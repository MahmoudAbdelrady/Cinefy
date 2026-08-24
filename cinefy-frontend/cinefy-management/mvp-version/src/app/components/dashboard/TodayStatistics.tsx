import { CURRENCY, TODAY_TOTALS, formatMoney, formatPercent } from './dashboardData';

/**
 * Today's sales, with no day-over-day comparison — that's the Statistics page's
 * job. Rendered as one ledger band rather than a row of icon tiles so it reads
 * as a single reading of the day.
 */
export function TodayStatistics({ dateLabel }: { dateLabel: string }) {
  const { ticketsSold, netRevenue, refunded, occupancy } = TODAY_TOTALS;

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col lg:flex-row">
      <div className="px-6 py-5 bg-gray-50 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col justify-center lg:min-w-44">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Today</p>
        <p className="text-sm font-semibold text-gray-900 mt-1">{dateLabel}</p>
      </div>

      <div className="flex-1 grid grid-cols-2 lg:grid-cols-4">
        <Figure label="Tickets sold" value={ticketsSold.toLocaleString('en-US')} />
        <Figure label="Net revenue" value={formatMoney(netRevenue)} unit={CURRENCY} />
        <Figure label="Refunded" value={formatMoney(refunded)} unit={CURRENCY} tone="negative" />
        <Figure label="Occupancy" value={formatPercent(occupancy)} />
      </div>
    </section>
  );
}

function Figure({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: 'negative';
}) {
  return (
    <div className="px-6 py-5 border-r last:border-r-0 border-gray-100 min-w-0">
      <p className="text-xs text-gray-500 mb-1.5">{label}</p>
      <p
        className={`text-2xl font-semibold tracking-tight tabular-nums ${
          tone === 'negative' ? 'text-red-600' : 'text-gray-900'
        }`}
      >
        {value}
        {unit && <span className="text-xs font-medium text-gray-500 ml-1">{unit}</span>}
      </p>
    </div>
  );
}
