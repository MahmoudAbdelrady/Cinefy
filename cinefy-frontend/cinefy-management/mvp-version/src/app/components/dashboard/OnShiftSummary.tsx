import { ContactRound } from 'lucide-react';
import { ON_SHIFT_COUNTS, ON_SHIFT_TOTAL, STAFF_TOTAL } from './dashboardData';
import { WidgetHeader } from './WidgetHeader';

/**
 * How many of each position are working right now. A position with nobody on
 * shift keeps its column as a greyed zero — "no ushers on shift" is the state
 * worth seeing, and a list that shortens itself hides exactly that.
 */
export function OnShiftSummary({ onManageStaff }: { onManageStaff: () => void }) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <WidgetHeader
        icon={ContactRound}
        title="On shift now"
        subtitle={`${ON_SHIFT_TOTAL} of ${STAFF_TOTAL} staff`}
        actionLabel="Manage staff"
        onAction={onManageStaff}
        tone="orange"
      />

      <ul className="flex py-1">
        {ON_SHIFT_COUNTS.map((position) => (
          <li
            key={position.label}
            className="flex-1 px-3 py-4 text-center border-r last:border-r-0 border-gray-100"
          >
            <p
              className={`text-[28px] leading-none font-semibold tracking-tight tabular-nums ${
                position.count === 0 ? 'text-gray-300' : 'text-gray-900'
              }`}
            >
              {position.count}
            </p>
            <p
              className={`text-xs mt-1.5 ${
                position.count === 0 ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              {position.label}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
