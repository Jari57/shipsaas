import React, { useState, useEffect, useRef } from 'react';
import { 
  Rocket, 
  Database, 
  CheckCircle2, 
  Loader2,
  Code,
  Globe,
  ShieldCheck,
  Cpu,
  ArrowRight,
  ArrowLeft,
  Zap,
  Sparkles,
  X,
  Users,
  Activity,
  Shield,
  Lock,
  Github,
  Upload,
  FolderArchive,
  Mail,
  Eye,
  EyeOff,
  CreditCard,
  Check,
  Star,
  Search,
  HelpCircle,
  MessageCircle,
  Play,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Bot,
  Layers,
  Palette,
  Terminal,
  ExternalLink,
  Quote,
  ArrowUpRight,
  Lightbulb,
  Video,
  FileText,
  Target,
  TrendingUp,
  Clock,
  Pencil,
  RotateCcw,
  Wand2,
  Settings,
  User as UserIcon,
  Key,
  Building2,
  Workflow,
  DollarSign,
  ChevronUp,
  CircleDot,
  Briefcase,
  Info,
  MapPin,
  Trash2,
  AlertTriangle,
  WifiOff,
  ScrollText
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import ReactMarkdown from 'react-markdown';
import JSZip from 'jszip';
import { useAppStore } from './stores/useAppStore';

// ─── Constants ──────────────────────────────────────────

const ONBOARDING_STEPS = [
  { id: 'auth',      label: 'Account',   icon: Lock },
  { id: 'source',    label: 'Source',     icon: Code },
  { id: 'configure', label: 'Configure',  icon: Sparkles },
  { id: 'deploy',    label: 'Deploy',     icon: Rocket },
];

const HOSTING_PROVIDERS = [
  {
    id: 'vercel',
    name: 'Vercel',
    price: '$20/mo',
    rating: 4.9,
    description: 'Best for Next.js & React. Global Edge Network.',
    features: ['Edge Functions', 'Analytics', 'DDoS Protection'],
    popular: true
  },
];

const PLANS = [
  {
    id: 'starter' as const,
    name: 'Free',
    price: 'Free',
    period: '',
    description: 'Everything you need to ship.',
    features: ['Unlimited projects', 'AI code generation', 'Vercel deployment', 'GitHub integration', 'Domain search', 'SSL included'],
    cta: 'Current Plan',
    highlighted: true,
    available: true,
  },
];

const TEMPLATES = [
  {
    id: 'saas-starter',
    name: 'SaaS Starter',
    description: 'Auth, billing, dashboard — ready to go.',
    icon: Zap,
    partial: { style: 'minimal' as const, color: '#3b82f6', appType: 'web' as const, authEnabled: true },
  },
  {
    id: 'portfolio',
    name: 'Creative Portfolio',
    description: 'High-end editorial layout.',
    icon: Sparkles,
    partial: { style: 'editorial' as const, color: '#8b5cf6', appType: 'web' as const, authEnabled: false },
  },
  {
    id: 'landing-page',
    name: 'Landing Page',
    description: 'Clean marketing page with CTAs.',
    icon: Globe,
    partial: { style: 'glassmorphism' as const, color: '#10b981', appType: 'web' as const, authEnabled: false },
  },
];

// ─── Help / How-to ──────────────────────────────────────

const HELP_SECTIONS = [
  {
    id: 'getting-started',
    icon: Rocket,
    title: 'Getting Started',
    items: [
      { q: 'How do I create my first project?', a: 'Click "Launch Pipeline" on the home screen. Sign up, choose your code source (GitHub, ZIP, or template), pick hosting, configure your style, select a plan, and hit deploy. Your app will be live in under 2 minutes.' },
      { q: 'What code sources are supported?', a: 'You can import from any public or private GitHub repo, upload a ZIP archive of your project, or start from one of our pre-built templates (SaaS Starter, Mobile App, Creative Portfolio).' },
      { q: 'Do I need a credit card to start?', a: 'No. The Starter plan is completely free. You only need payment info if you upgrade to Pro ($29/mo) or Agency ($99/mo).' },
    ],
  },
  {
    id: 'deployment',
    icon: Globe,
    title: 'Deployment & Hosting',
    items: [
      { q: 'Which hosting providers are available?', a: 'We support Vercel, Netlify, Railway, AWS Amplify, and DigitalOcean. Each includes SSL, CDN, and automatic deployments from your connected repo.' },
      { q: 'Can I use a custom domain?', a: 'Yes. During the Domain step, search for available domains. We handle DNS setup and auto-provision SSL via Cloudflare. You also get a free .shipsaas.io subdomain.' },
      { q: 'How do I redeploy after code changes?', a: 'Push to your connected GitHub repo and the hosting provider will automatically rebuild and deploy. Or use the Builder to trigger a manual deploy.' },
    ],
  },
  {
    id: 'ai-features',
    icon: Bot,
    title: 'AI Features',
    items: [
      { q: 'What does the AI Stack Advisor do?', a: 'It analyzes your project type, features, scale, and budget to recommend the optimal tech stack — frontend framework, backend, database, hosting, and auth provider with reasoning for each choice.' },
      { q: 'Can AI generate my entire codebase?', a: 'Yes. During deployment, our Gemini-powered engine generates production-ready source code based on your blueprint — including component structure, styling, auth integration, and API routes.' },
      { q: 'Is the AI code production-ready?', a: 'The generated code follows best practices with React, Tailwind CSS, and clean architecture. We recommend reviewing it before going live, especially for business-critical apps.' },
    ],
  },
  {
    id: 'security',
    icon: Shield,
    title: 'Security & Auth',
    items: [
      { q: 'How is authentication handled?', a: 'We use Firebase Auth supporting email/password, Google OAuth, and GitHub OAuth. User sessions are managed with secure tokens automatically.' },
      { q: 'Is my data encrypted?', a: 'Yes. All data in Firestore is encrypted at rest. Communications use TLS 1.3. API keys are stored as environment variables, never in source code.' },
      { q: 'Can I manage team access?', a: 'On the Agency plan, you get team accounts with role-based access control. Manage members from the Admin dashboard.' },
    ],
  },
];

const DEMO_PROJECTS = [
  { name: 'TaskFlow SaaS', desc: 'Project management app with Kanban boards', stack: 'React + Firebase + Vercel', color: '#3b82f6', url: '#' },
  { name: 'FitTrack Mobile', desc: 'Fitness tracking with Capacitor native wrapper', stack: 'React + Capacitor + Railway', color: '#10b981', url: '#' },
  { name: 'Artisan Portfolio', desc: 'Editorial photography portfolio with CMS', stack: 'Next.js + Sanity + Netlify', color: '#8b5cf6', url: '#' },
];

// ─── Stepper Bar ────────────────────────────────────────

function StepBar({ current, onStep, auto }: { current: number; onStep: (n: number) => void; auto?: boolean }) {
  return (
    <div className="w-full border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex items-center py-4 px-6 gap-2 overflow-x-auto">
        {ONBOARDING_STEPS.map((s, i) => {
          const done = auto ? (i !== current) : (i < current);
          const active = i === current;
          const clickable = auto || done;
          const Icon = s.icon;
          return (
            <React.Fragment key={s.id}>
              {i > 0 && <div className={cn("h-px flex-1 min-w-4", (auto || done) ? "bg-emerald-500" : "bg-black/10")} />}
              <button
                onClick={() => clickable && onStep(i)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium uppercase tracking-wider transition-all whitespace-nowrap",
                  active && "bg-[#09090B] text-white",
                  done && "bg-emerald-500/10 text-emerald-600 cursor-pointer hover:bg-emerald-500/20",
                  !done && !active && (auto ? "bg-emerald-500/10 text-emerald-600 cursor-pointer hover:bg-emerald-500/20" : "opacity-30 cursor-default")
                )}
              >
                {done && !active ? <CheckCircle2 size={12} /> : <Icon size={12} />}
                {s.label}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step Wrapper ───────────────────────────────────────

function StepShell({ phase, title, subtitle, children, onNext, onBack, nextLabel, nextDisabled }: {
  phase: string;
  title: React.ReactNode;
  subtitle: string;
  children: React.ReactNode;
  onNext?: () => void;
  onBack?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      className="max-w-5xl mx-auto px-6 py-12 lg:py-20 space-y-10"
    >
      <div className="space-y-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-600 font-bold">{phase}</p>
        <h2 className="text-5xl lg:text-6xl font-bold tracking-[-0.03em] leading-tight">{title}</h2>
        <p className="text-lg opacity-50 max-w-lg">{subtitle}</p>
      </div>
      {children}
      <div className="flex items-center justify-between pt-6">
        {onBack ? (
          <button onClick={onBack} className="flex items-center gap-2 text-xs font-semibold opacity-40 hover:opacity-100 transition-opacity">
            <ArrowLeft size={14} /> Back
          </button>
        ) : <div />}
        {onNext && (
          <button
            onClick={onNext}
            disabled={nextDisabled}
            className={cn(
              "flex items-center gap-2 bg-[#09090B] text-white px-8 py-4 rounded-full font-semibold transition-all brutal-shadow-sm",
              nextDisabled ? "opacity-30 cursor-not-allowed" : "hover:scale-105 active:scale-95"
            )}
          >
            {nextLabel || 'Continue'} <ArrowRight size={16} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Review Card (for auto-setup review) ───────────────

function ReviewCard({ label, icon: Icon, gradient, editing, onToggle, summary, reason, children }: {
  label: string;
  icon: React.ElementType;
  gradient: string;
  editing: boolean;
  onToggle: () => void;
  summary: React.ReactNode;
  reason?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("bg-white border rounded-2xl overflow-hidden transition-all", editing ? "border-[#09090B] brutal-shadow-sm" : "border-black/5")}>
      <button onClick={onToggle} className="w-full flex items-center gap-4 p-5 hover:bg-black/[0.02] transition-colors text-left">
        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white shrink-0`}>
          <Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wider text-black/30">{label}</p>
          <div className="text-sm mt-0.5 truncate">{summary}</div>
        </div>
        <Pencil size={14} className={cn("shrink-0 transition-all", editing ? "text-[#09090B]" : "opacity-20")} />
      </button>
      {editing && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="border-t border-black/5 p-5 space-y-3">
          {children}
          {reason && (
            <p className="text-[10px] opacity-40 flex items-center gap-1 mt-2"><Bot size={10} /> AI: {reason}</p>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ─── Help Drawer ────────────────────────────────────────

function HelpDrawer({ open, onClose, activeSection, onToggleSection }: {
  open: boolean;
  onClose: () => void;
  activeSection: string | null;
  onToggleSection: (id: string) => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="absolute right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl overflow-y-auto"
      >
        <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 p-6 border-b border-black/5 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 text-[11px] font-medium mb-1">
              <BookOpen size={12} /> Help Center
            </div>
            <h3 className="text-2xl font-bold tracking-[-0.03em]">How can we help?</h3>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {HELP_SECTIONS.map(section => {
            const isOpen = activeSection === section.id;
            const Icon = section.icon;
            return (
              <div key={section.id} className="border border-black/5 rounded-2xl overflow-hidden">
                <button
                  onClick={() => onToggleSection(section.id)}
                  className="w-full flex items-center justify-between p-5 hover:bg-black/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600"><Icon size={16} /></div>
                    <span className="font-bold text-sm">{section.title}</span>
                  </div>
                  {isOpen ? <ChevronDown size={16} className="opacity-40" /> : <ChevronRight size={16} className="opacity-40" />}
                </button>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="border-t border-black/5">
                    {section.items.map((item, i) => (
                      <div key={i} className="px-5 py-4 border-b border-black/5 last:border-0">
                        <p className="font-bold text-sm mb-2 flex items-start gap-2">
                          <Lightbulb size={14} className="mt-0.5 text-amber-500 shrink-0" />
                          {item.q}
                        </p>
                        <p className="text-sm opacity-60 leading-relaxed pl-[22px]">{item.a}</p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>
            );
          })}

          {/* Demo projects in help */}
          <div className="border border-black/5 rounded-2xl p-5 space-y-4 mt-8">
            <div className="flex items-center gap-2">
              <Play size={14} className="text-blue-500" />
              <span className="font-bold text-sm">Example Projects</span>
            </div>
            {DEMO_PROJECTS.map(d => (
              <div key={d.name} className="flex items-center gap-4 p-3 rounded-xl bg-black/[0.02]">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: d.color }}>
                  <Layers size={16} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">{d.name}</p>
                  <p className="text-[10px] opacity-40 font-mono">{d.stack}</p>
                </div>
                <ExternalLink size={14} className="opacity-20" />
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── AI Advisor Panel ───────────────────────────────────

function AIAdvisorPanel({ open, onClose, query, onQueryChange, onSubmit, loading, result }: {
  open: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
  result: Record<string, unknown> | null;
}) {
  if (!open) return null;
  const rec = result as Record<string, string> | null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto brutal-shadow"
      >
        <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 p-8 pb-6 border-b border-black/5">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 text-purple-600 text-[11px] font-medium mb-2">
                <Bot size={14} /> AI Stack Advisor
              </div>
              <h3 className="text-3xl font-bold tracking-[-0.03em]">What are you building?</h3>
              <p className="text-sm opacity-40 mt-1">Describe your project and get personalized tech stack recommendations.</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors">
              <X size={18} />
            </button>
          </div>
          <div className="mt-6 space-y-3">
            <div className="relative">
              <div className="absolute left-4 top-4 text-purple-400 pointer-events-none"><MessageCircle size={16} /></div>
              <textarea
                value={query}
                onChange={e => onQueryChange(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), onSubmit())}
                placeholder="e.g. A fitness tracking app with social features, workout logging, and leaderboards..."
                className="w-full bg-[#F8F8F7] border border-black/[0.06] rounded-[10px] pl-11 pr-5 pt-4 pb-16 text-[14px] leading-relaxed resize-none h-32 focus:border-black/20 focus:bg-white focus:outline-none focus:ring-0 transition-all duration-200 placeholder:text-black/25"
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <span className="text-[10px] font-mono opacity-20">{query.length > 0 ? `${query.length} chars` : 'Enter ↵ to submit'}</span>
                <button
                  onClick={onSubmit}
                  disabled={loading || !query.trim()}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-[10px] text-white transition-all",
                    loading || !query.trim() ? "bg-purple-300/60 cursor-not-allowed" : "bg-gradient-to-r from-purple-500 to-indigo-600 hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/20"
                  )}
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <><Sparkles size={12} /> Analyze</>}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 size={32} className="animate-spin text-purple-500" />
              <p className="text-sm opacity-40 font-mono">Analyzing your project requirements...</p>
            </div>
          )}

          {rec && !rec.error && !loading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Frontend', value: rec.frontend, icon: Palette, gradient: 'from-blue-500 to-cyan-400' },
                  { label: 'Backend', value: rec.backend, icon: Terminal, gradient: 'from-emerald-500 to-teal-400' },
                  { label: 'Database', value: rec.database, icon: Database, gradient: 'from-purple-500 to-pink-400' },
                  { label: 'Hosting', value: rec.hosting, icon: Globe, gradient: 'from-orange-500 to-red-400' },
                  { label: 'Auth', value: rec.auth, icon: Shield, gradient: 'from-indigo-500 to-blue-400' },
                  { label: 'Extras', value: rec.extras, icon: Sparkles, gradient: 'from-pink-500 to-rose-400' },
                ].map(item => (
                  <div key={item.label} className="bg-[#F5F5F4] p-5 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white`}>
                        <item.icon size={14} />
                      </div>
                      <span className="text-[10px] font-mono uppercase opacity-40 tracking-widest">{item.label}</span>
                    </div>
                    <p className="font-bold text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
              {rec.estimatedCost && (
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-2xl">
                  <p className="text-[10px] font-mono uppercase text-emerald-600 font-bold mb-1">Estimated Monthly Cost</p>
                  <p className="text-xl font-bold">{rec.estimatedCost}</p>
                </div>
              )}
              {rec.summary && (
                <div className="bg-purple-500/5 border border-purple-500/10 p-5 rounded-2xl">
                  <p className="text-[10px] font-mono uppercase text-purple-600 font-bold mb-2">AI Summary</p>
                  <p className="text-sm opacity-70 leading-relaxed">{rec.summary}</p>
                </div>
              )}
            </motion.div>
          )}

          {rec?.error && !loading && (
            <div className="text-center py-16">
              <p className="text-red-500 text-sm">{rec.error}</p>
            </div>
          )}

          {!rec && !loading && (
            <div className="text-center py-16 space-y-4">
              <Bot size={48} className="mx-auto opacity-10" />
              <p className="text-sm opacity-30">Describe your project idea above to get AI-powered stack recommendations.</p>
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {['E-commerce store', 'Social media app', 'SaaS dashboard', 'Portfolio site'].map(ex => (
                  <button key={ex} onClick={() => onQueryChange(ex)} className="px-4 py-2 rounded-full bg-black/5 text-xs font-mono hover:bg-black/10 transition-colors">{ex}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Tooltip ────────────────────────────────────────────

function ShipTooltip({ children, text, position = 'top' }: { children: React.ReactNode; text: string; position?: 'top' | 'bottom' | 'left' | 'right' }) {
  const [show, setShow] = useState(false);
  const posClass = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }[position];
  const arrowClass = {
    top: 'top-full left-1/2 -translate-x-1/2 -mt-1 rotate-45',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 -mb-1 rotate-45',
    left: 'left-full top-1/2 -translate-y-1/2 -ml-1 rotate-45',
    right: 'right-full top-1/2 -translate-y-1/2 -mr-1 rotate-45',
  }[position];
  return (
    <div className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className={`absolute ${posClass} px-3 py-2 bg-[#09090B] text-white text-[10px] rounded-lg whitespace-nowrap z-[200] pointer-events-none tracking-wide`}>
          {text}
          <div className={`absolute ${arrowClass} w-2 h-2 bg-[#09090B]`} />
        </div>
      )}
    </div>
  );
}

// ─── Tour Constants ─────────────────────────────────────

const TOUR_STEPS = [
  { icon: Rocket, title: 'Welcome to ShipSaaS', description: 'ShipSaaS is your AI-powered SaaS pipeline. Let\'s walk through the key areas of the platform.' },
  { icon: Code, title: 'Builder', description: 'Create new projects here. Describe your idea for AI Auto-Setup, or go step-by-step: choose source, domain, hosting, style, plan, and deploy.' },
  { icon: Layers, title: 'Dashboard', description: 'Your home base. See a quick overview of your projects and recent activity. Jump to any project from here.' },
  { icon: Database, title: 'Inventory', description: 'Browse all your shipped projects in a table with live status, hosting, architecture, and admin info.' },
  { icon: Shield, title: 'Admin Panel', description: 'Monitor deployment velocity, total projects, active users, API requests, and storage usage with real-time charts.' },
  { icon: UserIcon, title: 'Profile & Billing', description: 'Manage your display name, email, payment method, subscription plan, and provider API keys (Vercel, Netlify, etc.).' },
  { icon: Bot, title: 'AI Stack Advisor', description: 'Describe your project idea and get personalized recommendations for frontend, backend, database, hosting, and auth.' },
  { icon: HelpCircle, title: 'Help Center', description: 'Access guides, FAQs, and demo projects anytime by clicking the floating help button in the bottom-right corner.' },
];

// ─── Guided Tour ────────────────────────────────────────

function GuidedTour({ active, currentStep, onNext, onPrev, onClose, totalSteps }: {
  active: boolean;
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  totalSteps: number;
}) {
  if (!active) return null;
  const step = TOUR_STEPS[currentStep];
  const Icon = step.icon;
  return (
    <div className="fixed inset-0 z-[300]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <motion.div
          key={currentStep}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative bg-white rounded-2xl w-full max-w-lg p-10 space-y-6 brutal-shadow"
        >
          <button onClick={onClose} className="absolute top-6 right-6 w-8 h-8 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors">
            <X size={16} />
          </button>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white mx-auto">
            <Icon size={32} />
          </div>
          <div className="text-center space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-600 font-bold">Step {currentStep + 1} of {totalSteps}</p>
            <h3 className="text-2xl font-bold tracking-[-0.03em]">{step.title}</h3>
            <p className="text-sm opacity-50 leading-relaxed max-w-sm mx-auto">{step.description}</p>
          </div>
          {/* Progress dots */}
          <div className="flex justify-center gap-2">
            {TOUR_STEPS.map((_, i) => (
              <div key={i} className={cn("w-2 h-2 rounded-full transition-all", i === currentStep ? "bg-emerald-500 w-6" : i < currentStep ? "bg-emerald-500/50" : "bg-black/10")} />
            ))}
          </div>
          <div className="flex items-center justify-between pt-2">
            {currentStep > 0 ? (
              <button onClick={onPrev} className="flex items-center gap-2 text-xs font-semibold opacity-40 hover:opacity-100 transition-opacity">
                <ArrowLeft size={14} /> Back
              </button>
            ) : (
              <button onClick={onClose} className="text-xs font-semibold opacity-40 hover:opacity-100 transition-opacity">
                Skip Tour
              </button>
            )}
            <button
              onClick={currentStep === totalSteps - 1 ? onClose : onNext}
              className="flex items-center gap-2 bg-[#09090B] text-white px-6 py-3 rounded-full font-semibold text-xs hover:scale-105 active:scale-95 transition-transform"
            >
              {currentStep === totalSteps - 1 ? 'Get Started' : 'Next'} <ArrowRight size={14} />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────

export default function App() {
  const {
    user, authLoading, step, view, isOffline,
    authMode, email, password, confirmPassword, showPassword, authError, authBusy,
    termsAccepted, forgotPasswordMode, resetEmailSent, verificationSent,
    blueprint, uploadedFile, githubUrl,
    isDeploying, deployLogs, generatedCode, shippedProjects,
    domainSearch, autoMode, autoLoading, projectDescription, reviewEditing, aiReasoning,
    helpOpen, helpSection, aiAdvisorOpen, aiQuery, aiLoading, aiResult,
    tourActive, tourStep,
    profileName, profileSaved, apiKeys,
    integrationStatus, domainResults, domainSearchLoading,
    deleteConfirm, deleteLoading,
    setAuthMode, setEmail, setPassword, setConfirmPassword, setShowPassword, setAuthError,
    setTermsAccepted, setForgotPasswordMode,
    setStep, setView,
    setBlueprint, setUploadedFile, setGithubUrl,
    setDeployLogs, setGeneratedCode,
    setDomainSearch, setAutoMode, setProjectDescription, setReviewEditing,
    setHelpOpen, setHelpSection, setAiAdvisorOpen, setAiQuery,
    setTourActive, setTourStep,
    setProfileName, setProfileSaved,
    setDeleteConfirm,
    handleEmailAuth, handleAppleAuth, handleGoogleAuth, handleSignOut,
    handleDeploy, handleAiRecommend, handleAutoSetup, handleDeleteAccount,
    handleDeleteProject, handleForgotPassword, handleResendVerification,
    handleVerifyIntegration, handleDisconnectIntegration, handleSearchDomains,
    next, back, updateApiKey, nextTourStep, prevTourStep,
    initAuth, initOnlineStatus,
  } = useAppStore();

  const fileRef = useRef<HTMLInputElement>(null);
  const zipRef = useRef<HTMLInputElement>(null);
  const { setUploadedFiles } = useAppStore();

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file.name);
    setBlueprint({ ...blueprint, source: 'zip' });
    try {
      const zip = await JSZip.loadAsync(file);
      const extracted: Array<{ path: string; content: string }> = [];
      const skipDirs = ['node_modules/', '.git/', 'dist/', 'build/', '.next/', '__pycache__/'];
      for (const [path, entry] of Object.entries(zip.files)) {
        if (entry.dir) continue;
        if (skipDirs.some(d => path.includes(d))) continue;
        if ((entry as any)._data?.uncompressedSize > 500000) continue;
        try {
          const content = await entry.async('string');
          extracted.push({ path, content });
        } catch { /* skip binary files */ }
        if (extracted.length >= 80) break;
      }
      setUploadedFiles(extracted);
    } catch {
      setUploadedFile(null);
      setUploadedFiles(null);
    }
  };

  useEffect(() => initAuth(), []);
  useEffect(() => initOnlineStatus(), []);

  // ─── Landing page (step -1) ───────────────────────────

  if (step === -1) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-[#09090B] selection:bg-[#09090B] selection:text-white">
        {isOffline && (
          <div className="fixed top-0 left-0 right-0 z-[500] bg-amber-500 text-black text-xs font-semibold text-center py-2 flex items-center justify-center gap-2">
            <WifiOff size={14} /> You're offline — some features may be unavailable
          </div>
        )}
        {/* ── Hero ── */}
        <div className="relative overflow-hidden">
          <div className="bg-[#09090B] text-white min-h-[92vh] flex flex-col justify-center relative">
            <div className="absolute inset-0 subtle-grid-dark" />
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-to-b from-emerald-500/[0.07] via-blue-500/[0.04] to-transparent rounded-full blur-[100px]" />
            </div>
            <div className="max-w-5xl mx-auto px-6 py-24 lg:py-32 relative z-10 text-center">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.04] text-[11px] font-medium tracking-wide text-white/60 mb-10">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  AI-Powered Deployment Platform
                </div>
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-[-0.035em] leading-[1.08] mb-7 text-balance">
                Ship to production<br /><span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">in minutes, not months.</span>
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="text-lg lg:text-xl text-white/45 max-w-2xl mx-auto leading-relaxed mb-12">
                Import your code, configure your stack, and deploy — with intelligent AI recommendations at every step.
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
                <button
                  onClick={() => setStep(0)}
                  className="group flex items-center gap-3 bg-white text-[#09090B] px-8 py-4 rounded-full font-semibold text-[14px] hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.15)]"
                >
                  Start Building
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
                <button
                  onClick={() => setAiAdvisorOpen(true)}
                  className="flex items-center gap-2.5 px-7 py-4 rounded-full border border-white/[0.12] text-[14px] font-medium text-white/70 hover:text-white hover:bg-white/[0.05] hover:border-white/20 transition-all"
                >
                  <Bot size={16} /> AI Stack Advisor
                </button>
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.5 }} className="flex flex-wrap justify-center gap-x-12 gap-y-6 text-white/35">
                {[
                  { value: 'Vercel', label: 'Deployment' },
                  { value: 'Gemini AI', label: 'Code Generation' },
                  { value: 'GitHub', label: 'Source Import' },
                  { value: 'Firebase', label: 'Auth & Database' },
                ].map(stat => (
                  <div key={stat.label} className="text-center">
                    <p className="text-xl font-semibold text-white/70 tracking-tight">{stat.value}</p>
                    <p className="text-[11px] tracking-wide mt-1">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>

        {/* ── Features ── */}
        <section className="py-28 px-8 bg-white subtle-grid">
          <div className="max-w-6xl mx-auto space-y-20">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-600">Platform</p>
              <h2 className="text-4xl lg:text-5xl font-bold tracking-[-0.03em] leading-tight">Everything you need<br /><span className="text-black/25">to ship fast.</span></h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Layers, title: 'Multi-Stack Support', desc: 'React, Next.js, Vue, Svelte — import any framework. We auto-detect and configure.', gradient: 'from-blue-600 to-cyan-500' },
                { icon: Bot, title: 'AI Stack Advisor', desc: 'Describe your project and our AI recommends the optimal tech stack, hosting, and architecture.', gradient: 'from-violet-600 to-purple-500' },
                { icon: Globe, title: 'Vercel Deployment', desc: 'One-click deploy to Vercel with SSL, CDN, and auto-deploy from GitHub.', gradient: 'from-emerald-600 to-teal-500' },
                { icon: Shield, title: 'Security First', desc: 'Firebase Auth, encrypted data, rate limiting, CORS protection, and OWASP-compliant API.', gradient: 'from-orange-600 to-amber-500' },
                { icon: Palette, title: 'Design System', desc: 'Choose from Minimal, Brutalist, Editorial, or Glassmorphism. Pick colors, fonts, and more.', gradient: 'from-pink-600 to-rose-500' },
                { icon: Terminal, title: 'Code Generation', desc: 'Gemini AI generates production-ready source code — components, routes, auth, and styling.', gradient: 'from-indigo-600 to-blue-500' },
              ].map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-white p-8 rounded-2xl space-y-4 group border border-black/[0.04] hover:border-black/[0.08] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center text-white`}>
                    <f.icon size={18} />
                  </div>
                  <h3 className="font-semibold text-[15px]">{f.title}</h3>
                  <p className="text-sm text-black/45 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Early Access ── */}
        <section className="py-28 px-8 bg-[#09090B] text-white relative overflow-hidden">
          <div className="absolute inset-0 subtle-grid-dark" />
          <div className="max-w-4xl mx-auto relative z-10 text-center space-y-10">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-400">Early Access</p>
              <h2 className="text-4xl lg:text-5xl font-bold tracking-[-0.03em]">Built in public.</h2>
              <p className="text-lg text-white/40 max-w-xl mx-auto">ShipSaaS is live and evolving fast. Try it free, deploy your first project, and help shape what comes next.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { icon: Rocket, title: 'Deploy in minutes', desc: 'Import code, configure, and ship — powered by Vercel.' },
                { icon: Bot, title: 'AI generates code', desc: 'Gemini AI creates production-ready source from your blueprint.' },
                { icon: Shield, title: 'Real security', desc: 'Firebase Auth, AES-256 encryption, rate limiting, CORS.' },
              ].map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="p-7 rounded-2xl border border-white/[0.06] bg-white/[0.02] space-y-3"
                >
                  <f.icon size={20} className="text-emerald-400" />
                  <p className="font-semibold text-[13px]">{f.title}</p>
                  <p className="text-[12px] text-white/50 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
            <button
              onClick={() => setStep(0)}
              className="px-8 py-4 bg-white text-[#09090B] rounded-full font-semibold text-sm hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              Start Building — It's Free
            </button>
          </div>
        </section>

        {/* ── Demo Projects ── */}
        <section className="py-28 px-8 bg-white">
          <div className="max-w-6xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-600">Examples</p>
              <h2 className="text-4xl lg:text-5xl font-bold tracking-[-0.03em]">See what's been <span className="text-black/25">shipped.</span></h2>
              <p className="text-black/40 max-w-md mx-auto text-[15px]">Real projects built and deployed through ShipSaaS in minutes.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {DEMO_PROJECTS.map((d, i) => (
                <motion.div
                  key={d.name}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-[#fafafa] rounded-2xl overflow-hidden group border border-black/[0.04] hover:border-black/[0.08] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300"
                >
                  <div className="h-44 relative" style={{ backgroundColor: d.color + '0a' }}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: d.color }}>
                        <Play size={24} />
                      </div>
                    </div>
                    <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-white/90 text-[10px] font-medium backdrop-blur-sm border border-black/[0.04]">{d.stack}</div>
                  </div>
                  <div className="p-6 space-y-2">
                    <h3 className="font-semibold text-[15px]">{d.name}</h3>
                    <p className="text-sm text-black/45">{d.desc}</p>
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 pt-2 group-hover:gap-3 transition-all">
                      View Demo <ArrowUpRight size={12} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-28 px-8 bg-[#09090B] text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 subtle-grid-dark" />
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-t from-emerald-500/[0.06] to-transparent rounded-full blur-[80px]" />
          </div>
          <div className="max-w-2xl mx-auto space-y-8 relative z-10">
            <h2 className="text-4xl lg:text-5xl font-bold tracking-[-0.03em]">Ready to <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">ship?</span></h2>
            <p className="text-lg text-white/40">Deploy your first project in minutes. Completely free.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setStep(0)}
                className="px-8 py-4 bg-white text-[#09090B] rounded-full font-semibold text-sm hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                Start Free
              </button>
              <button
                onClick={() => setHelpOpen(true)}
                className="px-8 py-4 border border-white/[0.12] rounded-full font-medium text-sm text-white/70 hover:bg-white/[0.05] hover:border-white/20 transition-all flex items-center gap-2 justify-center"
              >
                <BookOpen size={16} /> How It Works
              </button>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="bg-[#09090B] text-white/30 py-8 px-8 border-t border-white/[0.04]">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2.5">
              <Rocket size={14} className="text-emerald-400" />
              <span className="text-xs font-semibold tracking-wider text-white/50">ShipSaaS</span>
              <span className="text-[10px]">© 2026</span>
            </div>
            <div className="flex gap-6">
              <button onClick={() => { setView('about'); setStep(0); }} className="text-xs hover:text-white/70 transition-colors">About</button>
              <button onClick={() => { setView('services'); setStep(0); }} className="text-xs hover:text-white/70 transition-colors">Services</button>
              <button onClick={() => { setView('how-it-works'); setStep(0); }} className="text-xs hover:text-white/70 transition-colors">How It Works</button>
              <button onClick={() => setHelpOpen(true)} className="text-xs hover:text-white/70 transition-colors">Help</button>
              <button onClick={() => setAiAdvisorOpen(true)} className="text-xs hover:text-white/70 transition-colors">AI Advisor</button>
              <button onClick={() => { setView('terms'); setStep(0); }} className="text-xs hover:text-white/70 transition-colors">Terms</button>
              <button onClick={() => { setView('privacy'); setStep(0); }} className="text-xs hover:text-white/70 transition-colors">Privacy</button>
            </div>
          </div>
        </footer>

        {/* Overlays */}
        <HelpDrawer open={helpOpen} onClose={() => setHelpOpen(false)} activeSection={helpSection} onToggleSection={s => setHelpSection(helpSection === s ? null : s)} />
        <AIAdvisorPanel
          open={aiAdvisorOpen}
          onClose={() => setAiAdvisorOpen(false)}
          query={aiQuery}
          onQueryChange={setAiQuery}
          onSubmit={handleAiRecommend}
          loading={aiLoading}
          result={aiResult}
        />
      </div>
    );
  }

  // ─── Main app shell ───────────────────────────────────

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#09090B] font-sans selection:bg-[#09090B] selection:text-white">
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-[500] bg-amber-500 text-black text-xs font-semibold text-center py-2 flex items-center justify-center gap-2">
          <WifiOff size={14} /> You're offline — some features may be unavailable
        </div>
      )}
      {/* Header */}
      <header className="border-b border-black/[0.04] bg-white/70 backdrop-blur-xl sticky top-0 z-50 px-6 py-3.5 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => { setStep(-1); setView('onboarding'); }}>
            <div className="w-8 h-8 bg-[#09090B] rounded-lg flex items-center justify-center text-white"><Rocket size={16} /></div>
            <h1 className="font-semibold text-[15px] tracking-tight">ShipSaaS</h1>
          </div>
          {user && (
            <>
              <div className="h-4 w-px bg-black/10" />
              <nav className="flex gap-4">
                {([
                  { id: 'onboarding' as const, label: 'Builder' },
                  { id: 'dashboard' as const, label: 'Dashboard' },
                  { id: 'inventory' as const, label: 'Inventory' },
                  { id: 'admin' as const, label: 'Admin' },
                ]).map((v) => (
                  <ShipTooltip key={v.id} text={v.id === 'onboarding' ? 'Create & deploy projects' : v.id === 'dashboard' ? 'Project overview' : v.id === 'inventory' ? 'All shipped projects' : 'Monitoring & analytics'}>
                    <button
                      onClick={() => { setView(v.id); if (v.id === 'onboarding' && step < 0) setStep(0); }}
                      className={cn(
                        "text-[13px] font-medium transition-all",
                        view === v.id ? "text-[#09090B]" : "text-black/35 hover:text-black/70"
                      )}
                    >
                      {v.label}
                    </button>
                  </ShipTooltip>
                ))}
              </nav>
            </>
          )}
          {!user && (
            <>
              <div className="h-4 w-px bg-black/10" />
              <nav className="flex gap-4">
                {([
                  { id: 'about' as const, label: 'About' },
                  { id: 'services' as const, label: 'Services' },
                  { id: 'how-it-works' as const, label: 'How It Works' },
                ]).map((v) => (
                  <button
                    key={v.id}
                    onClick={() => { setView(v.id); setStep(0); }}
                    className={cn(
                      "text-[13px] font-medium transition-all",
                      view === v.id ? "text-[#09090B]" : "text-black/35 hover:text-black/70"
                    )}
                  >
                    {v.label}
                  </button>
                ))}
              </nav>
            </>
          )}
        </div>
        {user && (
          <div className="flex items-center gap-4">
            <ShipTooltip text="Take a guided tour">
              <button onClick={() => { setTourStep(0); setTourActive(true); }} className="text-[13px] font-medium text-black/35 hover:text-black/70 transition-colors flex items-center gap-1.5">
                <CircleDot size={13} /> Tour
              </button>
            </ShipTooltip>
            <ShipTooltip text="Manage your profile & billing">
              <button onClick={() => setView('profile')} className={cn("text-[13px] font-medium transition-all flex items-center gap-1.5", view === 'profile' ? "text-[#09090B]" : "text-black/35 hover:text-black/70")}>
                <UserIcon size={13} /> Profile
              </button>
            </ShipTooltip>
            <p className="text-[12px] text-black/30">{user.email}</p>
            <button onClick={() => handleSignOut()} className="text-[13px] font-medium text-black/35 hover:text-black/70 transition-colors">
              Sign out
            </button>
          </div>
        )}
      </header>

      {/* Stepper (onboarding view only) */}
      {view === 'onboarding' && step >= 0 && (
        <StepBar current={step} onStep={setStep} auto={autoMode} />
      )}

      <AnimatePresence mode="wait">
        {/* ── Auth Guard ─────────────────────────────── */}
        {!user && (view === 'admin' || view === 'dashboard' || view === 'inventory' || view === 'profile') && (
          <motion.div key="guard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-md mx-auto px-6 py-32 text-center space-y-6">
            <Lock size={48} className="mx-auto text-black/10" />
            <h2 className="text-3xl font-bold tracking-[-0.02em]">Sign in required</h2>
            <p className="text-black/40 text-sm">You need to be signed in to access this area.</p>
            <button onClick={() => { setView('onboarding'); setStep(0); }} className="px-8 py-3 bg-[#09090B] text-white rounded-full font-semibold text-sm hover:bg-[#09090B]/90 transition-colors">
              Sign In
            </button>
          </motion.div>
        )}

        {/* ── Admin View ──────────────────────────────── */}
        {view === 'admin' && user && (
          <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-6xl mx-auto p-8 lg:p-16 space-y-10">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 text-[11px] font-medium">
                <Shield size={12} /> Command Center
              </div>
              <h2 className="text-4xl font-bold tracking-[-0.03em]">Admin Dashboard</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {[
                { label: 'Total Projects', value: String(shippedProjects.length), icon: Rocket, color: 'text-blue-500' },
                { label: 'Live Projects', value: String(shippedProjects.filter(p => p.status === 'live').length), icon: Users, color: 'text-emerald-500' },
                { label: 'Draft Projects', value: String(shippedProjects.filter(p => p.status === 'draft').length), icon: Activity, color: 'text-purple-500' },
                { label: 'Hosting', value: shippedProjects.length > 0 ? [...new Set(shippedProjects.map(p => p.hosting))].join(', ') : 'None', icon: Database, color: 'text-orange-500' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-7 rounded-2xl brutal-shadow space-y-4 border border-black/[0.04]">
                  <div className={cn("w-9 h-9 rounded-xl bg-black/[0.03] flex items-center justify-center", stat.color)}><stat.icon size={18} /></div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-black/35">{stat.label}</p>
                  <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-8 brutal-shadow space-y-6 border border-black/[0.04]">
              <h3 className="font-semibold text-lg">Deployment History</h3>
              <div className="h-[300px] w-full">
                {shippedProjects.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-black/20 text-sm">Deploy your first project to see stats here.</div>
                ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={(() => {
                    const byWeek: Record<string, number> = {};
                    shippedProjects.forEach(p => {
                      const d = p.timestamp || 'Unknown';
                      byWeek[d] = (byWeek[d] || 0) + 1;
                    });
                    return Object.entries(byWeek).slice(-8).map(([name, deployments]) => ({ name, deployments }));
                  })()}>
                    <defs>
                      <linearGradient id="colorDeploy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#09090B" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#09090B" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#00000008" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="deployments" stroke="#09090B" strokeWidth={2} fillOpacity={1} fill="url(#colorDeploy)" />
                  </AreaChart>
                </ResponsiveContainer>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Inventory View ──────────────────────────── */}
        {view === 'inventory' && user && (
          <motion.div key="inventory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-6xl mx-auto p-8 lg:p-16 space-y-10">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[11px] font-medium">
                <ShieldCheck size={12} /> Global Fleet
              </div>
              <h2 className="text-4xl font-bold tracking-[-0.03em]">Project Inventory</h2>
            </div>
            <div className="bg-white rounded-2xl overflow-hidden brutal-shadow border border-black/[0.04]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#09090B] text-white">
                    {['Project', 'URL / Hosting', 'Architecture', 'Admin', 'Status'].map(h => (
                      <th key={h} className="p-5 text-[11px] font-medium uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04]">
                  {shippedProjects.length === 0 ? (
                    <tr><td colSpan={5} className="p-24 text-center text-black/20">
                      <Database size={48} className="mx-auto mb-4" />
                      <p className="text-xs font-medium uppercase tracking-wider">No projects shipped yet</p>
                      <button onClick={() => { setStep(0); setView('onboarding'); }} className="mt-4 px-6 py-2 bg-[#09090B] text-white rounded-full text-xs font-semibold hover:scale-105 transition-transform">Create First Project</button>
                    </td></tr>
                  ) : shippedProjects.map(p => {
                    const statusConfig = {
                      live: { color: 'bg-emerald-500', label: 'Live', pulse: true },
                      deploying: { color: 'bg-blue-500', label: 'Deploying', pulse: true },
                      draft: { color: 'bg-amber-500', label: 'Draft', pulse: false },
                      failed: { color: 'bg-red-500', label: 'Failed', pulse: false },
                    }[p.status || 'draft'] || { color: 'bg-gray-400', label: p.status || 'Unknown', pulse: false };
                    return (
                    <tr key={p.id} className="hover:bg-black/[0.01] transition-colors group">
                      <td className="p-5"><p className="font-semibold">{p.name}</p><p className="text-[11px] text-black/30 mt-0.5">{p.id}</p></td>
                      <td className="p-5">{p.url ? <a href={p.url} target="_blank" rel="noreferrer" className="text-sm underline underline-offset-4 hover:text-emerald-600 transition-colors">{p.url.replace('https://', '')}</a> : <span className="text-sm text-black/30">No URL</span>}<p className="text-[11px] text-black/30 mt-0.5">{p.hosting}</p></td>
                      <td className="p-5"><p className="text-sm">{p.db}</p><p className="text-[11px] text-black/30 mt-0.5">Auth: {p.auth}</p></td>
                      <td className="p-5"><p className="text-xs">{p.admin}</p></td>
                      <td className="p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2"><div className={cn('w-2 h-2 rounded-full', statusConfig.color, statusConfig.pulse && 'animate-pulse')} /><span className="text-[11px] font-semibold uppercase tracking-wider">{statusConfig.label}</span></div>
                          {p.firestoreId && <button onClick={() => handleDeleteProject(p.firestoreId!)} className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity" title="Delete project"><Trash2 size={14} className="text-red-500" /></button>}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ── Dashboard View ──────────────────────────── */}
        {view === 'dashboard' && user && (
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-5xl mx-auto px-6 py-16 space-y-10">
            <div className="space-y-3">
              <h2 className="text-4xl font-bold tracking-[-0.03em]">Welcome back{profileName ? `, ${profileName}` : ''}.</h2>
              <p className="text-black/40 text-sm">Here's an overview of your projects and activity.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Projects', value: String(shippedProjects.length), icon: Layers, color: 'text-blue-500' },
                { label: 'Live', value: String(shippedProjects.filter(p => p.status === 'live').length), icon: Globe, color: 'text-emerald-500' },
                { label: 'Drafts', value: String(shippedProjects.filter(p => p.status === 'draft' || !p.status).length), icon: FileText, color: 'text-amber-500' },
                { label: 'Failed', value: String(shippedProjects.filter(p => p.status === 'failed').length), icon: AlertTriangle, color: 'text-red-500' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-black/[0.04] space-y-3">
                  <div className={cn('w-8 h-8 rounded-lg bg-black/[0.03] flex items-center justify-center', stat.color)}><stat.icon size={16} /></div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-black/35">{stat.label}</p>
                  <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Recent projects */}
            {shippedProjects.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Recent Projects</h3>
                  <button onClick={() => setView('inventory')} className="text-xs text-black/40 hover:text-black/70 transition-colors flex items-center gap-1">View all <ArrowRight size={12} /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {shippedProjects.slice(0, 6).map(p => {
                    const statusColor = p.status === 'live' ? 'bg-emerald-500' : p.status === 'failed' ? 'bg-red-500' : 'bg-amber-500';
                    return (
                      <div key={p.id} className="bg-white p-6 rounded-2xl border border-black/[0.04] space-y-4 hover:border-black/[0.08] hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all group">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{p.name}</p>
                            <p className="text-[11px] text-black/30 mt-0.5">{p.hosting}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className={cn('w-2 h-2 rounded-full', statusColor)} />
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-black/40">{p.status || 'draft'}</span>
                          </div>
                        </div>
                        {p.url && (
                          <a href={p.url} target="_blank" rel="noreferrer" className="text-xs text-black/40 hover:text-emerald-600 transition-colors flex items-center gap-1 truncate">
                            <ExternalLink size={10} /> {p.url.replace('https://', '')}
                          </a>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-black/5">
                          <p className="text-[10px] text-black/25">{p.timestamp}</p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setBlueprint({ appName: p.name, projectId: p.id, style: (p as any).style || 'minimal', color: (p as any).color || '#10b981', source: (p as any).source || 'github', hosting: 'vercel', domain: (p as any).domain, authEnabled: (p as any).authEnabled ?? true, appType: 'web', plan: 'free' });
                                setView('onboarding');
                                handleDeploy();
                              }}
                              className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-semibold text-blue-500"
                              title="Redeploy project"
                            >
                              <RotateCcw size={11} /> Redeploy
                            </button>
                            {p.firestoreId && <button onClick={() => handleDeleteProject(p.firestoreId!)} className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity"><Trash2 size={12} className="text-red-500" /></button>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-black/[0.04] rounded-2xl p-16 text-center space-y-4">
                <Rocket size={48} className="mx-auto text-black/10" />
                <h3 className="font-bold text-lg">No projects yet</h3>
                <p className="text-sm text-black/40 max-w-sm mx-auto">Create your first project with AI Auto-Setup or go through the step-by-step builder.</p>
                <button onClick={() => { setStep(0); setView('onboarding'); }} className="px-6 py-3 bg-[#09090B] text-white rounded-full text-sm font-semibold hover:scale-105 transition-transform">Start Building</button>
              </div>
            )}

            {/* Quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button onClick={() => { setStep(0); setView('onboarding'); }} className="bg-white p-6 rounded-2xl border border-black/[0.04] hover:border-black/[0.08] transition-all text-left space-y-2 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-white"><Rocket size={18} /></div>
                <p className="font-semibold text-sm">New Project</p>
                <p className="text-[11px] text-black/40">Launch the deployment pipeline</p>
              </button>
              <button onClick={() => setView('inventory')} className="bg-white p-6 rounded-2xl border border-black/[0.04] hover:border-black/[0.08] transition-all text-left space-y-2 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white"><Layers size={18} /></div>
                <p className="font-semibold text-sm">View Inventory</p>
                <p className="text-[11px] text-black/40">Browse all your shipped projects</p>
              </button>
              <button onClick={() => setAiAdvisorOpen(true)} className="bg-white p-6 rounded-2xl border border-black/[0.04] hover:border-black/[0.08] transition-all text-left space-y-2 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center text-white"><Bot size={18} /></div>
                <p className="font-semibold text-sm">AI Stack Advisor</p>
                <p className="text-[11px] text-black/40">Get personalized tech recommendations</p>
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Profile & Billing View ─────────────────── */}
        {view === 'profile' && user && (
          <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-5xl mx-auto p-8 lg:p-16 space-y-10">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 text-[11px] font-medium">
                <UserIcon size={12} /> Account Settings
              </div>
              <h2 className="text-4xl font-bold tracking-[-0.03em]">Your Profile</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Profile Info */}
              <div className="bg-white p-8 rounded-2xl brutal-shadow space-y-6 border border-black/[0.04]">
                <h3 className="font-semibold text-lg">Personal Information</h3>
                <div className="flex items-center gap-6 pb-4 border-b border-black/5">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                    {(user.displayName || user.email || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-lg">{user.displayName || 'User'}</p>
                    <p className="text-sm text-black/35">{user.email}</p>
                    <p className="text-[10px] text-black/25 mt-1">UID: {user.uid.slice(0, 12)}...</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-medium uppercase tracking-wider text-black/35">Display Name</label>
                    <input
                      type="text"
                      value={profileName || user.displayName || ''}
                      onChange={e => setProfileName(e.target.value)}
                      placeholder="Your name"
                      className="w-full bg-[#F8F8F7] border border-black/[0.06] rounded-[10px] px-4 py-3 text-[14px] focus:border-black/20 focus:bg-white focus:outline-none focus:ring-0 transition-all duration-200 placeholder:text-black/25"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-medium uppercase tracking-wider text-black/35">Email</label>
                    <input
                      type="email"
                      value={user.email || ''}
                      disabled
                      className="w-full bg-[#F3F3F2] border border-black/[0.04] rounded-[10px] px-4 py-3 text-[14px] text-black/40 cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-medium uppercase tracking-wider text-black/35">Current Plan</label>
                    <div className="flex items-center gap-3">
                      <span className="px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-semibold capitalize">{blueprint.plan}</span>
                      <span className="text-sm opacity-40">{PLANS.find(p => p.id === blueprint.plan)?.price}{PLANS.find(p => p.id === blueprint.plan)?.period}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing */}
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-2xl brutal-shadow space-y-6 border border-black/[0.04]">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Billing & Subscription</h3>
                    <CreditCard size={20} className="opacity-20" />
                  </div>
                  <div className="bg-gradient-to-br from-[#09090B] to-[#1e1e2e] text-white p-6 rounded-2xl space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] uppercase opacity-40 tracking-wider">Current Plan</p>
                        <p className="text-xl font-bold capitalize mt-1">{blueprint.plan}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase">Active</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">{PLANS.find(p => p.id === blueprint.plan)?.price}</span>
                      <span className="text-xs opacity-40">{PLANS.find(p => p.id === blueprint.plan)?.period}</span>
                    </div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-600" />
                      <p className="text-sm font-semibold text-emerald-800">Free Plan — All Features Included</p>
                    </div>
                    <p className="text-xs text-emerald-700/70 leading-relaxed">You have full access to all ShipSaaS features including AI code generation, Vercel deployment, GitHub integration, and domain search. Paid plans with advanced features are coming soon.</p>
                  </div>
                </div>

                {/* Save button */}
                <button
                  onClick={() => { setProfileSaved(true); setTimeout(() => setProfileSaved(false), 3000); }}
                  className="w-full bg-[#09090B] text-white py-4 rounded-2xl font-semibold hover:bg-[#09090B]/90 transition-all brutal-shadow-sm flex items-center justify-center gap-2"
                >
                  {profileSaved ? <><CheckCircle2 size={16} /> Saved!</> : 'Save Profile'}
                </button>
              </div>
            </div>

            {/* Connected Accounts */}
            <div className="bg-white p-8 rounded-2xl brutal-shadow space-y-6 border border-black/[0.04]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Connected Accounts</h3>
                  <p className="text-sm text-black/35 mt-1">Link your hosting, deployment, and service accounts. Tokens are verified in real-time against each provider's API.</p>
                </div>
                <Workflow size={20} className="opacity-20" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'vercel', label: 'Vercel', desc: 'Deploy Next.js & React apps', gradient: 'from-black to-gray-700', verifiable: true },
                  { key: 'github', label: 'GitHub', desc: 'Repository access & CI/CD', gradient: 'from-gray-700 to-gray-500', verifiable: true },
                  { key: 'stripe', label: 'Stripe', desc: 'Payment processing', gradient: 'from-indigo-500 to-purple-400', verifiable: true },
                  { key: 'cloudflare', label: 'Cloudflare', desc: 'DNS & domain management', gradient: 'from-orange-400 to-yellow-400', verifiable: true },
                  { key: 'netlify', label: 'Netlify', desc: 'Static sites & serverless', gradient: 'from-teal-500 to-cyan-400', verifiable: false },
                  { key: 'railway', label: 'Railway', desc: 'Full-stack apps & databases', gradient: 'from-purple-500 to-indigo-400', verifiable: false },
                  { key: 'aws', label: 'AWS', desc: 'Amplify hosting & services', gradient: 'from-orange-500 to-amber-400', verifiable: false },
                  { key: 'digitalocean', label: 'DigitalOcean', desc: 'App platform & droplets', gradient: 'from-blue-500 to-blue-400', verifiable: false },
                ].map(provider => {
                  const status = integrationStatus[provider.key];
                  const hasToken = !!apiKeys[provider.key];
                  const isConnected = status?.connected;
                  const isLoading = status?.loading;
                  return (
                    <div key={provider.key} className={cn("p-5 rounded-2xl space-y-3 border transition-all", isConnected ? "bg-emerald-50/50 border-emerald-200" : "bg-[#F5F5F4] border-transparent")}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${provider.gradient} flex items-center justify-center text-white`}>
                            {isConnected ? <CheckCircle2 size={14} /> : <Key size={14} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm">{provider.label}</p>
                              {isConnected && <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600">Connected</span>}
                            </div>
                            <p className="text-[10px] text-black/35">{isConnected && status?.username ? `@${status.username}` : provider.desc}</p>
                          </div>
                        </div>
                        {hasToken && isConnected && (
                          <button onClick={() => handleDisconnectIntegration(provider.key)} className="text-[10px] text-red-400 hover:text-red-600 transition-colors font-medium">Disconnect</button>
                        )}
                      </div>
                      {!isConnected && (
                        <div className="flex gap-2">
                          <input
                            type="password"
                            value={apiKeys[provider.key]}
                            onChange={e => updateApiKey(provider.key, e.target.value)}
                            placeholder={`${provider.label} API Token`}
                            className="flex-1 bg-white border border-black/[0.06] rounded-[10px] px-3 py-2.5 text-[13px] font-mono focus:border-black/20 focus:outline-none focus:ring-0 transition-all duration-200 placeholder:text-black/25"
                          />
                          {hasToken && provider.verifiable && (
                            <button
                              onClick={() => handleVerifyIntegration(provider.key)}
                              disabled={isLoading}
                              className="px-4 py-2.5 bg-[#09090B] text-white rounded-[10px] text-xs font-semibold hover:bg-[#09090B]/80 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                            >
                              {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                              {isLoading ? 'Verifying...' : 'Verify'}
                            </button>
                          )}
                        </div>
                      )}
                      {status?.error && !isConnected && (
                        <p className="text-[10px] text-red-500 flex items-center gap-1"><AlertTriangle size={10} /> {status.error}</p>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 text-[10px] opacity-30">
                <ShieldCheck size={10} /> <span>API tokens are encrypted and stored securely. They are only used for deployments you initiate. Tokens are verified against each provider's official API.</span>
              </div>
            </div>

            {/* ── Danger Zone: Account Deletion ── */}
            <div className="bg-white border border-red-100 p-8 rounded-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-red-600">Danger Zone</h3>
                  <p className="text-sm text-black/35 mt-1">Permanently delete your account and all associated data.</p>
                </div>
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              {!deleteConfirm ? (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors text-sm font-semibold"
                >
                  <Trash2 size={16} /> Delete Account
                </button>
              ) : (
                <div className="bg-red-50 border border-red-200 p-6 rounded-2xl space-y-4">
                  <p className="text-sm font-bold text-red-700">Are you absolutely sure?</p>
                  <p className="text-xs text-red-600/70">This will permanently delete your account, all projects, billing data, and API keys. This action cannot be undone.</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleDeleteAccount()}
                      disabled={deleteLoading}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-semibold"
                    >
                      {deleteLoading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      Yes, Delete Everything
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(false)}
                      className="px-6 py-3 rounded-xl border border-black/[0.06] text-sm font-medium hover:bg-black/[0.02] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Privacy Policy View ─────────────────────── */}
        {view === 'privacy' && (
          <motion.div key="privacy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-4xl mx-auto px-6 py-16 lg:py-24 space-y-12">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 text-[11px] font-medium">
                <Shield size={12} /> Legal
              </div>
              <h1 className="text-4xl font-bold tracking-[-0.03em]">Privacy Policy</h1>
              <p className="text-sm text-black/35">Last updated: March 15, 2026</p>
            </div>

            <div className="prose prose-sm max-w-none space-y-8">
              <section className="bg-white border border-black/[0.04] p-7 rounded-2xl space-y-4">
                <h2 className="text-xl font-bold">1. Information We Collect</h2>
                <p className="opacity-60 leading-relaxed">When you create an account, we collect your <strong>email address</strong>, <strong>display name</strong>, and <strong>authentication provider information</strong> (Google or Apple sign-in). If you add a payment method, your card details are processed by Stripe — we never store full card numbers on our servers.</p>
                <p className="opacity-60 leading-relaxed">We also collect <strong>project configuration data</strong> (app names, hosting preferences, style choices) that you provide during the pipeline setup process, and <strong>provider API keys</strong> you optionally enter for deployment integrations.</p>
              </section>

              <section className="bg-white border border-black/[0.04] p-7 rounded-2xl space-y-4">
                <h2 className="text-xl font-bold">2. How We Use Your Data</h2>
                <ul className="space-y-2 opacity-60">
                  <li className="flex items-start gap-2"><Check size={14} className="text-emerald-500 shrink-0 mt-1" /> <span>To create and manage your ShipSaaS account</span></li>
                  <li className="flex items-start gap-2"><Check size={14} className="text-emerald-500 shrink-0 mt-1" /> <span>To deploy your projects to hosting providers on your behalf</span></li>
                  <li className="flex items-start gap-2"><Check size={14} className="text-emerald-500 shrink-0 mt-1" /> <span>To provide AI-powered stack recommendations via Google Gemini</span></li>
                  <li className="flex items-start gap-2"><Check size={14} className="text-emerald-500 shrink-0 mt-1" /> <span>To process payments through Stripe</span></li>
                  <li className="flex items-start gap-2"><Check size={14} className="text-emerald-500 shrink-0 mt-1" /> <span>To send transactional emails (deployment confirmations, account changes)</span></li>
                </ul>
              </section>

              <section className="bg-white border border-black/[0.04] p-7 rounded-2xl space-y-4">
                <h2 className="text-xl font-bold">3. Data Storage & Security</h2>
                <p className="opacity-60 leading-relaxed">Your data is stored in <strong>Google Cloud Firestore</strong> (encrypted at rest). All communications use <strong>TLS 1.3</strong>. API keys are stored encrypted and are only decrypted at the moment of deployment. We implement rate limiting, CORS protection, and follow OWASP security guidelines.</p>
              </section>

              <section className="bg-white border border-black/[0.04] p-7 rounded-2xl space-y-4">
                <h2 className="text-xl font-bold">4. Third-Party Services</h2>
                <p className="opacity-60 leading-relaxed">We share data with these providers only as needed to deliver our services:</p>
                <ul className="space-y-2 opacity-60">
                  <li className="flex items-start gap-2"><ArrowRight size={14} className="text-blue-500 shrink-0 mt-1" /> <span><strong>Firebase</strong> (Google) — Authentication, database, hosting</span></li>
                  <li className="flex items-start gap-2"><ArrowRight size={14} className="text-blue-500 shrink-0 mt-1" /> <span><strong>Google Gemini AI</strong> — Project analysis and code generation (project descriptions are sent)</span></li>
                  <li className="flex items-start gap-2"><ArrowRight size={14} className="text-blue-500 shrink-0 mt-1" /> <span><strong>Stripe</strong> — Payment processing</span></li>
                  <li className="flex items-start gap-2"><ArrowRight size={14} className="text-blue-500 shrink-0 mt-1" /> <span><strong>Hosting providers</strong> (Vercel, Netlify, Railway, AWS, DigitalOcean) — Only when you deploy</span></li>
                </ul>
              </section>

              <section className="bg-white border border-black/[0.04] p-7 rounded-2xl space-y-4">
                <h2 className="text-xl font-bold">5. Your Rights</h2>
                <p className="opacity-60 leading-relaxed">You have the right to:</p>
                <ul className="space-y-2 opacity-60">
                  <li className="flex items-start gap-2"><Check size={14} className="text-emerald-500 shrink-0 mt-1" /> <span><strong>Access</strong> your personal data at any time from your Profile page</span></li>
                  <li className="flex items-start gap-2"><Check size={14} className="text-emerald-500 shrink-0 mt-1" /> <span><strong>Update</strong> your display name and preferences</span></li>
                  <li className="flex items-start gap-2"><Check size={14} className="text-emerald-500 shrink-0 mt-1" /> <span><strong>Delete</strong> your account and all data (Profile → Danger Zone)</span></li>
                  <li className="flex items-start gap-2"><Check size={14} className="text-emerald-500 shrink-0 mt-1" /> <span><strong>Export</strong> your project data by contacting support</span></li>
                </ul>
              </section>

              <section className="bg-white border border-black/[0.04] p-7 rounded-2xl space-y-4">
                <h2 className="text-xl font-bold">6. Data Retention</h2>
                <p className="opacity-60 leading-relaxed">We retain your data for as long as your account is active. When you delete your account, all personal data, project configurations, and API keys are permanently removed within 30 days. Anonymized analytics may be retained.</p>
              </section>

              <section className="bg-white border border-black/[0.04] p-7 rounded-2xl space-y-4">
                <h2 className="text-xl font-bold">7. Children's Privacy</h2>
                <p className="opacity-60 leading-relaxed">ShipSaaS is not intended for users under 13 years of age. We do not knowingly collect personal information from children.</p>
              </section>

              <section className="bg-white border border-black/[0.04] p-7 rounded-2xl space-y-4">
                <h2 className="text-xl font-bold">8. Contact</h2>
                <p className="opacity-60 leading-relaxed">For privacy-related inquiries, email <strong>privacy@shipsaas.io</strong>.</p>
              </section>
            </div>
          </motion.div>
        )}

        {/* ── Terms of Service View ───────────────────── */}
        {view === 'terms' && (
          <motion.div key="terms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-4xl mx-auto px-6 py-16 lg:py-24 space-y-12">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 text-[11px] font-medium">
                <ScrollText size={12} /> Legal
              </div>
              <h1 className="text-4xl font-bold tracking-[-0.03em]">Terms of Service</h1>
              <p className="text-sm text-black/35">Last updated: March 15, 2026</p>
            </div>

            <div className="prose prose-sm max-w-none space-y-8">
              <section className="bg-white border border-black/[0.04] p-7 rounded-2xl space-y-4">
                <h2 className="text-xl font-bold">1. Acceptance of Terms</h2>
                <p className="opacity-60 leading-relaxed">By accessing or using ShipSaaS ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service. We reserve the right to modify these terms at any time; continued use constitutes acceptance of changes.</p>
              </section>

              <section className="bg-white border border-black/[0.04] p-7 rounded-2xl space-y-4">
                <h2 className="text-xl font-bold">2. Description of Service</h2>
                <p className="opacity-60 leading-relaxed">ShipSaaS is an AI-powered SaaS deployment pipeline that helps developers deploy web and mobile applications. The Service includes project configuration, AI code generation, hosting provider integration, domain management, and deployment automation.</p>
              </section>

              <section className="bg-white border border-black/[0.04] p-7 rounded-2xl space-y-4">
                <h2 className="text-xl font-bold">3. Account Responsibilities</h2>
                <ul className="space-y-2 opacity-60">
                  <li className="flex items-start gap-2"><ArrowRight size={14} className="text-blue-500 shrink-0 mt-1" /> <span>You must provide accurate account information</span></li>
                  <li className="flex items-start gap-2"><ArrowRight size={14} className="text-blue-500 shrink-0 mt-1" /> <span>You are responsible for maintaining the security of your account credentials and API keys</span></li>
                  <li className="flex items-start gap-2"><ArrowRight size={14} className="text-blue-500 shrink-0 mt-1" /> <span>You must be at least 13 years old to use the Service</span></li>
                  <li className="flex items-start gap-2"><ArrowRight size={14} className="text-blue-500 shrink-0 mt-1" /> <span>You are responsible for all activity under your account</span></li>
                </ul>
              </section>

              <section className="bg-white border border-black/[0.04] p-7 rounded-2xl space-y-4">
                <h2 className="text-xl font-bold">4. Subscription & Billing</h2>
                <p className="opacity-60 leading-relaxed">ShipSaaS offers free and paid plans. Paid subscriptions are billed monthly through Stripe. You may cancel at any time; access continues through the end of the billing period. No refunds are provided for partial months. Pricing is subject to change with 30 days' notice.</p>
              </section>

              <section className="bg-white border border-black/[0.04] p-7 rounded-2xl space-y-4">
                <h2 className="text-xl font-bold">5. Acceptable Use</h2>
                <p className="opacity-60 leading-relaxed">You agree not to:</p>
                <ul className="space-y-2 opacity-60">
                  <li className="flex items-start gap-2"><X size={14} className="text-red-500 shrink-0 mt-1" /> <span>Use the Service to deploy malware, phishing sites, or any illegal content</span></li>
                  <li className="flex items-start gap-2"><X size={14} className="text-red-500 shrink-0 mt-1" /> <span>Attempt to exploit, reverse-engineer, or overload the Service infrastructure</span></li>
                  <li className="flex items-start gap-2"><X size={14} className="text-red-500 shrink-0 mt-1" /> <span>Share your account or API keys with unauthorized parties</span></li>
                  <li className="flex items-start gap-2"><X size={14} className="text-red-500 shrink-0 mt-1" /> <span>Violate third-party hosting providers' terms through the Service</span></li>
                </ul>
              </section>

              <section className="bg-white border border-black/[0.04] p-7 rounded-2xl space-y-4">
                <h2 className="text-xl font-bold">6. Intellectual Property</h2>
                <p className="opacity-60 leading-relaxed">You retain full ownership of all code, content, and projects you create or deploy through ShipSaaS. AI-generated code is provided without warranty and is licensed to you for any use. The ShipSaaS platform, brand, and interface remain our intellectual property.</p>
              </section>

              <section className="bg-white border border-black/[0.04] p-7 rounded-2xl space-y-4">
                <h2 className="text-xl font-bold">7. Third-Party Services</h2>
                <p className="opacity-60 leading-relaxed">ShipSaaS integrates with third-party services (hosting providers, payment processors, AI services). Your use of these integrations is also subject to those providers' terms. We are not responsible for outages or changes to third-party services.</p>
              </section>

              <section className="bg-white border border-black/[0.04] p-7 rounded-2xl space-y-4">
                <h2 className="text-xl font-bold">8. Limitation of Liability</h2>
                <p className="opacity-60 leading-relaxed">ShipSaaS is provided "as is" without warranties of any kind. We are not liable for data loss, deployment failures, downtime, or damages resulting from use of the Service. Our total liability shall not exceed the amount you paid in the preceding 12 months.</p>
              </section>

              <section className="bg-white border border-black/[0.04] p-7 rounded-2xl space-y-4">
                <h2 className="text-xl font-bold">9. Termination</h2>
                <p className="opacity-60 leading-relaxed">You may delete your account at any time from Profile → Danger Zone. We may suspend or terminate accounts that violate these Terms. Upon termination, your data will be deleted in accordance with our Privacy Policy.</p>
              </section>

              <section className="bg-white border border-black/[0.04] p-7 rounded-2xl space-y-4">
                <h2 className="text-xl font-bold">10. Contact</h2>
                <p className="opacity-60 leading-relaxed">Questions about these Terms? Email <strong>legal@shipsaas.io</strong>.</p>
              </section>
            </div>
          </motion.div>
        )}

        {/* ── About Us View ───────────────────────────── */}
        {view === 'about' && (
          <motion.div key="about" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen">
            {/* Hero */}
            <section className="bg-[#09090B] text-white py-24 px-8 relative overflow-hidden">
              <div className="absolute inset-0 subtle-grid-dark" />
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-emerald-500/[0.04] rounded-full blur-[100px]" />
              </div>
              <div className="max-w-4xl mx-auto relative z-10 space-y-6 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-medium">
                  <Building2 size={12} /> About ShipSaaS
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold tracking-[-0.03em]">We make shipping <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">effortless.</span></h1>
                <p className="text-lg opacity-50 max-w-xl mx-auto leading-relaxed">
                  ShipSaaS was built by developers who were tired of the gap between writing code and getting it live. We believe every idea deserves to be in production — fast.
                </p>
              </div>
            </section>

            {/* Mission */}
            <section className="py-24 px-8 bg-white">
              <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-600">Our Mission</p>
                  <h2 className="text-3xl font-bold tracking-[-0.02em]">Eliminate the friction between idea and production.</h2>
                  <p className="opacity-50 leading-relaxed">
                    Traditional deployment pipelines require expertise in CI/CD, infrastructure, DNS, SSL, databases, and authentication — all before a single user touches your product. ShipSaaS collapses that entire workflow into minutes.
                  </p>
                  <p className="opacity-50 leading-relaxed">
                    Our AI engine analyzes your project, recommends the optimal stack, provisions infrastructure, and deploys your application — while you focus on what matters: building something people love.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { icon: Rocket, value: 'Vercel', label: 'Deployment Platform', color: 'from-emerald-500 to-teal-400' },
                    { icon: Clock, value: '<60s', label: 'Avg Deploy Time', color: 'from-blue-500 to-cyan-400' },
                    { icon: Wand2, value: 'Gemini', label: 'AI Engine', color: 'from-purple-500 to-pink-400' },
                    { icon: Globe, value: 'Free', label: 'To Get Started', color: 'from-orange-500 to-red-400' },
                  ].map(stat => (
                    <div key={stat.label} className="bg-[#F5F5F4] p-6 rounded-2xl text-center space-y-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white mx-auto`}>
                        <stat.icon size={22} />
                      </div>
                      <p className="text-3xl font-bold tracking-tighter">{stat.value}</p>
                      <p className="text-[10px] font-mono uppercase opacity-40 tracking-widest">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Values */}
            <section className="py-24 px-8 bg-[#F5F5F4]">
              <div className="max-w-5xl mx-auto space-y-16">
                <div className="text-center space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-600">Our Values</p>
                  <h2 className="text-4xl font-bold tracking-[-0.03em]">What drives us <span className="text-black/25">forward.</span></h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { icon: Zap, title: 'Speed First', desc: 'We obsess over developer velocity. Every feature we build is measured by how much time it saves you.', gradient: 'from-amber-500 to-orange-400' },
                    { icon: Shield, title: 'Security Built-In', desc: 'OWASP compliance, encrypted storage, rate limiting, and automated SSL. Security is never an afterthought.', gradient: 'from-blue-500 to-indigo-400' },
                    { icon: Users, title: 'Developer Love', desc: 'We\'re developers building for developers. Every decision starts with "will this make their day better?"', gradient: 'from-pink-500 to-rose-400' },
                  ].map(value => (
                    <div key={value.title} className="bg-white p-8 rounded-2xl space-y-4 border border-black/5">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${value.gradient} flex items-center justify-center text-white`}>
                        <value.icon size={22} />
                      </div>
                      <h3 className="font-bold text-lg">{value.title}</h3>
                      <p className="text-sm opacity-50 leading-relaxed">{value.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* CTA */}
            <section className="py-24 px-8 bg-[#09090B] text-white text-center relative overflow-hidden">
              <div className="absolute inset-0 subtle-grid-dark" />
              <div className="max-w-2xl mx-auto space-y-8 relative z-10">
                <h2 className="text-4xl font-bold tracking-[-0.03em]">Join the <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">movement.</span></h2>
                <p className="text-lg text-white/40">Start shipping today. No credit card required.</p>
                <button onClick={() => { setStep(0); setView('onboarding'); }} className="px-8 py-4 bg-white text-[#09090B] rounded-full font-semibold text-sm hover:bg-white/90 transition-colors">
                  Start Building
                </button>
              </div>
            </section>
          </motion.div>
        )}

        {/* ── Our Services View ───────────────────────── */}
        {view === 'services' && (
          <motion.div key="services" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen">
            {/* Hero */}
            <section className="bg-[#09090B] text-white py-24 px-8 relative overflow-hidden">
              <div className="absolute inset-0 subtle-grid-dark" />
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-purple-500/[0.04] rounded-full blur-[100px]" />
              </div>
              <div className="max-w-4xl mx-auto relative z-10 space-y-6 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-[11px] font-medium">
                  <Briefcase size={12} /> Our Services
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold tracking-[-0.03em]">Everything you need to <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">ship.</span></h1>
                <p className="text-lg opacity-50 max-w-xl mx-auto leading-relaxed">
                  From code to production, ShipSaaS handles every layer of your deployment pipeline.
                </p>
              </div>
            </section>

            {/* Services Grid */}
            <section className="py-24 px-8 bg-white">
              <div className="max-w-6xl mx-auto space-y-16">
                {[
                  {
                    icon: Wand2, title: 'AI Auto-Setup', desc: 'Describe your project in plain English and our AI configures your entire stack — hosting, domain, style, authentication, and plan — in seconds.',
                    features: ['Natural language project input', 'Gemini-powered analysis', 'Editable review before deploy', 'One-click override for any choice'],
                    gradient: 'from-purple-500 to-blue-500',
                  },
                  {
                    icon: Terminal, title: 'AI Code Generation', desc: 'Our Gemini engine generates production-ready source code — React components, routes, styling, auth integration, and API routes tailored to your blueprint.',
                    features: ['Framework-aware generation', 'Tailwind CSS styling', 'Auth scaffolding', 'Clean, maintainable output'],
                    gradient: 'from-emerald-500 to-teal-400',
                  },
                  {
                    icon: Globe, title: 'Vercel Deployment', desc: 'Ship to Vercel — the fastest global Edge Network — with one click. We handle CI/CD, environment variables, and auto-deploy from GitHub.',
                    features: ['Vercel Edge Network', 'Auto SSL & CDN', 'GitHub CI/CD', 'Zero-config deploys'],
                    gradient: 'from-blue-500 to-cyan-400',
                  },
                  {
                    icon: Globe, title: 'Domain & DNS Management', desc: 'Search for domains, register them, and auto-configure DNS records. Every project includes a free .shipsaas.io subdomain with SSL via Cloudflare.',
                    features: ['Domain search & registration', 'Auto DNS configuration', 'Cloudflare SSL', 'Free subdomain included'],
                    gradient: 'from-orange-500 to-red-400',
                  },
                  {
                    icon: Shield, title: 'Authentication & Security', desc: 'Firebase Auth with email/password, Google, and GitHub OAuth out-of-the-box. Rate limiting, CORS, and OWASP-compliant API security.',
                    features: ['Firebase Auth integration', 'Multi-provider OAuth', 'Rate limiting & CORS', 'Encrypted data at rest'],
                    gradient: 'from-indigo-500 to-blue-400',
                  },
                  {
                    icon: Bot, title: 'AI Stack Advisor', desc: 'Not sure which tech stack to use? Describe your project and our AI recommends the optimal frontend, backend, database, hosting, and auth solution.',
                    features: ['Personalized recommendations', 'Cost estimation', 'Architecture reasoning', 'One-click apply to pipeline'],
                    gradient: 'from-pink-500 to-rose-400',
                  },
                ].map((service, i) => (
                  <motion.div
                    key={service.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className={cn("grid grid-cols-1 lg:grid-cols-2 gap-12 items-center", i % 2 === 1 && "lg:flex-row-reverse")}
                  >
                    <div className={cn("space-y-6", i % 2 === 1 && "lg:order-2")}>
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.gradient} flex items-center justify-center text-white`}>
                        <service.icon size={28} />
                      </div>
                      <h3 className="text-3xl font-bold tracking-[-0.03em]">{service.title}</h3>
                      <p className="opacity-50 leading-relaxed">{service.desc}</p>
                      <div className="grid grid-cols-2 gap-3">
                        {service.features.map(f => (
                          <div key={f} className="flex items-center gap-2">
                            <Check size={12} className="text-emerald-500 shrink-0" />
                            <span className="text-xs">{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className={cn("bg-[#F5F5F4] rounded-2xl p-12 flex items-center justify-center min-h-[280px]", i % 2 === 1 && "lg:order-1")}>
                      <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${service.gradient} flex items-center justify-center text-white opacity-30`}>
                        <service.icon size={48} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Pricing CTA */}
            <section className="py-24 px-8 bg-[#09090B] text-white text-center relative overflow-hidden">
              <div className="absolute inset-0 subtle-grid-dark" />
              <div className="max-w-2xl mx-auto space-y-8 relative z-10">
                <h2 className="text-4xl font-bold tracking-[-0.03em]">Simple, transparent <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">pricing.</span></h2>
                <div className="max-w-xs mx-auto">
                  <div className="bg-white/5 border border-emerald-500/30 p-8 rounded-2xl text-center space-y-3">
                    <p className="text-[11px] font-medium uppercase tracking-wider opacity-40">Free</p>
                    <p className="text-4xl font-bold">$0</p>
                    <p className="text-[10px] opacity-40">forever</p>
                    <p className="text-xs opacity-50 leading-relaxed">Full access — AI code gen, Vercel deploy, GitHub integration, domain search.</p>
                  </div>
                </div>
                    <button onClick={() => { setStep(0); setView('onboarding'); }} className="px-8 py-4 bg-white text-[#09090B] rounded-full font-semibold text-sm hover:bg-white/90 transition-colors">
                  Get Started Free
                </button>
              </div>
            </section>
          </motion.div>
        )}

        {/* ── How It Works View ───────────────────────── */}
        {view === 'how-it-works' && (
          <motion.div key="how-it-works" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen">
            {/* Hero */}
            <section className="bg-[#09090B] text-white py-24 px-8 relative overflow-hidden">
              <div className="absolute inset-0 subtle-grid-dark" />
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-blue-500/[0.04] rounded-full blur-[100px]" />
              </div>
              <div className="max-w-4xl mx-auto relative z-10 space-y-6 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[11px] font-medium">
                  <Workflow size={12} /> How It Works
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold tracking-[-0.03em]">From zero to <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">production.</span></h1>
                <p className="text-lg opacity-50 max-w-xl mx-auto leading-relaxed">
                  4 simple steps. Under 60 seconds. Here's exactly how ShipSaaS takes your idea live.
                </p>
              </div>
            </section>

            {/* Steps */}
            <section className="py-24 px-8 bg-white">
              <div className="max-w-4xl mx-auto space-y-0">
                {[
                  { step: 1, title: 'Create Your Account', desc: 'Sign up with email, Google, or GitHub in seconds. No credit card required.', icon: Lock, tip: 'You can also sign in with an existing GitHub account to auto-connect repos.' },
                  { step: 2, title: 'Choose Your Source', desc: 'Import from GitHub, upload a ZIP, use a template — or describe your project and let AI Auto-Setup handle everything.', icon: Code, tip: 'AI Auto-Setup analyzes your description and fills every field automatically. You can edit any choice before deploying.' },
                  { step: 3, title: 'Configure Your Project', desc: 'Name your app, pick a style, set a domain (optional), toggle auth — all in one step. Includes a live preview card.', icon: Sparkles, tip: 'For AI Auto-Setup, this step shows a full editable blueprint. You can tweak any AI choice before shipping.' },
                  { step: 4, title: 'Ship It!', desc: 'One click and ShipSaaS generates your code, provisions Vercel infrastructure, configures DNS, and deploys to production.', icon: Rocket, tip: 'The deploy terminal shows real-time progress. Your app is typically live in under 60 seconds.' },
                ].map((s, i) => (
                  <div key={s.step} className="relative">
                    {/* Connecting line */}
                    {i < 3 && (
                      <div className="absolute left-[27px] top-[72px] bottom-0 w-px bg-gradient-to-b from-emerald-500/30 to-transparent" />
                    )}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                      className="flex gap-8 py-8"
                    >
                      {/* Step number */}
                      <div className="shrink-0">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                          {s.step}
                        </div>
                      </div>
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <s.icon size={18} className="text-emerald-600" />
                          <h3 className="text-xl font-bold">{s.title}</h3>
                        </div>
                        <p className="opacity-50 leading-relaxed">{s.desc}</p>
                        <div className="flex items-start gap-2 bg-emerald-500/5 border border-emerald-500/10 px-4 py-3 rounded-xl">
                          <Lightbulb size={14} className="text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-xs opacity-60">{s.tip}</p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                ))}
              </div>
            </section>

            {/* AI Auto-Setup highlight */}
            <section className="py-24 px-8 bg-[#F5F5F4]">
              <div className="max-w-4xl mx-auto text-center space-y-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 text-[11px] font-medium">
                  <Wand2 size={12} /> The Fast Track
                </div>
                <h2 className="text-4xl font-bold tracking-[-0.03em]">Or let AI <span className="text-black/25">do it all.</span></h2>
                <p className="opacity-50 max-w-lg mx-auto leading-relaxed">
                  Just describe your project in plain English. Our AI analyzes your requirements, auto-configures every setting, and presents an editable blueprint. Review, tweak, and hit "Ship It" — done.
                </p>
                <div className="bg-white border border-purple-200 rounded-2xl p-8 max-w-lg mx-auto text-left space-y-4">
                  <div className="flex items-center gap-3">
                    <Wand2 size={18} className="text-purple-500" />
                    <span className="font-bold text-sm">Example Input</span>
                  </div>
                  <div className="bg-[#F5F5F4] rounded-xl p-4 font-mono text-sm opacity-60 italic">
                    "A project management SaaS with team collaboration, Kanban boards, real-time chat, and Stripe billing"
                  </div>
                  <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold">
                    <ArrowRight size={14} /> AI configures: domain, style, auth — deploys to Vercel in seconds
                  </div>
                </div>
                <button onClick={() => { setStep(0); setView('onboarding'); }} className="px-8 py-4 bg-[#09090B] text-white rounded-full font-semibold text-sm hover:bg-[#09090B]/90 transition-colors">
                  Try It Now
                </button>
              </div>
            </section>

            {/* API requirements */}
            <section className="py-24 px-8 bg-white">
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-orange-600">API Keys</p>
                  <h2 className="text-3xl font-bold tracking-[-0.02em]">Do I need API keys?</h2>
                  <p className="opacity-50 max-w-lg mx-auto">
                    For ShipSaaS to deploy and manage your projects seamlessly, you'll need API tokens from each provider you want to use. Here's what each one does:
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { provider: 'Vercel', purpose: 'Deploy React/Next.js & Vite apps — auto SSL, Edge CDN, instant rollbacks', required: 'Required for deployment' },
                    { provider: 'GitHub', purpose: 'Create repos, push generated code, set up CI/CD webhooks', required: 'Required for all deploy methods' },
                    { provider: 'Stripe', purpose: 'Process payments for your end users', required: 'If your app has billing' },
                    { provider: 'Cloudflare', purpose: 'DNS management and SSL certificate provisioning', required: 'For custom domains' },
                  ].map(api => (
                    <div key={api.provider} className="bg-[#F5F5F4] p-5 rounded-2xl flex items-start gap-4">
                      <Key size={16} className="text-orange-500 shrink-0 mt-1" />
                      <div>
                        <p className="font-bold text-sm">{api.provider}</p>
                        <p className="text-xs opacity-50 mt-1">{api.purpose}</p>
                        <p className="text-[10px] font-mono text-orange-600 mt-1">{api.required}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center">
                  <p className="text-sm opacity-40">You can add API keys anytime from your Profile → Provider API Keys section.</p>
                </div>
              </div>
            </section>
          </motion.div>
        )}

        {/* ── Onboarding Steps ────────────────────────── */}
        {view === 'onboarding' && (
          <>
            {/* Step 0: Auth */}
            {step === 0 && (() => {
              // Password strength calculator
              const getPasswordStrength = (pw: string) => {
                if (!pw) return { score: 0, label: '', color: '', width: '0%' };
                let s = 0;
                if (pw.length >= 8) s++;
                if (pw.length >= 12) s++;
                if (/[A-Z]/.test(pw)) s++;
                if (/[0-9]/.test(pw)) s++;
                if (/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(pw)) s++;
                if (s <= 1) return { score: s, label: 'Weak', color: 'bg-red-500', width: '20%' };
                if (s <= 2) return { score: s, label: 'Fair', color: 'bg-orange-500', width: '40%' };
                if (s <= 3) return { score: s, label: 'Good', color: 'bg-yellow-500', width: '60%' };
                if (s <= 4) return { score: s, label: 'Strong', color: 'bg-emerald-500', width: '80%' };
                return { score: s, label: 'Very Strong', color: 'bg-emerald-600', width: '100%' };
              };
              const strength = getPasswordStrength(password);

              return (
              <StepShell
                key="auth"
                phase="Step 01 of 04"
                title={forgotPasswordMode
                  ? <><span className="opacity-30">Reset your</span><br />Password.</>
                  : authMode === 'signup'
                    ? <>Create your<br /><span className="opacity-30">Secure Account.</span></>
                    : <>Welcome<br /><span className="opacity-30">Back.</span></>
                }
                subtitle={forgotPasswordMode
                  ? "Enter your email and we'll send a secure reset link."
                  : authMode === 'signup'
                    ? "Your data is encrypted and protected with enterprise-grade security."
                    : "Sign in to your secure account."}
              >
                <div className="max-w-md space-y-6">
                  {/* Security trust bar */}
                  <div className="flex items-center justify-center gap-6 py-3 px-4 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/[0.08]">
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <Shield size={12} />
                      <span className="text-[10px] font-semibold uppercase tracking-wider">256-bit SSL</span>
                    </div>
                    <div className="w-px h-3 bg-emerald-500/20" />
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <Lock size={12} />
                      <span className="text-[10px] font-semibold uppercase tracking-wider">Encrypted</span>
                    </div>
                    <div className="w-px h-3 bg-emerald-500/20" />
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <ShieldCheck size={12} />
                      <span className="text-[10px] font-semibold uppercase tracking-wider">SOC 2</span>
                    </div>
                  </div>

                  {/* Forgot password flow */}
                  {forgotPasswordMode ? (
                    <div className="space-y-4">
                      {resetEmailSent ? (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4 py-6">
                          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                            <Mail size={28} className="text-emerald-600" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="font-bold text-lg">Check your email</h3>
                            <p className="text-sm text-black/50 leading-relaxed">If an account exists for <strong className="text-black/70">{email}</strong>, you'll receive a password reset link shortly.</p>
                          </div>
                          <p className="text-[11px] text-black/30">Didn't receive it? Check your spam folder or try again.</p>
                        </motion.div>
                      ) : (
                        <>
                          <input
                            type="email"
                            placeholder="you@company.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleForgotPassword()}
                            className="w-full bg-[#F8F8F7] border border-black/[0.06] rounded-[10px] px-4 py-3.5 text-[14px] focus:border-black/20 focus:bg-white focus:outline-none focus:ring-0 transition-colors duration-200 placeholder:text-black/25"
                          />
                          {authError && (
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
                              <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
                              <p className="text-red-600 text-xs leading-relaxed">{authError}</p>
                            </div>
                          )}
                          <button
                            onClick={handleForgotPassword}
                            disabled={authBusy || !email}
                            className={cn(
                              "w-full bg-[#09090B] text-white py-4 rounded-2xl font-semibold flex justify-center items-center gap-2 transition-all",
                              (authBusy || !email) ? "opacity-40" : "hover:scale-[1.02]"
                            )}
                          >
                            {authBusy ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                            Send Reset Link
                          </button>
                        </>
                      )}
                      <button onClick={() => setForgotPasswordMode(false)} className="text-center text-xs text-black/40 hover:text-black/70 transition-colors w-full flex items-center justify-center gap-1">
                        <ArrowLeft size={12} /> Back to sign in
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* OAuth buttons */}
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={handleGoogleAuth}
                          disabled={authBusy}
                          className="flex items-center justify-center gap-3 bg-white border border-black/10 p-4 rounded-2xl font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all brutal-shadow-sm"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                          Google
                        </button>
                        <button
                          onClick={handleAppleAuth}
                          disabled={authBusy}
                          className="flex items-center justify-center gap-3 bg-[#09090B] text-white p-4 rounded-2xl font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all brutal-shadow-sm"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                          Apple
                        </button>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-black/10" />
                        <p className="text-[11px] text-black/30">or with email</p>
                        <div className="h-px flex-1 bg-black/10" />
                      </div>

                      {/* Email form */}
                      <div className="space-y-4">
                        {/* Email */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold uppercase tracking-wider text-black/40 flex items-center gap-1.5">
                            <Mail size={11} /> Email Address
                          </label>
                          <input
                            type="email"
                            placeholder="you@company.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            autoComplete="email"
                            className="w-full bg-[#F8F8F7] border border-black/[0.06] rounded-[10px] px-4 py-3.5 text-[14px] focus:border-black/20 focus:bg-white focus:outline-none focus:ring-0 transition-colors duration-200 placeholder:text-black/25"
                          />
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold uppercase tracking-wider text-black/40 flex items-center gap-1.5">
                            <Key size={11} /> Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              placeholder={authMode === 'signup' ? 'Min 8 chars, upper, number, symbol' : 'Enter your password'}
                              value={password}
                              onChange={e => setPassword(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && authMode === 'signin' && handleEmailAuth()}
                              autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                              className="w-full bg-[#F8F8F7] border border-black/[0.06] rounded-[10px] px-4 py-3.5 text-[14px] focus:border-black/20 focus:bg-white focus:outline-none focus:ring-0 transition-colors duration-200 placeholder:text-black/25 pr-12"
                            />
                            <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 hover:opacity-80 transition-opacity">
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                          {/* Password strength meter (signup only) */}
                          {authMode === 'signup' && password.length > 0 && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2 pt-1">
                              <div className="h-1.5 bg-black/[0.04] rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: strength.width }}
                                  transition={{ duration: 0.3 }}
                                  className={cn("h-full rounded-full transition-colors", strength.color)}
                                />
                              </div>
                              <div className="flex justify-between items-center">
                                <p className={cn("text-[10px] font-semibold uppercase tracking-wider", strength.score <= 1 ? 'text-red-500' : strength.score <= 2 ? 'text-orange-500' : strength.score <= 3 ? 'text-yellow-600' : 'text-emerald-600')}>
                                  {strength.label}
                                </p>
                                <div className="flex gap-3 text-[10px] text-black/30">
                                  <span className={cn(password.length >= 8 && 'text-emerald-600 font-medium')}>8+ chars</span>
                                  <span className={cn(/[A-Z]/.test(password) && 'text-emerald-600 font-medium')}>A-Z</span>
                                  <span className={cn(/[0-9]/.test(password) && 'text-emerald-600 font-medium')}>0-9</span>
                                  <span className={cn(/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(password) && 'text-emerald-600 font-medium')}>!@#</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>

                        {/* Confirm password (signup only) */}
                        {authMode === 'signup' && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-1.5">
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-black/40 flex items-center gap-1.5">
                              <Shield size={11} /> Confirm Password
                            </label>
                            <div className="relative">
                              <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Re-enter your password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleEmailAuth()}
                                autoComplete="new-password"
                                className={cn(
                                  "w-full bg-[#F8F8F7] border rounded-[10px] px-4 py-3.5 text-[14px] focus:bg-white focus:outline-none focus:ring-0 transition-colors duration-200 placeholder:text-black/25 pr-12",
                                  confirmPassword && password !== confirmPassword ? "border-red-300 focus:border-red-400" : "border-black/[0.06] focus:border-black/20"
                                )}
                              />
                              {confirmPassword && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                  {password === confirmPassword ? (
                                    <Check size={16} className="text-emerald-500" />
                                  ) : (
                                    <X size={16} className="text-red-400" />
                                  )}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}

                        {/* Terms checkbox (signup only) */}
                        {authMode === 'signup' && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-3 pt-1">
                            <button
                              onClick={() => setTermsAccepted(!termsAccepted)}
                              className={cn(
                                "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all",
                                termsAccepted ? "bg-[#09090B] border-[#09090B] text-white" : "border-black/20 hover:border-black/40"
                              )}
                            >
                              {termsAccepted && <Check size={12} strokeWidth={3} />}
                            </button>
                            <p className="text-[12px] text-black/50 leading-relaxed">
                              I agree to the{' '}
                              <button onClick={() => { setView('terms'); setStep(0); }} className="underline text-black/70 hover:text-black">Terms of Service</button>
                              {' '}and{' '}
                              <button onClick={() => { setView('privacy'); setStep(0); }} className="underline text-black/70 hover:text-black">Privacy Policy</button>
                            </p>
                          </motion.div>
                        )}

                        {/* Forgot password link (signin only) */}
                        {authMode === 'signin' && (
                          <div className="flex justify-end">
                            <button onClick={() => setForgotPasswordMode(true)} className="text-[12px] text-black/40 hover:text-black/70 transition-colors underline underline-offset-2">
                              Forgot password?
                            </button>
                          </div>
                        )}

                        {/* Error display */}
                        {authError && (
                          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-100">
                            <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
                            <p className="text-red-600 text-xs leading-relaxed">{authError}</p>
                          </motion.div>
                        )}

                        {/* Verification notice */}
                        {verificationSent && authMode === 'signup' && !authError && (
                          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-50 border border-blue-100">
                            <Mail size={14} className="text-blue-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-blue-700 text-xs font-semibold">Verification email sent</p>
                              <p className="text-blue-600/70 text-[11px] mt-0.5">Please check your inbox to verify your email address.</p>
                            </div>
                          </motion.div>
                        )}

                        {/* Submit button */}
                        <button
                          onClick={handleEmailAuth}
                          disabled={authBusy || !email || !password || (authMode === 'signup' && (!confirmPassword || !termsAccepted))}
                          className={cn(
                            "w-full bg-[#09090B] text-white py-4 rounded-2xl font-semibold flex justify-center items-center gap-2 transition-all",
                            (authBusy || !email || !password || (authMode === 'signup' && (!confirmPassword || !termsAccepted))) ? "opacity-40 cursor-not-allowed" : "hover:scale-[1.02] active:scale-[0.98]"
                          )}
                        >
                          {authBusy ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                          {authMode === 'signup' ? 'Create Secure Account' : 'Sign In Securely'}
                        </button>

                        {/* Toggle auth mode */}
                        <p className="text-center text-xs text-black/40">
                          {authMode === 'signup' ? 'Already have an account?' : "Don't have an account?"}
                          <button onClick={() => setAuthMode(authMode === 'signup' ? 'signin' : 'signup')} className="ml-1 underline font-bold text-black/60 hover:text-black transition-colors">
                            {authMode === 'signup' ? 'Sign in' : 'Sign up'}
                          </button>
                        </p>
                      </div>

                      {/* Security footer */}
                      <div className="pt-2 border-t border-black/[0.04]">
                        <p className="text-[10px] text-black/25 text-center leading-relaxed">
                          Your connection is secured with TLS 1.3 encryption. We never store your password in plain text. Protected by Firebase Authentication with built-in brute-force protection.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </StepShell>
              );
            })()}

            {/* Step 1: Describe & Source */}
            {step === 1 && (
              <StepShell
                key="source"
                phase="Step 02 of 04"
                title={<>What are you<br /><span className="opacity-30">Building?</span></>}
                subtitle="Describe your project and we'll auto-configure everything — or set it up manually."
                onNext={next}
                onBack={back}
                nextLabel="Configure →"
                nextDisabled={
                  (blueprint.source === 'github' && !githubUrl) ||
                  (blueprint.source === 'zip' && !uploadedFile)
                }
              >
                {/* ── AI Auto-Setup ── */}
                <div className="bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-emerald-500/5 border border-purple-200 p-8 rounded-2xl space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-200 to-transparent rounded-full blur-2xl opacity-40" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white">
                        <Wand2 size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-sm">AI Auto-Setup</p>
                        <p className="text-[10px] opacity-40">Describe your idea — AI fills every step for you</p>
                      </div>
                    </div>
                    <textarea
                      value={projectDescription}
                      onChange={e => setProjectDescription(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAutoSetup())}
                      placeholder="e.g. A project management SaaS with team collaboration, Kanban boards, real-time chat, and Stripe billing..."
                      className="w-full bg-[#F8F8F7] border border-black/[0.06] rounded-[10px] px-4 py-3.5 text-[14px] resize-none h-24 focus:border-black/20 focus:bg-white focus:outline-none focus:ring-0 transition-all duration-200 placeholder:text-black/25"
                    />
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex flex-wrap gap-2">
                        {['SaaS dashboard', 'E-commerce store', 'Portfolio site', 'Mobile fitness app'].map(ex => (
                          <button key={ex} onClick={() => setProjectDescription(ex)} className="px-3 py-1.5 rounded-full bg-white/80 text-[10px] font-mono hover:bg-white transition-colors border border-black/5">{ex}</button>
                        ))}
                      </div>
                      <button
                        onClick={handleAutoSetup}
                        disabled={autoLoading || !projectDescription.trim()}
                        className={cn(
                          "flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-xs text-white transition-all shrink-0 ml-4",
                          autoLoading || !projectDescription.trim()
                            ? "bg-purple-300 cursor-not-allowed"
                            : "bg-gradient-to-r from-purple-500 to-blue-500 hover:scale-105 active:scale-95 brutal-shadow-sm"
                        )}
                      >
                        {autoLoading ? <><Loader2 size={14} className="animate-spin" /> Setting up...</> : <><Wand2 size={14} /> Auto-Setup</>}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4 py-2">
                  <div className="h-px flex-1 bg-black/10" />
                  <p className="text-[11px] text-black/30">or choose source manually</p>
                  <div className="h-px flex-1 bg-black/10" />
                </div>

                {/* ── Manual Source Selection ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <button
                    onClick={() => setBlueprint({ ...blueprint, source: 'github' })}
                    className={cn(
                      "p-8 rounded-2xl border text-left space-y-4 transition-all",
                      blueprint.source === 'github' ? "bg-[#09090B] text-white border-[#09090B] brutal-shadow" : "bg-white border-black/10 hover:border-black"
                    )}
                  >
                    <Github size={32} />
                    <p className="font-bold text-lg">Import from GitHub</p>
                    <p className="text-xs opacity-60">Connect a repo and we'll handle the rest.</p>
                  </button>
                  <div
                    onClick={() => zipRef.current?.click()}
                    className={cn(
                      "p-8 rounded-2xl border text-left space-y-4 transition-all cursor-pointer",
                      blueprint.source === 'zip' ? "bg-[#09090B] text-white border-[#09090B] brutal-shadow" : "bg-white border-black/10 hover:border-black"
                    )}
                  >
                    <FolderArchive size={32} />
                    <p className="font-bold text-lg">Upload ZIP</p>
                    <p className="text-xs opacity-60">{uploadedFile ? `✓ ${uploadedFile}` : 'Drop a project folder and deploy instantly.'}</p>
                  </div>
                  <input ref={zipRef} type="file" accept=".zip" className="hidden" onChange={handleZipUpload} />
                  <button
                    onClick={() => setBlueprint({ ...blueprint, source: 'template' })}
                    className={cn(
                      "p-8 rounded-2xl border text-left space-y-4 transition-all",
                      blueprint.source === 'template' ? "bg-[#09090B] text-white border-[#09090B] brutal-shadow" : "bg-white border-black/10 hover:border-black"
                    )}
                  >
                    <Sparkles size={32} />
                    <p className="font-bold text-lg">Start from Template</p>
                    <p className="text-xs opacity-60">Pre-built SaaS, mobile, or portfolio starter.</p>
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {blueprint.source === 'github' && (
                    <motion.div key="gh" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="bg-white border border-black/10 rounded-2xl p-6 mt-4 space-y-4">
                        <label className="text-[11px] font-medium uppercase tracking-wider text-black/35">Repository URL</label>
                        <input
                          type="text"
                          placeholder="https://github.com/username/repo"
                          value={githubUrl}
                          onChange={e => { setGithubUrl(e.target.value); setBlueprint({ ...blueprint, githubRepo: e.target.value }); }}
                          className="w-full bg-[#F8F8F7] border border-black/[0.06] rounded-[10px] px-4 py-3 text-[14px] font-mono focus:border-black/20 focus:bg-white focus:outline-none focus:ring-0 transition-all duration-200 placeholder:text-black/25"
                        />
                      </div>
                    </motion.div>
                  )}

                  {blueprint.source === 'template' && (
                    <motion.div key="tpl" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        {TEMPLATES.map(t => (
                          <div key={t.id} onClick={() => setBlueprint({ ...blueprint, ...t.partial, projectId: t.id, appName: t.name })} className={cn("p-6 rounded-2xl border cursor-pointer transition-all", blueprint.projectId === t.id ? "bg-emerald-500/10 border-emerald-500" : "bg-white border-black/10 hover:border-black")}>
                            <div className="flex items-center gap-3 mb-2"><t.icon size={18} /><p className="font-bold text-sm">{t.name}</p></div>
                            <p className="text-xs opacity-50">{t.description}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </StepShell>
            )}

            {/* Step 2: Configure (name, style, domain merged) */}
            {step === 2 && (
              <StepShell
                key="configure"
                phase={autoMode ? 'AI Auto-Configured' : 'Step 03 of 04'}
                title={autoMode ? <>Review your<br /><span className="opacity-30">Blueprint.</span></> : <>Configure your<br /><span className="opacity-30">Project.</span></>}
                subtitle={autoMode ? 'AI configured everything below. Click any section to edit, then ship.' : 'Name, style, and optionally pick a domain — then ship.'}
                onNext={() => handleDeploy()}
                onBack={() => { if (autoMode) { setAutoMode(false); setStep(1); } else { back(); } }}
                nextLabel="Ship It 🚀"
                nextDisabled={!blueprint.appName}
              >
                {autoMode ? (
                  /* ── AI Auto-Configured Blueprint Review ── */
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-500/5 to-blue-500/5 border border-purple-200 rounded-2xl">
                      <Wand2 size={16} className="text-purple-500" />
                      <p className="text-sm"><span className="font-bold">AI Auto-Setup</span> — <span className="opacity-50">based on: "{projectDescription}"</span></p>
                      <button onClick={() => { setAutoMode(false); setStep(1); }} className="ml-auto flex items-center gap-1 text-[10px] font-semibold opacity-40 hover:opacity-100 transition-opacity">
                        <RotateCcw size={12} /> Start Over
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <ReviewCard label="Project Identity" icon={Rocket} gradient="from-blue-500 to-cyan-400" editing={reviewEditing === 'identity'} onToggle={() => setReviewEditing(reviewEditing === 'identity' ? null : 'identity')} summary={<><span className="font-bold">{blueprint.appName || '—'}</span> <span className="opacity-40">({blueprint.projectId || '—'})</span></>}>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2"><label className="text-[10px] font-mono uppercase opacity-40 tracking-widest">App Name</label><input type="text" value={blueprint.appName} onChange={e => setBlueprint({ ...blueprint, appName: e.target.value })} className="w-full bg-[#F8F8F7] border border-black/[0.06] rounded-[10px] px-4 py-3 text-[14px] font-mono focus:border-black/20 focus:bg-white focus:outline-none focus:ring-0 transition-all duration-200" /></div>
                          <div className="space-y-2"><label className="text-[10px] font-mono uppercase opacity-40 tracking-widest">Project ID</label><input type="text" value={blueprint.projectId} onChange={e => setBlueprint({ ...blueprint, projectId: e.target.value })} className="w-full bg-[#F8F8F7] border border-black/[0.06] rounded-[10px] px-4 py-3 text-[14px] font-mono focus:border-black/20 focus:bg-white focus:outline-none focus:ring-0 transition-all duration-200" /></div>
                        </div>
                      </ReviewCard>

                      <ReviewCard label="Code Source" icon={Code} gradient="from-emerald-500 to-teal-400" editing={reviewEditing === 'source'} onToggle={() => setReviewEditing(reviewEditing === 'source' ? null : 'source')} summary={<span className="font-bold capitalize">{blueprint.source}</span>}>
                        <div className="flex gap-3">
                          {(['template', 'github', 'zip'] as const).map(s => (
                            <button key={s} onClick={() => setBlueprint({ ...blueprint, source: s })} className={cn("flex-1 py-3 rounded-xl text-xs font-semibold transition-all", blueprint.source === s ? "bg-[#09090B] text-white" : "bg-[#F5F5F4] hover:bg-black/10")}>{s}</button>
                          ))}
                        </div>
                      </ReviewCard>

                      <ReviewCard label="Deployment" icon={Globe} gradient="from-orange-500 to-red-400" editing={false} onToggle={() => {}} summary={<span className="font-bold">Vercel</span>}>
                        <div className="bg-[#F5F5F4] p-3 rounded-xl text-xs text-black/50">Deployed to Vercel — Edge Network, auto SSL, CDN.</div>
                      </ReviewCard>

                      <ReviewCard label="Domain" icon={Globe} gradient="from-indigo-500 to-blue-400" editing={reviewEditing === 'domain'} onToggle={() => setReviewEditing(reviewEditing === 'domain' ? null : 'domain')} summary={<span className="font-bold font-mono">{blueprint.domain || `${blueprint.projectId || 'app'}.shipsaas.io`}</span>}>
                        <div className="space-y-3">
                          <input type="text" value={blueprint.domain || ''} onChange={e => setBlueprint({ ...blueprint, domain: e.target.value || undefined })} placeholder="custom-domain.com" className="w-full bg-[#F8F8F7] border border-black/[0.06] rounded-[10px] px-4 py-3 text-[14px] font-mono focus:border-black/20 focus:bg-white focus:outline-none focus:ring-0 transition-all duration-200 placeholder:text-black/25" />
                          <p className="text-[10px] opacity-40">Leave empty for free subdomain: {blueprint.projectId || 'app'}.shipsaas.io</p>
                        </div>
                      </ReviewCard>

                      <ReviewCard label="Design" icon={Palette} gradient="from-pink-500 to-rose-400" editing={reviewEditing === 'design'} onToggle={() => setReviewEditing(reviewEditing === 'design' ? null : 'design')} summary={<><span className="font-bold capitalize">{blueprint.style}</span> <span className="inline-block w-3 h-3 rounded-full align-middle ml-2" style={{ backgroundColor: blueprint.color }} /></>} reason={aiReasoning?.style}>
                        <div className="space-y-4">
                          <div className="grid grid-cols-4 gap-2">{(['minimal', 'brutalist', 'editorial', 'glassmorphism'] as const).map(s => (<button key={s} onClick={() => setBlueprint({ ...blueprint, style: s })} className={cn("py-2 rounded-xl text-[10px] font-semibold transition-all", blueprint.style === s ? "bg-[#09090B] text-white" : "bg-[#F5F5F4] hover:bg-black/10")}>{s}</button>))}</div>
                          <div className="flex gap-2">{['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'].map(c => (<button key={c} onClick={() => setBlueprint({ ...blueprint, color: c })} className={cn("w-8 h-8 rounded-full border-2 transition-all", blueprint.color === c ? "border-black scale-110" : "border-transparent")} style={{ backgroundColor: c }} />))}</div>
                        </div>
                      </ReviewCard>

                      <ReviewCard label="Authentication" icon={Shield} gradient="from-amber-500 to-orange-400" editing={reviewEditing === 'auth'} onToggle={() => setReviewEditing(reviewEditing === 'auth' ? null : 'auth')} summary={<span className="font-bold">{blueprint.authEnabled ? 'Enabled — Firebase Auth' : 'Disabled'}</span>}>
                        <div className="flex gap-3">
                          <button onClick={() => setBlueprint({ ...blueprint, authEnabled: true })} className={cn("flex-1 py-3 rounded-xl text-xs font-semibold transition-all", blueprint.authEnabled ? "bg-[#09090B] text-white" : "bg-[#F5F5F4] hover:bg-black/10")}>Enabled</button>
                          <button onClick={() => setBlueprint({ ...blueprint, authEnabled: false })} className={cn("flex-1 py-3 rounded-xl text-xs font-semibold transition-all", !blueprint.authEnabled ? "bg-[#09090B] text-white" : "bg-[#F5F5F4] hover:bg-black/10")}>Disabled</button>
                        </div>
                      </ReviewCard>
                    </div>

                    {aiReasoning?.stack && (
                      <div className="bg-purple-500/5 border border-purple-500/10 p-5 rounded-2xl flex items-start gap-3">
                        <Bot size={16} className="text-purple-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-mono uppercase text-purple-600 font-bold mb-1">AI Reasoning</p>
                          <p className="text-sm opacity-70">{aiReasoning.stack}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* ── Manual Configure ── */
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-8">
                      <div className="bg-white border border-[#09090B] p-8 rounded-2xl brutal-shadow space-y-6">
                        <h3 className="font-semibold text-lg">Project Identity</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-mono uppercase opacity-40 tracking-widest">App Name</label>
                            <input type="text" placeholder="My App" value={blueprint.appName} onChange={e => setBlueprint({ ...blueprint, appName: e.target.value })} className="w-full bg-[#F8F8F7] border border-black/[0.06] rounded-[10px] px-4 py-3 text-[14px] font-mono focus:border-black/20 focus:bg-white focus:outline-none focus:ring-0 transition-all duration-200 placeholder:text-black/25" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-mono uppercase opacity-40 tracking-widest">Project ID</label>
                            <input type="text" placeholder="my-app" value={blueprint.projectId} onChange={e => setBlueprint({ ...blueprint, projectId: e.target.value })} className="w-full bg-[#F8F8F7] border border-black/[0.06] rounded-[10px] px-4 py-3 text-[14px] font-mono focus:border-black/20 focus:bg-white focus:outline-none focus:ring-0 transition-all duration-200 placeholder:text-black/25" />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-mono uppercase opacity-40 tracking-widest">Aesthetic Style</label>
                          <div className="grid grid-cols-2 gap-3">
                            {(['minimal', 'brutalist', 'editorial', 'glassmorphism'] as const).map(s => (
                              <button key={s} onClick={() => setBlueprint({ ...blueprint, style: s })} className={cn("p-3 rounded-xl border text-xs font-semibold transition-all capitalize", blueprint.style === s ? "bg-[#09090B] text-white border-[#09090B]" : "border-black/10 hover:border-black")}>{s}</button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-mono uppercase opacity-40 tracking-widest">Accent Color</label>
                          <div className="flex gap-3">
                            {['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'].map(c => (
                              <button key={c} onClick={() => setBlueprint({ ...blueprint, color: c })} className={cn("w-10 h-10 rounded-full border-2 transition-all", blueprint.color === c ? "border-black scale-110" : "border-transparent")} style={{ backgroundColor: c }} />
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-mono uppercase opacity-40 tracking-widest">Authentication</label>
                          <div className="flex gap-3">
                            <button onClick={() => setBlueprint({ ...blueprint, authEnabled: true })} className={cn("flex-1 py-3 rounded-xl border text-xs font-semibold transition-all", blueprint.authEnabled ? "bg-[#09090B] text-white border-[#09090B]" : "border-black/10 hover:border-black")}>Enabled (Firebase Auth)</button>
                            <button onClick={() => setBlueprint({ ...blueprint, authEnabled: false })} className={cn("flex-1 py-3 rounded-xl border text-xs font-semibold transition-all", !blueprint.authEnabled ? "bg-[#09090B] text-white border-[#09090B]" : "border-black/10 hover:border-black")}>Disabled</button>
                          </div>
                        </div>
                      </div>

                      {/* Domain search (optional) */}
                      <div className="bg-white border border-black/10 p-6 rounded-2xl space-y-4">
                        <h3 className="font-semibold text-sm flex items-center gap-2"><Globe size={14} /> Domain <span className="text-[10px] font-normal text-black/35">(optional)</span></h3>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
                            <input type="text" placeholder="my-app" value={domainSearch} onChange={e => setDomainSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearchDomains(domainSearch)} className="w-full bg-[#F8F8F7] border border-black/[0.06] rounded-[10px] px-4 py-2.5 pl-9 text-[13px] font-mono focus:border-black/20 focus:bg-white focus:outline-none focus:ring-0 transition-all duration-200 placeholder:text-black/25" />
                          </div>
                          <button onClick={() => handleSearchDomains(domainSearch)} disabled={domainSearchLoading} className="px-4 py-2.5 bg-[#09090B] text-white rounded-[10px] text-xs font-semibold hover:bg-[#09090B]/80 disabled:opacity-50 flex items-center gap-1.5 shrink-0">
                            {domainSearchLoading ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                            Check
                          </button>
                        </div>
                        {domainResults.length > 0 && (
                          <div className="space-y-1.5">
                            {domainResults.map(d => (
                              <div key={d.domain} onClick={() => d.available && setBlueprint({ ...blueprint, domain: d.domain })} className={cn("flex justify-between items-center p-3 rounded-xl transition-colors text-sm", d.available ? "cursor-pointer hover:bg-emerald-500/5" : "opacity-40 cursor-not-allowed", blueprint.domain === d.domain && "bg-emerald-500/10 border border-emerald-500")}>
                                <div className="flex items-center gap-2">{blueprint.domain === d.domain ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Globe size={12} className="opacity-30" />}<span className="font-mono font-bold text-xs">{d.domain}</span></div>
                                <div className="flex items-center gap-2">
                                  <span className={cn("text-[9px] font-bold uppercase px-2 py-0.5 rounded-full", d.available ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500")}>{d.available ? 'Available' : 'Taken'}</span>
                                  {d.available && <a href={`https://www.namecheap.com/domains/registration/results/?domain=${encodeURIComponent(d.domain)}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-[9px] font-bold text-blue-500 hover:underline">Register →</a>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="bg-[#F5F5F4] rounded-xl p-3 text-xs font-mono text-black/40">Free: <span className="text-black/70 font-bold">{blueprint.projectId || 'your-app'}.shipsaas.io</span></div>
                      </div>
                    </div>

                    {/* Preview card */}
                    <div className="bg-[#09090B] text-white p-10 rounded-2xl brutal-shadow flex flex-col justify-between sticky top-24 h-fit">
                      <div>
                        <p className="text-[10px] font-mono uppercase opacity-40 tracking-widest mb-4">Live Preview</p>
                        <h3 className="text-4xl font-bold tracking-[-0.03em] mb-2">{blueprint.appName || 'Your App'}</h3>
                        <p className="text-sm opacity-50">{blueprint.domain || `${blueprint.projectId || 'your-app'}.vercel.app`}</p>
                      </div>
                      <div className="space-y-4 mt-10">
                        {[
                          ['Style', blueprint.style],
                          ['Source', blueprint.source],
                          ['Hosting', 'Vercel'],
                          ['Auth', blueprint.authEnabled ? 'Firebase' : 'None'],
                        ].map(([k, v]) => (
                          <div key={k} className="flex justify-between items-center border-b border-white/10 pb-2">
                            <p className="text-[10px] font-mono uppercase opacity-40">{k}</p>
                            <p className="text-sm font-bold uppercase tracking-tighter">{v}</p>
                          </div>
                        ))}
                        <div className="flex justify-between items-center border-b border-white/10 pb-2">
                          <p className="text-[10px] font-mono uppercase opacity-40">Accent</p>
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: blueprint.color }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </StepShell>
            )}

            {/* Step 3: Deploy */}
            {step === 3 && (
              <StepShell
                key="deploy"
                phase="Step 04 of 04"
                title={isDeploying ? <>Shipping<br /><span className="opacity-30">your project...</span></> : <>Your project<br /><span className="opacity-30">is Live.</span></>}
                subtitle={isDeploying ? 'Building, provisioning, and deploying your infrastructure.' : 'Pipeline complete. Your SaaS is in production.'}
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Deploy terminal */}
                  <div className="bg-[#09090B] text-[#F5F5F4] p-8 rounded-2xl brutal-shadow space-y-4 font-mono text-xs min-h-[320px]">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="ml-2 text-[10px] opacity-40 uppercase tracking-widest">Pipeline Output</span>
                    </div>
                    {deployLogs.map((log, i) => (
                      <motion.p key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="opacity-70">{log}</motion.p>
                    ))}
                    {isDeploying && <Loader2 size={14} className="animate-spin opacity-40 mt-2" />}
                  </div>

                  {/* Summary card */}
                  <div className="bg-white border border-[#09090B] p-8 rounded-2xl brutal-shadow space-y-6">
                    <h3 className="font-semibold text-lg">Deployment Summary</h3>
                    <div className="space-y-3">
                      {[
                        ['Project', blueprint.appName],
                        ['Domain', blueprint.domain || `${blueprint.projectId}.shipsaas.io`],
                        ['Hosting', blueprint.hosting || 'Vercel'],
                        ['Source', blueprint.source],
                        ['Style', blueprint.style],
                        ['Platform', blueprint.appType],
                        ['Plan', blueprint.plan],
                        ['Status', isDeploying ? 'Deploying...' : 'Production ✓'],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between items-center py-2 border-b border-black/5">
                          <p className="text-[10px] font-mono uppercase opacity-40 tracking-widest">{k}</p>
                          <p className="text-sm font-bold uppercase tracking-tighter">{v}</p>
                        </div>
                      ))}
                    </div>

                    {!isDeploying && (
                      <div className="space-y-3 pt-4">
                        {(() => {
                          const latestProject = shippedProjects.find(p => p.name === blueprint.appName);
                          const deployUrl = latestProject?.url || `https://${blueprint.projectId}.vercel.app`;
                          return deployUrl && deployUrl !== '' ? (
                            <a
                              href={deployUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="block w-full bg-[#09090B] text-white py-4 rounded-xl text-center font-semibold hover:scale-105 transition-transform"
                            >
                              Open Application
                            </a>
                          ) : (
                            <div className="w-full bg-[#09090B]/10 text-black/40 py-4 rounded-xl text-center font-semibold">
                              Saved as Draft — No URL yet
                            </div>
                          );
                        })()}
                        <button
                          onClick={() => { setStep(1); setView('onboarding'); }}
                          className="block w-full border border-black/10 py-3 rounded-xl text-center text-xs font-semibold hover:border-black transition-colors"
                        >
                          Create Another
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Generated code */}
                {generatedCode && !isDeploying && (
                  <div className="bg-white border border-black/5 rounded-2xl p-10 shadow-xl mt-6">
                    <h3 className="font-semibold text-base mb-6">Generated Source</h3>
                    <div className="prose prose-sm max-w-none markdown-body">
                      <ReactMarkdown>{generatedCode}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </StepShell>
            )}
          </>
        )}
      </AnimatePresence>

      {/* Footer */}
      {step >= 0 && (
        <footer className="fixed bottom-0 left-0 right-0 border-t border-black/5 bg-white/80 backdrop-blur-md py-3 px-8 flex justify-between items-center z-40">
          <div className="flex gap-12">
            <div className="space-y-0.5">
              <p className="text-[8px] font-mono uppercase opacity-30 tracking-widest">Status</p>
              <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /><p className="text-[10px] font-bold uppercase tracking-tighter">Operational</p></div>
            </div>
            <div className="space-y-0.5">
              <p className="text-[8px] font-mono uppercase opacity-30 tracking-widest">Engine</p>
              <p className="text-[10px] font-bold uppercase tracking-tighter">Gemini Flash</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ShipTooltip text="Get AI-powered stack recommendations" position="top">
              <button onClick={() => setAiAdvisorOpen(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 transition-colors text-[10px] font-semibold">
                <Bot size={12} /> AI Advisor
              </button>
            </ShipTooltip>
            <div className="opacity-20 flex items-center gap-4">
              <Cpu size={14} />
              <p className="text-[11px] font-medium uppercase tracking-wider">v3.0.0</p>
            </div>
          </div>
        </footer>
      )}

      {/* Floating Help Button */}
      {step >= 0 && (
        <ShipTooltip text="Help Center — FAQs & guides" position="left">
          <button
            onClick={() => setHelpOpen(true)}
            className="fixed bottom-20 right-6 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform"
          >
            <HelpCircle size={22} />
          </button>
        </ShipTooltip>
      )}

      {/* Overlays */}
      <HelpDrawer open={helpOpen} onClose={() => setHelpOpen(false)} activeSection={helpSection} onToggleSection={s => setHelpSection(helpSection === s ? null : s)} />
      <AIAdvisorPanel
        open={aiAdvisorOpen}
        onClose={() => setAiAdvisorOpen(false)}
        query={aiQuery}
        onQueryChange={setAiQuery}
        onSubmit={handleAiRecommend}
        loading={aiLoading}
        result={aiResult}
      />
      <GuidedTour
        active={tourActive}
        currentStep={tourStep}
        onNext={() => nextTourStep(TOUR_STEPS.length)}
        onPrev={() => prevTourStep()}
        onClose={() => setTourActive(false)}
        totalSteps={TOUR_STEPS.length}
      />
    </div>
  );
}
