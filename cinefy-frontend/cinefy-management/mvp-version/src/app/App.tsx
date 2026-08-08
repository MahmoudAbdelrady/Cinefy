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
  KeyRound,
  Webhook,
  Check,
  ChevronLeft,
  Eye as EyeIcon,
  EyeOff,
  ExternalLink,
  Info,
  Lock,
  PowerOff,
  Power,
  CircleCheck,
  UserPlus,
  Mail,
  Phone,
  Briefcase,
  AtSign,
  CalendarClock,
  ContactRound,
  User,
  Save,
  Megaphone,
} from 'lucide-react';
import { ImageWithFallback } from './components/figma/ImageWithFallback';

// ============================================================================
// Payment Section — payment gateway routing
// ============================================================================

type GatewayProvider = 'paymob';

type ChannelCurrency = 'EGP' | 'USD';

type PaymentChannel = {
  id: string;
  name: string;
  currency: ChannelCurrency;
  isActive: boolean;
  integrationId: string;
};

type PaymobCredentials = {
  secretKey: string;
  publicKey: string;
  hmacKey: string;
};

type PaymentGateway = {
  id: string;
  name: string;
  provider: GatewayProvider;
  isActive: boolean;
  credentials: PaymobCredentials;
  channels: PaymentChannel[];
  createdAt: string;
};

/**
 * The provider registry. Everything that varies per provider lives here, so
 * adding a second gateway provider is a matter of adding an entry — the modal
 * reads its credential fields and its channel support from this map rather
 * than hard-coding Paymob's shape.
 */
/**
 * `secret: true` fields are write-only — the API never returns them, so the
 * edit form starts them blank and treats an empty value as "keep the stored
 * one" rather than "clear it".
 */
type CredentialField = {
  key: keyof PaymobCredentials;
  label: string;
  secret: boolean;
  placeholder: string;
  hint: string;
};

const storedSecretHint = (label: string) =>
  `${label} is already stored. Leave blank to keep it or enter a new value only to rotate it.`;

type ProviderSpec = {
  id: GatewayProvider;
  label: string;
  available: boolean;
  credentialFields: CredentialField[];
  supportsChannels: boolean;
  channelHelp: string;
  docsUrl: string;
};

const PROVIDERS: ProviderSpec[] = [
  {
    id: 'paymob',
    label: 'Paymob',
    available: true,
    supportsChannels: true,
    channelHelp: 'Where to find: Settings → Developers → Payment Integrations',
    docsUrl: 'https://developers.paymob.com/egypt/getting-started-egypt',
    credentialFields: [
      {
        key: 'secretKey',
        label: 'Secret key',
        secret: true,
        placeholder: 'egy_sk_live_…',
        hint: 'Where to find: Settings → Developers → API Keys',
      },
      {
        key: 'publicKey',
        label: 'Public key',
        secret: false,
        placeholder: 'egy_pk_live_…',
        hint: 'Where to find: Settings → Developers → API Keys',
      },
      {
        key: 'hmacKey',
        label: 'HMAC key',
        secret: true,
        placeholder: 'b4a91c84e6f7d3a1…',
        hint: 'Where to find: Settings → Developers → API Keys',
      },
    ],
  },
];

const PROVIDER_BY_ID: Record<GatewayProvider, ProviderSpec> = PROVIDERS.reduce(
  (acc, p) => ({ ...acc, [p.id]: p }),
  {} as Record<GatewayProvider, ProviderSpec>,
);

const CURRENCIES: ChannelCurrency[] = ['EGP', 'USD'];

const SAMPLE_GATEWAYS: PaymentGateway[] = [
  {
    id: 'gw_01',
    name: 'Paymob — Production',
    provider: 'paymob',
    isActive: true,
    createdAt: '2026-02-12',
    credentials: {
      secretKey: 'egy_sk_live_9f2c4b71ad83e6',
      publicKey: 'egy_pk_live_4471bc02de99',
      hmacKey: 'b4a91c84e6f7d3a1c02e',
    },
    channels: [
      { id: 'ch_01', name: 'Cards', currency: 'EGP', isActive: true, integrationId: '4827193' },
      {
        id: 'ch_02',
        name: 'Mobile wallets',
        currency: 'EGP',
        isActive: true,
        integrationId: '4827511',
      },
      {
        id: 'ch_03',
        name: 'Cards — USD',
        currency: 'USD',
        isActive: false,
        integrationId: '4830042',
      },
    ],
  },
  {
    id: 'gw_02',
    name: 'Paymob — Sandbox',
    provider: 'paymob',
    isActive: false,
    createdAt: '2026-04-28',
    credentials: {
      secretKey: 'egy_sk_test_1a55c9038be7',
      publicKey: 'egy_pk_test_77d1e4ba2205',
      hmacKey: 'a1f7be2290c4d8e35b16',
    },
    channels: [
      { id: 'ch_04', name: 'Cards', currency: 'EGP', isActive: true, integrationId: '4710228' },
      {
        id: 'ch_05',
        name: 'Installments',
        currency: 'EGP',
        isActive: false,
        integrationId: '4710901',
      },
    ],
  },
  {
    id: 'gw_03',
    name: 'Paymob — Legacy account',
    provider: 'paymob',
    isActive: false,
    createdAt: '2025-08-14',
    credentials: {
      secretKey: 'egy_sk_live_00b3e71fa4cd',
      publicKey: 'egy_pk_live_2be5701cc4fa',
      hmacKey: 'c93a04e7b1d825f6a047',
    },
    channels: [
      { id: 'ch_06', name: 'Cards', currency: 'EGP', isActive: false, integrationId: '4392107' },
    ],
  },
];

const newId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const emptyCredentials = (): PaymobCredentials => ({ secretKey: '', publicKey: '', hmacKey: '' });

function StatusPill({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11.5px] font-semibold whitespace-nowrap">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
      Receiving payments
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-500 text-[11.5px] font-semibold whitespace-nowrap">
      <span className="h-1.5 w-1.5 rounded-full bg-gray-400" aria-hidden />
      Standby
    </span>
  );
}

function GatewaySwitch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 ${
        checked ? 'bg-emerald-600' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-[18px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

function RowAction({
  icon: Icon,
  label,
  onClick,
  tone = 'neutral',
}: {
  icon: typeof Eye;
  label: string;
  onClick: () => void;
  tone?: 'neutral' | 'danger';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${
        tone === 'danger'
          ? 'border-gray-200 text-gray-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600'
          : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <Icon size={15} />
    </button>
  );
}

/** The shared body of every routing warning, so the wording never drifts. */
function RoutingNotice({ compact }: { compact?: boolean }) {
  return (
    <div
      className={`rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2.5 ${
        compact ? 'p-3' : 'p-3.5'
      }`}
    >
      <Info size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
      <p className="text-[12.5px] leading-relaxed text-amber-900">
        Payments already in progress finish on their current gateway. Only new payments follow this
        change.
      </p>
    </div>
  );
}

function GatewayRow({
  gateway,
  onViewChannels,
  onEdit,
  onDelete,
  onToggle,
}: {
  gateway: PaymentGateway;
  onViewChannels: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const spec = PROVIDER_BY_ID[gateway.provider];
  const active = gateway.isActive;

  return (
    <tr className={active ? 'bg-emerald-50/40' : 'hover:bg-gray-50 transition-colors'}>
      <td className="relative py-5 pl-6 pr-4">
        {active && <span className="absolute inset-y-0 left-0 w-1 bg-emerald-500" aria-hidden />}
        <div className="flex items-center gap-4 min-w-0">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              active
                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            <CreditCard size={24} />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 truncate">{gateway.name}</h4>
        </div>
      </td>
      <td className="py-5 px-4 text-sm text-gray-600">{spec.label}</td>
      <td className="py-5 px-4 text-sm text-gray-600 tabular-nums whitespace-nowrap">
        {formatShortDate(gateway.createdAt)}
      </td>
      <td className="py-5 px-4 text-sm text-gray-600 tabular-nums">
        <span className="font-semibold text-gray-900">{gateway.channels.length}</span>
      </td>
      <td className="py-5 px-4">
        <StatusPill active={active} />
      </td>
      <td className="py-5 pl-4 pr-6">
        <div className="flex items-center justify-end gap-2">
          <GatewaySwitch
            checked={active}
            onChange={onToggle}
            label={`${active ? 'Deactivate' : 'Activate'} ${gateway.name}`}
          />
          <span className="w-2" />
          {spec.supportsChannels && (
            <button
              onClick={onViewChannels}
              title="View channels"
              className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 border border-gray-300 whitespace-nowrap"
            >
              <Eye size={16} />
              <span>Channels</span>
            </button>
          )}
          <button
            onClick={onEdit}
            title="Edit gateway"
            className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2 border border-blue-200"
          >
            <Edit size={16} />
            <span>Edit</span>
          </button>
          <button
            onClick={onDelete}
            title="Delete gateway"
            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 border border-red-200"
          >
            <Trash2 size={16} />
            <span>Delete</span>
          </button>
        </div>
      </td>
    </tr>
  );
}

function PaymentSection() {
  const [gateways, setGateways] = useState<PaymentGateway[]>(SAMPLE_GATEWAYS);
  const [editingGateway, setEditingGateway] = useState<PaymentGateway | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [channelsFor, setChannelsFor] = useState<PaymentGateway | null>(null);
  const [pendingToggle, setPendingToggle] = useState<PaymentGateway | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PaymentGateway | null>(null);

  const activeGateway = gateways.find((g) => g.isActive) ?? null;
  const standby = gateways.filter((g) => !g.isActive);
  const ordered = activeGateway ? [activeGateway, ...standby] : standby;
  const liveChannels = activeGateway ? activeGateway.channels.filter((c) => c.isActive).length : 0;

  const openCreate = () => {
    setEditingGateway(null);
    setShowForm(true);
  };

  const openEdit = (g: PaymentGateway) => {
    setEditingGateway(g);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingGateway(null);
  };

  const editFromChannels = () => {
    if (!channelsFor) return;
    const g = channelsFor;
    setChannelsFor(null);
    openEdit(g);
  };

  const saveGateway = (g: PaymentGateway) => {
    setGateways((prev) => {
      const exists = prev.some((p) => p.id === g.id);
      const next = exists ? prev.map((p) => (p.id === g.id ? g : p)) : [...prev, g];
      // One gateway receives new payments at a time.
      return g.isActive ? next.map((p) => (p.id === g.id ? p : { ...p, isActive: false })) : next;
    });
    closeForm();
  };

  const confirmToggle = () => {
    if (!pendingToggle) return;
    const target = pendingToggle;
    setGateways((prev) =>
      prev.map((g) =>
        g.id === target.id
          ? { ...g, isActive: !target.isActive }
          : target.isActive
            ? g
            : { ...g, isActive: false },
      ),
    );
    setPendingToggle(null);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    setGateways((prev) => prev.filter((g) => g.id !== pendingDelete.id));
    setPendingDelete(null);
  };

  return (
    <>
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Payment gateways</h2>
            <p className="text-sm text-gray-600 mt-1">
              One gateway takes every new payment. The rest wait on standby.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus size={18} />
            <span>Add payment gateway</span>
          </button>
        </div>
      </div>

      <div className="p-8">
        {gateways.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <CreditCard size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-900 font-medium">No payment gateways yet</p>
            <p className="text-sm text-gray-500 mt-1 mb-5">
              Add a gateway to start taking online payments.
            </p>
            <button
              onClick={openCreate}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors inline-flex items-center gap-2 shadow-sm"
            >
              <Plus size={18} />
              <span>Add payment gateway</span>
            </button>
          </div>
        ) : (
          <>
            {!activeGateway && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-6 py-5 flex items-start gap-3 mb-6">
                <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900 text-[15px]">
                    No gateway is receiving payments
                  </p>
                  <p className="text-sm text-amber-800/90 mt-0.5">
                    Customers can't pay online right now. Turn a standby gateway on to restore
                    checkout.
                  </p>
                </div>
              </div>
            )}

            {activeGateway && liveChannels === 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-6 py-4 flex items-start gap-3 mb-6">
                <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900">
                  <span className="font-semibold">{activeGateway.name}</span> is receiving payments
                  but{' '}
                  {activeGateway.channels.length === 0
                    ? "has no channels configured — it can't charge anything."
                    : "every channel is off — it can't charge anything."}
                </p>
              </div>
            )}

            {/* Gateways List */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">All Payment Gateways</h3>
                <p className="text-sm text-gray-600 mt-1">
                  One gateway receives new payments — the rest stay on standby
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] text-left">
                  <thead>
                    <tr className="border-b border-gray-200 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                      <th className="py-3 pl-6 pr-4">Gateway Name</th>
                      <th className="py-3 px-4">Provider</th>
                      <th className="py-3 px-4">Added</th>
                      <th className="py-3 px-4">Channels</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 pl-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {ordered.map((g) => (
                      <GatewayRow
                        key={g.id}
                        gateway={g}
                        onViewChannels={() => setChannelsFor(g)}
                        onEdit={() => openEdit(g)}
                        onDelete={() => setPendingDelete(g)}
                        onToggle={() => setPendingToggle(g)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {showForm && (
        <GatewayFormModal
          editing={editingGateway}
          activeGateway={activeGateway}
          onClose={closeForm}
          onSave={saveGateway}
        />
      )}

      {channelsFor && (
        <ChannelsModal
          gateway={channelsFor}
          onClose={() => setChannelsFor(null)}
          onEdit={editFromChannels}
        />
      )}

      {pendingToggle && (
        <ToggleGatewayDialog
          gateway={pendingToggle}
          currentActive={activeGateway}
          onCancel={() => setPendingToggle(null)}
          onConfirm={confirmToggle}
        />
      )}

      {pendingDelete && (
        <DeleteGatewayDialog
          gateway={pendingDelete}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </>
  );
}

// ============================================================================
// Gateway form — create / edit
// ============================================================================

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[13px] font-semibold text-gray-900 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function SecretInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-3 pr-11 py-2.5 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        aria-label={visible ? 'Hide value' : 'Show value'}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors"
      >
        {visible ? <EyeOff size={15} /> : <EyeIcon size={15} />}
      </button>
    </div>
  );
}

function GatewayFormModal({
  editing,
  activeGateway,
  onClose,
  onSave,
}: {
  editing: PaymentGateway | null;
  activeGateway: PaymentGateway | null;
  onClose: () => void;
  onSave: (g: PaymentGateway) => void;
}) {
  const isEdit = !!editing;
  const [name, setName] = useState(editing?.name ?? '');
  const [provider, setProvider] = useState<GatewayProvider>(editing?.provider ?? 'paymob');
  const [isActive, setIsActive] = useState(editing?.isActive ?? false);
  // Write-only fields are never returned by the API, so they start blank even
  // when editing — a blank one on save means "keep whatever is stored".
  const [credentials, setCredentials] = useState<PaymobCredentials>(
    editing ? { ...editing.credentials, secretKey: '', hmacKey: '' } : emptyCredentials(),
  );
  const [channels, setChannels] = useState<PaymentChannel[]>(editing ? [...editing.channels] : []);

  const spec = PROVIDER_BY_ID[provider];
  const wasActive = editing?.isActive ?? false;
  // Same wording as the standalone toggle dialog: the switch here reroutes too.
  const reroutes = isActive !== wasActive;
  const displacedGateway =
    isActive && !wasActive && activeGateway && activeGateway.id !== editing?.id
      ? activeGateway
      : null;

  const missingCredential = spec.credentialFields.some(
    (f) => !(isEdit && f.secret) && !credentials[f.key].trim(),
  );
  const canSave = name.trim().length > 0 && !missingCredential;

  const submit = () => {
    if (!canSave) return;
    const merged = { ...credentials };
    if (editing) {
      for (const f of spec.credentialFields) {
        if (f.secret && !merged[f.key].trim()) merged[f.key] = editing.credentials[f.key];
      }
    }
    onSave({
      id: editing?.id ?? newId('gw'),
      name: name.trim(),
      provider,
      isActive,
      credentials: merged,
      channels: spec.supportsChannels ? channels : [],
      createdAt: editing?.createdAt ?? new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isEdit ? 'Edit payment gateway' : 'Add payment gateway'}
            </h3>
            <p className="text-[13px] text-gray-600 mt-0.5">
              {isEdit
                ? 'Changes apply to the next payment that runs through this gateway.'
                : 'Connect a provider account so customers can pay online.'}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Identity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Name</FieldLabel>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Paymob — Production"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1.5">For display only</p>
            </div>
            <div>
              <FieldLabel required>Provider</FieldLabel>
              <div className="relative">
                <select
                  value={provider}
                  disabled
                  onChange={(e) => setProvider(e.target.value as GatewayProvider)}
                  className="w-full appearance-none px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-700 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <Lock
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>
          </div>

          {/* Active */}
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-gray-900">Active</p>
                <p className="text-[12.5px] text-gray-600 mt-0.5">
                  {isActive
                    ? 'New payments will route to this gateway.'
                    : 'This gateway stays configured but takes no payments.'}
                </p>
              </div>
              <GatewaySwitch checked={isActive} onChange={setIsActive} label="Active" />
            </div>

            {reroutes && (
              <div className="mt-3.5 space-y-2.5">
                <RoutingNotice compact />
                {displacedGateway && (
                  <p className="text-[12.5px] text-gray-600 pl-0.5">
                    <span className="font-semibold text-gray-900">{displacedGateway.name}</span>{' '}
                    will stop receiving new payments when you save.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Credentials — driven by the provider spec */}
          <section>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <KeyRound size={15} className="text-gray-400" />
                <h4 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-gray-500">
                  Credentials
                </h4>
              </div>
              <a
                href={spec.docsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[12.5px] text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
              >
                {spec.label} docs
                <ExternalLink size={12} />
              </a>
            </div>

            <div className="space-y-4">
              {spec.credentialFields.map((field) => {
                const storedSecret = isEdit && field.secret;
                return (
                  <div key={field.key}>
                    <FieldLabel required={!storedSecret}>{field.label}</FieldLabel>
                    {field.secret ? (
                      <SecretInput
                        value={credentials[field.key]}
                        onChange={(v) => setCredentials((c) => ({ ...c, [field.key]: v }))}
                        placeholder={storedSecret ? 'Leave blank to keep' : field.placeholder}
                      />
                    ) : (
                      <input
                        type="text"
                        value={credentials[field.key]}
                        onChange={(e) =>
                          setCredentials((c) => ({ ...c, [field.key]: e.target.value }))
                        }
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                    <p className="text-xs text-gray-500 mt-1.5">
                      {storedSecret ? storedSecretHint(field.label) : field.hint}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Payment channels — only when the provider has them */}
          {spec.supportsChannels && (
            <section>
              <div className="flex items-center gap-2 mb-1.5">
                <Webhook size={15} className="text-gray-400" />
                <h4 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-gray-500">
                  Payment channels
                </h4>
              </div>
              <p className="text-[12.5px] text-gray-600 mb-3">{spec.channelHelp}</p>
              <ChannelEditor channels={channels} onChange={setChannels} />
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            <Lock size={13} />
            Keys are encrypted at rest.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg border border-gray-300 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={!canSave}
              className="px-5 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors text-sm font-semibold shadow-sm"
            >
              {isEdit ? 'Save changes' : 'Add gateway'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Channel editor — add / edit / toggle / remove rows (inside the gateway form)
// ============================================================================

type ChannelDraft = {
  name: string;
  currency: ChannelCurrency;
  isActive: boolean;
  integrationId: string;
};

const emptyDraft = (): ChannelDraft => ({
  name: '',
  currency: 'EGP',
  isActive: true,
  integrationId: '',
});

function ChannelEditor({
  channels,
  onChange,
}: {
  channels: PaymentChannel[];
  onChange: (next: PaymentChannel[]) => void;
}) {
  // `null` = closed, `'new'` = adding, otherwise the id being edited.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ChannelDraft>(emptyDraft());

  const startAdd = () => {
    setDraft(emptyDraft());
    setEditingId('new');
  };

  const startEdit = (c: PaymentChannel) => {
    setDraft({
      name: c.name,
      currency: c.currency,
      isActive: c.isActive,
      integrationId: c.integrationId,
    });
    setEditingId(c.id);
  };

  const cancel = () => setEditingId(null);

  const canSaveDraft = draft.name.trim().length > 0 && draft.integrationId.trim().length > 0;

  const commit = () => {
    if (!canSaveDraft) return;
    const value = {
      name: draft.name.trim(),
      currency: draft.currency,
      isActive: draft.isActive,
      integrationId: draft.integrationId.trim(),
    };
    if (editingId === 'new') {
      onChange([...channels, { id: newId('ch'), ...value }]);
    } else {
      onChange(channels.map((c) => (c.id === editingId ? { ...c, ...value } : c)));
    }
    setEditingId(null);
  };

  const toggle = (id: string) =>
    onChange(channels.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c)));

  const remove = (id: string) => {
    onChange(channels.filter((c) => c.id !== id));
    if (editingId === id) setEditingId(null);
  };

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      {channels.length === 0 && editingId !== 'new' && (
        <p className="px-4 py-6 text-center text-[13px] text-gray-500">
          No channels yet. Add one so this gateway has a way to charge.
        </p>
      )}

      {channels.length > 0 && (
        <ul className="divide-y divide-gray-100">
          {channels.map((c) =>
            editingId === c.id ? (
              <li key={c.id} className="bg-blue-50/40">
                <ChannelForm
                  draft={draft}
                  setDraft={setDraft}
                  canSave={canSaveDraft}
                  saveLabel="Save channel"
                  onCancel={cancel}
                  onSave={commit}
                />
              </li>
            ) : (
              <li key={c.id} className="px-4 py-3 flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-[13.5px] font-medium truncate ${
                      c.isActive ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {c.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                    <span className="font-semibold text-gray-700 tabular-nums">{c.currency}</span>
                    <span className="text-gray-300">·</span>
                    <span className="font-mono tabular-nums">{c.integrationId}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <RowAction icon={Edit} label="Edit channel" onClick={() => startEdit(c)} />
                  <RowAction
                    icon={Trash2}
                    label="Remove channel"
                    tone="danger"
                    onClick={() => remove(c.id)}
                  />
                  <span className="w-px h-5 bg-gray-200 mx-1" aria-hidden />
                  <GatewaySwitch
                    checked={c.isActive}
                    onChange={() => toggle(c.id)}
                    label={`${c.isActive ? 'Deactivate' : 'Activate'} ${c.name}`}
                  />
                </div>
              </li>
            ),
          )}
        </ul>
      )}

      {editingId === 'new' && (
        <div className="bg-blue-50/40 border-t border-gray-100">
          <ChannelForm
            draft={draft}
            setDraft={setDraft}
            canSave={canSaveDraft}
            saveLabel="Add channel"
            onCancel={cancel}
            onSave={commit}
          />
        </div>
      )}

      {editingId !== 'new' && (
        <div className="border-t border-gray-100 bg-gray-50/70 px-4 py-2.5">
          <button
            type="button"
            onClick={startAdd}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-blue-600 hover:text-blue-700"
          >
            <Plus size={15} />
            Add channel
          </button>
        </div>
      )}
    </div>
  );
}

function ChannelForm({
  draft,
  setDraft,
  canSave,
  saveLabel,
  onCancel,
  onSave,
}: {
  draft: ChannelDraft;
  setDraft: (next: ChannelDraft) => void;
  canSave: boolean;
  saveLabel: string;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="px-4 py-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <FieldLabel required>Name</FieldLabel>
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Cards"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <FieldLabel required>Currency</FieldLabel>
          <select
            value={draft.currency}
            onChange={(e) => setDraft({ ...draft, currency: e.target.value as ChannelCurrency })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel required>Integration ID</FieldLabel>
          <input
            type="number"
            inputMode="numeric"
            value={draft.integrationId}
            onChange={(e) => setDraft({ ...draft, integrationId: e.target.value })}
            placeholder="4827193"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-end">
          <div className="w-full flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
            <span className="text-[13px] font-semibold text-gray-900">Active</span>
            <GatewaySwitch
              checked={draft.isActive}
              onChange={(next) => setDraft({ ...draft, isActive: next })}
              label="Channel active"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-3.5 py-1.5 rounded-lg border border-gray-300 bg-white text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-[13px] font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {saveLabel}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Channels modal — read-only; changes go through the edit interface
// ============================================================================

function ChannelsModal({
  gateway,
  onClose,
  onEdit,
}: {
  gateway: PaymentGateway;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              Channels — {gateway.name}
            </h3>
            <p className="text-[13px] text-gray-600 mt-0.5">
              Read-only — edit the gateway to change its channels.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {gateway.channels.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-gray-500">
              No channels configured. Edit the gateway to add one.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10.5px] uppercase tracking-[0.12em] text-gray-400 border-b border-gray-200">
                  <th className="py-2.5 pr-4 font-bold">Channel</th>
                  <th className="py-2.5 pr-4 font-bold">Currency</th>
                  <th className="py-2.5 pr-4 font-bold">Integration ID</th>
                  <th className="py-2.5 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {gateway.channels.map((c) => (
                  <tr key={c.id}>
                    <td className="py-3 pr-4 font-medium text-gray-900">{c.name}</td>
                    <td className="py-3 pr-4 text-gray-600 tabular-nums">{c.currency}</td>
                    <td className="py-3 pr-4 font-mono text-[13px] text-gray-600 tabular-nums">
                      {c.integrationId}
                    </td>
                    <td className="py-3 text-right">
                      {c.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                          On
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 text-[11px] font-semibold">
                          <span className="h-1.5 w-1.5 rounded-full bg-gray-400" aria-hidden />
                          Off
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-4">
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-blue-600 hover:text-blue-700"
          >
            <Edit size={14} />
            Edit gateway
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg border border-gray-300 transition-colors text-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Confirmation dialogs
// ============================================================================

function ToggleGatewayDialog({
  gateway,
  currentActive,
  onCancel,
  onConfirm,
}: {
  gateway: PaymentGateway;
  currentActive: PaymentGateway | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const activating = !gateway.isActive;
  const displaced =
    activating && currentActive && currentActive.id !== gateway.id ? currentActive : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
              activating ? 'bg-emerald-100' : 'bg-amber-100'
            }`}
          >
            {activating ? (
              <Power size={22} className="text-emerald-600" />
            ) : (
              <PowerOff size={22} className="text-amber-600" />
            )}
          </div>

          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            {activating ? `Activate ${gateway.name}?` : `Deactivate ${gateway.name}?`}
          </h3>
          <p className="text-[13.5px] text-gray-600 text-center mb-5 leading-relaxed">
            {activating
              ? 'New payments will start routing to this gateway.'
              : 'This gateway will stop receiving new payments.'}
          </p>

          <div className="space-y-2.5 mb-6">
            <RoutingNotice />
            {displaced && (
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 flex items-start gap-2.5">
                <Info size={15} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-[12.5px] leading-relaxed text-gray-600">
                  <span className="font-semibold text-gray-900">{displaced.name}</span> is active
                  now. Activating this one deactivates it.
                </p>
              </div>
            )}
            {!activating && (
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 flex items-start gap-2.5">
                <AlertCircle size={15} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-[12.5px] leading-relaxed text-gray-600">
                  No other gateway takes over automatically. Activate one, or customers won't be
                  able to pay online.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors shadow-sm text-sm font-semibold ${
                activating
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {activating ? 'Activate' : 'Deactivate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteGatewayDialog({
  gateway,
  onCancel,
  onConfirm,
}: {
  gateway: PaymentGateway;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={22} className="text-red-600" />
          </div>

          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            Delete {gateway.name}?
          </h3>
          <p className="text-[13.5px] text-gray-600 text-center mb-5 leading-relaxed">
            This removes the gateway, its credentials, and its{' '}
            <span className="tabular-nums">{gateway.channels.length}</span>{' '}
            {gateway.channels.length === 1 ? 'channel' : 'channels'}. This can't be undone.
          </p>

          {gateway.isActive && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3.5 flex items-start gap-2.5 mb-6">
              <AlertCircle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-[12.5px] leading-relaxed text-amber-900">
                <p className="font-semibold mb-0.5">This gateway is taking payments</p>
                <p>
                  Activate another gateway first so new payments have somewhere to go. Deleting it
                  now leaves customers unable to pay online.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors shadow-sm text-sm font-semibold"
            >
              Delete gateway
            </button>
          </div>
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

// ============================================================================
// Staff Seat Reservation — book seats on behalf of a walk-in customer
// ============================================================================

type SeatKind = 'normal' | 'vip' | 'onsite' | 'empty';

interface ReservationSeat {
  id: string;
  row: string;
  number: number;
  kind: SeatKind;
  taken: boolean;
}

type PaymentType = 'CASH' | 'CARD';

/** Mock wire payload — the real endpoint will be POST /bookings/:id/payment. */
interface CompletePaymentRequest {
  bookingId: string;
  paymentType: PaymentType;
  paidAmount?: number;
  paymentReference?: string;
}

/** Mock wire response — the issued ticket returned by the payment endpoint. */
interface IssuedTicket {
  ticketId: string;
  bookingId: string;
  qrCode: string;
  movieTitle: string;
  hallName: string;
  date: string;
  time: string;
  seats: string[];
  totalAmount: number;
  paymentType: PaymentType;
  paidAmount?: number;
  paymentReference?: string;
  issuedAt: string;
}

const SEAT_ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const SEAT_COLS = 12;
const HOLD_SECONDS = 10 * 60;

const SEAT_PRICE: Record<Exclude<SeatKind, 'empty'>, number> = {
  normal: 120,
  vip: 200,
  onsite: 120,
};

const SEAT_KIND_LABEL: Record<Exclude<SeatKind, 'empty'>, string> = {
  normal: 'Normal',
  vip: 'VIP',
  onsite: 'On-site',
};

/**
 * Deterministic layout + taken pattern seeded off the showtime, so the same
 * showtime always renders the same hall (no Math.random flicker on re-render).
 */
function buildReservationHall(seed: number, bookedSeats: number): ReservationSeat[][] {
  let remaining = bookedSeats;
  return SEAT_ROWS.map((row, rowIdx) => {
    return Array.from({ length: SEAT_COLS }, (_, colIdx) => {
      const number = colIdx + 1;
      const mid = Math.floor(SEAT_COLS / 2);
      const isAisle = (colIdx === mid - 1 || colIdx === mid) && rowIdx < SEAT_ROWS.length - 2;
      const isVip = rowIdx >= SEAT_ROWS.length - 2;
      const kind: SeatKind = isAisle ? 'empty' : isVip ? 'vip' : 'normal';

      let taken = false;
      if (kind !== 'empty' && remaining > 0) {
        const h = (rowIdx * 31 + colIdx * 17 + seed * 7) % 100;
        if (h < 45) {
          taken = true;
          remaining--;
        }
      }

      return { id: `${row}${number}`, row, number, kind, taken };
    });
  });
}

function formatCountdown(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatMoney(amount: number) {
  return `EGP ${amount.toFixed(2)}`;
}

function hashString(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0;
  return h;
}

function newBookingId(showtimeId: number) {
  return `BK-${String(showtimeId).padStart(4, '0')}-${Date.now().toString(36).toUpperCase()}`;
}

/** Placeholder QR — a deterministic dot matrix, swapped for a real code later. */
function QrStub({ seed, size = 116 }: { seed: string; size?: number }) {
  const cells = 21;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;

  const modules: boolean[] = [];
  for (let i = 0; i < cells * cells; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    modules.push(((h >>> 16) & 1) === 1);
  }

  const isFinder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= cells - 7) || (r >= cells - 7 && c < 7);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${cells} ${cells}`}
      className="rounded-lg bg-white p-1 ring-1 ring-gray-200"
      shapeRendering="crispEdges"
    >
      {Array.from({ length: cells }).map((_, r) =>
        Array.from({ length: cells }).map((_, c) => {
          if (isFinder(r, c)) return null;
          if (!modules[r * cells + c]) return null;
          return <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#111827" />;
        }),
      )}
      {[
        [0, 0],
        [0, cells - 7],
        [cells - 7, 0],
      ].map(([r, c]) => (
        <g key={`${r}-${c}`}>
          <rect x={c} y={r} width={7} height={7} fill="#111827" />
          <rect x={c + 1} y={r + 1} width={5} height={5} fill="#ffffff" />
          <rect x={c + 2} y={r + 2} width={3} height={3} fill="#111827" />
        </g>
      ))}
    </svg>
  );
}

function SeatCell({
  seat,
  selected,
  locked,
  onToggle,
}: {
  seat: ReservationSeat;
  selected: boolean;
  locked: boolean;
  onToggle: () => void;
}) {
  if (seat.kind === 'empty') return <span className="w-7 h-7" />;

  const base =
    'w-7 h-7 rounded-t-md rounded-b-sm border text-[10px] font-semibold transition-all flex items-center justify-center';

  if (seat.taken) {
    return (
      <span
        className={`${base} bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed`}
        title={`${seat.id} · Taken`}
      />
    );
  }

  const kindClass =
    seat.kind === 'vip'
      ? 'bg-purple-100 border-purple-300 text-purple-700 hover:border-purple-500'
      : 'bg-blue-100 border-blue-300 text-blue-700 hover:border-blue-500';

  return (
    <button
      onClick={onToggle}
      disabled={locked}
      title={`${seat.id} · ${SEAT_KIND_LABEL[seat.kind]} · ${formatMoney(SEAT_PRICE[seat.kind])}`}
      className={`${base} ${
        selected
          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
          : `${kindClass} ${locked ? 'cursor-not-allowed opacity-70' : ''}`
      }`}
    >
      {selected ? seat.number : ''}
    </button>
  );
}

function SeatLegendItem({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-3.5 h-3.5 rounded-t border ${className}`} />
      {label}
    </span>
  );
}

function TicketDetail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={15} className="text-gray-400 flex-shrink-0" />
      <div className="flex flex-1 items-baseline justify-between gap-3">
        <dt className="text-gray-500">{label}</dt>
        <dd className="font-medium text-gray-900">{value}</dd>
      </div>
    </div>
  );
}

function IssuedTicketPanel({ ticket }: { ticket: IssuedTicket }) {
  return (
    <div className="p-6 flex justify-center">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center text-center mb-6">
          <span className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-3">
            <Check size={28} className="text-green-600" strokeWidth={3} />
          </span>
          <h4 className="text-2xl font-bold text-gray-900">Payment complete</h4>
          <p className="text-gray-600 mt-1">
            The ticket has been issued — hand it to the customer.
          </p>
        </div>

        <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-5 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/70">
              Admit {ticket.seats.length}
            </p>
            <h5 className="text-2xl font-bold leading-tight mt-0.5">{ticket.movieTitle}</h5>
          </div>

          <div className="border-t border-dashed border-gray-300" />

          <div className="flex items-center gap-6 p-6">
            <dl className="flex-1 space-y-3 text-sm">
              <TicketDetail icon={Calendar} label="Date" value={ticket.date} />
              <TicketDetail icon={Clock} label="Time" value={ticket.time} />
              <TicketDetail icon={MapPin} label="Hall" value={ticket.hallName} />
              <TicketDetail icon={Ticket} label="Seats" value={ticket.seats.join(' · ')} />
            </dl>

            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <QrStub seed={ticket.qrCode} />
              <span className="text-[11px] text-gray-500 font-medium">{ticket.ticketId}</span>
            </div>
          </div>

          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Payment</span>
              <span className="font-semibold text-gray-900">
                {ticket.paymentType === 'CASH' ? 'Cash' : 'Card'}
              </span>
            </div>
            {ticket.paymentType === 'CASH' && ticket.paidAmount !== undefined && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Paid</span>
                  <span className="text-gray-900 tabular-nums">
                    {formatMoney(ticket.paidAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Change</span>
                  <span className="text-gray-900 tabular-nums">
                    {formatMoney(ticket.paidAmount - ticket.totalAmount)}
                  </span>
                </div>
              </>
            )}
            {ticket.paymentType === 'CARD' && ticket.paymentReference && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Reference</span>
                <span className="text-gray-900 font-mono text-xs">{ticket.paymentReference}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="text-lg font-bold text-blue-600 tabular-nums">
                {formatMoney(ticket.totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReservationStatusPanel({
  tone,
  icon,
  title,
  description,
  onClose,
}: {
  tone: 'red' | 'orange';
  icon: React.ReactNode;
  title: string;
  description: string;
  onClose: () => void;
}) {
  const ring = tone === 'red' ? 'bg-red-100' : 'bg-orange-100';
  return (
    <div className="flex flex-col items-center text-center py-16 px-6">
      <span className={`w-16 h-16 rounded-full ${ring} flex items-center justify-center mb-4`}>
        {icon}
      </span>
      <h4 className="text-2xl font-bold text-gray-900">{title}</h4>
      <p className="text-gray-600 mt-1 max-w-sm">{description}</p>
      <button
        onClick={onClose}
        className="mt-6 px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors shadow-md font-semibold"
      >
        Close
      </button>
    </div>
  );
}

function StaffReservationModal({ showtime, onClose }: { showtime: any; onClose: () => void }) {
  const [stage, setStage] = useState<'seats' | 'payment' | 'ticket'>('seats');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [secondsLeft, setSecondsLeft] = useState(HOLD_SECONDS);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [expired, setExpired] = useState(false);

  const [paymentType, setPaymentType] = useState<'' | PaymentType>('');
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [ticket, setTicket] = useState<IssuedTicket | null>(null);

  const [bookingId, setBookingId] = useState(() => newBookingId(showtime.id));
  const [hall, setHall] = useState(() => buildReservationHall(showtime.id, showtime.bookedSeats));

  // Hold timer — runs while the seats are held, stops once the ticket is issued
  // or the booking is cancelled.
  useEffect(() => {
    if (stage === 'ticket' || cancelled || expired) return;
    if (secondsLeft <= 0) {
      setExpired(true);
      return;
    }
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [secondsLeft, stage, cancelled, expired]);

  const seatById = new Map(hall.flat().map((s) => [s.id, s]));
  const selectedSeats = [...selected]
    .map((id) => seatById.get(id)!)
    .sort((a, b) => a.row.localeCompare(b.row) || a.number - b.number);

  const total = selectedSeats.reduce(
    (sum, s) => sum + SEAT_PRICE[s.kind as Exclude<SeatKind, 'empty'>],
    0,
  );

  const enteredAmount = Number(paidAmount);
  const amountEntered = paidAmount.trim() !== '' && !Number.isNaN(enteredAmount);
  const amountIsValid = amountEntered && enteredAmount >= total;
  const amountIsShort = amountEntered && enteredAmount < total;
  const change = amountIsValid ? enteredAmount - total : 0;

  const canCompletePayment =
    paymentType === 'CASH'
      ? amountIsValid
      : paymentType === 'CARD'
        ? paymentReference.trim().length > 0
        : false;

  const toggleSeat = (seat: ReservationSeat) => {
    if (seat.taken || seat.kind === 'empty' || stage !== 'seats') return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(seat.id) ? next.delete(seat.id) : next.add(seat.id);
      return next;
    });
  };

  const completePayment = () => {
    const payload: CompletePaymentRequest = {
      bookingId,
      paymentType: paymentType as PaymentType,
      ...(paymentType === 'CASH'
        ? { paidAmount: enteredAmount }
        : { paymentReference: paymentReference.trim() }),
    };

    // TODO: POST this payload to the payment endpoint — the response is the
    // issued ticket. Until the backend exists, the ticket is built locally.
    console.log('completePayment →', payload);

    setTicket({
      ticketId: `TK-${Math.abs(hashString(bookingId)).toString(36).toUpperCase().slice(0, 8)}`,
      bookingId,
      qrCode: bookingId,
      movieTitle: showtime.movieTitle,
      hallName: showtime.hallName,
      date: showtime.date,
      time: showtime.time,
      seats: selectedSeats.map((s) => s.id),
      totalAmount: total,
      paymentType: payload.paymentType,
      paidAmount: payload.paidAmount,
      paymentReference: payload.paymentReference,
      issuedAt: new Date().toISOString(),
    });
    setStage('ticket');
  };

  // Start another booking on the same showtime — the seats just sold are now
  // genuinely occupied, so they carry over as taken into the fresh hall.
  const startNewBooking = () => {
    const sold = new Set(ticket?.seats ?? []);
    setHall((prev) =>
      prev.map((row) => row.map((s) => (sold.has(s.id) ? { ...s, taken: true } : s))),
    );
    setBookingId(newBookingId(showtime.id));
    setSelected(new Set());
    setPaymentType('');
    setPaidAmount('');
    setPaymentReference('');
    setTicket(null);
    setSecondsLeft(HOLD_SECONDS);
    setStage('seats');
  };

  const timerCritical = secondsLeft <= 60;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-2xl font-bold text-gray-900 truncate">
                {stage === 'ticket' ? 'Ticket Issued' : 'Reserve Seats'}
              </h3>
              <p className="text-sm text-gray-600 mt-1 flex items-center gap-2 flex-wrap">
                <span className="font-medium">{showtime.movieTitle}</span>
                <span className="text-gray-300">·</span>
                <span className="flex items-center gap-1">
                  <MapPin size={13} />
                  {showtime.hallName}
                </span>
                <span className="text-gray-300">·</span>
                <span>
                  {showtime.date} at {showtime.time}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {stage !== 'ticket' && !cancelled && !expired && (
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${
                    timerCritical
                      ? 'border-red-300 bg-red-50 text-red-700'
                      : 'border-gray-300 bg-white text-gray-700'
                  }`}
                >
                  <Clock size={15} />
                  <span className="tabular-nums">{formatCountdown(secondsLeft)}</span>
                </div>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto">
          {cancelled ? (
            <ReservationStatusPanel
              tone="red"
              icon={<X size={32} className="text-red-600" strokeWidth={3} />}
              title="Booking cancelled"
              description="The held seats have been released and are available again."
              onClose={onClose}
            />
          ) : expired ? (
            <ReservationStatusPanel
              tone="orange"
              icon={<Clock size={32} className="text-orange-600" />}
              title="Reservation expired"
              description="The hold timer ran out and the seats were released. Start a new reservation to try again."
              onClose={onClose}
            />
          ) : stage === 'ticket' && ticket ? (
            <IssuedTicketPanel ticket={ticket} />
          ) : (
            <div className="flex flex-col lg:flex-row">
              {/* Seat map */}
              <div className="flex-1 p-6 border-b lg:border-b-0 lg:border-r border-gray-200">
                <div className="overflow-x-auto pb-2">
                  <div className="flex flex-col gap-2 min-w-max mx-auto">
                    <div className="mb-5 bg-gradient-to-b from-gray-800 to-gray-700 rounded-md py-1.5 shadow-md">
                      <p className="text-center text-white text-xs font-semibold tracking-wide">
                        SCREEN
                      </p>
                    </div>

                    {hall.map((row) => (
                      <div key={row[0].row} className="flex items-center justify-center gap-3">
                        <span className="w-5 text-center text-xs font-semibold text-gray-400">
                          {row[0].row}
                        </span>
                        <div className="flex gap-1.5">
                          {row.map((seat) => (
                            <SeatCell
                              key={seat.id}
                              seat={seat}
                              selected={selected.has(seat.id)}
                              locked={stage !== 'seats'}
                              onToggle={() => toggleSeat(seat)}
                            />
                          ))}
                        </div>
                        <span className="w-5 text-center text-xs font-semibold text-gray-400">
                          {row[0].row}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-600">
                  <SeatLegendItem className="bg-blue-100 border-blue-300" label="Normal" />
                  <SeatLegendItem className="bg-purple-100 border-purple-300" label="VIP" />
                  <SeatLegendItem className="bg-blue-600 border-blue-600" label="Selected" />
                  <SeatLegendItem className="bg-gray-200 border-gray-300" label="Taken" />
                </div>
              </div>

              {/* Summary + payment */}
              <div className="w-full lg:w-80 flex-shrink-0 p-6 bg-gray-50">
                <h4 className="font-semibold text-gray-900 mb-4">Booking Summary</h4>

                {selectedSeats.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-center text-gray-500">
                    <Info size={28} className="opacity-40" />
                    <p className="text-sm">Select seats to start a booking.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                      {selectedSeats.map((seat) => (
                        <div
                          key={seat.id}
                          className="flex items-center justify-between text-sm bg-white border border-gray-200 rounded-lg px-3 py-2"
                        >
                          <span className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{seat.id}</span>
                            <span className="text-xs text-gray-500">
                              {SEAT_KIND_LABEL[seat.kind as Exclude<SeatKind, 'empty'>]}
                            </span>
                          </span>
                          <span className="text-gray-700 tabular-nums">
                            {formatMoney(SEAT_PRICE[seat.kind as Exclude<SeatKind, 'empty'>])}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <span className="font-semibold text-gray-900">
                        Total ({selectedSeats.length})
                      </span>
                      <span className="text-lg font-bold text-blue-600 tabular-nums">
                        {formatMoney(total)}
                      </span>
                    </div>

                    {stage === 'seats' ? (
                      <button
                        onClick={() => setStage('payment')}
                        className="w-full px-6 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors shadow-md font-semibold flex items-center justify-center gap-2"
                      >
                        <Ticket size={16} />
                        Book
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Payment type
                          </label>
                          <select
                            value={paymentType}
                            onChange={(e) => {
                              setPaymentType(e.target.value as '' | PaymentType);
                              setPaidAmount('');
                              setPaymentReference('');
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select payment type</option>
                            <option value="CASH">Cash</option>
                            <option value="CARD">Card</option>
                          </select>
                        </div>

                        {paymentType === 'CASH' && (
                          <div>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={paidAmount}
                              onChange={(e) => setPaidAmount(e.target.value)}
                              placeholder="Enter paid amount"
                              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent ${
                                amountIsShort
                                  ? 'border-red-300 focus:ring-red-500'
                                  : 'border-gray-300 focus:ring-blue-500'
                              }`}
                            />
                            {amountIsShort && (
                              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                                <AlertCircle size={13} />
                                Amount must be at least {formatMoney(total)}
                              </p>
                            )}
                            {amountIsValid && (
                              <p className="mt-1.5 text-xs text-gray-600">
                                Change:{' '}
                                <span className="font-semibold text-gray-900 tabular-nums">
                                  {formatMoney(change)}
                                </span>
                              </p>
                            )}
                          </div>
                        )}

                        {paymentType === 'CARD' && (
                          <div>
                            <input
                              type="text"
                              value={paymentReference}
                              onChange={(e) => setPaymentReference(e.target.value)}
                              placeholder="Enter payment reference"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="mt-1.5 text-xs text-gray-500">
                              The reference returned by the payment gateway.
                            </p>
                          </div>
                        )}

                        <button
                          onClick={completePayment}
                          disabled={!canCompletePayment}
                          className="w-full px-6 py-2.5 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-md font-semibold flex items-center justify-center gap-2"
                        >
                          <Check size={16} />
                          Complete payment
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => setConfirmingCancel(true)}
                      className="w-full px-6 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <X size={15} />
                      Cancel booking
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Ticket footer */}
        {stage === 'ticket' && ticket && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
            <button
              onClick={startNewBooking}
              className="px-5 py-2 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors font-semibold flex items-center gap-2"
            >
              <Plus size={16} />
              Book more seats
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors shadow-md font-semibold"
            >
              Done
            </button>
          </div>
        )}
      </div>

      {/* Cancel Booking Confirmation */}
      {confirmingCancel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={24} className="text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              Cancel this booking?
            </h3>
            <p className="text-gray-600 text-center mb-6">
              The held seats will be released and made available to other customers. This can't be
              undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setConfirmingCancel(false)}
                className="flex-1 px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
              >
                Keep booking
              </button>
              <button
                onClick={() => {
                  setConfirmingCancel(false);
                  setCancelled(true);
                }}
                className="flex-1 px-6 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors shadow-md"
              >
                Cancel booking
              </button>
            </div>
          </div>
        </div>
      )}
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
  const [reservingShowtime, setReservingShowtime] = useState<any>(null);
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

  // Announce-to-clients state (per movie id). In the real app this comes from the
  // UpcomingMovieDTO.isAnnounced flag; here it's local so the toggle is interactive.
  const [announcedMovieIds, setAnnouncedMovieIds] = useState<Set<number>>(new Set([10]));
  // Movies with a published showtime hide the announce control entirely (they're
  // already "really showing"). Stubbed here to demo the hidden state on one card.
  const committedMovieIds = new Set<number>([8]);

  // Highlight-on-homepage state (per movie id) — the single shared `highlighted` flag.
  // Same set drives the toggle on both the upcoming cards and the now-showing rows;
  // in the real app it's one `highlighted` flag on the movie (announced OR now-showing).
  // Here it's local so the toggle is interactive.
  const [highlightedMovieIds, setHighlightedMovieIds] = useState<Set<number>>(new Set([5]));

  const toggleHighlighted = (movieId: number) => {
    setHighlightedMovieIds((prev) => {
      const next = new Set(prev);
      next.has(movieId) ? next.delete(movieId) : next.add(movieId);
      return next;
    });
  };

  const toggleAnnounced = (movieId: number) => {
    setAnnouncedMovieIds((prev) => {
      const next = new Set(prev);
      next.has(movieId) ? next.delete(movieId) : next.add(movieId);
      return next;
    });
  };

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

                  <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 p-6">
                    {moviesWithShowtimes.map((movie) => {
                      const movieShowtimes = getMovieShowtimes(movie.id);
                      const draftCount = movieShowtimes.filter(
                        (st: any) => st.status === 'draft',
                      ).length;
                      const isHighlighted = highlightedMovieIds.has(movie.id);
                      return (
                        <div
                          key={movie.id}
                          className={`flex flex-col rounded-xl border transition-all ${
                            isHighlighted
                              ? 'border-orange-200 bg-orange-50/30'
                              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                          }`}
                        >
                          {/* Identity — poster + title/meta + the metric chip. */}
                          <div className="flex gap-4 p-4">
                            <div className="relative shrink-0">
                              <ImageWithFallback
                                src={movie.poster}
                                alt={movie.title}
                                className="w-20 h-28 object-cover rounded-lg shadow-sm"
                              />
                              {isHighlighted && (
                                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-orange-500 ring-2 ring-white flex items-center justify-center shadow-sm">
                                  <Star size={12} className="fill-white text-white" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col">
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <h4 className="font-semibold text-gray-900 leading-tight line-clamp-2">
                                  {movie.title}
                                </h4>
                                <span className="shrink-0 inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-md text-xs font-medium">
                                  <Clock size={13} className="text-gray-500" />
                                  <span className="text-gray-700">
                                    {movieShowtimes.length} showtime
                                    {movieShowtimes.length !== 1 ? 's' : ''}
                                  </span>
                                  {draftCount > 0 && (
                                    <span className="text-orange-600">
                                      ({draftCount} draft{draftCount !== 1 ? 's' : ''})
                                    </span>
                                  )}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 truncate">{movie.genre}</p>
                              <p className="mt-0.5 text-sm text-gray-500 truncate">
                                {movie.duration} · {movie.director}
                              </p>
                            </div>
                          </div>

                          {/* Footer — the highlight toggle on its own row, then the
                              extensible action-button zone beneath it. A now-showing movie
                              is already client-visible, so the toggle has no announce-gate —
                              always enabled. Shares `highlightedMovieIds` with the upcoming
                              card. mt-auto pins the footer to the card bottom so cards in a
                              row stay equal height regardless of title length. */}
                          <div
                            className={`mt-auto border-t ${
                              isHighlighted ? 'border-orange-100' : 'border-gray-100'
                            }`}
                          >
                            <button
                              role="switch"
                              aria-checked={isHighlighted}
                              onClick={() => toggleHighlighted(movie.id)}
                              className={`group flex w-full items-center justify-between gap-3 px-4 py-2.5 outline-none transition-colors ${
                                isHighlighted ? 'hover:bg-orange-50/60' : 'hover:bg-gray-50'
                              }`}
                            >
                              <span className="flex items-center gap-2 min-w-0">
                                <Star
                                  size={15}
                                  className={`shrink-0 transition-colors ${
                                    isHighlighted
                                      ? 'fill-orange-400 text-orange-500'
                                      : 'text-gray-400 group-hover:text-gray-500'
                                  }`}
                                />
                                <span
                                  className={`text-sm font-medium truncate transition-colors ${
                                    isHighlighted ? 'text-orange-700' : 'text-gray-600'
                                  }`}
                                >
                                  Highlight on homepage
                                </span>
                              </span>
                              <span
                                className={`relative shrink-0 inline-flex h-5 w-9 items-center rounded-full transition-colors group-focus-visible:ring-2 group-focus-visible:ring-orange-500/40 ${
                                  isHighlighted ? 'bg-orange-600' : 'bg-gray-200'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                                    isHighlighted ? 'translate-x-[18px]' : 'translate-x-0.5'
                                  }`}
                                />
                              </span>
                            </button>

                            <div
                              className={`flex items-center gap-2 px-4 py-3 border-t ${
                                isHighlighted ? 'border-orange-100' : 'border-gray-100'
                              }`}
                            >
                              <button
                                onClick={() => {
                                  setSelectedMovie(movie);
                                  const dates = getShowtimeDates(movie.id);
                                  setSelectedShowtimeDate(dates[0] || '');
                                  setShowViewShowtimesModal(true);
                                }}
                                className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center text-sm font-medium"
                              >
                                View
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedMovie(movie);
                                  setShowCreateShowtimeModal(true);
                                }}
                                className="flex-1 px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-sm font-medium"
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
                                <Trash2 size={17} />
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
                      const isAnnounced = announcedMovieIds.has(movie.id);
                      const isCommitted = committedMovieIds.has(movie.id);

                      return (
                        <div
                          key={movie.id}
                          className="flex flex-col p-4 bg-white rounded-xl border border-gray-200 hover:border-orange-200 hover:shadow-md transition-all"
                        >
                          <div className="flex gap-4">
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
                                className="self-start px-4 py-1.5 bg-orange-50 text-orange-600 rounded-lg font-medium hover:bg-orange-100 transition-colors text-sm"
                              >
                                Schedule Showtimes
                              </button>
                            </div>
                          </div>

                          {/* Client visibility — full-width footer of movie-state toggles.
                              When the movie already has a published showtime it's "really showing":
                              the toggles render disabled (off) so every card keeps the same height. */}
                          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Announce — the gate: show in the client "Coming Soon" rail */}
                            <div
                              className={`flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2.5 ${
                                isCommitted ? 'opacity-60' : ''
                              }`}
                            >
                              <div className="flex items-start gap-2.5 min-w-0">
                                <Megaphone
                                  size={16}
                                  className={`mt-0.5 shrink-0 transition-colors ${
                                    isAnnounced ? 'text-orange-600' : 'text-gray-400'
                                  }`}
                                />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-900 leading-tight">
                                    Announce to clients
                                  </p>
                                  <p className="text-xs text-gray-500 leading-tight mt-0.5">
                                    {isCommitted
                                      ? 'Already scheduled'
                                      : 'Show in the “Coming Soon” rail'}
                                  </p>
                                </div>
                              </div>
                              <button
                                role="switch"
                                aria-checked={isAnnounced}
                                disabled={isCommitted}
                                title={isCommitted ? 'Already scheduled' : undefined}
                                onClick={isCommitted ? undefined : () => toggleAnnounced(movie.id)}
                                className={`relative shrink-0 inline-flex h-5 w-9 items-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 ${
                                  isAnnounced ? 'bg-orange-600' : 'bg-gray-200'
                                } ${isCommitted ? 'cursor-not-allowed' : ''}`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                                    isAnnounced ? 'translate-x-[18px]' : 'translate-x-0.5'
                                  }`}
                                />
                              </button>
                            </div>

                            {/* Highlight — the escalation: feature in the client homepage hero.
                                  Lands next PR; disabled until the movie is announced. */}
                            <div
                              className={`flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2.5 ${
                                isAnnounced ? '' : 'opacity-60'
                              }`}
                            >
                              <div className="flex items-start gap-2.5 min-w-0">
                                <Star size={16} className="mt-0.5 shrink-0 text-gray-400" />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-900 leading-tight">
                                    Highlight on homepage
                                  </p>
                                  <p className="text-xs text-gray-500 leading-tight mt-0.5">
                                    {isAnnounced
                                      ? 'Feature in the hero banner'
                                      : 'Announce first to enable'}
                                  </p>
                                </div>
                              </div>
                              <button
                                role="switch"
                                aria-checked={false}
                                disabled
                                title="Coming soon"
                                className="relative shrink-0 inline-flex h-5 w-9 items-center rounded-full bg-gray-200 transition-colors cursor-not-allowed"
                              >
                                <span className="inline-block h-4 w-4 rounded-full bg-white shadow-sm translate-x-0.5" />
                              </button>
                            </div>
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
                                onClick={() => setReservingShowtime(showtime)}
                                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-100 rounded-md transition-colors"
                                title="Reserve seats"
                              >
                                <Ticket size={15} />
                              </button>
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

      {/* Staff Seat Reservation Modal */}
      {reservingShowtime && (
        <StaffReservationModal
          showtime={reservingShowtime}
          onClose={() => setReservingShowtime(null)}
        />
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
