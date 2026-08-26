import {
  dashboardWidgetsFor,
  showsScannerAsPage,
  type NavSection,
  type StaffPosition,
} from '../../access';
import { RUNNING_NOW, TODAY_LABEL, gatewayForPreview, type GatewayPreview } from './dashboardData';
import { ActiveGateway } from './ActiveGateway';
import { HallsSummary } from './HallsSummary';
import { OnShiftSummary } from './OnShiftSummary';
import { PrototypeControls } from './PrototypeControls';
import { TicketScanner } from './TicketScanner';
import { TodaySchedule } from './TodaySchedule';
import { TodayStatistics } from './TodayStatistics';

type Props = {
  position: StaffPosition;
  onPositionChange: (position: StaffPosition) => void;
  gatewayPreview: GatewayPreview;
  onGatewayPreviewChange: (preview: GatewayPreview) => void;
  onNavigate: (section: NavSection) => void;
};

export function DashboardSection({
  position,
  onPositionChange,
  gatewayPreview,
  onGatewayPreviewChange,
  onNavigate,
}: Props) {
  const widgets = dashboardWidgetsFor(position);
  const has = (widget: (typeof widgets)[number]) => widgets.includes(widget);
  const scannerIsPage = showsScannerAsPage(position);

  // A position with no side widgets (a cashier sees only the schedule) gets a
  // single full-width column instead of a two-column grid with a dead gap.
  const hasSideColumn = has('halls') || has('gateway') || has('onShift');

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10 shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-900">
          {scannerIsPage ? 'Scan tickets' : 'Dashboard'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {scannerIsPage
            ? 'Verify tickets as customers arrive'
            : `${TODAY_LABEL} · ${RUNNING_NOW} screenings running now`}
        </p>
      </header>

      <div className="p-8 space-y-5">
        <PrototypeControls
          position={position}
          onPositionChange={onPositionChange}
          gatewayPreview={gatewayPreview}
          onGatewayPreviewChange={onGatewayPreviewChange}
          showGatewayToggle={has('gateway')}
        />

        {scannerIsPage ? (
          <TicketScanner />
        ) : (
          <>
            {has('statistics') && <TodayStatistics dateLabel={TODAY_LABEL} />}

            <div
              className={`grid grid-cols-1 gap-5 items-start ${
                hasSideColumn ? 'xl:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]' : ''
              }`}
            >
              {has('schedule') && (
                <TodaySchedule
                  emphasis={position === 'Cashier' ? 'available' : 'sold'}
                  actionLabel={position === 'Cashier' ? 'Sell tickets' : 'Manage showtimes'}
                  onAction={() => onNavigate('movies')}
                />
              )}

              {hasSideColumn && (
                <div className="space-y-5">
                  {has('halls') && <HallsSummary onManage={() => onNavigate('halls')} />}
                  {has('gateway') && (
                    <ActiveGateway
                      gateway={gatewayForPreview(gatewayPreview)}
                      onOpenSettings={() => onNavigate('payment')}
                    />
                  )}
                  {has('onShift') && <OnShiftSummary onManageStaff={() => onNavigate('staff')} />}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
