import { create } from 'zustand';
import type { User } from 'firebase/auth';
import { signUpWithEmail, signInWithEmail, signInWithApple, signInWithGoogle, signOut, onAuth, deleteAccount } from '../services/auth';
import { generateAppCode } from '../services/gemini';
import { saveProject, getUserProjects, updateProject, saveApiKeys, loadApiKeys, loadUserProfile, saveProfileName, type ProjectDoc } from '../services/projects';
import type { Blueprint, ShippedProject, ViewType } from '../types';

// Number of testimonials (kept in sync with TESTIMONIALS array in App.tsx)
const TESTIMONIALS_COUNT = 4;

// API base URL — empty string in dev (uses Vite proxy), full URL in production
const API_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : '';

interface AppState {
  // ── Auth ────────────────────────────────────────────
  user: User | null;
  authLoading: boolean;
  authMode: 'signin' | 'signup';
  email: string;
  password: string;
  showPassword: boolean;
  authError: string;
  authBusy: boolean;

  setUser: (v: User | null) => void;
  setAuthLoading: (v: boolean) => void;
  setAuthMode: (v: 'signin' | 'signup') => void;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  setShowPassword: (v: boolean) => void;
  setAuthError: (v: string) => void;
  setAuthBusy: (v: boolean) => void;

  handleEmailAuth: () => Promise<void>;
  handleAppleAuth: () => Promise<void>;
  handleGoogleAuth: () => Promise<void>;
  handleSignOut: () => void;

  // ── Navigation ──────────────────────────────────────
  step: number;
  view: ViewType;

  setStep: (v: number) => void;
  setView: (v: ViewType) => void;
  next: () => void;
  back: () => void;

  // ── Offline ─────────────────────────────────────────
  isOffline: boolean;
  setIsOffline: (v: boolean) => void;

  // ── Blueprint ───────────────────────────────────────
  blueprint: Blueprint;
  uploadedFile: string | null;
  githubUrl: string;

  setBlueprint: (v: Blueprint) => void;
  setUploadedFile: (v: string | null) => void;
  setGithubUrl: (v: string) => void;

  // ── Deploy ──────────────────────────────────────────
  isDeploying: boolean;
  deployLogs: string[];
  generatedCode: string | null;
  shippedProjects: ShippedProject[];

  setIsDeploying: (v: boolean) => void;
  setDeployLogs: (v: string[]) => void;
  setGeneratedCode: (v: string | null) => void;
  setShippedProjects: (v: ShippedProject[]) => void;
  handleDeploy: () => Promise<void>;

  // ── Domain ──────────────────────────────────────────
  domainSearch: string;
  setDomainSearch: (v: string) => void;

  // ── Auto-setup ──────────────────────────────────────
  autoMode: boolean;
  autoLoading: boolean;
  projectDescription: string;
  reviewEditing: string | null;
  aiReasoning: Record<string, string> | null;

  setAutoMode: (v: boolean) => void;
  setAutoLoading: (v: boolean) => void;
  setProjectDescription: (v: string) => void;
  setReviewEditing: (v: string | null) => void;
  setAiReasoning: (v: Record<string, string> | null) => void;
  handleAutoSetup: () => Promise<void>;

  // ── Help & AI ───────────────────────────────────────
  helpOpen: boolean;
  helpSection: string | null;
  aiAdvisorOpen: boolean;
  aiQuery: string;
  aiLoading: boolean;
  aiResult: Record<string, unknown> | null;
  testimonialIdx: number;

  setHelpOpen: (v: boolean) => void;
  setHelpSection: (v: string | null) => void;
  setAiAdvisorOpen: (v: boolean) => void;
  setAiQuery: (v: string) => void;
  setAiLoading: (v: boolean) => void;
  setAiResult: (v: Record<string, unknown> | null) => void;
  setTestimonialIdx: (v: number) => void;
  handleAiRecommend: () => Promise<void>;
  rotateTestimonial: () => void;

  // ── Tour ────────────────────────────────────────────
  tourActive: boolean;
  tourStep: number;

  setTourActive: (v: boolean) => void;
  setTourStep: (v: number) => void;
  nextTourStep: (totalSteps: number) => void;
  prevTourStep: () => void;

  // ── Profile ─────────────────────────────────────────
  profileName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  profileSaved: boolean;
  apiKeys: Record<string, string>;

  setProfileName: (v: string) => void;
  setCardNumber: (v: string) => void;
  setCardExpiry: (v: string) => void;
  setCardCvc: (v: string) => void;
  setProfileSaved: (v: boolean) => void;
  setApiKeys: (v: Record<string, string>) => void;
  updateApiKey: (key: string, value: string) => void;

  // ── Account Deletion ───────────────────────────────
  deleteConfirm: boolean;
  deleteLoading: boolean;

  setDeleteConfirm: (v: boolean) => void;
  setDeleteLoading: (v: boolean) => void;
  handleDeleteAccount: () => Promise<void>;

  // ── Lifecycle ───────────────────────────────────────
  initAuth: () => () => void;
  initOnlineStatus: () => () => void;
}

export const useAppStore = create<AppState>()((set, get) => ({
  // ── Auth state ──────────────────────────────────────
  user: null,
  authLoading: true,
  authMode: 'signup',
  email: '',
  password: '',
  showPassword: false,
  authError: '',
  authBusy: false,

  setUser: (v) => set({ user: v }),
  setAuthLoading: (v) => set({ authLoading: v }),
  setAuthMode: (v) => set({ authMode: v }),
  setEmail: (v) => set({ email: v }),
  setPassword: (v) => set({ password: v }),
  setShowPassword: (v) => set({ showPassword: v }),
  setAuthError: (v) => set({ authError: v }),
  setAuthBusy: (v) => set({ authBusy: v }),

  handleEmailAuth: async () => {
    set({ authError: '', authBusy: true });
    try {
      const { authMode, email, password } = get();
      if (authMode === 'signup') {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      set({ step: 1 });
    } catch (e: any) {
      set({ authError: e.message?.replace('Firebase: ', '') || 'Authentication failed' });
    } finally {
      set({ authBusy: false });
    }
  },

  handleAppleAuth: async () => {
    set({ authError: '', authBusy: true });
    try {
      await signInWithApple();
      set({ step: 1 });
    } catch (e: any) {
      set({ authError: e.message?.replace('Firebase: ', '') || 'Apple login failed' });
    } finally {
      set({ authBusy: false });
    }
  },

  handleGoogleAuth: async () => {
    set({ authError: '', authBusy: true });
    try {
      await signInWithGoogle();
      set({ step: 1 });
    } catch (e: any) {
      set({ authError: e.message?.replace('Firebase: ', '') || 'Google login failed' });
    } finally {
      set({ authBusy: false });
    }
  },

  handleSignOut: () => {
    signOut();
    set({ step: -1 });
  },

  // ── Navigation state ───────────────────────────────
  step: -1,
  view: 'onboarding',

  setStep: (v) => set({ step: v }),
  setView: (v) => set({ view: v }),
  next: () => set(s => ({ step: Math.min(s.step + 1, 6) })),
  back: () => set(s => ({ step: Math.max(s.step - 1, 0) })),

  // ── Offline state ──────────────────────────────────
  isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
  setIsOffline: (v) => set({ isOffline: v }),

  // ── Blueprint state ────────────────────────────────
  blueprint: {
    projectId: '',
    appName: '',
    source: 'template',
    style: 'brutalist',
    color: '#10b981',
    appType: 'web',
    authEnabled: true,
    plan: 'starter',
  },
  uploadedFile: null,
  githubUrl: '',

  setBlueprint: (v) => set({ blueprint: v }),
  setUploadedFile: (v) => set({ uploadedFile: v }),
  setGithubUrl: (v) => set({ githubUrl: v }),

  // ── Deploy state ───────────────────────────────────
  isDeploying: false,
  deployLogs: [],
  generatedCode: null,
  shippedProjects: [],

  setIsDeploying: (v) => set({ isDeploying: v }),
  setDeployLogs: (v) => set({ deployLogs: v }),
  setGeneratedCode: (v) => set({ generatedCode: v }),
  setShippedProjects: (v) => set({ shippedProjects: v }),

  handleDeploy: async () => {
    set({ isDeploying: true, step: 6, deployLogs: [] });
    const log = (msg: string) => set(s => ({ deployLogs: [...s.deployLogs, msg] }));

    const { user, blueprint, apiKeys } = get();
    if (!user) { set({ isDeploying: false }); return; }

    log('▸ Initializing pipeline...');

    // Generate source code
    log('▸ Generating source code from blueprint...');
    let code: string | null = null;
    try {
      code = await generateAppCode(blueprint);
      set({ generatedCode: code });
      log('▸ Source code generated ✓');
    } catch {
      log('▸ Code generation offline — using template fallback');
    }

    // Call real deploy endpoint
    log(`▸ Deploying to ${blueprint.hosting || 'Vercel'}...`);
    try {
      const res = await fetch(`${API_BASE}/api/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: blueprint.projectId || `proj-${Date.now()}`,
          appName: blueprint.appName || 'Untitled',
          hosting: blueprint.hosting || 'vercel',
          authEnabled: blueprint.authEnabled,
          vercelToken: apiKeys.vercel || undefined,
          githubToken: apiKeys.github || undefined,
          generatedCode: code || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        log(`▸ Deployment issue: ${data.error || 'Unknown error'}`);
        log('▸ Saving project as draft...');
      } else {
        log(`▸ Live at ${data.deploymentUrl} ✓`);
      }

      // Save to Firestore
      const projectDoc = await saveProject(user.uid, {
        projectId: blueprint.projectId || `proj-${Date.now()}`,
        appName: blueprint.appName || 'Untitled',
        source: blueprint.source,
        githubRepo: blueprint.githubRepo,
        domain: blueprint.domain,
        hosting: blueprint.hosting || 'vercel',
        style: blueprint.style,
        color: blueprint.color,
        appType: blueprint.appType,
        authEnabled: blueprint.authEnabled,
        plan: blueprint.plan,
        status: data.success ? 'live' : 'draft',
        deploymentUrl: data.deploymentUrl || undefined,
        generatedCode: code || undefined,
        blueprint,
      });

      const newProject: ShippedProject = {
        id: projectDoc.id,
        name: blueprint.appName || 'Untitled',
        url: data.deploymentUrl || `https://${blueprint.projectId}.shipio.app`,
        hosting: blueprint.hosting || 'Vercel',
        db: 'Firestore',
        auth: blueprint.authEnabled ? 'Firebase Auth' : 'None',
        admin: user.email || '',
        timestamp: new Date().toLocaleDateString(),
        status: data.success ? 'live' : 'draft',
        firestoreId: projectDoc.id,
      };
      log('▸ Project saved ✓');
      log('▸ Pipeline complete.');
      set(s => ({ shippedProjects: [newProject, ...s.shippedProjects], isDeploying: false }));
    } catch (err: any) {
      log(`▸ Deploy failed: ${err.message || 'Network error'}`);
      // Still save as draft
      try {
        const projectDoc = await saveProject(user.uid, {
          projectId: blueprint.projectId || `proj-${Date.now()}`,
          appName: blueprint.appName || 'Untitled',
          source: blueprint.source,
          hosting: blueprint.hosting || 'vercel',
          style: blueprint.style,
          color: blueprint.color,
          appType: blueprint.appType,
          authEnabled: blueprint.authEnabled,
          plan: blueprint.plan,
          status: 'draft',
          blueprint,
        });
        const newProject: ShippedProject = {
          id: projectDoc.id,
          name: blueprint.appName || 'Untitled',
          url: '',
          hosting: blueprint.hosting || 'Vercel',
          db: 'Firestore',
          auth: blueprint.authEnabled ? 'Firebase Auth' : 'None',
          admin: user.email || '',
          timestamp: new Date().toLocaleDateString(),
          status: 'draft',
          firestoreId: projectDoc.id,
        };
        log('▸ Saved as draft ✓');
        set(s => ({ shippedProjects: [newProject, ...s.shippedProjects], isDeploying: false }));
      } catch {
        log('▸ Could not save project.');
        set({ isDeploying: false });
      }
    }
  },

  // ── Domain state ───────────────────────────────────
  domainSearch: '',
  setDomainSearch: (v) => set({ domainSearch: v }),

  // ── Auto-setup state ──────────────────────────────
  autoMode: false,
  autoLoading: false,
  projectDescription: '',
  reviewEditing: null,
  aiReasoning: null,

  setAutoMode: (v) => set({ autoMode: v }),
  setAutoLoading: (v) => set({ autoLoading: v }),
  setProjectDescription: (v) => set({ projectDescription: v }),
  setReviewEditing: (v) => set({ reviewEditing: v }),
  setAiReasoning: (v) => set({ aiReasoning: v }),

  handleAutoSetup: async () => {
    const { projectDescription } = get();
    if (!projectDescription.trim()) return;
    set({ autoLoading: true });
    try {
      const res = await fetch(`${API_BASE}/api/auto-setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: projectDescription }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      if (data.blueprint) {
        const b = data.blueprint;
        const prev = get().blueprint;
        set({
          blueprint: {
            ...prev,
            appName: b.appName || prev.appName,
            projectId: b.projectId || prev.projectId,
            source: (['github', 'zip', 'template'].includes(b.source) ? b.source : 'template') as Blueprint['source'],
            hosting: b.hosting || 'vercel',
            style: (['minimal', 'brutalist', 'editorial', 'glassmorphism'].includes(b.style) ? b.style : 'minimal') as Blueprint['style'],
            color: b.color || '#10b981',
            appType: (['web', 'mobile'].includes(b.appType) ? b.appType : 'web') as Blueprint['appType'],
            authEnabled: b.authEnabled ?? true,
            plan: (['starter', 'pro', 'agency'].includes(b.plan) ? b.plan : 'starter') as Blueprint['plan'],
            domain: b.domain || undefined,
          },
          autoMode: true,
          step: 5,
        });
        if (b.domain) set({ domainSearch: b.domain });
        if (b.reasoning) set({ aiReasoning: b.reasoning });
      }
    } catch {
      set({ autoMode: false });
    } finally {
      set({ autoLoading: false });
    }
  },

  // ── Help & AI state ────────────────────────────────
  helpOpen: false,
  helpSection: null,
  aiAdvisorOpen: false,
  aiQuery: '',
  aiLoading: false,
  aiResult: null,
  testimonialIdx: 0,

  setHelpOpen: (v) => set({ helpOpen: v }),
  setHelpSection: (v) => set({ helpSection: v }),
  setAiAdvisorOpen: (v) => set({ aiAdvisorOpen: v }),
  setAiQuery: (v) => set({ aiQuery: v }),
  setAiLoading: (v) => set({ aiLoading: v }),
  setAiResult: (v) => set({ aiResult: v }),
  setTestimonialIdx: (v) => set({ testimonialIdx: v }),

  handleAiRecommend: async () => {
    const { aiQuery } = get();
    if (!aiQuery.trim()) return;
    set({ aiLoading: true, aiResult: null });
    try {
      const res = await fetch(`${API_BASE}/api/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: aiQuery }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      set({ aiResult: data.recommendation });
    } catch {
      set({ aiResult: { error: 'Could not reach AI advisor. Try again later.' } });
    } finally {
      set({ aiLoading: false });
    }
  },

  rotateTestimonial: () => set(s => ({ testimonialIdx: (s.testimonialIdx + 1) % TESTIMONIALS_COUNT })),

  // ── Tour state ─────────────────────────────────────
  tourActive: false,
  tourStep: 0,

  setTourActive: (v) => set({ tourActive: v }),
  setTourStep: (v) => set({ tourStep: v }),
  nextTourStep: (totalSteps) => set(s => ({ tourStep: Math.min(s.tourStep + 1, totalSteps - 1) })),
  prevTourStep: () => set(s => ({ tourStep: Math.max(s.tourStep - 1, 0) })),

  // ── Profile state ──────────────────────────────────
  profileName: '',
  cardNumber: '',
  cardExpiry: '',
  cardCvc: '',
  profileSaved: false,
  apiKeys: { vercel: '', netlify: '', railway: '', aws: '', digitalocean: '', stripe: '', cloudflare: '', github: '' },

  setProfileName: (v) => set({ profileName: v }),
  setCardNumber: (v) => set({ cardNumber: v }),
  setCardExpiry: (v) => set({ cardExpiry: v }),
  setCardCvc: (v) => set({ cardCvc: v }),
  setProfileSaved: (v) => {
    set({ profileSaved: v });
    if (v) {
      const user = get().user;
      const name = get().profileName;
      if (user && name) saveProfileName(user.uid, name).catch(() => {});
    }
  },
  setApiKeys: (v) => set({ apiKeys: v }),
  updateApiKey: (key, value) => {
    set(s => ({ apiKeys: { ...s.apiKeys, [key]: value } }));
    // Persist to Firestore in the background
    const user = get().user;
    if (user) {
      const keys = { ...get().apiKeys, [key]: value };
      saveApiKeys(user.uid, keys).catch(() => {});
    }
  },

  // ── Account Deletion state ────────────────────────
  deleteConfirm: false,
  deleteLoading: false,

  setDeleteConfirm: (v) => set({ deleteConfirm: v }),
  setDeleteLoading: (v) => set({ deleteLoading: v }),

  handleDeleteAccount: async () => {
    set({ deleteLoading: true });
    try {
      await deleteAccount();
      set({ step: -1, view: 'onboarding', deleteConfirm: false });
    } catch (e: any) {
      set({ authError: e.message?.replace('Firebase: ', '') || 'Deletion failed. You may need to sign in again.' });
    } finally {
      set({ deleteLoading: false });
    }
  },

  // ── Lifecycle ──────────────────────────────────────
  initAuth: () => {
    return onAuth(async (u) => {
      set({ user: u, authLoading: false });
      if (u) {
        if (get().step === 0) set({ step: 1 });
        // Load persisted projects
        try {
          const projects = await getUserProjects(u.uid);
          const shipped: ShippedProject[] = projects.map(p => ({
            id: p.projectId,
            name: p.appName,
            url: p.deploymentUrl || '',
            hosting: p.hosting || 'Vercel',
            db: 'Firestore',
            auth: p.authEnabled ? 'Firebase Auth' : 'None',
            admin: u.email || '',
            timestamp: p.createdAt?.toDate?.()?.toLocaleDateString?.() || new Date().toLocaleDateString(),
            status: p.status,
            firestoreId: p.id,
          }));
          set({ shippedProjects: shipped });
        } catch {
          // Silently fail — projects will be empty
        }
        // Load persisted API keys
        try {
          const keys = await loadApiKeys(u.uid);
          if (Object.keys(keys).length > 0) {
            set(s => ({ apiKeys: { ...s.apiKeys, ...keys } }));
          }
        } catch {
          // Silently fail
        }
        // Load profile name
        try {
          const profile = await loadUserProfile(u.uid);
          if (profile?.profileName) set({ profileName: profile.profileName });
        } catch {
          // Silently fail
        }
      } else {
        // Signed out — clear state
        set({ shippedProjects: [], apiKeys: { vercel: '', netlify: '', railway: '', aws: '', digitalocean: '', stripe: '', cloudflare: '', github: '' } });
      }
    });
  },

  initOnlineStatus: () => {
    const goOffline = () => set({ isOffline: true });
    const goOnline = () => set({ isOffline: false });
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  },
}));
