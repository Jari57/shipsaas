const API = import.meta.env.VITE_API_URL || '';

export interface IntegrationStatus {
  connected: boolean;
  username?: string;
  error?: string;
}

export interface DomainResult {
  domain: string;
  tld: string;
  available: boolean;
  price: string;
}

export async function verifyIntegration(provider: string, token: string): Promise<IntegrationStatus> {
  const res = await fetch(`${API}/api/integrations/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, token }),
  });
  if (!res.ok) return { connected: false, error: 'Verification failed' };
  return res.json();
}

export async function searchDomains(query: string): Promise<DomainResult[]> {
  const res = await fetch(`${API}/api/integrations/domain-search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain: query }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.results || [];
}

export async function listVercelProjects(token: string): Promise<{ name: string; url: string }[]> {
  const res = await fetch(`${API}/api/integrations/vercel/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.projects || [];
}

export async function listGitHubRepos(token: string): Promise<{ name: string; url: string; private: boolean }[]> {
  const res = await fetch(`${API}/api/integrations/github/repos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.repos || [];
}
