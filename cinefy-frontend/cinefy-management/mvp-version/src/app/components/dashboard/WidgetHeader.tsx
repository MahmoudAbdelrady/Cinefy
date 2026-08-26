import type { LucideIcon } from 'lucide-react';

const TONES = {
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-50 text-amber-700',
  orange: 'bg-orange-50 text-orange-600',
  green: 'bg-green-50 text-green-600',
} as const;

type Props = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  tone?: keyof typeof TONES;
  actionLabel?: string;
  onAction?: () => void;
};

export function WidgetHeader({
  icon: Icon,
  title,
  subtitle,
  tone = 'blue',
  actionLabel,
  onAction,
}: Props) {
  return (
    <header className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
      <span
        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${TONES[tone]}`}
      >
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold text-gray-900 leading-tight">{title}</h3>
        {subtitle && <p className="text-xs text-gray-600 mt-0.5">{subtitle}</p>}
      </div>
      {actionLabel && (
        <button
          onClick={onAction}
          className="ml-auto px-3.5 py-2 rounded-lg border border-gray-200 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
        >
          {actionLabel}
        </button>
      )}
    </header>
  );
}
