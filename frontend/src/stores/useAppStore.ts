import { create } from 'zustand';
import type { User } from 'firebase/auth';
import { signUpWithEmail, signInWithEmail, signInWithApple, signInWithGoogle, signOut, onAuth, deleteAccount, sendPasswordReset, resendVerificationEmail } from '../services/auth';
import { generateAppCode } from '../services/gemini';
import { saveProject, getUserProjects, updateProject, removeProject, saveApiKeys, loadApiKeys, loadUserProfile, saveProfileName, type ProjectDoc } from '../services/projects';
import { verifyIntegration, searchDomains as searchDomainsApi, type IntegrationStatus, type DomainResult } from '../services/integrations';
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
  confirmPassword: string;
  showPassword: boolean;
  authError: string;
  authBusy: boolean;
  termsAccepted: boolean;
  forgotPasswordMode: boolean;
  resetEmailSent: boolean;
  failedAttempts: number;
  lockoutUntil: number | null;
  verificationSent: boolean;

  setUser: (v: User | null) => void;
  setAuthLoading: (v: boolean) => void;
  setAuthMode: (v: 'signin' | 'signup') => void;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  setConfirmPassword: (v: string) => void;
  setShowPassword: (v: boolean) => void;
  setAuthError: (v: string) => void;
  setAuthBusy: (v: boolean) => void;
  setTermsAccepted: (v: boolean) => void;
  setForgotPasswordMode: (v: boolean) => void;
  setResetEmailSent: (v: boolean) => void;

  handleEmailAuth: () => Promise<void>;
  handleAppleAuth: () => Promise<void>;
  handleGoogleAuth: () => Promise<void>;
  handleSignOut: () => void;
  handleForgotPassword: () => Promise<void>;
  handleResendVerification: () => Promise<void>;

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
  uploadedFiles: Array<{ path: string; content: string }> | null;
  githubUrl: string;

  setBlueprint: (v: Blueprint) => void;
  setUploadedFile: (v: string | null) => void;
  setUploadedFiles: (v: Array<{ path: string; content: string }> | null) => void;
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
  profileSaved: boolean;
  apiKeys: Record<string, string>;

  setProfileName: (v: string) => void;
  setProfileSaved: (v: boolean) => void;
  setApiKeys: (v: Record<string, string>) => void;
  updateApiKey: (key: string, value: string) => void;

  // ── Integrations ───────────────────────────────────
  integrationStatus: Record<string, IntegrationStatus & { loading?: boolean }>;
  domainResults: DomainResult[];
  domainSearchLoading: boolean;

  setIntegrationStatus: (v: Record<string, IntegrationStatus & { loading?: boolean }>) => void;
  setDomainResults: (v: DomainResult[]) => void;
  setDomainSearchLoading: (v: boolean) => void;
  handleVerifyIntegration: (provider: string) => Promise<void>;
  handleDisconnectIntegration: (provider: string) => void;
  handleSearchDomains: (query: string) => Promise<void>;

  // ── Account Deletion ───────────────────────────────
  deleteConfirm: boolean;
  deleteLoading: boolean;

  setDeleteConfirm: (v: boolean) => void;
  setDeleteLoading: (v: boolean) => void;
  handleDeleteProject: (firestoreId: string) => Promise<void>;
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
  confirmPassword: '',
  showPassword: false,
  authError: '',
  authBusy: false,
  termsAccepted: false,
  forgotPasswordMode: false,
  resetEmailSent: false,
  failedAttempts: 0,
  lockoutUntil: null,
  verificationSent: false,

  setUser: (v) => set({ user: v }),
  setAuthLoading: (v) => set({ authLoading: v }),
  setAuthMode: (v) => set({ authMode: v, authError: '', forgotPasswordMode: false, resetEmailSent: false }),
  setEmail: (v) => set({ email: v }),
  setPassword: (v) => set({ password: v }),
  setConfirmPassword: (v) => set({ confirmPassword: v }),
  setShowPassword: (v) => set({ showPassword: v }),
  setAuthError: (v) => set({ authError: v }),
  setAuthBusy: (v) => set({ authBusy: v }),
  setTermsAccepted: (v) => set({ termsAccepted: v }),
  setForgotPasswordMode: (v) => set({ forgotPasswordMode: v, authError: '', resetEmailSent: false }),
  setResetEmailSent: (v) => set({ resetEmailSent: v }),

  handleEmailAuth: async () => {
    const { authMode, email, password, confirmPassword, termsAccepted, lockoutUntil, failedAttempts } = get();
    // Check lockout
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
      set({ authError: `Too many failed attempts. Try again in ${remaining}s.` });
      return;
    }
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      set({ authError: 'Please enter a valid email address.' });
      return;
    }
    // Signup validations
    if (authMode === 'signup') {
      if (password.length < 8) {
        set({ authError: 'Password must be at least 8 characters.' });
        return;
      }
      if (!/[A-Z]/.test(password)) {
        set({ authError: 'Password must contain an uppercase letter.' });
        return;
      }
      if (!/[0-9]/.test(password)) {
        set({ authError: 'Password must contain a number.' });
        return;
      }
      if (!/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(password)) {
        set({ authError: 'Password must contain a special character.' });
        return;
      }
      if (password !== confirmPassword) {
        set({ authError: 'Passwords do not match.' });
        return;
      }
      if (!termsAccepted) {
        set({ authError: 'You must accept the Terms of Service and Privacy Policy.' });
        return;
      }
    }
    set({ authError: '', authBusy: true });
    try {
      if (authMode === 'signup') {
        await signUpWithEmail(email, password);
        set({ verificationSent: true });
      } else {
        await signInWithEmail(email, password);
      }
      set({ step: 1, failedAttempts: 0, lockoutUntil: null });
      try { localStorage.removeItem('shipsaas_lockout'); } catch {}
    } catch (e: any) {
      const newAttempts = failedAttempts + 1;
      const lockout = newAttempts >= 5 ? Date.now() + 60000 * Math.min(newAttempts - 4, 5) : null;
      const msg = e.message?.replace('Firebase: ', '') || 'Authentication failed';
      set({ authError: newAttempts >= 5 ? `Account temporarily locked. Too many failed attempts. Try again in ${Math.min(newAttempts - 4, 5)} minute(s).` : msg, failedAttempts: newAttempts, lockoutUntil: lockout });
      try { localStorage.setItem('shipsaas_lockout', JSON.stringify({ failedAttempts: newAttempts, lockoutUntil: lockout })); } catch {}
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

  handleForgotPassword: async () => {
    const { email } = get();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      set({ authError: 'Please enter your email address above.' });
      return;
    }
    set({ authBusy: true, authError: '' });
    try {
      await sendPasswordReset(email);
      set({ resetEmailSent: true });
    } catch {
      // Don't reveal whether email exists - always show success
      set({ resetEmailSent: true });
    } finally {
      set({ authBusy: false });
    }
  },

  handleResendVerification: async () => {
    set({ authBusy: true });
    try {
      await resendVerificationEmail();
      set({ verificationSent: true });
    } catch {
      // Silent fail
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
  next: () => set(s => ({ step: Math.min(s.step + 1, 3) })),
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
  uploadedFiles: null,
  githubUrl: '',

  setBlueprint: (v) => set({ blueprint: v }),
  setUploadedFile: (v) => set({ uploadedFile: v }),
  setUploadedFiles: (v) => set({ uploadedFiles: v }),
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
    set({ isDeploying: true, step: 3, deployLogs: [] });
    const log = (msg: string) => set(s => ({ deployLogs: [...s.deployLogs, msg] }));

    const { user, blueprint, apiKeys } = get();
    if (!user) { set({ isDeploying: false }); return; }

    // Guard: email verification required for email/password users
    if (user.providerData?.[0]?.providerId === 'password' && !user.emailVerified) {
      log('✗ Email not verified. Please check your inbox and verify your email before deploying.');
      set({ isDeploying: false });
      return;
    }

    // Guard: only Vercel hosting is currently supported
    if (blueprint.hosting && blueprint.hosting !== 'vercel') {
      log(`✗ ${blueprint.hosting} hosting is not yet supported. Please select Vercel as your hosting provider.`);
      set({ isDeploying: false });
      return;
    }

    log('▸ Initializing pipeline...');

    const { uploadedFiles, githubUrl } = get();

    // Source-specific: only generate AI code for template source
    let code: string | null = null;
    if (blueprint.source === 'template') {
      log('▸ Generating source code from blueprint...');
      try {
        code = await generateAppCode(blueprint);
        if (code) {
          set({ generatedCode: code });
          log('▸ Source code generated ✓');
        } else {
          log('▸ Code generation unavailable — deploying with template');
        }
      } catch {
        log('▸ Code generation offline — deploying with template');
      }
    } else if (blueprint.source === 'github' && githubUrl) {
      log(`▸ Importing code from GitHub: ${githubUrl}`);
    } else if (blueprint.source === 'zip' && uploadedFiles?.length) {
      log(`▸ Deploying ${uploadedFiles.length} uploaded files...`);
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
          githubRepo: blueprint.source === 'github' ? githubUrl : undefined,
          uploadedFiles: blueprint.source === 'zip' ? uploadedFiles : undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        log(`▸ Deployment issue: ${data.error || 'Unknown error'}`);
        log('▸ Saving project as draft...');
      } else {
        log(`▸ Live at ${data.deploymentUrl} ✓`);
      }
      if (data.warnings) {
        data.warnings.forEach((w: string) => log(`⚠ ${w}`));
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
        url: data.deploymentUrl || `https://${blueprint.projectId}.vercel.app`,
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
            hosting: 'vercel',
            style: (['minimal', 'brutalist', 'editorial', 'glassmorphism'].includes(b.style) ? b.style : 'minimal') as Blueprint['style'],
            color: b.color || '#10b981',
            appType: (['web', 'mobile'].includes(b.appType) ? b.appType : 'web') as Blueprint['appType'],
            authEnabled: b.authEnabled ?? true,
            plan: (['starter', 'pro', 'agency'].includes(b.plan) ? b.plan : 'starter') as Blueprint['plan'],
            domain: b.domain || undefined,
          },
          autoMode: true,
          step: 2,
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
      set({ aiResult: data });
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
  profileSaved: false,
  apiKeys: { vercel: '', netlify: '', railway: '', aws: '', digitalocean: '', stripe: '', cloudflare: '', github: '' },

  setProfileName: (v) => set({ profileName: v }),
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

  // ── Integrations state ────────────────────────────
  integrationStatus: {},
  domainResults: [],
  domainSearchLoading: false,

  setIntegrationStatus: (v) => set({ integrationStatus: v }),
  setDomainResults: (v) => set({ domainResults: v }),
  setDomainSearchLoading: (v) => set({ domainSearchLoading: v }),

  handleVerifyIntegration: async (provider: string) => {
    const token = get().apiKeys[provider];
    if (!token) return;
    set(s => ({ integrationStatus: { ...s.integrationStatus, [provider]: { connected: false, loading: true } } }));
    try {
      const result = await verifyIntegration(provider, token);
      set(s => ({ integrationStatus: { ...s.integrationStatus, [provider]: { ...result, loading: false } } }));
    } catch {
      set(s => ({ integrationStatus: { ...s.integrationStatus, [provider]: { connected: false, error: 'Verification failed', loading: false } } }));
    }
  },

  handleDisconnectIntegration: (provider: string) => {
    set(s => ({
      apiKeys: { ...s.apiKeys, [provider]: '' },
      integrationStatus: { ...s.integrationStatus, [provider]: { connected: false } },
    }));
    const user = get().user;
    if (user) {
      const keys = { ...get().apiKeys, [provider]: '' };
      saveApiKeys(user.uid, keys).catch(() => {});
    }
  },

  handleSearchDomains: async (query: string) => {
    if (!query) return;
    set({ domainSearchLoading: true, domainResults: [] });
    try {
      const results = await searchDomainsApi(query);
      set({ domainResults: results, domainSearchLoading: false });
    } catch {
      set({ domainSearchLoading: false });
    }
  },

  // ── Account Deletion state ────────────────────────
  deleteConfirm: false,
  deleteLoading: false,

  setDeleteConfirm: (v) => set({ deleteConfirm: v }),
  setDeleteLoading: (v) => set({ deleteLoading: v }),

  handleDeleteProject: async (firestoreId: string) => {
    try {
      await removeProject(firestoreId);
      set(s => ({ shippedProjects: s.shippedProjects.filter(p => p.firestoreId !== firestoreId) }));
    } catch {
      // Silent fail
    }
  },

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
    // Restore lockout state from localStorage
    try {
      const saved = localStorage.getItem('shipsaas_lockout');
      if (saved) {
        const { failedAttempts, lockoutUntil } = JSON.parse(saved);
        if (lockoutUntil && Date.now() < lockoutUntil) {
          set({ failedAttempts, lockoutUntil });
        } else {
          localStorage.removeItem('shipsaas_lockout');
        }
      }
    } catch {}
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
