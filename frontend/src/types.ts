export interface Blueprint {
  projectId: string;
  appName: string;
  source: 'github' | 'zip' | 'template';
  githubRepo?: string;
  domain?: string;
  hosting?: string;
  style: 'minimal' | 'brutalist' | 'editorial' | 'glassmorphism';
  color: string;
  appType: 'web' | 'mobile';
  authEnabled: boolean;
  plan: 'starter' | 'pro' | 'agency';
}

export interface ShippedProject {
  id: string;
  name: string;
  url: string;
  hosting: string;
  db: string;
  auth: string;
  admin: string;
  timestamp: string;
  status?: 'draft' | 'deploying' | 'live' | 'failed';
  firestoreId?: string;
}

export type ViewType = 'onboarding' | 'dashboard' | 'inventory' | 'admin' | 'profile' | 'about' | 'services' | 'how-it-works' | 'privacy' | 'terms';
