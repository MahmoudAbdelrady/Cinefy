import { AlertCircle, CreditCard } from 'lucide-react';
import { type ActiveGatewayInfo } from './dashboardData';
import { WidgetHeader } from './WidgetHeader';

/**
 * The gateway currently taking online payments. `gateway` is null when none is
 * active — a real API state (PaymentGatewayList.active is optional), and an
 * outage rather than an empty list, so it reads as a warning with a way out.
 */
export function ActiveGateway({
  gateway,
  onOpenSettings,
}: {
  gateway: ActiveGatewayInfo | null;
  onOpenSettings: () => void;
}) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <WidgetHeader
        icon={CreditCard}
        title="Active gateway"
        actionLabel="Settings"
        onAction={onOpenSettings}
        tone="amber"
      />
      {gateway ? <GatewayDetails gateway={gateway} /> : <NoGateway onActivate={onOpenSettings} />}
    </section>
  );
}

function GatewayDetails({ gateway }: { gateway: ActiveGatewayInfo }) {
  const noneActive = !gateway.channels.some((channel) => channel.active);

  return (
    <div className="p-5">
      <h4 className="text-[17px] font-semibold text-gray-900">{gateway.name}</h4>
      <p className="text-[13px] text-gray-600 mt-1">{gateway.provider}</p>

      <div className="mt-4 pt-3.5 border-t border-gray-100">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2.5">
          Channels
        </p>

        {/* A gateway can carry many channels; the list scrolls rather than
            pushing the rest of the side column down. */}
        <ul className="max-h-40 overflow-y-auto">
          {gateway.channels.map((channel) => (
            <li
              key={`${channel.name}-${channel.currency}`}
              className="flex items-center gap-2.5 py-2 text-[13px] text-gray-700 border-t first:border-t-0 border-gray-100"
            >
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  channel.active ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
              {channel.name}
              <span className="ml-auto text-xs text-gray-500">{channel.currency}</span>
            </li>
          ))}
        </ul>

        {/* An active gateway with every channel switched off takes no money —
            the same outcome as having no gateway, so it gets said out loud. */}
        {noneActive && (
          <p className="flex items-start gap-2 mt-3 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs leading-relaxed text-amber-800">
            <AlertCircle size={14} className="flex-shrink-0 mt-px" />
            <span>
              {gateway.channels.length === 0
                ? 'This gateway has no channels, so online payments can’t be taken.'
                : 'No channel is switched on, so online payments can’t be taken.'}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

function NoGateway({ onActivate }: { onActivate: () => void }) {
  return (
    <div className="px-5 pt-7 pb-6 text-center">
      <span className="w-12 h-12 mx-auto mb-3.5 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
        <AlertCircle size={22} />
      </span>
      <h4 className="text-[15px] font-semibold text-gray-900">No active gateway</h4>
      <p className="text-[13px] text-gray-600 leading-relaxed mt-1.5 max-w-[30ch] mx-auto">
        Online bookings can't be paid for until one is activated. On-site cash sales still work.
      </p>
      <button
        onClick={onActivate}
        className="inline-flex items-center gap-2 mt-4 px-[18px] py-2.5 rounded-lg bg-gray-900 text-white text-[13px] font-medium hover:bg-gray-800 transition-colors"
      >
        <CreditCard size={15} />
        Activate a gateway
      </button>
    </div>
  );
}
