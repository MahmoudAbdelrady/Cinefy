import { Calendar, Clock, Ticket } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { TODAY_SCREENINGS, startsSoon, type Screening } from './dashboardData';

type Props = {
  /** A manager reads how much sold; a cashier reads what is left to sell. */
  emphasis: 'sold' | 'available';
  actionLabel: string;
  onAction: () => void;
};

export function TodaySchedule({ emphasis, actionLabel, onAction }: Props) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <header className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
        <span className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
          <Clock size={18} />
        </span>
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-gray-900 leading-tight">Today's schedule</h3>
          <p className="text-xs text-gray-600 mt-0.5">{TODAY_SCREENINGS.length} showtimes</p>
        </div>
        <button
          onClick={onAction}
          className="ml-auto flex items-center gap-2 px-3.5 py-2 rounded-lg border border-gray-200 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
        >
          {emphasis === 'sold' ? (
            <Calendar size={15} className="text-gray-400" />
          ) : (
            <Ticket size={15} className="text-gray-400" />
          )}
          <span>{actionLabel}</span>
        </button>
      </header>

      <ul className="px-2 divide-y divide-gray-100 max-h-[38rem] overflow-y-auto">
        {TODAY_SCREENINGS.map((screening) => (
          <ScreeningRow key={screening.id} screening={screening} emphasis={emphasis} />
        ))}
      </ul>
    </section>
  );
}

function ScreeningRow({ screening, emphasis }: { screening: Screening; emphasis: Props['emphasis'] }) {
  const seatsLeft = screening.capacity - screening.sold;

  return (
    <li className="flex items-center gap-3.5 px-3 py-3.5">
      <ImageWithFallback
        src={screening.poster}
        alt={screening.title}
        className="w-11 h-16 rounded-lg object-cover flex-shrink-0"
      />

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-gray-900 truncate">{screening.title}</h4>
        <p className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-600 tabular-nums">
          <Ticket size={13} className="text-gray-400" />
          {emphasis === 'sold'
            ? `${screening.sold} / ${screening.capacity}`
            : `${seatsLeft} seats left`}
        </p>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="text-[13px] font-semibold text-gray-900 tabular-nums">
          {screening.startsAt} – {screening.endsAt}
        </p>
        {screening.status === 'running' ? (
          <StatusTag label="Running" text="text-green-700" dot="bg-green-500" />
        ) : startsSoon(screening) ? (
          <StatusTag label="Starts soon" text="text-amber-700" dot="bg-amber-500" />
        ) : null}
      </div>
    </li>
  );
}

function StatusTag({ label, text, dot }: { label: string; text: string; dot: string }) {
  return (
    <p className={`inline-flex items-center gap-1.5 mt-1 text-xs font-medium ${text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </p>
  );
}
