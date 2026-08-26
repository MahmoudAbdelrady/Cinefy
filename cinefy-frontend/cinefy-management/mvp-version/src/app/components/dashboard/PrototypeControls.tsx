import type { StaffPosition } from '../../access';
import type { GatewayPreview } from './dashboardData';

/**
 * Prototype-only. In the real app the position comes from the signed-in staff
 * member and there is nothing to switch — this exists so the composition and
 * the gateway's empty state can both be reviewed without seeding data.
 */

const POSITIONS: StaffPosition[] = ['Manager', 'Cashier', 'Usher'];

const GATEWAY_PREVIEWS: { value: GatewayPreview; label: string }[] = [
  { value: 'active', label: 'One active' },
  { value: 'noChannels', label: 'No channels on' },
  { value: 'none', label: 'None active' },
];

type Props = {
  position: StaffPosition;
  onPositionChange: (position: StaffPosition) => void;
  gatewayPreview: GatewayPreview;
  onGatewayPreviewChange: (preview: GatewayPreview) => void;
  showGatewayToggle: boolean;
};

export function PrototypeControls({
  position,
  onPositionChange,
  gatewayPreview,
  onGatewayPreviewChange,
  showGatewayToggle,
}: Props) {
  return (
    <div className="flex items-center gap-2.5 flex-wrap px-3.5 py-2.5 rounded-lg border border-dashed border-gray-300 bg-white">
      <span className="text-xs text-gray-500">Prototype control — signed in as:</span>
      {POSITIONS.map((option) => (
        <Chip
          key={option}
          label={option}
          selected={position === option}
          onClick={() => onPositionChange(option)}
        />
      ))}

      {showGatewayToggle && (
        <>
          <span className="w-px h-5 bg-gray-200" />
          <span className="text-xs text-gray-500">Gateway:</span>
          {GATEWAY_PREVIEWS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={gatewayPreview === option.value}
              onClick={() => onGatewayPreviewChange(option.value)}
            />
          ))}
        </>
      )}
    </div>
  );
}

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full border text-[13px] font-medium transition-colors ${
        selected
          ? 'bg-gray-900 border-gray-900 text-white'
          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  );
}
