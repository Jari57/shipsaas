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
  githubRepo: z.string().max(500).optional(),
  uploadedFiles: z.array(z.object({
    path: z.string().max(500),
    content: z.string().max(500000),
  })).max(100).optional(),
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
// Rate limiting (Firestore-backed, persists across cold starts)
async function rateLimit(req, res, next) {
  const ip = (req.ip || req.headers["x-forwarded-for"] || "unknown").replace(/[^a-zA-Z0-9.:]/g, "_");
  const now = Date.now();
  const windowMs = 60000;
  const max = 30;
  const ref = firestore.doc(`rateLimit/${ip}`);

  try {
    const snap = await ref.get();
    const data = snap.exists ? snap.data() : { hits: [], updatedAt: 0 };
    const recentHits = (data.hits || []).filter((t) => now - t < windowMs);

    if (recentHits.length >= max) {
      return res.status(429).json({ error: "Too many requests" });
    }

    recentHits.push(now);
    // Fire-and-forget update to avoid blocking the request
    ref.set({ hits: recentHits, updatedAt: now }).catch(() => {});
    next();
  } catch {
    // If Firestore fails, allow the request rather than blocking
    next();
  }
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
// Helper: Recursively fetch all files from a GitHub repo
async function fetchGitHubTree(owner, repo, token) {
  const headers = { "User-Agent": "ShipSaaS", Accept: "application/vnd.github.v3+json" };
  if (token) headers.Authorization = `token ${token}`;

  // Get the default branch's tree recursively
  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  if (!repoRes.ok) throw new Error(`Could not access repo: ${repoRes.status}`);
  const repoData = await repoRes.json();
  const branch = repoData.default_branch || "main";

  const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, { headers });
  if (!treeRes.ok) throw new Error(`Could not fetch file tree: ${treeRes.status}`);
  const treeData = await treeRes.json();

  // Filter to blobs (files) only, skip huge files (>500KB) and common non-deployable dirs
  const skipDirs = ["node_modules/", ".git/", "dist/", "build/", ".next/", "__pycache__/"];
  const blobs = (treeData.tree || []).filter(
    (item) => item.type === "blob" && item.size < 500000 && !skipDirs.some((d) => item.path.startsWith(d))
  );

  // Fetch file contents (limit to 80 files to stay within Vercel payload limits)
  const filesToFetch = blobs.slice(0, 80);
  const files = await Promise.all(
    filesToFetch.map(async (item) => {
      try {
        const blobRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs/${item.sha}`, { headers });
        if (!blobRes.ok) return null;
        const blobData = await blobRes.json();
        return { file: item.path, data: blobData.content, encoding: "base64" };
      } catch {
        return null;
      }
    })
  );

  return files.filter(Boolean);
}

app.post("/api/deploy", rateLimit, validate(deploySchema), async (req, res) => {
  try {
    const { projectId, appName, hosting, vercelToken, githubToken, generatedCode, githubRepo, uploadedFiles } = req.body;

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
    let files = [];
    let sourceType = "template";

    if (uploadedFiles && uploadedFiles.length > 0) {
      // Deploy user-uploaded files
      sourceType = "upload";
      files = uploadedFiles.map((f) => ({
        file: f.path,
        data: Buffer.from(f.content).toString("base64"),
        encoding: "base64",
      }));
    } else if (githubRepo) {
      // Fetch real code from GitHub repo
      sourceType = "github";
      try {
        const match = githubRepo.match(/github\.com\/([^/]+)\/([^/\s?#]+)/);
        if (!match) throw new Error("Invalid GitHub URL");
        const [, owner, repo] = match;
        const cleanRepo = repo.replace(/\.git$/, "");
        files = await fetchGitHubTree(owner, cleanRepo, githubToken);
        if (files.length === 0) throw new Error("No deployable files found in repo");
      } catch (ghErr) {
        return res.json({
          success: false,
          error: `GitHub import failed: ${ghErr.message}`,
          projectId,
          appName,
          deploymentUrl: null,
          timestamp: new Date().toISOString(),
        });
      }
    } else if (generatedCode) {
      // Deploy the AI-generated code as index.html
      sourceType = "ai";
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
</head><body><div class="c"><h1>${appName || projectId}</h1><p>Deployed with ShipSaaS</p></div></body></html>`;
      files.push({
        file: "index.html",
        data: Buffer.from(html).toString("base64"),
        encoding: "base64",
      });
    }

    // Also create a GitHub repo if token is provided
    let githubRepoUrl = null;
    const warnings = [];
    if (githubToken) {
      try {
        const ghRes = await fetch("https://api.github.com/user/repos", {
          method: "POST",
          headers: {
            Authorization: `token ${githubToken}`,
            "Content-Type": "application/json",
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "ShipSaaS",
          },
          body: JSON.stringify({
            name: projectId,
            description: `${appName || projectId} — deployed with ShipSaaS`,
            private: false,
            auto_init: true,
          }),
        });
        if (ghRes.ok) {
          const ghData = await ghRes.json();
          githubRepoUrl = ghData.html_url;
        } else {
          const ghErr = await ghRes.json().catch(() => ({}));
          const msg = ghRes.status === 422 ? `GitHub repo '${projectId}' already exists` : `GitHub repo creation failed: ${ghErr.message || ghRes.status}`;
          warnings.push(msg);
          console.error("GitHub:", msg);
        }
      } catch (ghErr) {
        const msg = `GitHub repo creation failed: ${ghErr.message}`;
        warnings.push(msg);
        console.error(msg);
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
      warnings: warnings.length > 0 ? warnings : undefined,
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

// ─── Integration: Verify Provider Token ────────────────
app.post("/api/integrations/verify", rateLimit, async (req, res) => {
  const { provider, token } = req.body;
  if (!provider || !token) return res.status(400).json({ error: "provider and token required" });

  try {
    let result = { connected: false, username: undefined, error: undefined };

    switch (provider) {
      case "vercel": {
        const r = await fetch("https://api.vercel.com/v2/user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (r.ok) {
          const data = await r.json();
          result = { connected: true, username: data.user?.username || data.user?.name };
        } else {
          result.error = "Invalid Vercel token";
        }
        break;
      }
      case "github": {
        const r = await fetch("https://api.github.com/user", {
          headers: { Authorization: `token ${token}`, "User-Agent": "ShipSaaS" },
        });
        if (r.ok) {
          const data = await r.json();
          result = { connected: true, username: data.login };
        } else {
          result.error = "Invalid GitHub token";
        }
        break;
      }
      case "cloudflare": {
        const r = await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (r.ok) {
          const data = await r.json();
          result = { connected: data.success === true, username: data.result?.status || "Active" };
        } else {
          result.error = "Invalid Cloudflare token";
        }
        break;
      }
      case "stripe": {
        if (token.startsWith("sk_")) {
          result = { connected: true, username: token.startsWith("sk_live") ? "Live Mode" : "Test Mode" };
        } else {
          result.error = "Stripe key must start with sk_";
        }
        break;
      }
      default:
        result = { connected: !!token, username: "API Key configured" };
    }

    res.json(result);
  } catch (error) {
    console.error(error);
    res.json({ connected: false, error: "Verification failed" });
  }
});

// ─── Integration: Domain Availability Search ───────────
const dns = require("dns").promises;

app.post("/api/integrations/domain-search", rateLimit, async (req, res) => {
  const { domain } = req.body;
  if (!domain || typeof domain !== "string" || domain.length > 63) {
    return res.status(400).json({ error: "Valid domain name required" });
  }

  // Sanitize: only allow alphanumeric and hyphens
  const clean = domain.replace(/[^a-z0-9-]/gi, "").toLowerCase();
  if (!clean) return res.status(400).json({ error: "Invalid domain name" });

  const tlds = [
    { ext: ".com", price: "$12.99/yr" },
    { ext: ".io", price: "$49.99/yr" },
    { ext: ".ai", price: "$79.99/yr" },
    { ext: ".app", price: "$14.99/yr" },
    { ext: ".dev", price: "$12.99/yr" },
  ];

  const results = await Promise.all(
    tlds.map(async ({ ext, price }) => {
      const full = clean + ext;
      try {
        await dns.resolveNs(full);
        // If NS records resolve, domain is registered
        return { domain: full, tld: ext, available: false, price };
      } catch (err) {
        // ENOTFOUND / ENODATA = likely available
        return { domain: full, tld: ext, available: err.code === "ENOTFOUND" || err.code === "ENODATA", price };
      }
    })
  );

  res.json({ results });
});

// ─── Integration: List Vercel Projects ─────────────────
app.post("/api/integrations/vercel/projects", rateLimit, async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "token required" });

  try {
    const r = await fetch("https://api.vercel.com/v9/projects?limit=20", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return res.status(400).json({ error: "Could not fetch projects" });
    const data = await r.json();
    const projects = (data.projects || []).map((p) => ({
      name: p.name,
      url: p.latestDeployments?.[0]?.url ? `https://${p.latestDeployments[0].url}` : null,
      framework: p.framework,
      updatedAt: p.updatedAt,
    }));
    res.json({ projects });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to list projects" });
  }
});

// ─── Integration: List GitHub Repos ────────────────────
app.post("/api/integrations/github/repos", rateLimit, async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "token required" });

  try {
    const r = await fetch("https://api.github.com/user/repos?sort=updated&per_page=20", {
      headers: { Authorization: `token ${token}`, "User-Agent": "ShipSaaS" },
    });
    if (!r.ok) return res.status(400).json({ error: "Could not fetch repos" });
    const data = await r.json();
    const repos = data.map((repo) => ({
      name: repo.full_name,
      url: repo.html_url,
      private: repo.private,
      language: repo.language,
      updatedAt: repo.updated_at,
    }));
    res.json({ repos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to list repos" });
  }
});

exports.api = onRequest({ secrets: [geminiKey], invoker: "public" }, app);
