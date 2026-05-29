import { useState, useRef, useEffect } from 'react';
import {
  Film,
  Layout,
  CreditCard,
  Home,
  Plus,
  Calendar,
  Users,
  TrendingUp,
  DollarSign,
  Eye,
  Ticket,
  Clock,
  Star,
  MoreVertical,
  Edit,
  Trash2,
  Settings,
  ChevronRight,
  BarChart3,
  AlertCircle,
  Search,
  X,
  MapPin,
  ShieldCheck,
  KeyRound,
  Webhook,
  Zap,
  Check,
  ChevronLeft,
  Eye as EyeIcon,
  EyeOff,
  Copy,
  ExternalLink,
  Info,
  Lock,
  Loader2,
  PowerOff,
  Power,
  Rocket,
  CircleCheck,
  Sparkles,
  CircleAlert,
  HelpCircle,
  UserPlus,
  Mail,
  Phone,
  Briefcase,
  AtSign,
  CalendarClock,
  ContactRound,
  User,
  Save,
} from 'lucide-react';
import { ImageWithFallback } from './components/figma/ImageWithFallback';

// ============================================================================
// Payment Section — Paymob integration management
// ============================================================================

type PaymentStatus = 'ACTIVE' | 'DRAFT' | 'INACTIVE';
type PaymentMethodKind = 'CARD' | 'WALLET' | 'INSTALLMENT';
type PaymentTestStatus = 'UNTESTED' | 'SUCCESS' | 'FAILURE';

type PaymentMethod = {
  id: string;
  name: string;
  gateway: 'paymob';
  type: PaymentMethodKind;
  isTest: boolean;
  mode: 'live' | 'sandbox';
  status: PaymentStatus;
  currency: string;
  testStatus: PaymentTestStatus;
  testFailureReason: string | null;
  testedAt: string | null;
  successRate: string;
  credentialsRotatedAt: string;
  createdAt: string;
  cardBrands?: string[];
  publishedAt?: string | null;
  monthlyVolume?: string;
  lastChargeAt?: string | null;
  config: {
    apiKeyMasked: string;
    integrationId: string;
    iframeId: string;
    hmacMasked: string;
  };
};

const SAMPLE_METHODS: PaymentMethod[] = [
  {
    id: 'pm_01',
    name: 'Paymob — Cards',
    gateway: 'paymob',
    type: 'CARD',
    isTest: false,
    mode: 'live',
    status: 'ACTIVE',
    currency: 'EGP',
    testStatus: 'SUCCESS',
    testFailureReason: null,
    testedAt: '2026-05-06T08:14:00',
    successRate: '98.4%',
    credentialsRotatedAt: '2026-04-19',
    createdAt: '2026-02-12',
    config: {
      apiKeyMasked: '••••••••••••••••••••••••',
      integrationId: '4827193',
      iframeId: '912034',
      hmacMasked: '••••••••••••••••',
    },
  },
  {
    id: 'pm_02',
    name: 'Paymob — Wallets',
    gateway: 'paymob',
    type: 'WALLET',
    isTest: false,
    mode: 'live',
    status: 'DRAFT',
    currency: 'EGP',
    testStatus: 'SUCCESS',
    testFailureReason: null,
    testedAt: '2026-05-09T05:42:00',
    successRate: '0.0%',
    credentialsRotatedAt: '2026-04-28',
    createdAt: '2026-04-28',
    config: {
      apiKeyMasked: '••••••••••••••••••••••••',
      integrationId: '4827511',
      iframeId: '912088',
      hmacMasked: '••••••••••••••••',
    },
  },
  {
    id: 'pm_03',
    name: 'Paymob — Installments',
    gateway: 'paymob',
    type: 'INSTALLMENT',
    isTest: true,
    mode: 'sandbox',
    status: 'INACTIVE',
    currency: 'EGP',
    testStatus: 'FAILURE',
    testFailureReason:
      'HMAC verification failed for integration 4710228 — the signing secret on Paymob has been rotated since this method was last saved.',
    testedAt: '2026-04-30T18:42:00',
    successRate: '64.2%',
    credentialsRotatedAt: '2026-03-01',
    createdAt: '2026-03-01',
    config: {
      apiKeyMasked: '••••••••••••••••••••••••',
      integrationId: '4710228',
      iframeId: '904412',
      hmacMasked: '••••••••••••••••',
    },
  },
  {
    id: 'pm_04',
    name: 'Paymob — Cards (Legacy)',
    gateway: 'paymob',
    type: 'CARD',
    isTest: false,
    mode: 'live',
    status: 'ACTIVE',
    currency: 'EGP',
    testStatus: 'UNTESTED',
    testFailureReason: null,
    testedAt: null,
    successRate: '91.7%',
    credentialsRotatedAt: '2026-01-15',
    createdAt: '2025-08-14',
    config: {
      apiKeyMasked: '••••••••••••••••••••••••',
      integrationId: '4392107',
      iframeId: '887214',
      hmacMasked: '••••••••••••••••',
    },
  },
];

const WIZARD_STEPS = [
  { id: 1, label: 'Identity', sub: 'Name & environment' },
  { id: 2, label: 'Credentials', sub: 'API key & HMAC' },
  { id: 3, label: 'Integration', sub: 'IDs & iframe' },
  { id: 4, label: 'Verify', sub: 'Test the connection' },
  { id: 5, label: 'Review', sub: 'Save as draft' },
];

function StatusPill({ status }: { status: PaymentStatus }) {
  if (status === 'ACTIVE') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
        </span>
        Active
      </span>
    );
  }
  if (status === 'DRAFT') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
        Draft
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200 text-xs font-semibold">
      <span className="h-1.5 w-1.5 rounded-full bg-gray-400"></span>
      Inactive
    </span>
  );
}

const TYPE_META: Record<
  PaymentMethodKind,
  { label: string; icon: typeof CreditCard; gradient: string; ring: string; tile: string }
> = {
  CARD: {
    label: 'Card',
    icon: CreditCard,
    gradient: 'from-[#1e3a8a] via-[#2563eb] to-[#1e40af]',
    ring: 'ring-blue-200/70',
    tile: 'text-white',
  },
  WALLET: {
    label: 'Wallet',
    icon: Webhook,
    gradient: 'from-[#5b21b6] via-[#7c3aed] to-[#6d28d9]',
    ring: 'ring-violet-200/70',
    tile: 'text-white',
  },
  INSTALLMENT: {
    label: 'Installment',
    icon: Sparkles,
    gradient: 'from-[#b45309] via-[#d97706] to-[#b45309]',
    ring: 'ring-amber-200/70',
    tile: 'text-white',
  },
};

function TypeMonogram({ type, dim }: { type: PaymentMethodKind; dim?: boolean }) {
  const meta = TYPE_META[type];
  const Icon = meta.icon;
  return (
    <div
      className={`relative w-12 h-14 rounded-[10px] flex items-center justify-center flex-shrink-0 overflow-hidden ${
        dim
          ? 'bg-gray-100 ring-1 ring-gray-200'
          : `bg-gradient-to-br ${meta.gradient} shadow-[0_6px_18px_-8px_rgba(30,58,138,0.45)] ring-1 ${meta.ring}`
      }`}
    >
      {/* fine internal frame */}
      <span
        className={`absolute inset-[3px] rounded-[7px] border ${
          dim ? 'border-gray-200' : 'border-white/15'
        }`}
        aria-hidden
      />
      {/* magnetic stripe / decorative line */}
      <span
        className={`absolute left-0 right-0 top-[34%] h-[2px] ${
          dim ? 'bg-gray-200' : 'bg-white/25'
        }`}
        aria-hidden
      />
      <Icon size={20} className={dim ? 'text-gray-400' : meta.tile} strokeWidth={2} />
    </div>
  );
}

function EnvChip({ isTest }: { isTest: boolean }) {
  return isTest ? (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-700 text-[10px] font-bold uppercase tracking-[0.12em] border border-violet-200/80">
      Sandbox
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-[0.12em] border border-blue-200/80">
      Production
    </span>
  );
}

function HelperHint({
  title,
  children,
  tone = 'info',
}: {
  title: string;
  children: React.ReactNode;
  tone?: 'info' | 'warn';
}) {
  const tones = {
    info: 'bg-blue-50/60 border-blue-100 text-blue-900',
    warn: 'bg-amber-50/60 border-amber-100 text-amber-900',
  };
  const Icon = tone === 'info' ? Info : AlertCircle;
  return (
    <div className={`rounded-lg border ${tones[tone]} p-3 flex gap-2.5`}>
      <Icon size={16} className="flex-shrink-0 mt-0.5 opacity-80" />
      <div className="text-xs leading-relaxed">
        <p className="font-semibold mb-0.5">{title}</p>
        <div className="opacity-90">{children}</div>
      </div>
    </div>
  );
}

function relativeDays(iso: string): { days: number; label: string } {
  const time = new Date(iso).getTime();
  if (isNaN(time)) return { days: 0, label: '—' };
  const days = Math.max(0, Math.floor((Date.now() - time) / 86_400_000));
  if (days === 0) return { days, label: 'Today' };
  if (days === 1) return { days, label: 'Yesterday' };
  if (days < 7) return { days, label: `${days} days ago` };
  if (days < 14) return { days, label: 'Last week' };
  if (days < 30) return { days, label: `${Math.floor(days / 7)} weeks ago` };
  if (days < 60) return { days, label: '1 month ago' };
  if (days < 365) return { days, label: `${Math.floor(days / 30)} months ago` };
  const years = Math.floor(days / 365);
  return { days, label: years === 1 ? '1 year ago' : `${years} years ago` };
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function parseRate(rate: string): number | null {
  const match = /^(-?\d+(\.\d+)?)\s*%?$/.exec(rate.trim());
  if (!match) return null;
  const n = parseFloat(match[1]);
  return isNaN(n) ? null : n;
}

function SuccessRateMetric({ rate }: { rate: string }) {
  const value = parseRate(rate);
  const isZero = value !== null && value === 0;
  const tone =
    value === null || isZero
      ? { num: 'text-gray-400', dot: 'bg-gray-300', label: 'No data yet' }
      : value >= 95
        ? { num: 'text-emerald-600', dot: 'bg-emerald-500', label: 'Healthy' }
        : value >= 80
          ? { num: 'text-amber-600', dot: 'bg-amber-500', label: 'Watch' }
          : { num: 'text-red-600', dot: 'bg-red-500', label: 'Degraded' };

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-[9.5px] uppercase tracking-[0.14em] text-gray-500 font-semibold">
        Success rate · 30d
      </span>
      <div className="flex items-baseline gap-1.5">
        <span
          className={`text-[26px] leading-none font-bold tabular-nums tracking-tight ${tone.num}`}
        >
          {rate}
        </span>
      </div>
      <div className="flex items-center gap-1.5 mt-0.5">
        <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} aria-hidden />
        <span className="text-[10.5px] uppercase tracking-[0.1em] text-gray-500 font-semibold">
          {tone.label}
        </span>
      </div>
    </div>
  );
}

function MetaLine({
  label,
  children,
  tone,
}: {
  label: string;
  children: React.ReactNode;
  tone?: 'warn' | 'bad';
}) {
  const valueColor =
    tone === 'bad' ? 'text-red-700' : tone === 'warn' ? 'text-amber-800' : 'text-gray-900';
  return (
    <div className="flex items-center justify-between gap-3 min-w-0">
      <span className="text-[10.5px] uppercase tracking-[0.12em] text-gray-500 font-semibold flex-shrink-0">
        {label}
      </span>
      <div className={`text-[12.5px] font-semibold ${valueColor} text-right`}>{children}</div>
    </div>
  );
}

function TestStatusBadge({ status }: { status: PaymentTestStatus }) {
  if (status === 'SUCCESS') {
    return (
      <span className="inline-flex items-center gap-1 text-emerald-700">
        <CircleCheck size={13} className="text-emerald-500" strokeWidth={2.5} />
        <span className="text-[13px] font-semibold leading-none">Passed</span>
      </span>
    );
  }
  if (status === 'FAILURE') {
    return (
      <span className="inline-flex items-center gap-1 text-red-700">
        <CircleAlert size={13} className="text-red-500" strokeWidth={2.5} />
        <span className="text-[13px] font-semibold leading-none">Failed</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-gray-500">
      <span className="h-1.5 w-1.5 rounded-full bg-gray-300" aria-hidden />
      <span className="text-[13px] font-semibold leading-none">Untested</span>
    </span>
  );
}

function PaymentSection() {
  const [methods, setMethods] = useState<PaymentMethod[]>(SAMPLE_METHODS);
  const [showWizard, setShowWizard] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [openError, setOpenError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  const openCreateWizard = () => {
    setEditingMethod(null);
    setShowWizard(true);
  };

  const openEditWizard = (m: PaymentMethod) => {
    setEditingMethod(m);
    setShowWizard(true);
    setOpenMenu(null);
  };

  const closeWizard = () => {
    setShowWizard(false);
    setEditingMethod(null);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    if (openMenu) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenu]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (errorRef.current && !errorRef.current.contains(e.target as Node)) {
        setOpenError(null);
      }
    };
    if (openError) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openError]);

  const activeCount = methods.filter((m) => m.status === 'ACTIVE').length;
  const draftCount = methods.filter((m) => m.status === 'DRAFT').length;
  const inactiveCount = methods.filter((m) => m.status === 'INACTIVE').length;

  const handlePublish = (id: string) => {
    setMethods((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, status: 'ACTIVE' as PaymentStatus, publishedAt: new Date().toISOString() }
          : m,
      ),
    );
    setOpenMenu(null);
  };

  const handleDisable = (id: string) => {
    setMethods((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: 'INACTIVE' as PaymentStatus } : m)),
    );
    setOpenMenu(null);
  };

  const handleEnable = (id: string) => {
    setMethods((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: 'ACTIVE' as PaymentStatus } : m)),
    );
    setOpenMenu(null);
  };

  const handleDelete = (id: string) => {
    setMethods((prev) => prev.filter((m) => m.id !== id));
    setOpenMenu(null);
  };

  return (
    <>
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Payment Methods</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage gateways your customers use to pay. Only{' '}
              <span className="font-semibold text-emerald-600">Active</span> methods are visible at
              checkout.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://paymob.com/docs"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors flex items-center gap-2 text-sm"
            >
              <ExternalLink size={16} />
              <span>Paymob docs</span>
            </a>
            <button
              onClick={openCreateWizard}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus size={18} />
              <span>Add payment method</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Configured methods */}
        <div className="mb-5 flex items-center gap-4 flex-wrap">
          <div className="flex items-baseline gap-2.5">
            <h3 className="text-xl font-semibold tracking-tight text-gray-900">
              Configured methods
            </h3>
            <span className="text-xl font-semibold text-gray-500 tabular-nums">
              {methods.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 tabular-nums">
              {activeCount} active
            </span>
            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/70 tabular-nums">
              {draftCount} draft
            </span>
            <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200 tabular-nums">
              {inactiveCount} inactive
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {methods.map((m) => {
            const dim = m.status === 'INACTIVE';
            const typeMeta = TYPE_META[m.type];
            const rotated = relativeDays(m.credentialsRotatedAt);
            const rotationCritical = rotated.days >= 90;
            const rotationStale = rotated.days >= 30 && !rotationCritical;
            const tested = m.testedAt ? relativeDays(m.testedAt) : null;
            const showFailure = m.testStatus === 'FAILURE' && !!m.testFailureReason;
            const cardBorder =
              m.status === 'DRAFT'
                ? 'border-amber-200/80 ring-1 ring-amber-100/60'
                : m.status === 'INACTIVE'
                  ? 'border-gray-200'
                  : 'border-gray-200 hover:border-blue-200';

            return (
              <article
                key={m.id}
                className={`group relative bg-white rounded-2xl border ${cardBorder} transition-all hover:shadow-[0_10px_30px_-12px_rgba(15,23,42,0.18)] ${
                  dim ? 'opacity-95' : ''
                }`}
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <TypeMonogram type={m.type} dim={dim} />
                      <div className="min-w-0 pt-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-[15.5px] text-gray-900 tracking-tight leading-tight truncate">
                            {m.name}
                          </h4>
                          <EnvChip isTest={m.isTest} />
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5 text-[11.5px] text-gray-500">
                          <span className="font-semibold text-gray-700">{typeMeta.label}</span>
                          <span className="text-gray-300">·</span>
                          <span className="font-semibold text-gray-700 tabular-nums">
                            {m.currency}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusPill status={m.status} />
                      <div className="relative" ref={openMenu === m.id ? menuRef : undefined}>
                        <button
                          onClick={() => setOpenMenu(openMenu === m.id ? null : m.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                        >
                          <MoreVertical size={18} />
                        </button>
                        {openMenu === m.id && (
                          <div className="absolute right-0 mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1.5 overflow-hidden">
                            {m.status === 'ACTIVE' && (
                              <button
                                onClick={() => handleDisable(m.id)}
                                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <PowerOff size={15} />
                                Set inactive
                              </button>
                            )}
                            <button
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              onClick={() => openEditWizard(m)}
                            >
                              <Edit size={15} />
                              Edit configuration
                            </button>
                            <button
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              onClick={() => setOpenMenu(null)}
                            >
                              <Zap size={15} />
                              Run test connection
                            </button>
                            <div className="my-1 border-t border-gray-100" />
                            <button
                              onClick={() => handleDelete(m.id)}
                              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 size={15} />
                              Delete method
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Meta strip — success rate hero + detail stack */}
                  <div className="rounded-xl bg-slate-50/70 ring-1 ring-slate-200/70 px-4 py-3.5 flex items-stretch gap-4">
                    <div className="flex-shrink-0 self-center pr-1">
                      <SuccessRateMetric rate={m.successRate} />
                    </div>
                    <span
                      className="w-px self-stretch bg-gradient-to-b from-transparent via-slate-200 to-transparent"
                      aria-hidden
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
                      <MetaLine label="Test Status">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <TestStatusBadge status={m.testStatus} />
                          {tested && (
                            <span className="text-gray-400 font-normal text-[11.5px]">
                              · {tested.label}
                            </span>
                          )}
                          {showFailure && (
                            <div
                              className="relative inline-block ml-0.5"
                              ref={openError === m.id ? errorRef : undefined}
                            >
                              <button
                                type="button"
                                onClick={() => setOpenError(openError === m.id ? null : m.id)}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-semibold border border-red-200/80 transition-colors"
                              >
                                <Info size={11} strokeWidth={2.5} />
                                View error
                              </button>
                              {openError === m.id && (
                                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-[0_18px_40px_-12px_rgba(15,23,42,0.28)] border border-red-200/80 z-30 overflow-hidden">
                                  <div className="px-3.5 py-2.5 bg-red-50/80 border-b border-red-100 flex items-center gap-2">
                                    <CircleAlert
                                      size={14}
                                      className="text-red-500"
                                      strokeWidth={2.5}
                                    />
                                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-red-700">
                                      Last test failed
                                    </p>
                                  </div>
                                  <p className="px-3.5 py-3 text-[12.5px] text-gray-800 leading-relaxed text-left whitespace-normal">
                                    {m.testFailureReason}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </MetaLine>
                      <MetaLine
                        label="Rotated"
                        tone={rotationCritical ? 'bad' : rotationStale ? 'warn' : undefined}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {(rotationCritical || rotationStale) && (
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                rotationCritical ? 'bg-red-500' : 'bg-amber-500'
                              }`}
                              aria-hidden
                            />
                          )}
                          {rotated.label}
                        </span>
                      </MetaLine>
                      <MetaLine label="Created">
                        <span className="tabular-nums">{formatShortDate(m.createdAt)}</span>
                      </MetaLine>
                    </div>
                  </div>

                  {/* Footer actions */}
                  {(m.status === 'DRAFT' || m.status === 'INACTIVE') && (
                    <div className="mt-4 flex items-center justify-end">
                      {m.status === 'DRAFT' && (
                        <button
                          onClick={() => handlePublish(m.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <Rocket size={13} />
                          Activate
                        </button>
                      )}
                      {m.status === 'INACTIVE' && (
                        <button
                          onClick={() => handleEnable(m.id)}
                          className="px-3 py-1.5 rounded-lg bg-white text-gray-700 text-xs font-semibold border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                        >
                          <Power size={13} />
                          Re-enable
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {showWizard && (
        <PaymentWizard
          editing={editingMethod}
          onClose={closeWizard}
          onSave={(m) => {
            setMethods((prev) => {
              const exists = prev.some((p) => p.id === m.id);
              return exists ? prev.map((p) => (p.id === m.id ? m : p)) : [m, ...prev];
            });
            closeWizard();
          }}
        />
      )}
    </>
  );
}

// ============================================================================
// Payment Wizard — multi-step Paymob setup
// ============================================================================

function PaymentWizard({
  editing,
  onClose,
  onSave,
}: {
  editing: PaymentMethod | null;
  onClose: () => void;
  onSave: (m: PaymentMethod) => void;
}) {
  const isEdit = !!editing;
  const [step, setStep] = useState(1);
  const [name, setName] = useState(editing?.name ?? 'Paymob — Cards');
  const [mode, setMode] = useState<'live' | 'sandbox'>(editing?.mode ?? 'sandbox');
  const [apiKey, setApiKey] = useState('');
  const [hmac, setHmac] = useState('');
  const [integrationId, setIntegrationId] = useState(editing?.config.integrationId ?? '');
  const [iframeId, setIframeId] = useState(editing?.config.iframeId ?? '');
  const [showSecrets, setShowSecrets] = useState(false);
  const [testState, setTestState] = useState<'idle' | 'running' | 'success' | 'failed'>(
    editing?.testStatus === 'SUCCESS'
      ? 'success'
      : editing?.testStatus === 'FAILURE'
        ? 'failed'
        : 'idle',
  );
  const [testReport, setTestReport] = useState<
    { label: string; ok: boolean; detail: string }[] | null
  >(null);

  const runTest = () => {
    setTestState('running');
    setTestReport(null);
    setTimeout(() => {
      const checks = [
        {
          label: 'API key authentication',
          ok: apiKey.length > 6,
          detail: apiKey.length > 6 ? 'Token issued · 1 hour validity' : 'Server returned 401',
        },
        {
          label: 'Integration lookup',
          ok: integrationId.length >= 4,
          detail:
            integrationId.length >= 4
              ? `Found integration #${integrationId}`
              : 'Integration not found in your Paymob account',
        },
        {
          label: 'Iframe accessibility',
          ok: iframeId.length >= 4,
          detail: iframeId.length >= 4 ? 'Iframe is reachable' : 'Iframe not found',
        },
        {
          label: 'HMAC signature',
          ok: hmac.length >= 6,
          detail: hmac.length >= 6 ? 'Signature verified' : 'Signature mismatch',
        },
      ];
      const allOk = checks.every((c) => c.ok);
      setTestReport(checks);
      setTestState(allOk ? 'success' : 'failed');
    }, 1600);
  };

  const finish = () => {
    const now = new Date().toISOString();
    const keysChanged = apiKey.length > 0 || hmac.length > 0;
    const nextTestStatus: PaymentTestStatus =
      testState === 'success'
        ? 'SUCCESS'
        : testState === 'failed'
          ? 'FAILURE'
          : isEdit
            ? (editing?.testStatus ?? 'UNTESTED')
            : 'UNTESTED';

    const ranTest = testState === 'success' || testState === 'failed';

    if (isEdit && editing) {
      onSave({
        ...editing,
        name: name || editing.name,
        mode,
        isTest: mode === 'sandbox',
        testStatus: nextTestStatus,
        testFailureReason:
          nextTestStatus === 'FAILURE'
            ? (editing.testFailureReason ?? 'Connection test failed.')
            : null,
        testedAt: ranTest ? now : editing.testedAt,
        credentialsRotatedAt: keysChanged ? now : editing.credentialsRotatedAt,
        config: {
          apiKeyMasked: apiKey ? '••••••••••••••••••••••••' : editing.config.apiKeyMasked,
          integrationId: integrationId || editing.config.integrationId,
          iframeId: iframeId || editing.config.iframeId,
          hmacMasked: hmac ? '••••••••••••••••' : editing.config.hmacMasked,
        },
      });
      return;
    }

    onSave({
      id: `pm_${Date.now()}`,
      name: name || 'Paymob method',
      gateway: 'paymob',
      type: 'CARD',
      isTest: mode === 'sandbox',
      mode,
      status: 'DRAFT',
      currency: 'EGP',
      testStatus: nextTestStatus,
      testFailureReason: nextTestStatus === 'FAILURE' ? 'Connection test failed.' : null,
      testedAt: ranTest ? now : null,
      successRate: '0.0%',
      credentialsRotatedAt: now,
      createdAt: now,
      config: {
        apiKeyMasked: '••••••••••••••••••••••••',
        integrationId: integrationId || '—',
        iframeId: iframeId || '—',
        hmacMasked: '••••••••••••••••',
      },
    });
  };

  const canNext = () => {
    if (step === 1) return name.trim().length > 0;
    if (step === 2) return isEdit || (apiKey.length > 0 && hmac.length > 0);
    if (step === 3) return isEdit ? true : integrationId.length > 0 && iframeId.length > 0;
    return true;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-7 py-5 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-blue-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-sm">
              <CreditCard size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {isEdit ? `Edit ${editing?.name}` : 'Add Paymob payment method'}
              </h3>
              <p className="text-sm text-gray-600">
                Step {step} of {WIZARD_STEPS.length} — {WIZARD_STEPS[step - 1].label}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left rail — stepper */}
          <aside className="w-72 border-r border-gray-200 bg-gradient-to-b from-gray-50 to-white p-6 hidden lg:block overflow-y-auto">
            <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-gray-400 mb-4">
              Setup checklist
            </p>
            <ol className="space-y-1 relative">
              <span className="absolute left-[15px] top-3 bottom-3 w-px bg-gray-200" aria-hidden />
              {WIZARD_STEPS.map((s) => {
                const done = step > s.id;
                const active = step === s.id;
                return (
                  <li key={s.id} className="relative flex gap-3 items-start py-2.5">
                    <div
                      className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 transition-all ${
                        done
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : active
                            ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-sm'
                            : 'bg-white border-2 border-gray-200 text-gray-400'
                      }`}
                    >
                      {done ? <Check size={15} /> : s.id}
                    </div>
                    <div className="pt-1">
                      <p
                        className={`text-sm font-semibold ${active ? 'text-gray-900' : done ? 'text-gray-700' : 'text-gray-500'}`}
                      >
                        {s.label}
                      </p>
                      <p className="text-xs text-gray-500">{s.sub}</p>
                    </div>
                  </li>
                );
              })}
            </ol>

            <div className="mt-8 rounded-xl bg-blue-50/60 border border-blue-100 p-4">
              <div className="flex items-start gap-2 mb-2">
                <HelpCircle size={16} className="text-blue-700 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-blue-900">Need help?</p>
              </div>
              <p className="text-xs text-blue-900/80 leading-relaxed">
                Most fields can be found in your{' '}
                <a
                  href="https://accept.paymob.com/portal2/"
                  target="_blank"
                  rel="noreferrer"
                  className="underline font-medium"
                >
                  Paymob dashboard
                </a>
                . If a field is missing, ask your account manager — every Paymob account has these.
              </p>
            </div>
          </aside>

          {/* Right — content */}
          <div className="flex-1 overflow-y-auto p-8">
            {step === 1 && (
              <StepIdentity name={name} setName={setName} mode={mode} setMode={setMode} />
            )}
            {step === 2 && (
              <StepCredentials
                apiKey={apiKey}
                setApiKey={setApiKey}
                hmac={hmac}
                setHmac={setHmac}
                showSecrets={showSecrets}
                setShowSecrets={setShowSecrets}
                isEdit={isEdit}
              />
            )}
            {step === 3 && (
              <StepIntegration
                integrationId={integrationId}
                setIntegrationId={setIntegrationId}
                iframeId={iframeId}
                setIframeId={setIframeId}
              />
            )}
            {step === 4 && (
              <StepVerify
                testState={testState}
                testReport={testReport}
                runTest={runTest}
                summary={{ name, mode, integrationId, iframeId }}
              />
            )}
            {step === 5 && (
              <StepReview
                name={name}
                mode={mode}
                apiKey={apiKey}
                hmac={hmac}
                integrationId={integrationId}
                iframeId={iframeId}
                testState={testState}
                isEdit={isEdit}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-xs text-gray-500 flex items-center gap-2">
            <Lock size={13} />
            Credentials are encrypted at rest and never exposed to the browser after saving.
          </div>
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg border border-gray-300 transition-colors flex items-center gap-2 text-sm"
              >
                <ChevronLeft size={16} />
                Back
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
            >
              Cancel
            </button>
            {step < WIZARD_STEPS.length && (
              <button
                onClick={() => canNext() && setStep(step + 1)}
                disabled={!canNext()}
                className="px-5 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2 text-sm font-semibold shadow-sm"
              >
                Continue
                <ChevronRight size={16} />
              </button>
            )}
            {step === WIZARD_STEPS.length && (
              <button
                onClick={finish}
                className="px-5 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-2 text-sm font-semibold shadow-sm"
              >
                <Check size={16} />
                {isEdit ? 'Save changes' : 'Save as draft'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Wizard step components ---

function FieldLabel({
  index,
  title,
  required = true,
}: {
  index: string;
  title: string;
  required?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="w-6 h-6 rounded-md bg-gray-900 text-white text-[11px] font-bold flex items-center justify-center">
        {index}
      </span>
      <label className="text-sm font-semibold text-gray-900">
        {title}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
    </div>
  );
}

function StepIdentity({
  name,
  setName,
  mode,
  setMode,
}: {
  name: string;
  setName: (v: string) => void;
  mode: 'live' | 'sandbox';
  setMode: (v: 'live' | 'sandbox') => void;
}) {
  return (
    <div className="max-w-3xl">
      <h3 className="text-2xl font-semibold text-gray-900 mb-1">Let's name this method</h3>
      <p className="text-sm text-gray-600 mb-8">
        This is just for you and your team — customers won't see this label.
      </p>

      <div className="space-y-7">
        <div>
          <FieldLabel index="A" title="Display name" />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g. Paymob — Cards (Live)"
          />
          <p className="text-xs text-gray-500 mt-2">
            A short name like "Paymob Cards" or "Wallets — Sandbox" so you can tell methods apart on
            the list.
          </p>
        </div>

        <div>
          <FieldLabel index="B" title="Environment" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => setMode('sandbox')}
              className={`text-left rounded-xl p-4 border-2 transition-all ${
                mode === 'sandbox'
                  ? 'border-violet-500 bg-violet-50/50 ring-2 ring-violet-100'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded-md bg-violet-100 text-violet-700 text-[10px] uppercase tracking-wider font-bold">
                  Sandbox
                </span>
                {mode === 'sandbox' && <Check size={18} className="text-violet-600" />}
              </div>
              <p className="font-semibold text-gray-900 mb-1">Test environment</p>
              <p className="text-xs text-gray-600 leading-relaxed">
                No real money is moved. Use test cards to walk through the full booking flow safely.
                Recommended for first-time setup.
              </p>
            </button>
            <button
              onClick={() => setMode('live')}
              className={`text-left rounded-xl p-4 border-2 transition-all ${
                mode === 'live'
                  ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-100'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] uppercase tracking-wider font-bold">
                  Production
                </span>
                {mode === 'live' && <Check size={18} className="text-emerald-600" />}
              </div>
              <p className="font-semibold text-gray-900 mb-1">Live environment</p>
              <p className="text-xs text-gray-600 leading-relaxed">
                Real charges go through. Only switch here once you've tested in sandbox and your
                Paymob account is verified.
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CredentialField({
  index,
  title,
  hint,
  value,
  onChange,
  show,
  placeholder,
  copyHelp,
}: {
  index: string;
  title: string;
  hint: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  placeholder: string;
  copyHelp: string;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
      <div className="lg:col-span-3">
        <FieldLabel index={index} title={title} />
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
        <p className="text-xs text-gray-500 mt-2">{copyHelp}</p>
      </div>
      <div className="lg:col-span-2">
        <HelperHint title="Where to find it">{hint}</HelperHint>
      </div>
    </div>
  );
}

function StepCredentials({
  apiKey,
  setApiKey,
  hmac,
  setHmac,
  showSecrets,
  setShowSecrets,
  isEdit,
}: {
  apiKey: string;
  setApiKey: (v: string) => void;
  hmac: string;
  setHmac: (v: string) => void;
  showSecrets: boolean;
  setShowSecrets: (v: boolean) => void;
  isEdit: boolean;
}) {
  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between mb-1 flex-wrap gap-3">
        <div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-1">
            {isEdit ? 'Update credentials' : 'Connect your Paymob account'}
          </h3>
          <p className="text-sm text-gray-600">
            {isEdit
              ? 'Leave fields blank to keep the existing keys. Fill them in only if you have rotated a value in Paymob.'
              : 'Two secret values let Cinefy talk securely to Paymob on your behalf.'}
          </p>
        </div>
        <button
          onClick={() => setShowSecrets(!showSecrets)}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          {showSecrets ? <EyeOff size={15} /> : <EyeIcon size={15} />}
          {showSecrets ? 'Hide values' : 'Show values'}
        </button>
      </div>

      <div className="mt-6 mb-7 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50/40 border border-amber-200 p-4 flex items-start gap-3">
        <Lock size={18} className="text-amber-700 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900">
          <p className="font-semibold mb-0.5">These are sensitive credentials</p>
          <p className="text-xs leading-relaxed">
            Treat the API key like a password. Anyone who has it can charge your customers — never
            paste it into chat, email, or screenshots. Cinefy stores it encrypted and never shows it
            back to you in plain text.
          </p>
        </div>
      </div>

      <div className="space-y-9">
        <CredentialField
          index="A"
          title="Paymob API Key"
          value={apiKey}
          onChange={setApiKey}
          show={showSecrets}
          placeholder={
            isEdit ? '•••••••••••••••• (unchanged)' : 'ZXlKaGJHY2lPaUpJVXpVeE1pSXNJblI1Y0NJNkki…'
          }
          copyHelp={
            isEdit
              ? 'Leave blank to keep the current key. Paste a new value only if you have rotated it in Paymob.'
              : "It's a long string (about 250 characters). Paste the whole thing — don't worry about line breaks."
          }
          hint={
            <>
              In your Paymob portal, open <strong>Developers → API Key</strong>. Click{' '}
              <strong>"Copy"</strong> next to the key. The portal also shows when it was last
              rotated.
            </>
          }
        />

        <div className="border-t border-dashed border-gray-200" />

        <CredentialField
          index="B"
          title="HMAC Secret"
          value={hmac}
          onChange={setHmac}
          show={showSecrets}
          placeholder={isEdit ? '•••••••••••••••• (unchanged)' : 'b4a91c84e6f7d3a1…'}
          copyHelp={
            isEdit
              ? 'Leave blank to keep the current secret.'
              : 'A shorter string (~32 characters) used to verify that webhook calls really came from Paymob.'
          }
          hint={
            <>
              Same area as the API key, under <strong>Developers → Webhooks</strong>. Look for{' '}
              <strong>"HMAC"</strong> — it's the hex string Paymob signs every callback with.
            </>
          }
        />
      </div>
    </div>
  );
}

function StepIntegration({
  integrationId,
  setIntegrationId,
  iframeId,
  setIframeId,
}: {
  integrationId: string;
  setIntegrationId: (v: string) => void;
  iframeId: string;
  setIframeId: (v: string) => void;
}) {
  return (
    <div className="max-w-4xl">
      <h3 className="text-2xl font-semibold text-gray-900 mb-1">Pick your integration</h3>
      <p className="text-sm text-gray-600 mb-7">
        Paymob calls each payment channel an "integration". Each one has a numeric ID and (for
        cards) a checkout iframe.
      </p>

      <div className="space-y-9">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3">
            <FieldLabel index="A" title="Integration ID" />
            <div className="relative">
              <input
                type="text"
                value={integrationId}
                onChange={(e) => setIntegrationId(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="4827193"
                inputMode="numeric"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Webhook
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Numeric only — usually 6 to 8 digits. Paymob auto-generates this when an integration
              is created.
            </p>
          </div>
          <div className="lg:col-span-2">
            <HelperHint title="Where to find it">
              <strong>Developers → Payment Integrations</strong>. Each row shows a numeric ID. Pick
              the one matching the channel you're configuring (cards, wallets, installments…).
            </HelperHint>
          </div>
        </div>

        <div className="border-t border-dashed border-gray-200" />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3">
            <FieldLabel index="B" title="Iframe ID" />
            <div className="relative">
              <input
                type="text"
                value={iframeId}
                onChange={(e) => setIframeId(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="912034"
                inputMode="numeric"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Layout
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              The iframe is the secure card-entry box your customers see. Wallet-only methods don't
              use one — leave it blank.
            </p>
          </div>
          <div className="lg:col-span-2">
            <HelperHint title="Where to find it">
              <strong>Developers → iFrames</strong>. Pick the iframe that matches the look you
              configured (currency, language, brand color).
            </HelperHint>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepVerify({
  testState,
  testReport,
  runTest,
  summary,
}: {
  testState: 'idle' | 'running' | 'success' | 'failed';
  testReport: { label: string; ok: boolean; detail: string }[] | null;
  runTest: () => void;
  summary: { name: string; mode: 'live' | 'sandbox'; integrationId: string; iframeId: string };
}) {
  return (
    <div className="max-w-3xl">
      <h3 className="text-2xl font-semibold text-gray-900 mb-1">Test the connection</h3>
      <p className="text-sm text-gray-600 mb-6">
        We'll run four read-only checks against Paymob. No charges will be made.
      </p>

      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-slate-50 to-white p-6">
        <div className="flex items-start gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all ${
              testState === 'success'
                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-200'
                : testState === 'failed'
                  ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-md shadow-red-200'
                  : testState === 'running'
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-200'
                    : 'bg-gray-100'
            }`}
          >
            {testState === 'idle' && <Zap size={26} className="text-gray-400" />}
            {testState === 'running' && <Loader2 size={26} className="text-white animate-spin" />}
            {testState === 'success' && <Check size={26} className="text-white" strokeWidth={3} />}
            {testState === 'failed' && <X size={26} className="text-white" strokeWidth={3} />}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">
              {testState === 'idle' && 'Ready to verify'}
              {testState === 'running' && 'Running checks…'}
              {testState === 'success' && 'All checks passed'}
              {testState === 'failed' && 'Some checks did not pass'}
            </p>
            <p className="text-sm text-gray-600 mt-0.5">
              {testState === 'idle' &&
                `${summary.name} · ${summary.mode} · integration ${summary.integrationId || '—'}`}
              {testState === 'running' && 'Talking to Paymob, this usually takes 1–2 seconds.'}
              {testState === 'success' &&
                'Your credentials work. You can save and publish whenever you are ready.'}
              {testState === 'failed' &&
                'See details below. You can fix and re-run, or save as draft and address later.'}
            </p>
          </div>
          <button
            onClick={runTest}
            disabled={testState === 'running'}
            className={`px-4 py-2.5 rounded-lg font-semibold flex items-center gap-2 text-sm transition-all ${
              testState === 'running'
                ? 'bg-blue-100 text-blue-600 cursor-not-allowed'
                : testState === 'success'
                  ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
            }`}
          >
            {testState === 'running' ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Testing…
              </>
            ) : testState === 'success' ? (
              <>
                <Zap size={15} />
                Re-run test
              </>
            ) : (
              <>
                <Zap size={15} />
                Test connection
              </>
            )}
          </button>
        </div>

        {testReport && (
          <div className="mt-6 space-y-2">
            {testReport.map((c) => (
              <div
                key={c.label}
                className={`rounded-lg border p-3 flex items-start gap-3 ${
                  c.ok ? 'bg-emerald-50/40 border-emerald-200' : 'bg-red-50/40 border-red-200'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    c.ok ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                >
                  {c.ok ? (
                    <Check size={14} className="text-white" strokeWidth={3} />
                  ) : (
                    <X size={14} className="text-white" strokeWidth={3} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-semibold ${c.ok ? 'text-emerald-900' : 'text-red-900'}`}
                  >
                    {c.label}
                  </p>
                  <p
                    className={`text-xs mt-0.5 font-mono ${c.ok ? 'text-emerald-700/80' : 'text-red-700/80'}`}
                  >
                    {c.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-5 text-center">
        Tip: a failed test won't block you. You can always save as a draft and come back later.
      </p>
    </div>
  );
}

function StepReview({
  name,
  mode,
  apiKey,
  hmac,
  integrationId,
  iframeId,
  testState,
  isEdit,
}: {
  name: string;
  mode: 'live' | 'sandbox';
  apiKey: string;
  hmac: string;
  integrationId: string;
  iframeId: string;
  testState: 'idle' | 'running' | 'success' | 'failed';
  isEdit: boolean;
}) {
  const dots = (v: string, count: number) => (v ? '•'.repeat(count) : '—');

  return (
    <div className="max-w-3xl">
      <h3 className="text-2xl font-semibold text-gray-900 mb-1">Review and save</h3>
      <p className="text-sm text-gray-600 mb-7">
        {isEdit ? (
          <>
            Review your changes. The method's current status (live, draft, or disabled) won't change
            — use the methods list to publish or disable it.
          </>
        ) : (
          <>
            This method will be saved as a <strong>draft</strong>. It won't be visible to customers
            until you publish it from the methods list.
          </>
        )}
      </p>

      <div className="rounded-2xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
            <CreditCard size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wider text-white/70 font-semibold mb-0.5">
              {isEdit ? 'Updated payment method' : 'New payment method'}
            </p>
            <p className="font-semibold truncate">{name || 'Untitled method'}</p>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-white/15 backdrop-blur text-white text-[11px] font-bold uppercase tracking-[0.12em] border border-white/25">
            {mode === 'live' ? 'Live' : 'Sandbox'}
          </span>
        </div>

        <dl className="divide-y divide-gray-100">
          {[
            { label: 'Display name', value: name || '—' },
            { label: 'Environment', value: mode === 'live' ? 'Production' : 'Sandbox' },
            { label: 'Integration ID', value: integrationId || '—', mono: true },
            { label: 'Iframe ID', value: iframeId || '—', mono: true },
            { label: 'API key', value: dots(apiKey, 24), mono: true },
            { label: 'HMAC secret', value: dots(hmac, 16), mono: true },
          ].map((row) => (
            <div key={row.label} className="px-5 py-3 grid grid-cols-3 items-center gap-4">
              <dt className="text-sm text-gray-600">{row.label}</dt>
              <dd
                className={`col-span-2 text-sm text-gray-900 ${row.mono ? 'font-mono' : 'font-medium'}`}
              >
                {row.value}
              </dd>
            </div>
          ))}
          <div className="px-5 py-3 grid grid-cols-3 items-center gap-4">
            <dt className="text-sm text-gray-600">Connection test</dt>
            <dd className="col-span-2 text-sm">
              {testState === 'success' && (
                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <CircleCheck size={16} /> Passed
                </span>
              )}
              {testState === 'failed' && (
                <span className="inline-flex items-center gap-1.5 text-red-700 font-semibold">
                  <CircleAlert size={16} /> Failed — saving anyway
                </span>
              )}
              {testState === 'idle' && (
                <span className="inline-flex items-center gap-1.5 text-gray-500">
                  Not run — you can test from the methods list
                </span>
              )}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 rounded-xl bg-emerald-50/60 border border-emerald-200 p-4 flex items-start gap-3">
        <Sparkles size={18} className="text-emerald-700 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-emerald-900">
          <p className="font-semibold mb-0.5">What happens next</p>
          <p className="text-xs leading-relaxed">
            {isEdit
              ? 'Your changes will be applied immediately. If this method is live, the new credentials take effect on the next checkout.'
              : "We'll save this configuration as a draft. From the Payment Methods page you can publish it (so customers can pay with it), edit any field, or delete it."}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Staff Section — Cinema staff roster management
// ============================================================================

type StaffPosition = 'Manager' | 'Cashier' | 'Projectionist' | 'Usher' | 'Concessions';
type EmploymentType = 'Full-time' | 'Part-time';
type Weekday = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

const WEEKDAYS: { value: Weekday; label: string }[] = [
  { value: 'Mon', label: 'Monday' },
  { value: 'Tue', label: 'Tuesday' },
  { value: 'Wed', label: 'Wednesday' },
  { value: 'Thu', label: 'Thursday' },
  { value: 'Fri', label: 'Friday' },
  { value: 'Sat', label: 'Saturday' },
  { value: 'Sun', label: 'Sunday' },
];

type StaffMember = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  position: StaffPosition;
  employmentType: EmploymentType;
  hiredAt: string;
  startDay: Weekday;
  endDay: Weekday;
  startTime: string;
  endTime: string;
  rating: number;
};

const STAFF_SAMPLE: StaffMember[] = [
  {
    id: 'st_01',
    fullName: 'Yara El-Sayed',
    username: 'yara.elsayed',
    email: 'yara.elsayed@cinefy.eg',
    phone: '+20 100 422 8841',
    position: 'Manager',
    employmentType: 'Full-time',
    hiredAt: '2024-03-11',
    startDay: 'Mon',
    endDay: 'Fri',
    startTime: '10:00',
    endTime: '19:00',
    rating: 4.9,
  },
  {
    id: 'st_02',
    fullName: 'Omar Hassan',
    username: 'omar.hassan',
    email: 'omar.hassan@cinefy.eg',
    phone: '+20 109 718 0260',
    position: 'Projectionist',
    employmentType: 'Full-time',
    hiredAt: '2023-11-02',
    startDay: 'Tue',
    endDay: 'Sat',
    startTime: '14:00',
    endTime: '23:00',
    rating: 4.7,
  },
  {
    id: 'st_03',
    fullName: 'Mariam Nabil',
    username: 'mariam.nabil',
    email: 'mariam.nabil@cinefy.eg',
    phone: '+20 122 305 7714',
    position: 'Cashier',
    employmentType: 'Part-time',
    hiredAt: '2025-08-19',
    startDay: 'Wed',
    endDay: 'Sun',
    startTime: '12:00',
    endTime: '20:00',
    rating: 4.6,
  },
  {
    id: 'st_04',
    fullName: 'Tarek Abdelaziz',
    username: 'tarek.abdelaziz',
    email: 'tarek.abdelaziz@cinefy.eg',
    phone: '+20 111 540 9162',
    position: 'Usher',
    employmentType: 'Part-time',
    hiredAt: '2026-01-22',
    startDay: 'Thu',
    endDay: 'Mon',
    startTime: '16:00',
    endTime: '23:59',
    rating: 4.4,
  },
  {
    id: 'st_05',
    fullName: 'Habiba Saad',
    username: 'habiba.saad',
    email: 'habiba.saad@cinefy.eg',
    phone: '+20 106 884 2207',
    position: 'Concessions',
    employmentType: 'Full-time',
    hiredAt: '2025-04-30',
    startDay: 'Mon',
    endDay: 'Fri',
    startTime: '13:00',
    endTime: '21:00',
    rating: 4.8,
  },
  {
    id: 'st_06',
    fullName: 'Karim Fouad',
    username: 'karim.fouad',
    email: 'karim.fouad@cinefy.eg',
    phone: '+20 128 217 4593',
    position: 'Cashier',
    employmentType: 'Part-time',
    hiredAt: '2024-09-08',
    startDay: 'Fri',
    endDay: 'Tue',
    startTime: '17:00',
    endTime: '23:59',
    rating: 4.3,
  },
];

const POSITION_META: Record<
  StaffPosition,
  { gradient: string; ring: string; soft: string; text: string; ink: string }
> = {
  Manager: {
    gradient: 'from-indigo-600 via-indigo-500 to-violet-600',
    ring: 'ring-indigo-200/70',
    soft: 'bg-indigo-50 border-indigo-200',
    text: 'text-indigo-700',
    ink: 'text-indigo-900',
  },
  Cashier: {
    gradient: 'from-emerald-600 via-emerald-500 to-teal-600',
    ring: 'ring-emerald-200/70',
    soft: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
    ink: 'text-emerald-900',
  },
  Projectionist: {
    gradient: 'from-amber-600 via-amber-500 to-orange-600',
    ring: 'ring-amber-200/70',
    soft: 'bg-amber-50 border-amber-200',
    text: 'text-amber-700',
    ink: 'text-amber-900',
  },
  Usher: {
    gradient: 'from-rose-600 via-rose-500 to-pink-600',
    ring: 'ring-rose-200/70',
    soft: 'bg-rose-50 border-rose-200',
    text: 'text-rose-700',
    ink: 'text-rose-900',
  },
  Concessions: {
    gradient: 'from-sky-600 via-sky-500 to-cyan-600',
    ring: 'ring-sky-200/70',
    soft: 'bg-sky-50 border-sky-200',
    text: 'text-sky-700',
    ink: 'text-sky-900',
  },
};

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function StaffMonogram({
  member,
  size = 'md',
}: {
  member: StaffMember;
  size?: 'sm' | 'md' | 'lg';
}) {
  const meta = POSITION_META[member.position];
  const dims =
    size === 'lg'
      ? 'w-16 h-16 text-lg'
      : size === 'sm'
        ? 'w-10 h-10 text-xs'
        : 'w-14 h-14 text-base';
  return (
    <div
      className={`relative ${dims} rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden bg-gradient-to-br ${meta.gradient} shadow-[0_8px_20px_-10px_rgba(30,41,59,0.5)] ring-1 ${meta.ring}`}
    >
      <span
        className="absolute inset-[3px] rounded-[14px] border border-white/15 pointer-events-none"
        aria-hidden
      />
      <span
        className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-white/15 blur-md"
        aria-hidden
      />
      <span className="relative font-bold tracking-wide text-white">
        {getInitials(member.fullName)}
      </span>
    </div>
  );
}

function PositionChip({ position }: { position: StaffPosition }) {
  const meta = POSITION_META[position];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md ${meta.soft} ${meta.text} text-[11px] font-bold uppercase tracking-[0.1em] border`}
    >
      <span className={`h-1.5 w-1.5 rounded-full bg-current opacity-70`}></span>
      {position}
    </span>
  );
}

function formatStaffDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatScheduleRange(
  startDay: Weekday,
  endDay: Weekday,
  startTime: string,
  endTime: string,
): string {
  const range = startDay === endDay ? startDay : `${startDay} – ${endDay}`;
  return `${range} · ${startTime} – ${endTime}`;
}

// ============================================================================
// Profile Section — the signed-in user's own account
// ============================================================================

type CurrentUser = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  hiredAt: string;
  employmentType: EmploymentType;
  position: StaffPosition;
  startDay: Weekday;
  endDay: Weekday;
  startTime: string;
  endTime: string;
};

const CURRENT_USER: CurrentUser = {
  firstName: 'Yara',
  lastName: 'El-Sayed',
  username: 'yara.elsayed',
  email: 'yara.elsayed@cinefy.eg',
  phone: '+20 100 422 8841',
  hiredAt: '2024-03-11',
  employmentType: 'Full-time',
  position: 'Manager',
  startDay: 'Mon',
  endDay: 'Fri',
  startTime: '10:00',
  endTime: '19:00',
};

function ReadOnlyField({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: typeof User;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-100">
      <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
        <Icon size={16} className="text-gray-500" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-sm font-medium text-gray-900 truncate ${mono ? 'font-mono' : ''}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function EmploymentRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: typeof User;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <Icon size={15} className="text-gray-400 flex-shrink-0" />
      <dt className="text-xs text-gray-500 flex-shrink-0">{label}</dt>
      <dd
        className={`ml-auto text-sm font-semibold text-gray-900 text-right truncate ${
          mono ? 'font-mono' : ''
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function EditableField({
  icon: Icon,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  icon: typeof User;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <Icon
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggleShow,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  placeholder?: string;
  error?: string | null;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <KeyRound
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="new-password"
          className={`w-full pl-9 pr-10 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
            error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff size={16} /> : <EyeIcon size={16} />}
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
    </div>
  );
}

function ProfileSection() {
  const [user, setUser] = useState<CurrentUser>(CURRENT_USER);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
  });

  const startEditing = () => {
    setDraft({ firstName: user.firstName, lastName: user.lastName, phone: user.phone });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setDraft({ firstName: user.firstName, lastName: user.lastName, phone: user.phone });
    setIsEditing(false);
  };

  const isDirty =
    draft.firstName !== user.firstName ||
    draft.lastName !== user.lastName ||
    draft.phone !== user.phone;

  const canSave = isDirty && draft.firstName.trim().length > 0 && draft.lastName.trim().length > 0;

  const saveProfile = () => {
    if (!canSave) return;
    setUser((u) => ({
      ...u,
      firstName: draft.firstName.trim(),
      lastName: draft.lastName.trim(),
      phone: draft.phone.trim(),
    }));
    setIsEditing(false);
  };

  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const passwordMismatch = passwords.confirm.length > 0 && passwords.next !== passwords.confirm;
  const newTooShort = passwords.next.length > 0 && passwords.next.length < 8;

  const canChangePassword =
    passwords.current.length > 0 &&
    passwords.next.length >= 8 &&
    passwords.confirm.length > 0 &&
    passwords.next === passwords.confirm;

  const changePassword = () => {
    if (!canChangePassword) return;
    setPasswords({ current: '', next: '', confirm: '' });
    setShowPasswords(false);
    setPasswordSaved(true);
  };

  const fullName = `${user.firstName} ${user.lastName}`.trim();
  const meta = POSITION_META[user.position];

  return (
    <>
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">My Profile</h2>
            <p className="text-sm text-gray-600 mt-1">
              Your account details. Update your name and phone — the rest is managed by your
              administrator.
            </p>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-6 items-start">
          {/* Left rail — identity (sticky, independent of right column height) */}
          <aside className="lg:sticky lg:top-28 space-y-6">
            <div
              className={`relative rounded-2xl bg-gradient-to-br ${meta.gradient} p-7 text-white overflow-hidden shadow-[0_18px_40px_-18px_rgba(30,41,59,0.55)]`}
            >
              <span
                className="absolute -top-10 -right-8 w-44 h-44 rounded-full bg-white/10 blur-2xl"
                aria-hidden
              />
              <span
                className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-white/10 blur-2xl"
                aria-hidden
              />
              <div className="relative flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/30 flex items-center justify-center text-3xl font-bold">
                  {getInitials(fullName)}
                </div>
                <h3 className="mt-4 text-xl font-bold truncate max-w-full">{fullName}</h3>
                <span className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/20 backdrop-blur-sm text-[11px] font-bold uppercase tracking-[0.1em]">
                  <Briefcase size={11} />
                  {user.position}
                </span>
              </div>
            </div>

            {/* Employment — compact divided list, fixed natural height */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Briefcase size={15} className="text-indigo-600" />
                  <h4 className="text-sm font-semibold text-gray-900">Employment</h4>
                </div>
              </div>
              <dl className="divide-y divide-gray-100">
                <EmploymentRow icon={Briefcase} label="Position" value={user.position} />
                <EmploymentRow
                  icon={ContactRound}
                  label="Employment type"
                  value={user.employmentType}
                />
                <EmploymentRow
                  icon={Calendar}
                  label="Hired on"
                  value={formatStaffDate(user.hiredAt)}
                />
                <EmploymentRow
                  icon={Calendar}
                  label="Working days"
                  value={
                    user.startDay === user.endDay
                      ? user.startDay
                      : `${user.startDay} – ${user.endDay}`
                  }
                  mono
                />
                <EmploymentRow
                  icon={Clock}
                  label="Working hours"
                  value={`${user.startTime} – ${user.endTime}`}
                  mono
                />
              </dl>
            </div>
          </aside>

          {/* Right column — editable panels, each sized to its own content */}
          <div className="space-y-6">
            {/* Personal details */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <User size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Personal details</h4>
                    <p className="text-xs text-gray-500">
                      {isEditing
                        ? 'Editable — these are yours to change'
                        : 'Your contact information'}
                    </p>
                  </div>
                </div>
                {!isEditing && (
                  <button
                    onClick={startEditing}
                    className="px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm text-sm font-semibold"
                  >
                    <Edit size={15} />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              <div className="p-6">
                {isEditing ? (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <EditableField
                        icon={User}
                        label="First name"
                        value={draft.firstName}
                        onChange={(v) => setDraft((d) => ({ ...d, firstName: v }))}
                        placeholder="e.g., Yara"
                      />
                      <EditableField
                        icon={User}
                        label="Last name"
                        value={draft.lastName}
                        onChange={(v) => setDraft((d) => ({ ...d, lastName: v }))}
                        placeholder="e.g., El-Sayed"
                      />
                    </div>
                    <EditableField
                      icon={Phone}
                      label="Phone number"
                      value={draft.phone}
                      onChange={(v) => setDraft((d) => ({ ...d, phone: v }))}
                      type="tel"
                      placeholder="+20 100 000 0000"
                    />

                    <div className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-3 flex items-start gap-2.5">
                      <Info size={15} className="text-gray-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Username, email, and employment information can only be changed by an
                        administrator.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ReadOnlyField icon={User} label="First name" value={user.firstName} />
                    <ReadOnlyField icon={User} label="Last name" value={user.lastName} />
                    <ReadOnlyField icon={AtSign} label="Username" value={user.username} mono />
                    <ReadOnlyField icon={Mail} label="Email" value={user.email} />
                    <ReadOnlyField icon={Phone} label="Phone" value={user.phone} />
                  </div>
                )}
              </div>

              {isEditing && (
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex items-center justify-end gap-3">
                  <button
                    onClick={cancelEditing}
                    className="px-5 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors border border-gray-300 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveProfile}
                    disabled={!canSave}
                    className="px-5 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm flex items-center gap-2 text-sm font-semibold"
                  >
                    <Save size={16} />
                    Save changes
                  </button>
                </div>
              )}
            </div>

            {/* Password */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                    <Lock size={16} className="text-amber-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Password</h4>
                    <p className="text-xs text-gray-500">
                      Choose a strong password you don't use elsewhere
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPasswords((s) => !s)}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  {showPasswords ? <EyeOff size={15} /> : <EyeIcon size={15} />}
                  {showPasswords ? 'Hide' : 'Show'}
                </button>
              </div>

              <div className="p-6">
                {passwordSaved && (
                  <div className="mb-5 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-start gap-2.5">
                    <CircleCheck size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-emerald-800">
                      Your password has been updated. Use it next time you sign in.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <PasswordField
                      label="Current password"
                      value={passwords.current}
                      onChange={(v) => {
                        setPasswords((p) => ({ ...p, current: v }));
                        setPasswordSaved(false);
                      }}
                      show={showPasswords}
                      onToggleShow={() => setShowPasswords((s) => !s)}
                      placeholder="Enter your current password"
                    />
                  </div>
                  <PasswordField
                    label="New password"
                    value={passwords.next}
                    onChange={(v) => {
                      setPasswords((p) => ({ ...p, next: v }));
                      setPasswordSaved(false);
                    }}
                    show={showPasswords}
                    onToggleShow={() => setShowPasswords((s) => !s)}
                    placeholder="At least 8 characters"
                    error={newTooShort ? 'Use at least 8 characters.' : null}
                  />
                  <PasswordField
                    label="Confirm new password"
                    value={passwords.confirm}
                    onChange={(v) => {
                      setPasswords((p) => ({ ...p, confirm: v }));
                      setPasswordSaved(false);
                    }}
                    show={showPasswords}
                    onToggleShow={() => setShowPasswords((s) => !s)}
                    placeholder="Re-enter the new password"
                    error={passwordMismatch ? "Passwords don't match." : null}
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex items-center justify-end">
                <button
                  onClick={changePassword}
                  disabled={!canChangePassword}
                  className="px-5 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm flex items-center gap-2 text-sm font-semibold"
                >
                  <Save size={16} />
                  Update password
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function App() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showAddHallModal, setShowAddHallModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedHall, setSelectedHall] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);

  // Movies management state
  const [searchQuery, setSearchQuery] = useState('');
  const [showMovieDetailsModal, setShowMovieDetailsModal] = useState(false);
  const [showCreateShowtimeModal, setShowCreateShowtimeModal] = useState(false);
  const [showEditShowtimeModal, setShowEditShowtimeModal] = useState(false);
  const [showDeleteShowtimeConfirm, setShowDeleteShowtimeConfirm] = useState(false);
  const [showDeleteAllShowtimesConfirm, setShowDeleteAllShowtimesConfirm] = useState(false);
  const [showViewShowtimesModal, setShowViewShowtimesModal] = useState(false);
  const [showScheduleMovieModal, setShowScheduleMovieModal] = useState(false);
  const [scheduleSelectedMovie, setScheduleSelectedMovie] = useState<any>(null);
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const [selectedShowtime, setSelectedShowtime] = useState<any>(null);
  const [selectedShowtimeDate, setSelectedShowtimeDate] = useState<string>('');

  // Staff management state
  const [staff, setStaff] = useState<StaffMember[]>(STAFF_SAMPLE);
  const [staffSearch, setStaffSearch] = useState('');
  const [staffPositionFilter, setStaffPositionFilter] = useState<'ALL' | StaffPosition>('ALL');
  const [staffPage, setStaffPage] = useState(1);
  const [staffPageSize, setStaffPageSize] = useState(5);
  const [showStaffFormModal, setShowStaffFormModal] = useState(false);
  const [staffEditMode, setStaffEditMode] = useState(false);
  const [showStaffViewModal, setShowStaffViewModal] = useState(false);
  const [showStaffDeleteConfirm, setShowStaffDeleteConfirm] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [staffForm, setStaffForm] = useState<{
    fullName: string;
    username: string;
    email: string;
    phone: string;
    position: StaffPosition;
    employmentType: EmploymentType;
    startDay: Weekday;
    endDay: Weekday;
    startTime: string;
    endTime: string;
  }>({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    position: 'Cashier',
    employmentType: 'Part-time',
    startDay: 'Mon',
    endDay: 'Fri',
    startTime: '09:00',
    endTime: '17:00',
  });

  const openAddStaff = () => {
    setStaffEditMode(false);
    setSelectedStaff(null);
    setStaffForm({
      fullName: '',
      username: '',
      email: '',
      phone: '',
      position: 'Cashier',
      employmentType: 'Part-time',
      startDay: 'Mon',
      endDay: 'Fri',
      startTime: '09:00',
      endTime: '17:00',
    });
    setShowStaffFormModal(true);
  };

  const openEditStaff = (member: StaffMember) => {
    setStaffEditMode(true);
    setSelectedStaff(member);
    setStaffForm({
      fullName: member.fullName,
      username: member.username,
      email: member.email,
      phone: member.phone,
      position: member.position,
      employmentType: member.employmentType,
      startDay: member.startDay,
      endDay: member.endDay,
      startTime: member.startTime,
      endTime: member.endTime,
    });
    setShowStaffFormModal(true);
  };

  const handleSaveStaff = () => {
    if (!staffForm.fullName.trim()) return;
    if (staffEditMode && selectedStaff) {
      setStaff((prev) =>
        prev.map((m) =>
          m.id === selectedStaff.id
            ? {
                ...m,
                fullName: staffForm.fullName,
                username: staffForm.username,
                email: staffForm.email,
                phone: staffForm.phone,
                position: staffForm.position,
                employmentType: staffForm.employmentType,
                startDay: staffForm.startDay,
                endDay: staffForm.endDay,
                startTime: staffForm.startTime,
                endTime: staffForm.endTime,
              }
            : m,
        ),
      );
    } else {
      const newId = `st_${String(staff.length + 1).padStart(2, '0')}`;
      setStaff((prev) => [
        {
          id: newId,
          fullName: staffForm.fullName,
          username: staffForm.username,
          email: staffForm.email,
          phone: staffForm.phone,
          position: staffForm.position,
          employmentType: staffForm.employmentType,
          hiredAt: '2026-05-11',
          startDay: staffForm.startDay,
          endDay: staffForm.endDay,
          startTime: staffForm.startTime,
          endTime: staffForm.endTime,
          rating: 4.5,
        },
        ...prev,
      ]);
    }
    setShowStaffFormModal(false);
  };

  const handleDeleteStaff = () => {
    if (!selectedStaff) return;
    setStaff((prev) => prev.filter((m) => m.id !== selectedStaff.id));
    setShowStaffDeleteConfirm(false);
    setSelectedStaff(null);
  };

  const filteredStaff = staff.filter((m) => {
    if (staffPositionFilter !== 'ALL' && m.position !== staffPositionFilter) return false;
    if (!staffSearch.trim()) return true;
    const q = staffSearch.trim().toLowerCase();
    return (
      m.fullName.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.phone.toLowerCase().includes(q) ||
      m.position.toLowerCase().includes(q)
    );
  });

  const staffTotalPages = Math.max(1, Math.ceil(filteredStaff.length / staffPageSize));
  const currentStaffPage = Math.min(staffPage, staffTotalPages);
  const staffRangeStart =
    filteredStaff.length === 0 ? 0 : (currentStaffPage - 1) * staffPageSize + 1;
  const staffRangeEnd = Math.min(currentStaffPage * staffPageSize, filteredStaff.length);
  const paginatedStaff = filteredStaff.slice(
    (currentStaffPage - 1) * staffPageSize,
    currentStaffPage * staffPageSize,
  );

  useEffect(() => {
    setStaffPage(1);
  }, [staffSearch, staffPositionFilter, staffPageSize]);

  const buildStaffPageItems = (current: number, total: number): (number | 'gap')[] => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const items: (number | 'gap')[] = [1];
    const left = Math.max(2, current - 1);
    const right = Math.min(total - 1, current + 1);
    if (left > 2) items.push('gap');
    for (let i = left; i <= right; i++) items.push(i);
    if (right < total - 1) items.push('gap');
    items.push(total);
    return items;
  };

  const STAFF_POSITION_ORDER: StaffPosition[] = [
    'Manager',
    'Projectionist',
    'Cashier',
    'Concessions',
    'Usher',
  ];
  const STAFF_POSITION_COLORS: Record<StaffPosition, { bar: string; dot: string; text: string }> = {
    Manager: { bar: 'bg-violet-500', dot: 'bg-violet-500', text: 'text-violet-700' },
    Projectionist: { bar: 'bg-indigo-500', dot: 'bg-indigo-500', text: 'text-indigo-700' },
    Cashier: { bar: 'bg-blue-500', dot: 'bg-blue-500', text: 'text-blue-700' },
    Concessions: { bar: 'bg-amber-500', dot: 'bg-amber-500', text: 'text-amber-700' },
    Usher: { bar: 'bg-emerald-500', dot: 'bg-emerald-500', text: 'text-emerald-700' },
  };
  const positionCounts = STAFF_POSITION_ORDER.map((position) => ({
    position,
    count: staff.filter((m) => m.position === position).length,
  }));
  const positionTotal = positionCounts.reduce((acc, p) => acc + p.count, 0);

  // Search dropdown ref for click outside detection
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) {
        setSearchQuery('');
      }
    };

    if (searchQuery) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchQuery]);

  // Seat layout editor state
  const [numRows, setNumRows] = useState(10);
  const [seatsPerRow, setSeatsPerRow] = useState(12);
  const [seatLayout, setSeatLayout] = useState<string[][]>([]);
  const [selectedSeatType, setSelectedSeatType] = useState<'normal' | 'vip' | 'onsite' | 'empty'>(
    'normal',
  );

  // Initialize seat layout when modal opens
  const initializeSeatLayout = (rows: number, cols: number) => {
    const layout: string[][] = [];
    for (let i = 0; i < rows; i++) {
      const row: string[] = [];
      for (let j = 0; j < cols; j++) {
        // Create default layout with aisles
        const isAisle =
          (j === Math.floor(cols / 2) - 1 || j === Math.floor(cols / 2)) && i < rows - 2;
        const isVIP = i >= rows - 2;
        const isOnSiteOnly = (i === 0 || i === 1) && (j <= 1 || j >= cols - 2);

        if (isAisle) {
          row.push('empty');
        } else if (isVIP) {
          row.push('vip');
        } else if (isOnSiteOnly) {
          row.push('onsite');
        } else {
          row.push('normal');
        }
      }
      layout.push(row);
    }
    setSeatLayout(layout);
  };

  const handleSeatClick = (rowIndex: number, colIndex: number) => {
    const newLayout = [...seatLayout];
    newLayout[rowIndex][colIndex] = selectedSeatType;
    setSeatLayout(newLayout);
  };

  const calculateSeatStats = () => {
    let normal = 0,
      vip = 0,
      onsite = 0,
      total = 0;
    seatLayout.forEach((row) => {
      row.forEach((seat) => {
        if (seat === 'normal') {
          normal++;
          total++;
        } else if (seat === 'vip') {
          vip++;
          total++;
        } else if (seat === 'onsite') {
          onsite++;
          total++;
        }
      });
    });
    return { normal, vip, onsite, total };
  };

  // Hall data
  const [halls, setHalls] = useState([
    {
      id: 1,
      name: 'Hall 1',
      capacity: 120,
      rows: 10,
      seatsPerRow: 12,
      status: 'Active',
      currentMovie: 'Spider-Man: No Way Home',
      occupancy: 85,
    },
    {
      id: 2,
      name: 'Hall 2',
      capacity: 150,
      rows: 12,
      seatsPerRow: 13,
      status: 'Active',
      currentMovie: 'Dune: Part Two',
      occupancy: 92,
    },
    {
      id: 3,
      name: 'Hall 3',
      capacity: 100,
      rows: 8,
      seatsPerRow: 13,
      status: 'Active',
      currentMovie: 'The Matrix Resurrections',
      occupancy: 78,
    },
    {
      id: 4,
      name: 'Hall 4',
      capacity: 80,
      rows: 8,
      seatsPerRow: 10,
      status: 'Inactive',
      currentMovie: null,
      occupancy: 0,
    },
  ]);

  const nowShowingMovies = [
    {
      title: 'The Matrix Resurrections',
      poster:
        'https://images.unsplash.com/photo-1572188863110-46d457c9234d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      genre: 'Sci-Fi',
      rating: 4.5,
      showtimes: 8,
      revenue: '$12,450',
      occupancy: '78%',
      status: 'Now Showing',
    },
    {
      title: 'Dune: Part Two',
      poster:
        'https://images.unsplash.com/photo-1761948245703-cbf27a3e7502?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      genre: 'Adventure',
      rating: 4.8,
      showtimes: 6,
      revenue: '$18,900',
      occupancy: '92%',
      status: 'Now Showing',
    },
    {
      title: 'Spider-Man: No Way Home',
      poster:
        'https://images.unsplash.com/photo-1758232589439-f5ec09dc92c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      genre: 'Action',
      rating: 4.7,
      showtimes: 10,
      revenue: '$24,350',
      occupancy: '85%',
      status: 'Now Showing',
    },
    {
      title: 'Avatar: The Way of Water',
      poster:
        'https://images.unsplash.com/photo-1753944847480-92f369a5f00e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      genre: 'Fantasy',
      rating: 4.6,
      showtimes: 7,
      revenue: '$15,200',
      occupancy: '81%',
      status: 'Now Showing',
    },
  ];

  const upcomingMovies = [
    {
      title: 'The Dark Knight Returns',
      poster:
        'https://images.unsplash.com/photo-1618410321132-9f4cebb2f7f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      genre: 'Action',
      releaseDate: 'March 30, 2026',
      status: 'Upcoming',
    },
    {
      title: 'Interstellar Journey',
      poster:
        'https://images.unsplash.com/photo-1758232589376-9f3db5aa371d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      genre: 'Sci-Fi',
      releaseDate: 'April 5, 2026',
      status: 'Upcoming',
    },
  ];

  // Complete movie database for search
  const [allMovies] = useState([
    {
      id: 1,
      title: 'The Matrix Resurrections',
      poster:
        'https://images.unsplash.com/photo-1572188863110-46d457c9234d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      genre: 'Sci-Fi',
      releaseYear: 2021,
      rating: 4.5,
      duration: '148 min',
      director: 'Lana Wachowski',
      description:
        'Return to a world of two realities: one, everyday life; the other, what lies behind it.',
      cast: ['Keanu Reeves', 'Carrie-Anne Moss', 'Yahya Abdul-Mateen II'],
    },
    {
      id: 2,
      title: 'Dune: Part Two',
      poster:
        'https://images.unsplash.com/photo-1761948245703-cbf27a3e7502?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      genre: 'Adventure',
      releaseYear: 2024,
      rating: 4.8,
      duration: '166 min',
      director: 'Denis Villeneuve',
      description:
        'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators.',
      cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson'],
    },
    {
      id: 3,
      title: 'Spider-Man: No Way Home',
      poster:
        'https://images.unsplash.com/photo-1758232589439-f5ec09dc92c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      genre: 'Action',
      releaseYear: 2021,
      rating: 4.7,
      duration: '148 min',
      director: 'Jon Watts',
      description: "Spider-Man's identity is revealed, and he turns to Doctor Strange for help.",
      cast: ['Tom Holland', 'Zendaya', 'Benedict Cumberbatch'],
    },
    {
      id: 4,
      title: 'Avatar: The Way of Water',
      poster:
        'https://images.unsplash.com/photo-1753944847480-92f369a5f00e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      genre: 'Fantasy',
      releaseYear: 2022,
      rating: 4.6,
      duration: '192 min',
      director: 'James Cameron',
      description:
        'Jake Sully and Neytiri have formed a family and are doing everything to stay together.',
      cast: ['Sam Worthington', 'Zoe Saldana', 'Sigourney Weaver'],
    },
    {
      id: 5,
      title: 'Inception',
      poster:
        'https://images.unsplash.com/photo-1765510296004-614b6cc204da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      genre: 'Thriller',
      releaseYear: 2010,
      rating: 4.9,
      duration: '148 min',
      director: 'Christopher Nolan',
      description: 'A thief who steals corporate secrets through dream-sharing technology.',
      cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Elliot Page'],
    },
    {
      id: 6,
      title: 'Interstellar',
      poster:
        'https://images.unsplash.com/photo-1761948245185-fc300ad20316?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      genre: 'Sci-Fi',
      releaseYear: 2014,
      rating: 4.8,
      duration: '169 min',
      director: 'Christopher Nolan',
      description: 'A team of explorers travel through a wormhole in space.',
      cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain'],
    },
    {
      id: 7,
      title: 'The Conjuring',
      poster:
        'https://images.unsplash.com/photo-1769321309399-38d9eda18370?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      genre: 'Horror',
      releaseYear: 2013,
      rating: 4.4,
      duration: '112 min',
      director: 'James Wan',
      description: 'Paranormal investigators work to help a family terrorized by a dark presence.',
      cast: ['Patrick Wilson', 'Vera Farmiga', 'Lili Taylor'],
    },
  ]);

  // Showtimes database
  const [showtimes, setShowtimes] = useState([
    // Apr 15 — all published (past)
    {
      id: 1,
      movieId: 3,
      movieTitle: 'Spider-Man: No Way Home',
      hallId: 1,
      hallName: 'Hall 1',
      date: '2026-04-15',
      time: '14:30',
      bookedSeats: 89,
      totalSeats: 120,
      status: 'published' as const,
    },
    {
      id: 2,
      movieId: 3,
      movieTitle: 'Spider-Man: No Way Home',
      hallId: 2,
      hallName: 'Hall 2',
      date: '2026-04-15',
      time: '18:00',
      bookedSeats: 112,
      totalSeats: 150,
      status: 'published' as const,
    },
    {
      id: 3,
      movieId: 2,
      movieTitle: 'Dune: Part Two',
      hallId: 3,
      hallName: 'Hall 3',
      date: '2026-04-15',
      time: '15:00',
      bookedSeats: 32,
      totalSeats: 100,
      status: 'published' as const,
    },
    {
      id: 4,
      movieId: 2,
      movieTitle: 'Dune: Part Two',
      hallId: 2,
      hallName: 'Hall 2',
      date: '2026-04-15',
      time: '19:00',
      bookedSeats: 78,
      totalSeats: 150,
      status: 'published' as const,
    },
    {
      id: 5,
      movieId: 1,
      movieTitle: 'The Matrix Resurrections',
      hallId: 1,
      hallName: 'Hall 1',
      date: '2026-04-15',
      time: '16:00',
      bookedSeats: 45,
      totalSeats: 120,
      status: 'published' as const,
    },
    {
      id: 6,
      movieId: 4,
      movieTitle: 'Avatar: The Way of Water',
      hallId: 1,
      hallName: 'Hall 1',
      date: '2026-04-15',
      time: '18:30',
      bookedSeats: 67,
      totalSeats: 120,
      status: 'published' as const,
    },
    // Apr 16 — today, mix of published and draft
    {
      id: 7,
      movieId: 1,
      movieTitle: 'The Matrix Resurrections',
      hallId: 3,
      hallName: 'Hall 3',
      date: '2026-04-16',
      time: '13:00',
      bookedSeats: 21,
      totalSeats: 100,
      status: 'published' as const,
    },
    {
      id: 8,
      movieId: 2,
      movieTitle: 'Dune: Part Two',
      hallId: 1,
      hallName: 'Hall 1',
      date: '2026-04-16',
      time: '20:00',
      bookedSeats: 93,
      totalSeats: 120,
      status: 'published' as const,
    },
    {
      id: 9,
      movieId: 3,
      movieTitle: 'Spider-Man: No Way Home',
      hallId: 2,
      hallName: 'Hall 2',
      date: '2026-04-16',
      time: '15:30',
      bookedSeats: 134,
      totalSeats: 150,
      status: 'published' as const,
    },
    {
      id: 10,
      movieId: 3,
      movieTitle: 'Spider-Man: No Way Home',
      hallId: 1,
      hallName: 'Hall 1',
      date: '2026-04-16',
      time: '19:00',
      bookedSeats: 98,
      totalSeats: 120,
      status: 'published' as const,
    },
    {
      id: 11,
      movieId: 4,
      movieTitle: 'Avatar: The Way of Water',
      hallId: 3,
      hallName: 'Hall 3',
      date: '2026-04-16',
      time: '16:00',
      bookedSeats: 55,
      totalSeats: 100,
      status: 'draft' as const,
    },
    {
      id: 12,
      movieId: 1,
      movieTitle: 'The Matrix Resurrections',
      hallId: 2,
      hallName: 'Hall 2',
      date: '2026-04-16',
      time: '21:00',
      bookedSeats: 0,
      totalSeats: 150,
      status: 'draft' as const,
    },
    // Apr 17 — mostly drafts (future planning)
    {
      id: 13,
      movieId: 2,
      movieTitle: 'Dune: Part Two',
      hallId: 2,
      hallName: 'Hall 2',
      date: '2026-04-17',
      time: '14:00',
      bookedSeats: 0,
      totalSeats: 150,
      status: 'draft' as const,
    },
    {
      id: 14,
      movieId: 2,
      movieTitle: 'Dune: Part Two',
      hallId: 3,
      hallName: 'Hall 3',
      date: '2026-04-17',
      time: '17:30',
      bookedSeats: 0,
      totalSeats: 100,
      status: 'draft' as const,
    },
    {
      id: 15,
      movieId: 3,
      movieTitle: 'Spider-Man: No Way Home',
      hallId: 1,
      hallName: 'Hall 1',
      date: '2026-04-17',
      time: '15:00',
      bookedSeats: 0,
      totalSeats: 120,
      status: 'draft' as const,
    },
    {
      id: 16,
      movieId: 3,
      movieTitle: 'Spider-Man: No Way Home',
      hallId: 2,
      hallName: 'Hall 2',
      date: '2026-04-17',
      time: '20:00',
      bookedSeats: 0,
      totalSeats: 150,
      status: 'published' as const,
    },
    {
      id: 17,
      movieId: 4,
      movieTitle: 'Avatar: The Way of Water',
      hallId: 1,
      hallName: 'Hall 1',
      date: '2026-04-17',
      time: '13:00',
      bookedSeats: 0,
      totalSeats: 120,
      status: 'draft' as const,
    },
    {
      id: 18,
      movieId: 1,
      movieTitle: 'The Matrix Resurrections',
      hallId: 1,
      hallName: 'Hall 1',
      date: '2026-04-17',
      time: '18:00',
      bookedSeats: 0,
      totalSeats: 120,
      status: 'published' as const,
    },
    {
      id: 19,
      movieId: 4,
      movieTitle: 'Avatar: The Way of Water',
      hallId: 2,
      hallName: 'Hall 2',
      date: '2026-04-17',
      time: '21:30',
      bookedSeats: 0,
      totalSeats: 150,
      status: 'draft' as const,
    },
    // Apr 18 — all drafts (not yet published)
    {
      id: 20,
      movieId: 2,
      movieTitle: 'Dune: Part Two',
      hallId: 1,
      hallName: 'Hall 1',
      date: '2026-04-18',
      time: '14:00',
      bookedSeats: 0,
      totalSeats: 120,
      status: 'draft' as const,
    },
    {
      id: 21,
      movieId: 3,
      movieTitle: 'Spider-Man: No Way Home',
      hallId: 3,
      hallName: 'Hall 3',
      date: '2026-04-18',
      time: '16:30',
      bookedSeats: 0,
      totalSeats: 100,
      status: 'draft' as const,
    },
    {
      id: 22,
      movieId: 1,
      movieTitle: 'The Matrix Resurrections',
      hallId: 2,
      hallName: 'Hall 2',
      date: '2026-04-18',
      time: '19:00',
      bookedSeats: 0,
      totalSeats: 150,
      status: 'draft' as const,
    },
    {
      id: 23,
      movieId: 4,
      movieTitle: 'Avatar: The Way of Water',
      hallId: 1,
      hallName: 'Hall 1',
      date: '2026-04-18',
      time: '21:00',
      bookedSeats: 0,
      totalSeats: 120,
      status: 'draft' as const,
    },
    // Inception — all published, no drafts
    {
      id: 24,
      movieId: 5,
      movieTitle: 'Inception',
      hallId: 2,
      hallName: 'Hall 2',
      date: '2026-04-16',
      time: '14:00',
      bookedSeats: 72,
      totalSeats: 150,
      status: 'published' as const,
    },
    {
      id: 25,
      movieId: 5,
      movieTitle: 'Inception',
      hallId: 1,
      hallName: 'Hall 1',
      date: '2026-04-16',
      time: '18:00',
      bookedSeats: 105,
      totalSeats: 120,
      status: 'published' as const,
    },
    {
      id: 26,
      movieId: 5,
      movieTitle: 'Inception',
      hallId: 3,
      hallName: 'Hall 3',
      date: '2026-04-17',
      time: '16:00',
      bookedSeats: 44,
      totalSeats: 100,
      status: 'published' as const,
    },
  ]);

  // Filter movies based on search
  const filteredMovies = allMovies.filter(
    (movie) =>
      movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movie.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movie.releaseYear.toString().includes(searchQuery),
  );

  // Get movies that have showtimes
  const moviesWithShowtimes = allMovies.filter((movie) =>
    showtimes.some((showtime) => showtime.movieId === movie.id),
  );

  // Get showtimes for selected movie
  const getMovieShowtimes = (movieId: number) => {
    return showtimes.filter((showtime) => showtime.movieId === movieId);
  };

  // Get unique dates from showtimes for a movie
  const getShowtimeDates = (movieId: number) => {
    const movieShowtimes = getMovieShowtimes(movieId);
    const uniqueDates = Array.from(new Set(movieShowtimes.map((st) => st.date))).sort();
    return uniqueDates;
  };

  // Get showtimes for a specific date
  const getShowtimesByDate = (movieId: number, date: string) => {
    return showtimes
      .filter((st) => st.movieId === movieId && st.date === date)
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  // Upcoming movies data
  const [upcomingInterval, setUpcomingInterval] = useState<'2weeks' | 'month' | '3months'>('month');

  const allUpcomingMovies = [
    // Next 2 weeks (Apr 17–30)
    {
      id: 8,
      title: 'Guardians of the Galaxy Vol. 3',
      poster:
        'https://images.unsplash.com/photo-1650568922476-7e5aa8ed62b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      genre: 'Action',
      releaseDate: '2026-04-20',
      director: 'James Gunn',
    },
    {
      id: 9,
      title: 'The Batman Returns',
      poster:
        'https://images.unsplash.com/photo-1628432136678-43ff9be34064?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      genre: 'Action',
      releaseDate: '2026-04-25',
      director: 'Matt Reeves',
    },
    {
      id: 10,
      title: 'Oppenheimer',
      poster:
        'https://images.unsplash.com/photo-1767244490204-74aa6a4c6df9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      genre: 'Drama',
      releaseDate: '2026-04-28',
      director: 'Christopher Nolan',
    },
    // This month (May)
    {
      id: 11,
      title: 'Barbie',
      poster:
        'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      genre: 'Comedy',
      releaseDate: '2026-05-01',
      director: 'Greta Gerwig',
    },
    {
      id: 12,
      title: 'Mission: Impossible 8',
      poster:
        'https://images.unsplash.com/photo-1536440136628-849c177e76a1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      genre: 'Action',
      releaseDate: '2026-05-08',
      director: 'Christopher McQuarrie',
    },
    {
      id: 13,
      title: 'Inside Out 3',
      poster:
        'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      genre: 'Animation',
      releaseDate: '2026-05-15',
      director: 'Kelsey Mann',
    },
    // Next 3 months (Jun–Jul)
    {
      id: 14,
      title: 'Jurassic World: Dominion 2',
      poster:
        'https://images.unsplash.com/photo-1616530940355-351fabd9524b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      genre: 'Sci-Fi',
      releaseDate: '2026-06-05',
      director: 'Colin Trevorrow',
    },
    {
      id: 15,
      title: 'Black Panther: Legacy',
      poster:
        'https://images.unsplash.com/photo-1635805737707-575885ab0820?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      genre: 'Action',
      releaseDate: '2026-06-19',
      director: 'Ryan Coogler',
    },
    {
      id: 16,
      title: 'Fantastic Four',
      poster:
        'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      genre: 'Action',
      releaseDate: '2026-07-04',
      director: 'Matt Shakman',
    },
    {
      id: 17,
      title: 'The Hunger Games: Sunrise',
      poster:
        'https://images.unsplash.com/photo-1518676590747-1e3dcf5a2e32?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      genre: 'Drama',
      releaseDate: '2026-07-17',
      director: 'Francis Lawrence',
    },
  ];

  const getIntervalEndDate = () => {
    const today = new Date('2026-04-16');
    if (upcomingInterval === '2weeks') {
      return new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    }
    if (upcomingInterval === '3months') {
      return new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());
    }
    return new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
  };

  const filteredUpcomingMovies = allUpcomingMovies.filter((movie) => {
    const releaseDate = new Date(movie.releaseDate);
    const today = new Date('2026-04-16');
    return releaseDate >= today && releaseDate <= getIntervalEndDate();
  });

  // Handle delete showtime
  const handleDeleteShowtime = () => {
    if (selectedShowtime) {
      setShowtimes(showtimes.filter((st) => st.id !== selectedShowtime.id));
      setShowDeleteShowtimeConfirm(false);
      setSelectedShowtime(null);
    }
  };

  // Handle delete all showtimes for a movie
  const handleDeleteAllShowtimes = () => {
    if (selectedMovie) {
      setShowtimes(showtimes.filter((st) => st.movieId !== selectedMovie.id));
      setShowDeleteAllShowtimesConfirm(false);
      setSelectedMovie(null);
    }
  };

  return (
    <div className="size-full flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <Film size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Cinema Admin</h1>
              <p className="text-xs text-gray-500">Management Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-auto">
          <div className="space-y-1">
            <button
              onClick={() => setActiveSection('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeSection === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Home size={20} />
              <span className="flex-1 text-left font-medium">Dashboard</span>
            </button>

            <button
              onClick={() => setActiveSection('halls')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeSection === 'halls'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Layout size={20} />
              <span className="flex-1 text-left font-medium">Halls</span>
            </button>

            <button
              onClick={() => setActiveSection('movies')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeSection === 'movies'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Film size={20} />
              <span className="flex-1 text-left font-medium">Movies</span>
            </button>

            <button
              onClick={() => setActiveSection('payment')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeSection === 'payment'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <CreditCard size={20} />
              <span className="flex-1 text-left font-medium">Payment</span>
            </button>

            <button
              onClick={() => setActiveSection('statistics')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeSection === 'statistics'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <BarChart3 size={20} />
              <span className="flex-1 text-left font-medium">Statistics</span>
            </button>

            <button
              onClick={() => setActiveSection('staff')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeSection === 'staff'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ContactRound size={20} />
              <span className="flex-1 text-left font-medium">Staff</span>
            </button>

            <button
              onClick={() => setActiveSection('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeSection === 'profile'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <User size={20} />
              <span className="flex-1 text-left font-medium">Profile</span>
            </button>

            <div className="pt-4 mt-4 border-t border-gray-200">
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-all">
                <Settings size={20} />
                <span className="flex-1 text-left font-medium">Settings</span>
              </button>
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveSection('profile')}
            className="w-full flex items-center gap-3 text-left rounded-lg p-1 -m-1 hover:bg-gray-100 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-sm flex-shrink-0">
              <span className="text-white text-sm font-semibold">
                {getInitials(`${CURRENT_USER.firstName} ${CURRENT_USER.lastName}`)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {CURRENT_USER.firstName} {CURRENT_USER.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">{CURRENT_USER.email}</p>
            </div>
            <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-50">
        {activeSection === 'dashboard' && (
          <>
            {/* Top Bar */}
            <div className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Welcome back! Here's what's happening today
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors flex items-center gap-2">
                    <BarChart3 size={18} />
                    <span>View Reports</span>
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm">
                    <Plus size={18} />
                    <span>Quick Add</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-8">
              {/* Today's Overview */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Today's Performance</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Real-time metrics for March 25, 2026
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveSection('statistics')}
                    className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 text-sm"
                  >
                    View Full Statistics <ChevronRight size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Ticket size={28} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Tickets Sold</p>
                      <p className="text-3xl font-bold text-gray-900">342</p>
                      <p className="text-xs text-green-600 font-semibold mt-1">
                        ↑ 12% vs yesterday
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <DollarSign size={28} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Revenue</p>
                      <p className="text-3xl font-bold text-gray-900">$8.5K</p>
                      <p className="text-xs text-green-600 font-semibold mt-1">
                        ↑ 15% vs yesterday
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Users size={28} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Active Viewers</p>
                      <p className="text-3xl font-bold text-gray-900">156</p>
                      <p className="text-xs text-gray-600 mt-1">In theaters now</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <TrendingUp size={28} className="text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Occupancy Rate</p>
                      <p className="text-3xl font-bold text-gray-900">84%</p>
                      <p className="text-xs text-green-600 font-semibold mt-1">↑ 8% vs last week</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Layout size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">8</p>
                      <p className="text-sm text-gray-600">Total Halls</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-sm text-gray-600">
                      <span className="font-semibold text-green-600">3</span> Active Now
                    </span>
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      Manage →
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Film size={24} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">12</p>
                      <p className="text-sm text-gray-600">Total Movies</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-sm text-gray-600">
                      <span className="font-semibold text-purple-600">6</span> Now Showing
                    </span>
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      View All →
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                      <Calendar size={24} className="text-orange-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">24</p>
                      <p className="text-sm text-gray-600">Today's Showtimes</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-sm text-gray-600">
                      <span className="font-semibold text-orange-600">18</span> Scheduled
                    </span>
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      Details →
                    </button>
                  </div>
                </div>
              </div>

              {/* Now Showing Movies */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <Film className="text-purple-600" size={24} />
                      Now Showing Movies
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">Currently screening in your cinema</p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                    View All <ChevronRight size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {nowShowingMovies.map((movie, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-xl transition-all hover:-translate-y-1 group"
                    >
                      <div className="relative">
                        <ImageWithFallback
                          src={movie.poster}
                          alt={movie.title}
                          className="w-full h-72 object-cover"
                        />
                        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                          <Star size={14} className="fill-yellow-400 text-yellow-400" />
                          {movie.rating}
                        </div>
                        <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold uppercase">
                          {movie.status}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                            <button className="flex-1 bg-white text-gray-900 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-1">
                              <Edit size={16} />
                              Edit
                            </button>
                            <button className="px-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="p-4">
                        <h4 className="font-semibold text-gray-900 mb-1 truncate">{movie.title}</h4>
                        <p className="text-sm text-gray-600 mb-3">{movie.genre}</p>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 flex items-center gap-1">
                              <Clock size={14} />
                              Showtimes
                            </span>
                            <span className="font-semibold text-gray-900">
                              {movie.showtimes} times
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 flex items-center gap-1">
                              <DollarSign size={14} />
                              Revenue
                            </span>
                            <span className="font-semibold text-green-600">{movie.revenue}</span>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 flex items-center gap-1">
                              <Eye size={14} />
                              Occupancy
                            </span>
                            <span className="font-semibold text-blue-600">{movie.occupancy}</span>
                          </div>
                        </div>

                        <button className="w-full mt-3 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors">
                          Manage Showtimes
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upcoming Movies */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Calendar className="text-orange-600" size={20} />
                      Upcoming Movies
                    </h3>
                    <div className="space-y-4">
                      {upcomingMovies.map((movie, index) => (
                        <div
                          key={index}
                          className="flex gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <ImageWithFallback
                            src={movie.poster}
                            alt={movie.title}
                            className="w-16 h-24 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm mb-1">
                              {movie.title}
                            </h4>
                            <p className="text-xs text-gray-600 mb-2">{movie.genre}</p>
                            <p className="text-xs text-orange-600 font-medium">
                              {movie.releaseDate}
                            </p>
                          </div>
                        </div>
                      ))}
                      <button className="w-full py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors">
                        View All Upcoming
                      </button>
                    </div>
                  </div>
                </div>

                {/* Today's Showtimes Schedule */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Clock className="text-blue-600" size={20} />
                        Today's Schedule
                      </h3>
                      <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                        View Full Schedule
                      </button>
                    </div>
                    <div className="space-y-3">
                      {[
                        {
                          movie: 'Spider-Man: No Way Home',
                          hall: 'Hall 2',
                          time: '14:30',
                          seats: '89/150',
                          status: 'In Progress',
                          color: 'green',
                        },
                        {
                          movie: 'Dune: Part Two',
                          hall: 'Hall 3',
                          time: '15:00',
                          seats: '32/100',
                          status: 'Upcoming',
                          color: 'orange',
                        },
                        {
                          movie: 'The Matrix Resurrections',
                          hall: 'Hall 1',
                          time: '16:00',
                          seats: '45/120',
                          status: 'Upcoming',
                          color: 'orange',
                        },
                        {
                          movie: 'Avatar: The Way of Water',
                          hall: 'Hall 1',
                          time: '18:30',
                          seats: '67/120',
                          status: 'Upcoming',
                          color: 'orange',
                        },
                        {
                          movie: 'Dune: Part Two',
                          hall: 'Hall 2',
                          time: '19:00',
                          seats: '78/150',
                          status: 'Upcoming',
                          color: 'orange',
                        },
                      ].map((showtime, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-all"
                        >
                          <div className="text-center min-w-[80px]">
                            <p className="text-2xl font-bold text-gray-900">{showtime.time}</p>
                            <p className="text-xs text-gray-500 uppercase">{showtime.hall}</p>
                          </div>

                          <div className="h-12 w-px bg-gray-200"></div>

                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">{showtime.movie}</h4>
                            <div className="flex items-center gap-3 text-sm">
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                  showtime.color === 'green'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-orange-100 text-orange-700'
                                }`}
                              >
                                {showtime.status}
                              </span>
                              <span className="text-gray-600">
                                <Ticket size={14} className="inline mr-1" />
                                {showtime.seats} seats
                              </span>
                            </div>
                          </div>

                          <button className="text-gray-400 hover:text-gray-600">
                            <MoreVertical size={20} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Halls Management Section */}
        {activeSection === 'halls' && (
          <>
            {/* Top Bar */}
            <div className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Halls Management</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage cinema halls, seats, and layouts
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAddHallModal(true);
                    setEditMode(false);
                    setSelectedHall(null);
                    setNumRows(10);
                    setSeatsPerRow(12);
                    initializeSeatLayout(10, 12);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Plus size={18} />
                  <span>Add New Hall</span>
                </button>
              </div>
            </div>

            <div className="p-8">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Layout size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{halls.length}</p>
                      <p className="text-sm text-gray-600">Total Halls</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <Eye size={24} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {halls.filter((h) => h.status === 'Active').length}
                      </p>
                      <p className="text-sm text-gray-600">Active Halls</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Users size={24} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {halls.reduce((acc, h) => acc + h.capacity, 0)}
                      </p>
                      <p className="text-sm text-gray-600">Total Capacity</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                      <TrendingUp size={24} className="text-orange-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {Math.round(halls.reduce((acc, h) => acc + h.occupancy, 0) / halls.length)}%
                      </p>
                      <p className="text-sm text-gray-600">Avg Occupancy</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Halls List */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">All Halls</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage your cinema halls and seating arrangements
                  </p>
                </div>

                <div className="divide-y divide-gray-200">
                  {halls.map((hall) => (
                    <div key={hall.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
                            <Layout size={32} className="text-white" />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900">{hall.name}</h4>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  hall.status === 'Active'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {hall.status}
                              </span>
                            </div>

                            <div className="flex items-center gap-6 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Users size={16} />
                                {hall.capacity} seats
                              </span>
                              <span className="flex items-center gap-1">
                                <Layout size={16} />
                                {hall.rows} rows × {hall.seatsPerRow} seats
                              </span>
                              {hall.currentMovie && (
                                <>
                                  <span className="text-gray-300">|</span>
                                  <span className="flex items-center gap-1">
                                    <Film size={16} />
                                    {hall.currentMovie}
                                  </span>
                                </>
                              )}
                            </div>

                            {hall.status === 'Active' && (
                              <div className="mt-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs text-gray-600">Occupancy</span>
                                  <span className="text-xs font-semibold text-gray-900">
                                    {hall.occupancy}%
                                  </span>
                                </div>
                                <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                                    style={{ width: `${hall.occupancy}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedHall(hall);
                              setEditMode(true);
                              setShowAddHallModal(true);
                              setNumRows(hall.rows);
                              setSeatsPerRow(hall.seatsPerRow);
                              initializeSeatLayout(hall.rows, hall.seatsPerRow);
                            }}
                            className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2 border border-blue-200"
                          >
                            <Edit size={16} />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedHall(hall);
                              setShowDeleteConfirm(true);
                            }}
                            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 border border-red-200"
                          >
                            <Trash2 size={16} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Movies Management Section */}
        {activeSection === 'movies' && (
          <>
            {/* Top Bar */}
            <div className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Movies Management</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage movies, showtimes, and schedules
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowScheduleMovieModal(true);
                    setScheduleSelectedMovie(null);
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Plus size={18} />
                  <span>Schedule a Movie</span>
                </button>
              </div>
            </div>

            <div className="p-8">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Film size={24} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{allMovies.length}</p>
                      <p className="text-sm text-gray-600">Total Movies</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Calendar size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{showtimes.length}</p>
                      <p className="text-sm text-gray-600">Total Showtimes</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <Clock size={24} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {showtimes.filter((st: any) => st.date === '2026-04-16').length}
                      </p>
                      <p className="text-sm text-gray-600">Today's Showtimes</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                      <TrendingUp size={24} className="text-orange-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {filteredUpcomingMovies.length}
                      </p>
                      <p className="text-sm text-gray-600">Upcoming This Month</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Movies with Showtimes */}
              <div className="mb-8">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Current Movies & Showtimes
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Manage movies currently showing in your cinema
                    </p>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {moviesWithShowtimes.map((movie) => {
                      const movieShowtimes = getMovieShowtimes(movie.id);
                      const draftCount = movieShowtimes.filter(
                        (st: any) => st.status === 'draft',
                      ).length;
                      return (
                        <div key={movie.id} className="p-6 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-5">
                            {/* Movie Poster */}
                            <ImageWithFallback
                              src={movie.poster}
                              alt={movie.title}
                              className="w-20 h-28 object-cover rounded-lg shadow-sm flex-shrink-0"
                            />

                            {/* Movie Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1">
                                <h4 className="text-lg font-semibold text-gray-900 truncate">
                                  {movie.title}
                                </h4>
                                <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold flex-shrink-0">
                                  {movie.genre}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500">
                                {movie.duration} · {movie.director}
                              </p>
                            </div>

                            {/* Showtime Count */}
                            <div className="text-center flex-shrink-0 px-4">
                              <p className="text-2xl font-bold text-gray-900">
                                {movieShowtimes.length}
                              </p>
                              <p className="text-xs text-gray-500">Showtimes</p>
                              {draftCount > 0 && (
                                <p className="text-xs text-orange-600 font-medium mt-0.5">
                                  {draftCount} draft{draftCount !== 1 ? 's' : ''}
                                </p>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={() => {
                                  setSelectedMovie(movie);
                                  const dates = getShowtimeDates(movie.id);
                                  setSelectedShowtimeDate(dates[0] || '');
                                  setShowViewShowtimesModal(true);
                                }}
                                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                              >
                                View Showtimes
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedMovie(movie);
                                  setShowCreateShowtimeModal(true);
                                }}
                                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 text-sm"
                              >
                                <Plus size={15} />
                                Add Showtime
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedMovie(movie);
                                  setShowDeleteAllShowtimesConfirm(true);
                                }}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete all showtimes"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {moviesWithShowtimes.length === 0 && (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Film size={32} className="text-gray-400" />
                      </div>
                      <p className="text-gray-600 mb-2">No movies with showtimes</p>
                      <p className="text-sm text-gray-500">
                        Use "Schedule a Movie" to add showtimes
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Upcoming Movies */}
              <div className="mb-8">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <Calendar className="text-orange-600" size={20} />
                          Upcoming Movies
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Movies releasing soon that you can schedule
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex bg-gray-100 rounded-lg p-1">
                          {[
                            { key: '2weeks' as const, label: '2 Weeks' },
                            { key: 'month' as const, label: '1 Month' },
                            { key: '3months' as const, label: '3 Months' },
                          ].map((option) => (
                            <button
                              key={option.key}
                              onClick={() => setUpcomingInterval(option.key)}
                              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                                upcomingInterval === option.key
                                  ? 'bg-white text-gray-900 shadow-sm'
                                  : 'text-gray-500 hover:text-gray-700'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                          {filteredUpcomingMovies.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                    {filteredUpcomingMovies.map((movie) => {
                      const release = new Date(movie.releaseDate);
                      const daysUntil = Math.max(
                        0,
                        Math.ceil(
                          (release.getTime() - new Date('2026-04-16').getTime()) /
                            (1000 * 60 * 60 * 24),
                        ),
                      );
                      const releaseLabel = release.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      });

                      return (
                        <div
                          key={movie.id}
                          className="flex gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-orange-200 hover:shadow-md transition-all"
                        >
                          <div className="relative shrink-0 w-24 aspect-[2/3] rounded-lg overflow-hidden bg-gray-100 ring-1 ring-gray-200">
                            <ImageWithFallback
                              src={movie.poster}
                              alt={movie.title}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1 min-w-0 flex flex-col">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900 truncate">
                                {movie.title}
                              </h4>
                              <span className="shrink-0 px-2 py-0.5 bg-orange-50 text-orange-700 rounded-full text-xs font-semibold whitespace-nowrap">
                                {daysUntil === 0 ? 'Today' : `in ${daysUntil}d`}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mb-2 truncate">
                              {movie.genre} · {movie.director}
                            </p>
                            <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-3">
                              <Calendar size={14} className="text-orange-500" />
                              <span className="font-medium">{releaseLabel}</span>
                            </div>

                            <button
                              onClick={() => {
                                setScheduleSelectedMovie({
                                  id: movie.id,
                                  title: movie.title,
                                  poster: movie.poster,
                                  genre: movie.genre,
                                  director: movie.director,
                                  releaseYear: release.getFullYear(),
                                  duration: 'TBA',
                                });
                                setShowScheduleMovieModal(true);
                                setSearchQuery('');
                              }}
                              className="mt-auto self-start px-4 py-1.5 bg-orange-50 text-orange-600 rounded-lg font-medium hover:bg-orange-100 transition-colors text-sm"
                            >
                              Schedule Showtimes
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeSection === 'payment' && <PaymentSection />}

        {activeSection === 'profile' && <ProfileSection />}

        {/* Staff Management Section */}
        {activeSection === 'staff' && (
          <>
            {/* Top Bar */}
            <div className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Staff</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Roster, positions, and contact details for the team on the floor
                  </p>
                </div>
                <button
                  onClick={openAddStaff}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                >
                  <UserPlus size={18} />
                  <span>Add Staff Member</span>
                </button>
              </div>
            </div>

            <div className="p-8">
              {/* Position Coverage */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
                <div className="mb-4">
                  <p className="text-[11px] font-semibold tracking-[0.14em] text-gray-500 uppercase">
                    Position Coverage
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    How the {positionTotal}-person roster splits across roles
                  </p>
                </div>

                {positionTotal === 0 ? (
                  <div className="py-6 text-sm text-gray-500">No staff members yet.</div>
                ) : (
                  <>
                    <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
                      {positionCounts.map(({ position, count }) =>
                        count === 0 ? null : (
                          <div
                            key={position}
                            className={`${STAFF_POSITION_COLORS[position].bar} h-full transition-all`}
                            style={{ width: `${(count / positionTotal) * 100}%` }}
                            title={`${position}: ${count}`}
                          />
                        ),
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                      {positionCounts.map(({ position, count }) => {
                        const pct = Math.round((count / positionTotal) * 100);
                        const colors = STAFF_POSITION_COLORS[position];
                        return (
                          <button
                            key={position}
                            onClick={() => setStaffPositionFilter(position)}
                            className={`flex items-center gap-2 text-sm rounded-md px-2 py-1 -mx-2 transition-colors ${
                              count === 0
                                ? 'opacity-50 cursor-default'
                                : 'hover:bg-gray-50 cursor-pointer'
                            }`}
                            disabled={count === 0}
                            title={
                              count === 0 ? 'No staff in this position' : `Filter by ${position}`
                            }
                          >
                            <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                            <span className="text-gray-700">{position}</span>
                            <span className={`font-semibold tabular-nums ${colors.text}`}>
                              {count}
                            </span>
                            <span className="text-gray-400 text-xs tabular-nums">{pct}%</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Staff List */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">All Staff Members</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Manage your cinema team and their shift schedules
                      </p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="relative">
                        <Search
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                        <input
                          type="text"
                          value={staffSearch}
                          onChange={(e) => setStaffSearch(e.target.value)}
                          placeholder="Search by name, email, phone…"
                          className="w-72 pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <select
                        value={staffPositionFilter}
                        onChange={(e) =>
                          setStaffPositionFilter(e.target.value as 'ALL' | StaffPosition)
                        }
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      >
                        <option value="ALL">All positions</option>
                        <option value="Manager">Manager</option>
                        <option value="Cashier">Cashier</option>
                        <option value="Projectionist">Projectionist</option>
                        <option value="Usher">Usher</option>
                        <option value="Concessions">Concessions</option>
                      </select>
                    </div>
                  </div>
                </div>

                {filteredStaff.length === 0 ? (
                  <div className="p-16 flex flex-col items-center justify-center text-center">
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                      <Users size={24} className="text-gray-400" />
                    </div>
                    <p className="text-gray-900 font-medium">No staff match this view</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Try clearing the search or switching the position filter.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {paginatedStaff.map((member) => (
                      <div key={member.id} className="p-6 hover:bg-gray-50/80 transition-colors">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <StaffMonogram member={member} />

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h4 className="text-lg font-semibold text-gray-900 truncate">
                                  {member.fullName}
                                </h4>
                                <PositionChip position={member.position} />
                              </div>

                              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-gray-600">
                                <span className="flex items-center gap-1.5 truncate">
                                  <Mail size={14} className="text-gray-400 flex-shrink-0" />
                                  <span className="truncate">{member.email}</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Phone size={14} className="text-gray-400 flex-shrink-0" />
                                  {member.phone}
                                </span>
                                <span className="flex items-center gap-1.5 text-gray-500">
                                  <CalendarClock
                                    size={14}
                                    className="text-gray-400 flex-shrink-0"
                                  />
                                  {formatScheduleRange(
                                    member.startDay,
                                    member.endDay,
                                    member.startTime,
                                    member.endTime,
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => {
                                setSelectedStaff(member);
                                setShowStaffViewModal(true);
                              }}
                              className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 border border-gray-300"
                              title="View info"
                            >
                              <Eye size={16} />
                              <span>View</span>
                            </button>
                            <button
                              onClick={() => openEditStaff(member)}
                              className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2 border border-blue-200"
                              title="Edit info"
                            >
                              <Edit size={16} />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedStaff(member);
                                setShowStaffDeleteConfirm(true);
                              }}
                              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 border border-red-200"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {filteredStaff.length > 0 && (
                  <div className="px-6 py-4 border-t border-gray-200 bg-gradient-to-b from-white to-gray-50/60">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-600">
                          Showing{' '}
                          <span className="font-semibold text-gray-900 tabular-nums">
                            {staffRangeStart}–{staffRangeEnd}
                          </span>{' '}
                          of{' '}
                          <span className="font-semibold text-gray-900 tabular-nums">
                            {filteredStaff.length}
                          </span>
                        </span>
                        <span className="h-4 w-px bg-gray-200" />
                        <label className="flex items-center gap-2 text-gray-600">
                          <span>Rows</span>
                          <select
                            value={staffPageSize}
                            onChange={(e) => setStaffPageSize(Number(e.target.value))}
                            className="px-2 py-1 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent tabular-nums"
                          >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                          </select>
                        </label>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setStaffPage((p) => Math.max(1, p - 1))}
                          disabled={currentStaffPage === 1}
                          className="px-2.5 h-9 text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm border border-transparent hover:border-gray-200 rounded-lg transition-all flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-600 disabled:hover:border-transparent disabled:hover:shadow-none"
                          title="Previous page"
                        >
                          <ChevronLeft size={16} />
                          <span className="hidden sm:inline text-sm">Prev</span>
                        </button>

                        <div className="flex items-center gap-1 px-1">
                          {buildStaffPageItems(currentStaffPage, staffTotalPages).map(
                            (item, idx) =>
                              item === 'gap' ? (
                                <span
                                  key={`gap-${idx}`}
                                  className="w-9 h-9 flex items-center justify-center text-gray-400 select-none"
                                >
                                  …
                                </span>
                              ) : (
                                <button
                                  key={item}
                                  onClick={() => setStaffPage(item)}
                                  aria-current={item === currentStaffPage ? 'page' : undefined}
                                  className={
                                    item === currentStaffPage
                                      ? 'w-9 h-9 flex items-center justify-center text-sm font-semibold rounded-lg bg-gray-900 text-white shadow-sm ring-1 ring-gray-900/10 tabular-nums'
                                      : 'w-9 h-9 flex items-center justify-center text-sm font-medium rounded-lg text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm border border-transparent hover:border-gray-200 transition-all tabular-nums'
                                  }
                                >
                                  {item}
                                </button>
                              ),
                          )}
                        </div>

                        <button
                          onClick={() => setStaffPage((p) => Math.min(staffTotalPages, p + 1))}
                          disabled={currentStaffPage === staffTotalPages}
                          className="px-2.5 h-9 text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm border border-transparent hover:border-gray-200 rounded-lg transition-all flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-600 disabled:hover:border-transparent disabled:hover:shadow-none"
                          title="Next page"
                        >
                          <span className="hidden sm:inline text-sm">Next</span>
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Add/Edit Hall Modal */}
      {showAddHallModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {editMode ? `Edit ${selectedHall?.name}` : 'Add New Hall'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Configure hall details and seat layout
                  </p>
                </div>
                <button
                  onClick={() => setShowAddHallModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Hall Details */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Settings size={20} className="text-blue-600" />
                      Hall Information
                    </h4>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hall Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Hall 1, VIP Hall, IMAX"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          defaultValue={editMode ? selectedHall?.name : ''}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Number of Rows
                          </label>
                          <input
                            type="number"
                            placeholder="10"
                            min="1"
                            max="20"
                            value={numRows}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 10;
                              setNumRows(val);
                              initializeSeatLayout(val, seatsPerRow);
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Seats per Row
                          </label>
                          <input
                            type="number"
                            placeholder="12"
                            min="1"
                            max="20"
                            value={seatsPerRow}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 12;
                              setSeatsPerRow(val);
                              initializeSeatLayout(numRows, val);
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status
                        </label>
                        <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Maintenance">Under Maintenance</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Copy Layout From Existing Hall
                        </label>
                        <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                          <option value="">Create new layout</option>
                          {halls.map((h) => (
                            <option key={h.id} value={h.id}>
                              {h.name} ({h.rows}×{h.seatsPerRow})
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          Select a hall to copy its seat configuration
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Star size={20} className="text-purple-600" />
                      Seat Categories
                    </h4>

                    <div className="space-y-3">
                      <button
                        onClick={() => setSelectedSeatType('normal')}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                          selectedSeatType === 'normal'
                            ? 'bg-blue-100 border-blue-500 shadow-md'
                            : 'bg-blue-50 border-blue-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-blue-500 rounded"></div>
                          <span className="font-medium text-gray-900">Normal Seats</span>
                        </div>
                        {selectedSeatType === 'normal' && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                            Selected
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() => setSelectedSeatType('vip')}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                          selectedSeatType === 'vip'
                            ? 'bg-purple-100 border-purple-500 shadow-md'
                            : 'bg-purple-50 border-purple-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-purple-500 rounded"></div>
                          <span className="font-medium text-gray-900">VIP Seats</span>
                        </div>
                        {selectedSeatType === 'vip' && (
                          <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">
                            Selected
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() => setSelectedSeatType('onsite')}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                          selectedSeatType === 'onsite'
                            ? 'bg-orange-100 border-orange-500 shadow-md'
                            : 'bg-orange-50 border-orange-200 hover:border-orange-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-orange-500 rounded"></div>
                          <span className="font-medium text-gray-900">On-Site Only</span>
                        </div>
                        {selectedSeatType === 'onsite' && (
                          <span className="text-xs bg-orange-600 text-white px-2 py-1 rounded">
                            Selected
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() => setSelectedSeatType('empty')}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                          selectedSeatType === 'empty'
                            ? 'bg-gray-200 border-gray-500 shadow-md'
                            : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-gray-300 rounded"></div>
                          <span className="font-medium text-gray-900">Space/Aisle</span>
                        </div>
                        {selectedSeatType === 'empty' && (
                          <span className="text-xs bg-gray-600 text-white px-2 py-1 rounded">
                            Selected
                          </span>
                        )}
                      </button>

                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs text-gray-700 text-center">
                          <strong>Tip:</strong> Select a seat type above, then click on seats in the
                          layout to apply it
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Seat Layout Editor */}
                <div>
                  <div className="sticky top-0">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Layout size={20} className="text-blue-600" />
                      Seat Layout Editor
                    </h4>

                    <div className="bg-gray-100 rounded-xl p-6 border-2 border-gray-300">
                      {/* Screen */}
                      <div className="mb-6">
                        <div className="bg-gradient-to-b from-gray-800 to-gray-700 rounded-lg p-3 shadow-lg">
                          <p className="text-center text-white text-sm font-semibold">SCREEN</p>
                        </div>
                      </div>

                      {/* Seat Grid */}
                      <div className="bg-white rounded-lg p-4 shadow-inner max-h-96 overflow-auto">
                        <div className="flex flex-col gap-3">
                          {seatLayout.map((row, rowIndex) => (
                            <div key={rowIndex} className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-gray-500 w-6 text-center">
                                {String.fromCharCode(65 + rowIndex)}
                              </span>
                              <div className="flex gap-2 flex-1 justify-center">
                                {row.map((seat, seatIndex) => {
                                  const getSeatColor = () => {
                                    switch (seat) {
                                      case 'normal':
                                        return 'bg-blue-500 hover:bg-blue-600';
                                      case 'vip':
                                        return 'bg-purple-500 hover:bg-purple-600';
                                      case 'onsite':
                                        return 'bg-orange-500 hover:bg-orange-600';
                                      case 'empty':
                                        return 'bg-gray-200 hover:bg-gray-300';
                                      default:
                                        return 'bg-gray-200';
                                    }
                                  };

                                  const getSeatLabel = () => {
                                    switch (seat) {
                                      case 'vip':
                                        return ' (VIP)';
                                      case 'onsite':
                                        return ' (On-Site Only)';
                                      case 'empty':
                                        return ' (Empty)';
                                      default:
                                        return '';
                                    }
                                  };

                                  if (seat === 'empty') {
                                    return (
                                      <button
                                        key={seatIndex}
                                        onClick={() => handleSeatClick(rowIndex, seatIndex)}
                                        className="w-6 h-6 rounded transition-all hover:scale-110 bg-transparent border-2 border-dashed border-gray-300 hover:border-gray-400"
                                        title={`${String.fromCharCode(65 + rowIndex)}${seatIndex + 1} (Empty - Click to add seat)`}
                                      ></button>
                                    );
                                  }

                                  return (
                                    <button
                                      key={seatIndex}
                                      onClick={() => handleSeatClick(rowIndex, seatIndex)}
                                      className={`w-6 h-6 rounded transition-all hover:scale-110 cursor-pointer ${getSeatColor()}`}
                                      title={`${String.fromCharCode(65 + rowIndex)}${seatIndex + 1}${getSeatLabel()} - Click to change`}
                                    ></button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="mt-4 flex items-center justify-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-4 bg-blue-500 rounded"></div>
                          <span className="text-gray-600">
                            Normal ({calculateSeatStats().normal})
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-4 bg-purple-500 rounded"></div>
                          <span className="text-gray-600">VIP ({calculateSeatStats().vip})</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-4 bg-orange-500 rounded"></div>
                          <span className="text-gray-600">
                            On-Site ({calculateSeatStats().onsite})
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs text-gray-700 text-center">
                          <strong>Total Seats:</strong> {calculateSeatStats().total} (Normal:{' '}
                          {calculateSeatStats().normal}, VIP: {calculateSeatStats().vip}, On-Site
                          Only: {calculateSeatStats().onsite})
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <button
                onClick={() => setShowAddHallModal(false)}
                className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors border border-gray-300"
              >
                Cancel
              </button>
              <div className="flex items-center gap-3">
                <button className="px-6 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-300">
                  Save as Draft
                </button>
                <button className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors shadow-md">
                  {editMode ? 'Update Hall' : 'Create Hall'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={24} className="text-red-600" />
              </div>

              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Hall</h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete <strong>{selectedHall?.name}</strong>? This action
                cannot be undone and will remove all seat configurations and associated data.
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-800">
                    <p className="font-semibold mb-1">Warning:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>All seat reservations will be cancelled</li>
                      <li>Scheduled showtimes will be removed</li>
                      <li>Historical data will be archived</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setHalls(halls.filter((h) => h.id !== selectedHall?.id));
                    setShowDeleteConfirm(false);
                    setSelectedHall(null);
                  }}
                  className="flex-1 px-6 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors shadow-md"
                >
                  Delete Hall
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Movie Details Modal */}
      {showMovieDetailsModal && selectedMovie && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="relative">
              <ImageWithFallback
                src={selectedMovie.poster}
                alt={selectedMovie.title}
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              <button
                onClick={() => {
                  setShowMovieDetailsModal(false);
                  setSelectedMovie(null);
                }}
                className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="text-3xl font-bold text-white mb-2">{selectedMovie.title}</h3>
                <div className="flex items-center gap-3 text-white/90 text-sm">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                    {selectedMovie.genre}
                  </span>
                  <span>{selectedMovie.releaseYear}</span>
                  <span>•</span>
                  <span>{selectedMovie.duration}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                    {selectedMovie.rating}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Director</h4>
                  <p className="text-gray-900">{selectedMovie.director}</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Synopsis</h4>
                  <p className="text-gray-700 leading-relaxed">{selectedMovie.description}</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Cast</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedMovie.cast.map((actor: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {actor}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                    Current Showtimes
                  </h4>
                  {getMovieShowtimes(selectedMovie.id).length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {getMovieShowtimes(selectedMovie.id).map((showtime) => (
                        <div key={showtime.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar size={14} className="text-gray-500" />
                            <span className="text-sm text-gray-900">{showtime.date}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <Clock size={14} className="text-gray-500" />
                            <span className="text-lg font-bold text-gray-900">{showtime.time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-gray-500" />
                            <span className="text-sm text-gray-600">{showtime.hallName}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No showtimes scheduled for this movie</p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowMovieDetailsModal(false);
                  setShowCreateShowtimeModal(true);
                }}
                className="w-full px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                <span>Create Showtime</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Showtime Modal */}
      {showCreateShowtimeModal && selectedMovie && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Create Showtime</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Schedule a new showtime for {selectedMovie.title}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowCreateShowtimeModal(false);
                    setSelectedMovie(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      defaultValue="2026-04-15"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                    <input
                      type="time"
                      defaultValue="14:00"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hall</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Select a hall</option>
                    {halls.map((hall) => (
                      <option key={hall.id} value={hall.id}>
                        {hall.name} - {hall.capacity} seats
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Add any special notes about this showtime..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  ></textarea>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-1">Reminder:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Ensure the hall is available for this time slot</li>
                        <li>Consider cleaning time between showtimes</li>
                        <li>Ticket pricing is managed per hall seat category</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowCreateShowtimeModal(false);
                    setSelectedMovie(null);
                  }}
                  className="flex-1 px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Here you would normally save the showtime
                    setShowCreateShowtimeModal(false);
                    setSelectedMovie(null);
                  }}
                  className="flex-1 px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors shadow-md"
                >
                  Create Showtime
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Showtime Modal */}
      {showEditShowtimeModal && selectedShowtime && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Edit Showtime</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Update showtime for {selectedShowtime.movieTitle}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowEditShowtimeModal(false);
                    setSelectedShowtime(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      defaultValue={selectedShowtime.date}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                    <input
                      type="time"
                      defaultValue={selectedShowtime.time}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hall</label>
                  <select
                    defaultValue={selectedShowtime.hallId}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a hall</option>
                    {halls.map((hall) => (
                      <option key={hall.id} value={hall.id}>
                        {hall.name} - {hall.capacity} seats
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-orange-800">
                      <p className="font-semibold mb-1">Current Bookings:</p>
                      <p>
                        This showtime has {selectedShowtime.bookedSeats} booked seats out of{' '}
                        {selectedShowtime.totalSeats} total. Changes may affect existing customers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowEditShowtimeModal(false);
                    setSelectedShowtime(null);
                  }}
                  className="flex-1 px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Here you would normally update the showtime
                    setShowEditShowtimeModal(false);
                    setSelectedShowtime(null);
                  }}
                  className="flex-1 px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors shadow-md"
                >
                  Update Showtime
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Showtime Confirmation Modal */}
      {showDeleteShowtimeConfirm && selectedShowtime && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={24} className="text-red-600" />
              </div>

              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Showtime</h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete this showtime for{' '}
                <strong>{selectedShowtime.movieTitle}</strong> on{' '}
                <strong>{selectedShowtime.date}</strong> at <strong>{selectedShowtime.time}</strong>
                ?
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-800">
                    <p className="font-semibold mb-1">Warning:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>{selectedShowtime.bookedSeats} customers will be affected</li>
                      <li>All seat reservations will be cancelled</li>
                      <li>Refunds may need to be processed</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowDeleteShowtimeConfirm(false);
                    setSelectedShowtime(null);
                  }}
                  className="flex-1 px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteShowtime}
                  className="flex-1 px-6 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors shadow-md"
                >
                  Delete Showtime
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Showtimes Modal */}
      {showViewShowtimesModal && selectedMovie && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Showtimes for {selectedMovie.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    View and manage all scheduled showtimes
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowViewShowtimesModal(false);
                    setSelectedMovie(null);
                    setSelectedShowtimeDate('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Date Tabs */}
            <div className="border-b border-gray-200 bg-white">
              <div className="flex overflow-x-auto scrollbar-hide px-6">
                {getShowtimeDates(selectedMovie.id).map((date) => {
                  const dateObj = new Date(date);
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                  const dayNum = dateObj.getDate();
                  const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });

                  return (
                    <button
                      key={date}
                      onClick={() => setSelectedShowtimeDate(date)}
                      className={`flex-shrink-0 px-6 py-4 border-b-2 transition-all ${
                        selectedShowtimeDate === date
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <p className="text-xs font-medium uppercase">{dayName}</p>
                        <p className="text-2xl font-bold mt-1">{dayNum}</p>
                        <p className="text-xs mt-1">{monthName}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Content - Showtimes for Selected Date */}
            <div className="flex-1 overflow-y-auto p-6">
              {selectedShowtimeDate && (
                <div>
                  <p className="text-sm text-gray-500 mb-4">
                    {getShowtimesByDate(selectedMovie.id, selectedShowtimeDate).length} showtime
                    {getShowtimesByDate(selectedMovie.id, selectedShowtimeDate).length !== 1
                      ? 's'
                      : ''}{' '}
                    scheduled
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {getShowtimesByDate(selectedMovie.id, selectedShowtimeDate).map((showtime) => {
                      const occupancyPct = Math.round(
                        (showtime.bookedSeats / showtime.totalSeats) * 100,
                      );
                      return (
                        <div
                          key={showtime.id}
                          className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50/30 transition-all"
                        >
                          {/* Top row: time, hall, status, actions */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-xl font-bold text-gray-900">
                                {showtime.time}
                              </span>
                              <span className="text-gray-300">·</span>
                              <span className="flex items-center gap-1.5 text-sm text-gray-600">
                                <MapPin size={14} />
                                {showtime.hallName}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  showtime.status === 'published'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-orange-100 text-orange-700'
                                }`}
                              >
                                {showtime.status === 'published' ? 'Published' : 'Draft'}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setSelectedShowtime(showtime);
                                  setShowViewShowtimesModal(false);
                                  setShowEditShowtimeModal(true);
                                }}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                                title="Edit showtime"
                              >
                                <Edit size={15} />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedShowtime(showtime);
                                  setShowViewShowtimesModal(false);
                                  setShowDeleteShowtimeConfirm(true);
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-md transition-colors"
                                title="Delete showtime"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>

                          {/* Occupancy bar */}
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                                style={{ width: `${occupancyPct}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500 whitespace-nowrap w-24 text-right">
                              {showtime.bookedSeats}/{showtime.totalSeats} ({occupancyPct}%)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {getShowtimesByDate(selectedMovie.id, selectedShowtimeDate).length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock size={32} className="text-gray-400" />
                      </div>
                      <p className="text-gray-600 mb-2">No showtimes scheduled for this date</p>
                      <p className="text-sm text-gray-500">Add a new showtime to get started</p>
                    </div>
                  )}
                </div>
              )}

              {!selectedShowtimeDate && getShowtimeDates(selectedMovie.id).length > 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar size={32} className="text-blue-600" />
                  </div>
                  <p className="text-gray-600 mb-2">Select a date to view showtimes</p>
                  <p className="text-sm text-gray-500">
                    Click on a date tab above to see scheduled showtimes
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              {(() => {
                const dayDrafts = selectedShowtimeDate
                  ? getShowtimesByDate(selectedMovie.id, selectedShowtimeDate).filter(
                      (st: any) => st.status === 'draft',
                    )
                  : [];
                const allDrafts = getMovieShowtimes(selectedMovie.id).filter(
                  (st: any) => st.status === 'draft',
                );
                const hasDayDrafts = dayDrafts.length > 0;
                const hasOtherDrafts = allDrafts.length > dayDrafts.length;

                return (
                  <div
                    className={`flex items-center ${hasDayDrafts || hasOtherDrafts ? 'justify-between' : 'justify-end'}`}
                  >
                    {(hasDayDrafts || hasOtherDrafts) && (
                      <button
                        onClick={() => {
                          setShowViewShowtimesModal(false);
                          setShowCreateShowtimeModal(true);
                        }}
                        className="px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2 text-blue-600 hover:bg-blue-50 border border-blue-200"
                      >
                        <Plus size={18} />
                        <span>Add Showtime</span>
                      </button>
                    )}

                    {hasDayDrafts || hasOtherDrafts ? (
                      <div className="flex items-center gap-3">
                        {hasOtherDrafts && (
                          <button
                            onClick={() => {
                              setShowtimes(
                                showtimes.map((st: any) =>
                                  st.movieId === selectedMovie.id && st.status === 'draft'
                                    ? { ...st, status: 'published' as const }
                                    : st,
                                ),
                              );
                            }}
                            className={`flex items-center gap-2 ${
                              hasDayDrafts
                                ? 'text-sm text-green-600 hover:text-green-700 font-medium'
                                : 'px-5 py-2.5 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors shadow-md'
                            }`}
                          >
                            {!hasDayDrafts && <Eye size={18} />}
                            <span>Publish all ({allDrafts.length})</span>
                          </button>
                        )}
                        {hasDayDrafts && (
                          <button
                            onClick={() => {
                              setShowtimes(
                                showtimes.map((st: any) =>
                                  st.movieId === selectedMovie.id &&
                                  st.date === selectedShowtimeDate &&
                                  st.status === 'draft'
                                    ? { ...st, status: 'published' as const }
                                    : st,
                                ),
                              );
                            }}
                            className="px-5 py-2.5 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors shadow-md flex items-center gap-2"
                          >
                            <Eye size={18} />
                            <span>
                              Publish {dayDrafts.length} Draft
                              {dayDrafts.length !== 1 ? 's' : ''}
                            </span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setShowViewShowtimesModal(false);
                          setShowCreateShowtimeModal(true);
                        }}
                        className="px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors shadow-md flex items-center gap-2"
                      >
                        <Plus size={18} />
                        <span>Add Showtime</span>
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Delete All Showtimes Confirmation Modal */}
      {showDeleteAllShowtimesConfirm && selectedMovie && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={24} className="text-red-600" />
              </div>

              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Delete All Showtimes
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete <strong>all showtimes</strong> for{' '}
                <strong>{selectedMovie.title}</strong>? This action cannot be undone.
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-800">
                    <p className="font-semibold mb-1">Critical Warning:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>
                        {getMovieShowtimes(selectedMovie.id).length} showtimes will be deleted
                      </li>
                      <li>All customer reservations will be cancelled</li>
                      <li>Revenue tracking will be affected</li>
                      <li>Mass refund processing may be required</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowDeleteAllShowtimesConfirm(false);
                    setSelectedMovie(null);
                  }}
                  className="flex-1 px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAllShowtimes}
                  className="flex-1 px-6 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors shadow-md"
                >
                  Delete All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule a Movie Modal */}
      {showScheduleMovieModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Schedule a Movie</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {scheduleSelectedMovie
                      ? 'Fill in the showtime details below'
                      : 'Search for a movie to schedule'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowScheduleMovieModal(false);
                    setScheduleSelectedMovie(null);
                    setSearchQuery('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {!scheduleSelectedMovie ? (
                /* Search Phase */
                <div>
                  <div className="relative mb-4">
                    <Search
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type="text"
                      placeholder="Search by title, genre, or year..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                      className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>

                  {searchQuery ? (
                    filteredMovies.length > 0 ? (
                      <div>
                        <p className="text-sm text-gray-500 mb-3">
                          {filteredMovies.length} result{filteredMovies.length !== 1 ? 's' : ''}{' '}
                          found
                        </p>
                        <div className="space-y-2">
                          {filteredMovies.map((movie: any) => (
                            <div
                              key={movie.id}
                              onClick={() => {
                                setScheduleSelectedMovie(movie);
                                setSearchQuery('');
                              }}
                              className="flex items-center gap-4 p-3 rounded-xl hover:bg-blue-50 cursor-pointer transition-colors border border-gray-200 hover:border-blue-300"
                            >
                              <ImageWithFallback
                                src={movie.poster}
                                alt={movie.title}
                                className="w-12 h-18 object-cover rounded-lg flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 truncate">
                                  {movie.title}
                                </h4>
                                <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                                  <span>{movie.genre}</span>
                                  <span>·</span>
                                  <span>{movie.releaseYear}</span>
                                  <span>·</span>
                                  <span>{movie.duration}</span>
                                </div>
                              </div>
                              <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Search size={24} className="text-gray-400" />
                        </div>
                        <p className="text-gray-600 font-medium">No movies found</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Try a different title, genre, or year
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Film size={24} className="text-blue-600" />
                      </div>
                      <p className="text-gray-600 font-medium">Search for a movie</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Type a movie title to find it in the catalog
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Form Phase — Movie selected */
                <div className="space-y-6">
                  {/* Selected Movie Card */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <ImageWithFallback
                      src={scheduleSelectedMovie.poster}
                      alt={scheduleSelectedMovie.title}
                      className="w-16 h-24 object-cover rounded-lg shadow-sm flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-lg truncate">
                        {scheduleSelectedMovie.title}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <span>{scheduleSelectedMovie.genre}</span>
                        <span>·</span>
                        <span>{scheduleSelectedMovie.releaseYear}</span>
                        <span>·</span>
                        <span>{scheduleSelectedMovie.duration}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Directed by {scheduleSelectedMovie.director}
                      </p>
                    </div>
                    <button
                      onClick={() => setScheduleSelectedMovie(null)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium flex-shrink-0"
                    >
                      Change
                    </button>
                  </div>

                  {/* Showtime Form Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                      <input
                        type="date"
                        defaultValue="2026-04-16"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                      <input
                        type="time"
                        defaultValue="14:00"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hall</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Select a hall</option>
                      {halls
                        .filter((h: any) => h.status === 'Active')
                        .map((hall: any) => (
                          <option key={hall.id} value={hall.id}>
                            {hall.name} — {hall.capacity} seats
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Notes (Optional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Add any special notes about this showtime..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    ></textarea>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {scheduleSelectedMovie && (
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setShowScheduleMovieModal(false);
                      setScheduleSelectedMovie(null);
                      setSearchQuery('');
                    }}
                    className="flex-1 px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors border border-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowScheduleMovieModal(false);
                      setScheduleSelectedMovie(null);
                      setSearchQuery('');
                    }}
                    className="flex-1 px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors shadow-md"
                  >
                    Create Showtime
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Staff Add/Edit Modal */}
      {showStaffFormModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-violet-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md">
                    {staffEditMode ? (
                      <Edit size={20} className="text-white" />
                    ) : (
                      <UserPlus size={20} className="text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {staffEditMode ? `Edit ${selectedStaff?.fullName}` : 'Add Staff Member'}
                    </h3>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {staffEditMode
                        ? 'Update contact details, position, or shift'
                        : "We'll add this person to the active roster"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowStaffFormModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full name</label>
                <input
                  type="text"
                  value={staffForm.fullName}
                  onChange={(e) => setStaffForm((f) => ({ ...f, fullName: e.target.value }))}
                  placeholder="e.g., Yara El-Sayed"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <div className="relative">
                  <AtSign
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={staffForm.username}
                    onChange={(e) => setStaffForm((f) => ({ ...f, username: e.target.value }))}
                    placeholder="e.g., yara.elsayed"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                    <input
                      type="email"
                      value={staffForm.email}
                      onChange={(e) => setStaffForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="name@cinefy.eg"
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone number
                  </label>
                  <div className="relative">
                    <Phone
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                    <input
                      type="tel"
                      value={staffForm.phone}
                      onChange={(e) => setStaffForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="+20 100 000 0000"
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {(
                    [
                      'Manager',
                      'Cashier',
                      'Projectionist',
                      'Usher',
                      'Concessions',
                    ] as StaffPosition[]
                  ).map((pos) => {
                    const meta = POSITION_META[pos];
                    const active = staffForm.position === pos;
                    return (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setStaffForm((f) => ({ ...f, position: pos }))}
                        className={`px-2 py-2.5 rounded-lg border-2 text-xs font-semibold transition-all ${
                          active
                            ? `${meta.soft} ${meta.ink} border-current shadow-sm`
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {pos}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employment type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Full-time', 'Part-time'] as EmploymentType[]).map((t) => {
                    const active = staffForm.employmentType === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setStaffForm((f) => ({ ...f, employmentType: t }))}
                        className={`px-3 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all ${
                          active
                            ? 'bg-blue-50 text-blue-900 border-blue-500 shadow-sm'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Working days</label>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={staffForm.startDay}
                    onChange={(e) =>
                      setStaffForm((f) => ({
                        ...f,
                        startDay: e.target.value as Weekday,
                      }))
                    }
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {WEEKDAYS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={staffForm.endDay}
                    onChange={(e) =>
                      setStaffForm((f) => ({
                        ...f,
                        endDay: e.target.value as Weekday,
                      }))
                    }
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {WEEKDAYS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Working hours
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="time"
                    value={staffForm.startTime}
                    onChange={(e) => setStaffForm((f) => ({ ...f, startTime: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="time"
                    value={staffForm.endTime}
                    onChange={(e) => setStaffForm((f) => ({ ...f, endTime: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center gap-3">
              <button
                onClick={() => setShowStaffFormModal(false)}
                className="flex-1 px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors border border-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStaff}
                disabled={!staffForm.fullName.trim()}
                className="flex-1 px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <Check size={18} />
                {staffEditMode ? 'Save changes' : 'Add staff member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff View Info Modal */}
      {showStaffViewModal && selectedStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Hero */}
            <div
              className={`relative bg-gradient-to-br ${POSITION_META[selectedStaff.position].gradient} p-8 text-white`}
            >
              <button
                onClick={() => {
                  setShowStaffViewModal(false);
                  setSelectedStaff(null);
                }}
                className="absolute top-4 right-4 w-9 h-9 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors"
              >
                <X size={18} className="text-white" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/30 flex items-center justify-center text-2xl font-bold">
                  {getInitials(selectedStaff.fullName)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-2xl font-bold truncate">{selectedStaff.fullName}</h3>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-sm text-[11px] font-bold uppercase tracking-[0.1em]">
                      <Briefcase size={11} />
                      {selectedStaff.position}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Contact
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                      <AtSign size={16} className="text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Username</p>
                      <p className="text-sm font-medium text-gray-900 font-mono truncate">
                        {selectedStaff.username}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                      <Mail size={16} className="text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {selectedStaff.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                      <Phone size={16} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-sm font-medium text-gray-900">{selectedStaff.phone}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Employment
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1.5">
                      <Calendar size={12} /> Hired
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatStaffDate(selectedStaff.hiredAt)}
                    </p>
                  </div>
                  <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1.5">
                      <Briefcase size={12} /> Employment type
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedStaff.employmentType}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Working schedule
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                      <Calendar size={16} className="text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Working days</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedStaff.startDay === selectedStaff.endDay
                          ? (WEEKDAYS.find((d) => d.value === selectedStaff.startDay)?.label ??
                            selectedStaff.startDay)
                          : `${
                              WEEKDAYS.find((d) => d.value === selectedStaff.startDay)?.label ??
                              selectedStaff.startDay
                            } – ${
                              WEEKDAYS.find((d) => d.value === selectedStaff.endDay)?.label ??
                              selectedStaff.endDay
                            }`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                      <Clock size={16} className="text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Working hours</p>
                      <p className="text-sm font-medium text-gray-900 font-mono">
                        {selectedStaff.startTime} – {selectedStaff.endTime}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-gray-200 bg-gray-50 flex items-center gap-3">
              <button
                onClick={() => {
                  setShowStaffViewModal(false);
                  setSelectedStaff(null);
                }}
                className="flex-1 px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors border border-gray-300"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowStaffViewModal(false);
                  if (selectedStaff) openEditStaff(selectedStaff);
                }}
                className="flex-1 px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <Edit size={16} />
                Edit info
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Delete Confirmation */}
      {showStaffDeleteConfirm && selectedStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={24} className="text-red-600" />
              </div>

              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Remove staff member
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to remove <strong>{selectedStaff.fullName}</strong> from the
                roster? This action cannot be undone.
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-800">
                    <p className="font-semibold mb-1">This will:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Revoke their dashboard access</li>
                      <li>Clear future shift assignments</li>
                      <li>Archive their employment history</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowStaffDeleteConfirm(false)}
                  className="flex-1 px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteStaff}
                  className="flex-1 px-6 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors shadow-md"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
