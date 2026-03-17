// Ship.io Cloud Functions — v2.0.0
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { z } = require("zod");
const admin = require("firebase-admin");

admin.initializeApp();
const firestore = admin.firestore();

const geminiKey = defineSecret("GEMINI_API_KEY");

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));

// ─── Input Schemas ──────────────────────────────────────
const generateSchema = z.object({
  prompt: z.string().min(1).max(5000),
  systemInstruction: z.string().max(2000).optional(),
});

const recommendSchema = z
  .object({
    projectType: z.string().min(1).max(500).optional(),
    description: z.string().min(1).max(2000).optional(),
    features: z.array(z.string().max(200)).max(20).optional(),
    scale: z.string().max(100).optional(),
    budget: z.string().max(100).optional(),
  })
  .refine((d) => d.projectType || d.description, {
    message: "projectType or description required",
  });

const autoSetupSchema = z.object({
  description: z.string().min(1).max(3000),
});

const deploySchema = z.object({
  projectId: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  appName: z.string().max(200).optional(),
  hosting: z.string().max(100).optional(),
  authEnabled: z.boolean().optional(),
  vercelToken: z.string().max(500).optional(),
  githubToken: z.string().max(500).optional(),
  generatedCode: z.string().max(500000).optional(),
});

const projectStatusSchema = z.object({
  deploymentId: z.string().min(1).max(200),
  vercelToken: z.string().min(1).max(500),
});

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res
        .status(400)
        .json({ error: "Invalid input", details: result.error.flatten().fieldErrors });
    }
    req.body = result.data;
    next();
  };
}

// Rate limiting (simple in-memory)
const rateMap = new Map();
function rateLimit(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const window = 60000;
  const max = 30;
  const hits = (rateMap.get(ip) || []).filter((t) => now - t < window);
  if (hits.length >= max) return res.status(429).json({ error: "Too many requests" });
  hits.push(now);
  rateMap.set(ip, hits);
  next();
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/api/generate", rateLimit, validate(generateSchema), async (req, res) => {
  try {
    const { prompt, systemInstruction } = req.body;
    const genAI = new GoogleGenerativeAI(geminiKey.value());
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemInstruction || "You are a senior full-stack engineer.",
    });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    res.json({ output: text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Generation failed" });
  }
});

app.post("/api/recommend", rateLimit, validate(recommendSchema), async (req, res) => {
  try {
    const { projectType, features, scale, budget, description } = req.body;

    const prompt = `As a DevOps and full-stack architecture expert, recommend the best technology stack for a "${projectType || description}" project with these requirements:
- Features: ${(features || []).join(", ") || "standard SaaS features"}
- Scale: ${scale || "startup / small"}
- Budget: ${budget || "lean"}

Return a JSON object (no markdown fences) with this exact structure:
{
  "frontend": { "framework": "...", "reason": "..." },
  "backend": { "framework": "...", "reason": "..." },
  "database": { "name": "...", "reason": "..." },
  "hosting": { "name": "...", "reason": "..." },
  "auth": { "name": "...", "reason": "..." },
  "extras": ["..."],
  "estimatedCost": "...",
  "summary": "2 sentence summary"
}`;

    const genAI = new GoogleGenerativeAI(geminiKey.value());
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    try {
      const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      res.json(parsed);
    } catch {
      res.json({ raw: text });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Recommendation failed" });
  }
});

app.post("/api/auto-setup", rateLimit, validate(autoSetupSchema), async (req, res) => {
  try {
    const { description } = req.body;

    const prompt = `You are a DevOps architect. Given this project description, generate a complete deployment blueprint.

Project description: "${description}"

Return ONLY a JSON object (no markdown, no fences) with this exact structure:
{
  "appName": "Human-readable app name",
  "projectId": "lowercase-kebab-case-id",
  "source": "template",
  "hosting": "vercel",
  "style": "minimal",
  "color": "#3b82f6",
  "appType": "web",
  "authEnabled": true,
  "plan": "starter",
  "domain": "suggested-domain",
  "reasoning": {
    "hosting": "1 sentence why this hosting was chosen",
    "style": "1 sentence why this style was chosen",
    "stack": "1 sentence about the recommended architecture"
  }
}

Rules:
- "source" must be one of: "template", "github", "zip"
- "hosting" must be one of: "vercel", "netlify", "railway", "aws", "digitalocean"
- "style" must be one of: "minimal", "brutalist", "editorial", "glassmorphism"
- "color" must be a hex color code
- "appType" must be "web" or "mobile"
- "plan" must be "starter", "pro", or "agency" based on project complexity
- "projectId" should be a clean kebab-case slug derived from the app name
- "domain" should be a short, memorable domain name (no extension)
- Make smart choices based on the project type and description`;

    const genAI = new GoogleGenerativeAI(geminiKey.value());
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    try {
      const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      res.json({ blueprint: parsed });
    } catch {
      res.json({ blueprint: null, raw: text });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Auto-setup failed" });
  }
});

// ─── Real Deployment (Vercel) ──────────────────────────
app.post("/api/deploy", rateLimit, validate(deploySchema), async (req, res) => {
  try {
    const { projectId, appName, hosting, vercelToken, githubToken, generatedCode } = req.body;

    // If no Vercel token, return a draft deployment
    if (!vercelToken) {
      return res.json({
        success: false,
        error: "No Vercel API token provided. Add your Vercel token in Profile → API Keys to enable deployment.",
        projectId,
        appName,
        deploymentUrl: null,
        timestamp: new Date().toISOString(),
      });
    }

    // Build file tree for Vercel deployment
    const files = [];

    if (generatedCode) {
      // Deploy the AI-generated code as index.html
      files.push({
        file: "index.html",
        data: Buffer.from(generatedCode).toString("base64"),
        encoding: "base64",
      });
    } else {
      // Default placeholder
      const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${appName || projectId}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#09090b;color:#fafafa}.c{text-align:center;max-width:480px;padding:2rem}h1{font-size:2rem;margin-bottom:1rem}p{color:#a1a1aa;line-height:1.6}</style>
</head><body><div class="c"><h1>${appName || projectId}</h1><p>Deployed with Ship.io</p></div></body></html>`;
      files.push({
        file: "index.html",
        data: Buffer.from(html).toString("base64"),
        encoding: "base64",
      });
    }

    // Also create a GitHub repo if token is provided
    let githubRepoUrl = null;
    if (githubToken) {
      try {
        const ghRes = await fetch("https://api.github.com/user/repos", {
          method: "POST",
          headers: {
            Authorization: `token ${githubToken}`,
            "Content-Type": "application/json",
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "Ship.io",
          },
          body: JSON.stringify({
            name: projectId,
            description: `${appName || projectId} — deployed with Ship.io`,
            private: false,
            auto_init: true,
          }),
        });
        if (ghRes.ok) {
          const ghData = await ghRes.json();
          githubRepoUrl = ghData.html_url;
        }
        // If repo already exists (422), still continue
      } catch (ghErr) {
        console.error("GitHub repo creation failed:", ghErr.message);
        // Non-fatal — continue with deployment
      }
    }

    // Deploy to Vercel via their REST API
    const vercelPayload = {
      name: projectId,
      files,
      projectSettings: {
        framework: null,
      },
    };

    const vercelRes = await fetch("https://api.vercel.com/v13/deployments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(vercelPayload),
    });

    const vercelData = await vercelRes.json();

    if (!vercelRes.ok) {
      return res.json({
        success: false,
        error: vercelData.error?.message || "Vercel deployment failed",
        projectId,
        appName,
        deploymentUrl: null,
        timestamp: new Date().toISOString(),
      });
    }

    const deploymentUrl = `https://${vercelData.url}`;
    const deploymentId = vercelData.id;

    res.json({
      success: true,
      deploymentUrl,
      deploymentId,
      githubRepoUrl,
      projectId,
      appName,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Deployment failed" });
  }
});

// ─── Project Status (check Vercel deployment state) ────
app.post("/api/project-status", rateLimit, validate(projectStatusSchema), async (req, res) => {
  try {
    const { deploymentId, vercelToken } = req.body;
    const vercelRes = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
      headers: { Authorization: `Bearer ${vercelToken}` },
    });
    if (!vercelRes.ok) {
      return res.status(400).json({ error: "Could not fetch deployment status" });
    }
    const data = await vercelRes.json();
    res.json({
      status: data.readyState, // QUEUED, BUILDING, READY, ERROR, CANCELED
      url: data.url ? `https://${data.url}` : null,
      createdAt: data.createdAt,
      ready: data.ready,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Status check failed" });
  }
});

// ─── Stripe Checkout Session ───────────────────────────
app.post("/api/create-checkout", rateLimit, async (req, res) => {
  try {
    const { plan, userId, email } = req.body;
    if (!plan || !userId) {
      return res.status(400).json({ error: "plan and userId required" });
    }

    // Price IDs — set these in your Stripe dashboard
    // For now, return a message to set up Stripe
    const priceMap = {
      starter: process.env.STRIPE_PRICE_STARTER || null,
      pro: process.env.STRIPE_PRICE_PRO || null,
      agency: process.env.STRIPE_PRICE_AGENCY || null,
    };

    const priceId = priceMap[plan];
    if (!priceId) {
      return res.json({
        success: false,
        message: `Stripe not configured yet. To enable billing, set STRIPE_PRICE_${plan.toUpperCase()} environment variable with your Stripe Price ID.`,
      });
    }

    // If Stripe is configured, create a checkout session
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.headers.origin || "https://shipio-77a34.web.app"}?checkout=success`,
      cancel_url: `${req.headers.origin || "https://shipio-77a34.web.app"}?checkout=cancelled`,
      metadata: { userId, plan },
    });

    res.json({ success: true, url: session.url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Checkout failed" });
  }
});

// ─── Stripe Webhook ────────────────────────────────────
app.post("/api/stripe-webhook", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripeKey || !webhookSecret) {
      return res.status(200).json({ received: true });
    }
    const stripe = require("stripe")(stripeKey);
    const sig = req.headers["stripe-signature"];
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan;
      if (userId && plan) {
        await firestore.doc(`users/${userId}`).update({ plan, stripeCustomerId: session.customer });
      }
    }
    res.json({ received: true });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Webhook failed" });
  }
});

// ─── Send Notification Email (via Firestore trigger extension or direct) ───
app.post("/api/send-notification", rateLimit, async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    if (!to || !subject || !body) {
      return res.status(400).json({ error: "to, subject, and body required" });
    }
    // Write to Firestore 'mail' collection (used by Firebase "Trigger Email" extension)
    await firestore.collection("mail").add({
      to,
      message: { subject, html: body },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Email failed" });
  }
});

exports.api = onRequest({ secrets: [geminiKey], invoker: "public" }, app);
