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
} from 'lucide-react';
import { ImageWithFallback } from './components/figma/ImageWithFallback';

// ============================================================================
// Payment Section — Paymob integration management
// ============================================================================

type PaymentStatus = 'live' | 'draft' | 'disabled';

type PaymentMethod = {
  id: string;
  name: string;
  gateway: 'paymob';
  mode: 'live' | 'sandbox';
  status: PaymentStatus;
  cardBrands: string[];
  lastTested: string | null;
  testStatus: 'success' | 'failed' | null;
  createdAt: string;
  publishedAt: string | null;
  monthlyVolume: string;
  successRate: number;
  credentialsRotatedAt: string;
  lastChargeAt: string | null;
  currency: string;
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
    name: 'Paymob — Cards (Live)',
    gateway: 'paymob',
    mode: 'live',
    status: 'live',
    cardBrands: ['Visa', 'Mastercard', 'Meeza'],
    lastTested: '2026-04-29T10:14:00',
    testStatus: 'success',
    createdAt: '2026-02-12',
    publishedAt: '2026-02-14',
    monthlyVolume: 'EGP 142,380',
    successRate: 98.4,
    credentialsRotatedAt: '2026-04-19',
    lastChargeAt: '2026-05-01T07:42:00',
    currency: 'EGP',
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
    mode: 'live',
    status: 'draft',
    cardBrands: ['Vodafone Cash', 'Orange Money', 'Etisalat'],
    lastTested: '2026-04-30T18:42:00',
    testStatus: 'success',
    createdAt: '2026-04-28',
    publishedAt: null,
    monthlyVolume: '—',
    successRate: 0,
    credentialsRotatedAt: '2026-04-28',
    lastChargeAt: null,
    currency: 'EGP',
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
    mode: 'sandbox',
    status: 'disabled',
    cardBrands: ['ValU', 'Souhoola'],
    lastTested: '2026-03-08T09:00:00',
    testStatus: 'failed',
    createdAt: '2026-03-01',
    publishedAt: '2026-03-05',
    monthlyVolume: 'EGP 0',
    successRate: 64.2,
    credentialsRotatedAt: '2026-03-01',
    lastChargeAt: '2026-04-08T19:14:00',
    currency: 'EGP',
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
    mode: 'live',
    status: 'live',
    cardBrands: ['Visa', 'Mastercard'],
    lastTested: '2026-01-20T11:30:00',
    testStatus: 'success',
    createdAt: '2025-08-14',
    publishedAt: '2025-08-16',
    monthlyVolume: 'EGP 38,940',
    successRate: 91.7,
    credentialsRotatedAt: '2026-01-15',
    lastChargeAt: '2026-04-30T22:08:00',
    currency: 'EGP',
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
  if (status === 'live') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
        </span>
        Live
      </span>
    );
  }
  if (status === 'draft') {
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
      Disabled
    </span>
  );
}

function ModeBadge({ mode }: { mode: 'live' | 'sandbox' }) {
  return mode === 'live' ? (
    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-semibold uppercase tracking-wider border border-blue-200">
      Production
    </span>
  ) : (
    <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[11px] font-semibold uppercase tracking-wider border border-purple-200">
      Sandbox
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
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
  if (days === 0) return { days, label: 'today' };
  if (days === 1) return { days, label: 'yesterday' };
  if (days < 30) return { days, label: `${days} days ago` };
  if (days < 60) return { days, label: '1 month ago' };
  if (days < 365) return { days, label: `${Math.floor(days / 30)} months ago` };
  return { days, label: `${Math.floor(days / 365)}y ago` };
}

type RowTone = 'good' | 'warn' | 'bad' | 'neutral';

const TONE_DOT: Record<RowTone, string> = {
  good: 'bg-emerald-500',
  warn: 'bg-amber-500',
  bad: 'bg-red-500',
  neutral: '',
};

const TONE_VALUE: Record<RowTone, string> = {
  good: 'text-gray-900',
  warn: 'text-amber-900',
  bad: 'text-red-900',
  neutral: 'text-gray-900',
};

function HealthCell({
  value,
  label,
  tone,
  hint,
}: {
  value: string;
  label: string;
  tone: RowTone;
  hint?: string;
}) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        {tone !== 'neutral' && (
          <span
            className={`w-1.5 h-1.5 rounded-full ${TONE_DOT[tone]} flex-shrink-0`}
            aria-hidden
          />
        )}
        <p
          className={`text-[15px] font-semibold leading-tight tracking-tight ${TONE_VALUE[tone]} truncate`}
        >
          {value}
        </p>
      </div>
      <p className="text-[11.5px] text-gray-500 mt-1 truncate">
        {label}
        {hint && <span className="text-gray-400"> · {hint}</span>}
      </p>
    </div>
  );
}

function CredentialsHealth({ method }: { method: PaymentMethod }) {
  // Rotation
  const rotated = relativeDays(method.credentialsRotatedAt);
  const rotationTone: RowTone =
    rotated.days >= 90 ? 'bad' : rotated.days >= 30 ? 'warn' : 'good';
  const rotationHint =
    rotationTone === 'bad'
      ? 'rotate now'
      : rotationTone === 'warn'
        ? 'rotate soon'
        : undefined;

  // Last charge
  const charge = method.lastChargeAt ? relativeDays(method.lastChargeAt) : null;
  let chargeTone: RowTone = 'neutral';
  let chargeValue = 'No charges yet';
  let chargeHint: string | undefined;
  if (charge) {
    chargeValue = charge.label.charAt(0).toUpperCase() + charge.label.slice(1);
    if (charge.days <= 1) {
      chargeTone = 'good';
    } else if (charge.days <= 14) {
      chargeTone = 'neutral';
    } else if (method.status === 'live') {
      chargeTone = 'warn';
      chargeHint = 'going quiet';
    }
  } else if (method.status === 'live') {
    chargeTone = 'warn';
    chargeHint = 'never used';
  } else {
    chargeHint = 'awaiting publish';
  }

  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="flex items-stretch gap-5">
        <HealthCell
          value={rotated.label.charAt(0).toUpperCase() + rotated.label.slice(1)}
          label="Credentials rotated"
          hint={rotationHint}
          tone={rotationTone}
        />
        <span className="w-px bg-slate-200 self-stretch" aria-hidden />
        <HealthCell value={chargeValue} label="Last charge" hint={chargeHint} tone={chargeTone} />
      </div>
      <div className="mt-3 pt-3 border-t border-slate-200/80">
        <p className="text-[11.5px] text-gray-500">
          All amounts in <span className="font-semibold text-gray-700">{method.currency || '—'}</span>
        </p>
      </div>
    </div>
  );
}

function PaymentSection() {
  const [methods, setMethods] = useState<PaymentMethod[]>(SAMPLE_METHODS);
  const [showWizard, setShowWizard] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const liveCount = methods.filter((m) => m.status === 'live').length;
  const draftCount = methods.filter((m) => m.status === 'draft').length;
  const disabledCount = methods.filter((m) => m.status === 'disabled').length;

  const handlePublish = (id: string) => {
    setMethods((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, status: 'live' as PaymentStatus, publishedAt: new Date().toISOString() }
          : m,
      ),
    );
    setOpenMenu(null);
  };

  const handleDisable = (id: string) => {
    setMethods((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: 'disabled' as PaymentStatus } : m)),
    );
    setOpenMenu(null);
  };

  const handleEnable = (id: string) => {
    setMethods((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: 'live' as PaymentStatus } : m)),
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
              <span className="font-semibold text-emerald-600">Live</span> methods are visible at
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
              {liveCount} live
            </span>
            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/70 tabular-nums">
              {draftCount} draft
            </span>
            <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200 tabular-nums">
              {disabledCount} disabled
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {methods.map((m) => (
            <article
              key={m.id}
              className={`group relative bg-white rounded-2xl border p-5 transition-all hover:shadow-md ${
                m.status === 'draft'
                  ? 'border-amber-200/80 ring-1 ring-amber-100/60'
                  : m.status === 'disabled'
                    ? 'border-gray-200 opacity-90'
                    : 'border-gray-200 hover:border-blue-200'
              }`}
            >
              {/* Header row */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      m.status === 'disabled'
                        ? 'bg-gray-100'
                        : 'bg-gradient-to-br from-blue-600 to-indigo-700 shadow-sm'
                    }`}
                  >
                    <CreditCard
                      size={22}
                      className={m.status === 'disabled' ? 'text-gray-400' : 'text-white'}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-gray-900 truncate">{m.name}</h4>
                      <ModeBadge mode={m.mode} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Paymob · {m.cardBrands.join(' · ')}
                    </p>
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
                        {m.status === 'draft' && (
                          <button
                            onClick={() => handlePublish(m.id)}
                            className="w-full px-3 py-2 text-left text-sm text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
                          >
                            <Rocket size={15} />
                            Publish & make live
                          </button>
                        )}
                        {m.status === 'live' && (
                          <button
                            onClick={() => handleDisable(m.id)}
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <PowerOff size={15} />
                            Disable
                          </button>
                        )}
                        {m.status === 'disabled' && (
                          <button
                            onClick={() => handleEnable(m.id)}
                            className="w-full px-3 py-2 text-left text-sm text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
                          >
                            <Power size={15} />
                            Re-enable
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

              {/* Stat row */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">
                    Volume 30d
                  </p>
                  <p className="text-sm font-semibold text-gray-900">{m.monthlyVolume}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">
                    Success
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {m.successRate > 0 ? `${m.successRate}%` : '—'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">
                    Last test
                  </p>
                  <p className="text-sm font-semibold flex items-center gap-1">
                    {m.testStatus === 'success' && (
                      <>
                        <CircleCheck size={14} className="text-emerald-500" />
                        <span className="text-emerald-700">Passed</span>
                      </>
                    )}
                    {m.testStatus === 'failed' && (
                      <>
                        <CircleAlert size={14} className="text-red-500" />
                        <span className="text-red-700">Failed</span>
                      </>
                    )}
                    {!m.testStatus && <span className="text-gray-500">Never</span>}
                  </p>
                </div>
              </div>

              {/* Credentials health */}
              <CredentialsHealth method={m} />

              {/* Footer actions */}
              <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                <span>
                  {m.publishedAt
                    ? `Published ${new Date(m.publishedAt).toLocaleDateString()}`
                    : `Created ${new Date(m.createdAt).toLocaleDateString()}`}
                </span>
                {m.status === 'draft' && (
                  <button
                    onClick={() => handlePublish(m.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Rocket size={13} />
                    Publish
                  </button>
                )}
              </div>
            </article>
          ))}
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
    editing?.testStatus === 'success' || editing?.testStatus === 'failed'
      ? editing.testStatus
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

    if (isEdit && editing) {
      onSave({
        ...editing,
        name: name || editing.name,
        mode,
        lastTested: testState === 'success' ? now : editing.lastTested,
        testStatus:
          testState === 'success' ? 'success' : testState === 'failed' ? 'failed' : editing.testStatus,
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
      mode,
      status: 'draft',
      cardBrands: ['Visa', 'Mastercard'],
      lastTested: testState === 'success' ? now : null,
      testStatus: testState === 'success' ? 'success' : testState === 'failed' ? 'failed' : null,
      createdAt: now,
      publishedAt: null,
      monthlyVolume: '—',
      successRate: 0,
      credentialsRotatedAt: now,
      lastChargeAt: null,
      currency: 'EGP',
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
    if (step === 3)
      return isEdit
        ? true
        : integrationId.length > 0 && iframeId.length > 0;
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
            {step === 1 && <StepIdentity name={name} setName={setName} mode={mode} setMode={setMode} />}
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
            A short name like "Paymob Cards" or "Wallets — Sandbox" so you can tell methods apart
            on the list.
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
          <KeyRound
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
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
            paste it into chat, email, or screenshots. Cinefy stores it encrypted and never shows
            it back to you in plain text.
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
              <Webhook size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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
              <Layout size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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
            Review your changes. The method's current status (live, draft, or disabled) won't
            change — use the methods list to publish or disable it.
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
          <ModeBadge mode={mode} />
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

            <div className="pt-4 mt-4 border-t border-gray-200">
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-all">
                <Settings size={20} />
                <span className="flex-1 text-left font-medium">Settings</span>
              </button>
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-sm">
              <span className="text-white text-sm font-semibold">AU</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">Admin User</p>
              <p className="text-xs text-gray-500 truncate">admin@cinema.com</p>
            </div>
            <button className="text-gray-400 hover:text-gray-600 flex-shrink-0">
              <MoreVertical size={18} />
            </button>
          </div>
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
    </div>
  );
}
