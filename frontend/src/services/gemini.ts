interface Blueprint {
  projectId: string;
  appName: string;
  domain?: string;
  hosting?: string;
  style: string;
  color: string;
  appType: string;
  authEnabled: boolean;
}

const API_URL = import.meta.env.VITE_API_URL || '';

const STYLE_DESCRIPTIONS: Record<string, string> = {
  minimal: 'Clean, lots of whitespace, simple sans-serif typography, subtle borders, light grays',
  brutalist: 'Bold black/white contrasts, thick borders, monospace fonts, raw and intentional',
  editorial: 'Magazine-style layout, serif headings, elegant spacing, large hero sections',
  glassmorphism: 'Frosted glass effects, translucent panels, backdrop-blur, soft gradients and shadows',
};

export async function generateAppCode(blueprint: Blueprint): Promise<string> {
  try {
    const styleDesc = STYLE_DESCRIPTIONS[blueprint.style] || STYLE_DESCRIPTIONS.minimal;

    const prompt = `Generate a COMPLETE, SELF-CONTAINED index.html file for a ${blueprint.appType} application called "${blueprint.appName}".

Requirements:
- Design style: ${blueprint.style} (${styleDesc})
- Primary accent color: ${blueprint.color}
- ${blueprint.authEnabled ? 'Include a sign-in/sign-up form section (UI only, no backend).' : 'No authentication UI needed.'}
- Must be a SINGLE HTML file with all CSS inline in a <style> tag
- Must be responsive (mobile + desktop)
- Include a hero section, features section, and footer
- Use modern CSS (flexbox/grid, custom properties, smooth transitions)
- NO external dependencies, NO JavaScript frameworks, NO CDN links
- Return ONLY the raw HTML — no markdown fences, no explanation, no code blocks

The output must start with <!DOCTYPE html> and end with </html>. Nothing else.`;

    const systemInstruction = 'You are a senior frontend engineer. Output ONLY raw HTML code. Never wrap in markdown code fences. Never add explanations. The HTML must be complete and self-contained.';

    const response = await fetch(`${API_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, systemInstruction }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    let output = data.output || '';

    // Strip markdown fences if the model wrapped it anyway
    output = output.replace(/^```html?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

    // Validate it looks like HTML
    if (!output.startsWith('<!DOCTYPE') && !output.startsWith('<html')) {
      return null as unknown as string;
    }

    return output;
  } catch (error) {
    console.error('Code generation failed:', error);
    return null as unknown as string;
  }
}
