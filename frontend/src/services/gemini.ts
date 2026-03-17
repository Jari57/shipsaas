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

export async function generateAppCode(blueprint: Blueprint): Promise<string> {
  try {
    const prompt = `Generate a production-ready ${blueprint.appType} application called "${blueprint.appName}" with ${blueprint.style} design style and ${blueprint.color} as the primary accent color. ${blueprint.authEnabled ? 'Include Clerk authentication.' : 'No authentication.'} Return the key files as markdown code blocks.`;

    const systemInstruction = `You are a senior full-stack engineer. Generate clean, production-ready code for a SaaS application. Use React, Tailwind CSS, and modern best practices. Return the code in markdown with file paths as headers.`;

    const response = await fetch(`${API_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, systemInstruction }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.output;
  } catch (error) {
    console.error('Code generation failed:', error);
    return `# Generated Blueprint for ${blueprint.appName}\n\n> Code generation is currently offline. Your blueprint has been saved and will be processed when the API is available.\n\n## Configuration\n- **Style:** ${blueprint.style}\n- **Color:** ${blueprint.color}\n- **Platform:** ${blueprint.appType}\n- **Auth:** ${blueprint.authEnabled ? 'Enabled' : 'Disabled'}`;
  }
}
