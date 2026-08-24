import { useEffect, useRef, useState, type RefObject } from 'react';
import { CircleCheck, Keyboard, MapPin, ScanLine, Ticket, TriangleAlert } from 'lucide-react';
import { RECENT_SCANS, SCANNED_THIS_SHIFT } from './dashboardData';
import { WidgetHeader } from './WidgetHeader';

type ScannedTicket = {
  reference: string;
  title: string;
  hall: string;
  hallType: string;
  time: string;
  date: string;
  seats: string[];
};

type Outcome = { status: 'VALID'; ticket: ScannedTicket } | { status: 'INVALID'; reference: string };

/** Hardware scanners type fast and finish with Enter; this mirrors that. */
const AUTO_SUBMIT_DELAY_MS = 500;

function verify(reference: string): Outcome {
  if (reference.length < 6) return { status: 'INVALID', reference };
  return {
    status: 'VALID',
    ticket: {
      reference,
      title: 'Wicked',
      hall: 'Hall 2',
      hallType: 'IMAX',
      time: '13:15',
      date: 'Aug 24, 2026',
      seats: ['F7', 'F8'],
    },
  };
}

/**
 * The whole dashboard for a position that can't open any other page. The
 * backend already permits it — BookingController.scanTicket allows USHER — but
 * the scan modal only opens from /movies, which an usher can't reach.
 */
export function TicketScanner() {
  const [reference, setReference] = useState('');
  const [manualEntry, setManualEntry] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scanner input arrives as a burst of keystrokes, so submit once it settles.
  useEffect(() => {
    if (manualEntry || outcome || !reference) return;

    timerRef.current = setTimeout(() => setOutcome(verify(reference)), AUTO_SUBMIT_DELAY_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [reference, manualEntry, outcome]);

  useEffect(() => {
    if (!outcome) inputRef.current?.focus();
  }, [outcome]);

  const reset = () => {
    setOutcome(null);
    setReference('');
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5">
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {outcome === null ? (
          <ScanPrompt
            reference={reference}
            manualEntry={manualEntry}
            inputRef={inputRef}
            onReferenceChange={setReference}
            onToggleManual={() => {
              setManualEntry((on) => !on);
              setReference('');
            }}
            onSubmit={() => reference && setOutcome(verify(reference))}
          />
        ) : outcome.status === 'VALID' ? (
          <VerifiedTicket ticket={outcome.ticket} onScanAnother={reset} />
        ) : (
          <RejectedTicket reference={outcome.reference} onScanAnother={reset} />
        )}
      </section>

      <section className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <WidgetHeader
          icon={CircleCheck}
          title="Verified in this shift"
          subtitle={`${SCANNED_THIS_SHIFT} tickets`}
          tone="green"
        />
        <ul className="p-2">
          {RECENT_SCANS.map((scan) => (
            <li
              key={scan.reference}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50"
            >
              <span className="w-[30px] h-[30px] rounded-full bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
                <CircleCheck size={16} />
              </span>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 truncate">{scan.title}</h4>
                <p className="text-xs text-gray-600 mt-0.5 tabular-nums truncate">
                  {scan.hall} · {scan.time} · {scan.seats.join(', ')} · #{scan.reference}
                </p>
              </div>
              <span className="text-xs text-gray-400 tabular-nums whitespace-nowrap">
                {scan.scannedAgo}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ScanPrompt({
  reference,
  manualEntry,
  inputRef,
  onReferenceChange,
  onToggleManual,
  onSubmit,
}: {
  reference: string;
  manualEntry: boolean;
  inputRef: RefObject<HTMLInputElement>;
  onReferenceChange: (value: string) => void;
  onToggleManual: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="px-9 pt-10 pb-8 text-center">
      <span className="size-26 mx-auto mb-5 rounded-2xl bg-blue-50 border-2 border-dashed border-blue-300 text-blue-600 flex items-center justify-center">
        <Ticket size={44} strokeWidth={1.5} />
      </span>

      <h2 className="text-[22px] font-semibold text-gray-900">Scan a ticket</h2>
      <p className="text-sm text-gray-600 mt-1.5">
        {manualEntry
          ? 'Type the booking reference from the ticket.'
          : "Point the scanner at the QR code on the customer's ticket."}
      </p>

      <form
        className="mt-6"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="flex items-center gap-3 px-[18px] py-3.5 rounded-lg border-2 border-blue-500 ring-4 ring-blue-500/10 bg-white text-left">
          <ScanLine size={20} className="text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={reference}
            autoFocus
            onChange={(event) => onReferenceChange(event.target.value.toUpperCase())}
            onBlur={() => !manualEntry && inputRef.current?.focus()}
            placeholder={manualEntry ? 'e.g. F2AC9WJKRV' : 'Waiting for scan'}
            className="flex-1 min-w-0 bg-transparent outline-none text-base tracking-widest text-gray-900 placeholder:text-gray-400 placeholder:tracking-widest"
          />
        </div>

        {manualEntry && (
          <button
            type="submit"
            disabled={!reference}
            className="w-full mt-3 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 transition-colors"
          >
            Verify ticket
          </button>
        )}
      </form>

      {!manualEntry && (
        <p className="mt-3.5 flex items-center justify-center gap-2.5 text-[13px] text-gray-600">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Listening for scanner input
        </p>
      )}

      <p className="mt-5 pt-4.5 border-t border-gray-200 text-[13px] text-gray-600">
        <button
          onClick={onToggleManual}
          className="inline-flex items-center gap-1.5 font-medium text-blue-600 hover:text-blue-700"
        >
          <Keyboard size={15} />
          {manualEntry ? 'Back to scanning' : 'Enter the reference manually'}
        </button>
      </p>
    </div>
  );
}

function VerifiedTicket({
  ticket,
  onScanAnother,
}: {
  ticket: ScannedTicket;
  onScanAnother: () => void;
}) {
  return (
    <div className="px-9 pt-9 pb-8 text-center">
      <span className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
        <CircleCheck size={32} />
      </span>
      <h2 className="text-[22px] font-semibold text-gray-900">Ticket verified</h2>
      <p className="text-sm text-gray-600 mt-1.5">Marked as used · admit the customer</p>

      <dl className="mt-6 text-left border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
        <Fact label="Movie" value={`${ticket.title} · ${ticket.hallType}`} />
        <Fact label="Hall" value={ticket.hall} icon={MapPin} />
        <Fact label="Showing" value={`${ticket.date} at ${ticket.time}`} />
        <Fact label={`Seats (${ticket.seats.length})`} value={ticket.seats.join(', ')} />
        <Fact label="Reference" value={`#${ticket.reference}`} />
      </dl>

      <button
        onClick={onScanAnother}
        className="w-full mt-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors inline-flex items-center justify-center gap-2"
      >
        <ScanLine size={16} />
        Scan another
      </button>
    </div>
  );
}

function RejectedTicket({
  reference,
  onScanAnother,
}: {
  reference: string;
  onScanAnother: () => void;
}) {
  return (
    <div className="px-9 pt-9 pb-8 text-center">
      <span className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
        <TriangleAlert size={30} />
      </span>
      <h2 className="text-[22px] font-semibold text-gray-900">Ticket not recognised</h2>
      <p className="text-sm text-gray-600 mt-1.5 max-w-[36ch] mx-auto">
        No booking matches <span className="font-semibold text-gray-900">#{reference}</span>. Check
        the reference on the ticket, or scan it again.
      </p>
      <button
        onClick={onScanAnother}
        className="w-full mt-5 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors inline-flex items-center justify-center gap-2"
      >
        <ScanLine size={16} />
        Scan again
      </button>
    </div>
  );
}

function Fact({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof MapPin;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <dt className="flex items-center gap-2 text-[13px] text-gray-600">
        {Icon && <Icon size={15} className="text-gray-400" />}
        {label}
      </dt>
      <dd className="ml-auto text-[13px] font-semibold text-gray-900 text-right">{value}</dd>
    </div>
  );
}
