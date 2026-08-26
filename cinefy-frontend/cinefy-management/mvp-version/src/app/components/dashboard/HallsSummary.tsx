import { Layout } from 'lucide-react';
import { ACTIVE_HALLS, HALL_STATUS_COUNTS, TOTAL_HALLS } from './dashboardData';
import { WidgetHeader } from './WidgetHeader';

/**
 * How many halls exist and how many are operating. The status split stays
 * visible — "6 active" hides whether the other two are in maintenance or
 * switched off, and those need different responses.
 */
export function HallsSummary({ onManage }: { onManage: () => void }) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <WidgetHeader
        icon={Layout}
        title="Halls"
        actionLabel="Manage"
        onAction={onManage}
        tone="blue"
      />

      <div className="p-5">
        <p className="flex items-baseline gap-2">
          <span className="text-[34px] leading-none font-semibold tracking-tight text-gray-900 tabular-nums">
            {TOTAL_HALLS}
          </span>
          <span className="text-sm text-gray-600">
            halls · <span className="font-semibold text-green-700">{ACTIVE_HALLS} active</span>
          </span>
        </p>

        <div className="flex gap-0.5 mt-4">
          {HALL_STATUS_COUNTS.filter((status) => status.count > 0).map((status) => (
            <span
              key={status.key}
              className={`h-2.5 rounded-sm ${status.swatch}`}
              style={{ flex: status.count }}
            />
          ))}
        </div>

        <ul className="mt-3.5 space-y-2">
          {HALL_STATUS_COUNTS.map((status) => (
            <li key={status.key} className="flex items-center gap-2.5 text-[13px] text-gray-600">
              <span className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 ${status.swatch}`} />
              {status.label}
              <span className="ml-auto font-semibold text-gray-900 tabular-nums">
                {status.count}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
