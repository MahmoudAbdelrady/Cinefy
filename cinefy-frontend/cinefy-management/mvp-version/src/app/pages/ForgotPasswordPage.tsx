import { useRef, useState } from 'react';
import {
  User,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Film,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';

type Stage = 'request' | 'otp' | 'reset' | 'done';

const OTP_LENGTH = 6;

export default function ForgotPasswordPage() {
  const [stage, setStage] = useState<Stage>('request');

  // Stage 1 — username
  const [username, setUsername] = useState('');
  const [requesting, setRequesting] = useState(false);

  // Stage 2 — OTP
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [otpError, setOtpError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const otpInputs = useRef<Array<HTMLInputElement | null>>([]);

  // Stage 3 — new password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  const canRequest = username.trim().length >= 2;
  const otpComplete = otp.every((d) => d.length === 1);
  const otpValue = otp.join('');
  const passwordStrength = scorePassword(newPassword);
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const canSaveNew = newPassword.length >= 8 && passwordsMatch && passwordStrength.score >= 2;

  function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!canRequest) return;
    setRequesting(true);
    setTimeout(() => {
      setRequesting(false);
      setStage('otp');
    }, 1100);
  }

  function setOtpDigit(idx: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[idx] = digit;
      return next;
    });
    setOtpError(null);
    if (digit && idx < OTP_LENGTH - 1) otpInputs.current[idx + 1]?.focus();
  }

  function handleOtpKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpInputs.current[idx - 1]?.focus();
    else if (e.key === 'ArrowLeft' && idx > 0) otpInputs.current[idx - 1]?.focus();
    else if (e.key === 'ArrowRight' && idx < OTP_LENGTH - 1) otpInputs.current[idx + 1]?.focus();
  }

  function handleOtpPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setOtp(next);
    setOtpError(null);
    otpInputs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  }

  function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otpComplete) return;
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      if (otpValue === '000000') {
        setOtpError('That code is invalid or has expired.');
        return;
      }
      setStage('reset');
    }, 1000);
  }

  function handleSaveNewPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!canSaveNew) return;
    setResetting(true);
    setTimeout(() => {
      setResetting(false);
      setStage('done');
    }, 1200);
  }

  return (
    <div className="login-root min-h-screen w-full bg-[#fafafa] text-gray-900 antialiased flex flex-col">
      <style>{LOGIN_STYLES}</style>

      <header className="w-full px-6 sm:px-10 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-sm">
            <Film size={17} className="text-white" strokeWidth={2.3} />
          </div>
          <div className="leading-none">
            <p className="text-[15px] font-semibold text-gray-900 tracking-tight">Cinefy</p>
            <p className="text-[10.5px] uppercase tracking-[0.16em] text-gray-500 font-semibold mt-1">
              Management Console
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-[420px]">
          {/* Progress dots — only visible after the first stage */}
          {stage !== 'request' && (
            <div className="flex items-center justify-center gap-1.5 mb-7">
              <Dot active={stage === 'otp'} done={stage !== 'otp'} label="Verify" />
              <Connector done={stage === 'reset' || stage === 'done'} />
              <Dot active={stage === 'reset'} done={stage === 'done'} label="New password" />
              <Connector done={stage === 'done'} />
              <Dot active={stage === 'done'} done={stage === 'done'} label="Done" />
            </div>
          )}

          {stage === 'request' && (
            <RequestStage
              username={username}
              setUsername={setUsername}
              canSubmit={canRequest}
              submitting={requesting}
              onSubmit={handleRequest}
            />
          )}

          {stage === 'otp' && (
            <OtpStage
              username={username}
              otp={otp}
              otpError={otpError}
              verifying={verifying}
              otpComplete={otpComplete}
              onChangeDigit={setOtpDigit}
              onKeyDown={handleOtpKeyDown}
              onPaste={handleOtpPaste}
              onSubmit={handleVerifyOtp}
              inputsRef={otpInputs}
              onBack={() => setStage('request')}
            />
          )}

          {stage === 'reset' && (
            <ResetStage
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              showNew={showNew}
              setShowNew={setShowNew}
              showConfirm={showConfirm}
              setShowConfirm={setShowConfirm}
              resetting={resetting}
              canSave={canSaveNew}
              strength={passwordStrength}
              passwordsMatch={passwordsMatch}
              onSubmit={handleSaveNewPassword}
            />
          )}

          {stage === 'done' && <DoneStage />}
        </div>
      </main>

      <footer className="w-full px-6 sm:px-10 py-6 border-t border-gray-200/80 bg-white/60">
        <div className="max-w-[1100px] mx-auto flex items-center justify-end gap-3 text-[11.5px] text-gray-500 tabular-nums">
          <span>v1.0.0</span>
          <span className="text-gray-300">·</span>
          <span>© Cinefy 2025</span>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* Stage 1 — Username entry                                                   */
/* ------------------------------------------------------------------------- */
function RequestStage(props: {
  username: string;
  setUsername: (v: string) => void;
  canSubmit: boolean;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const { username, setUsername, canSubmit, submitting, onSubmit } = props;

  return (
    <div className="stage-enter">
      <div className="mb-7">
        <h1 className="text-[24px] leading-[1.2] tracking-tight font-semibold text-gray-900">
          Forgot password?
        </h1>
        <p className="mt-1.5 text-[14px] text-gray-600">
          Enter your username and we&rsquo;ll email a verification code to the address on file.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(15,23,42,0.12)] p-7">
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="username"
              className="block text-[12.5px] font-semibold text-gray-800 mb-1.5"
            >
              Username
            </label>
            <div className="relative">
              <User
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                strokeWidth={2}
              />
              <input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="e.g. j.morales"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input pl-10"
                autoFocus
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="group relative w-full mt-1 inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-blue-600 text-white font-semibold text-[14px] shadow-sm transition-all disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed enabled:hover:bg-blue-700 enabled:active:translate-y-[1px]"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Sending code…</span>
              </>
            ) : (
              <>
                <span>Send verification code</span>
                <ArrowRight
                  size={16}
                  className="transition-transform group-enabled:group-hover:translate-x-0.5"
                />
              </>
            )}
          </button>
        </form>
      </div>

      <a
        href="#/login"
        className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft size={14} strokeWidth={2} />
        Back to sign in
      </a>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* Stage 2 — OTP entry                                                        */
/* ------------------------------------------------------------------------- */
function OtpStage(props: {
  username: string;
  otp: string[];
  otpError: string | null;
  verifying: boolean;
  otpComplete: boolean;
  onChangeDigit: (idx: number, value: string) => void;
  onKeyDown: (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  inputsRef: React.MutableRefObject<Array<HTMLInputElement | null>>;
  onBack: () => void;
}) {
  const {
    username,
    otp,
    otpError,
    verifying,
    otpComplete,
    onChangeDigit,
    onKeyDown,
    onPaste,
    onSubmit,
    inputsRef,
    onBack,
  } = props;

  return (
    <div className="stage-enter">
      <div className="mb-6">
        <h1 className="text-[24px] leading-[1.2] tracking-tight font-semibold text-gray-900">
          Enter the code we sent
        </h1>
        <p className="mt-1.5 text-[14px] text-gray-600 leading-relaxed">
          We emailed a 6-digit code to the address on file for{' '}
          <span className="font-semibold text-gray-900">{username || 'your account'}</span>.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(15,23,42,0.12)] p-7">
        <form onSubmit={onSubmit}>
          <label className="block text-[12.5px] font-semibold text-gray-800 mb-3">
            Verification code
          </label>

          <div className={`flex items-center justify-between gap-2 ${otpError ? 'otp-shake' : ''}`}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputsRef.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => onChangeDigit(idx, e.target.value)}
                onKeyDown={(e) => onKeyDown(idx, e)}
                onPaste={onPaste}
                className={`otp-box ${otpError ? 'otp-box--error' : ''} ${
                  digit ? 'otp-box--filled' : ''
                }`}
                autoFocus={idx === 0}
              />
            ))}
          </div>

          {otpError && (
            <p className="mt-3 flex items-center gap-1.5 text-[12.5px] font-medium text-red-600">
              <AlertCircle size={14} strokeWidth={2.2} />
              {otpError}
            </p>
          )}

          <p className="mt-4 text-[12.5px] text-gray-500">
            Didn&rsquo;t get a code?{' '}
            <button
              type="button"
              className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Resend
            </button>
            <span className="text-gray-300 mx-1.5">·</span>
            <span className="tabular-nums">Expires in 14:32</span>
          </p>

          <button
            type="submit"
            disabled={!otpComplete || verifying}
            className="group relative w-full mt-6 inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-blue-600 text-white font-semibold text-[14px] shadow-sm transition-all disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed enabled:hover:bg-blue-700 enabled:active:translate-y-[1px]"
          >
            {verifying ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Verifying…</span>
              </>
            ) : (
              <>
                <span>Verify code</span>
                <ArrowRight
                  size={16}
                  className="transition-transform group-enabled:group-hover:translate-x-0.5"
                />
              </>
            )}
          </button>
        </form>
      </div>

      <button
        type="button"
        onClick={onBack}
        className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft size={14} strokeWidth={2} />
        Use a different username
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* Stage 3 — New password                                                     */
/* ------------------------------------------------------------------------- */
type Strength = { score: number; label: string; color: string };

function ResetStage(props: {
  newPassword: string;
  setNewPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  showNew: boolean;
  setShowNew: (fn: (v: boolean) => boolean) => void;
  showConfirm: boolean;
  setShowConfirm: (fn: (v: boolean) => boolean) => void;
  resetting: boolean;
  canSave: boolean;
  strength: Strength;
  passwordsMatch: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const {
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showNew,
    setShowNew,
    showConfirm,
    setShowConfirm,
    resetting,
    canSave,
    strength,
    passwordsMatch,
    onSubmit,
  } = props;

  const checks = [
    { ok: newPassword.length >= 8, label: 'At least 8 characters' },
    { ok: /[A-Z]/.test(newPassword), label: 'One uppercase letter' },
    { ok: /[0-9]/.test(newPassword), label: 'One number' },
    { ok: /[^A-Za-z0-9]/.test(newPassword), label: 'One special character' },
  ];

  return (
    <div className="stage-enter">
      <div className="mb-6">
        <h1 className="text-[24px] leading-[1.2] tracking-tight font-semibold text-gray-900">
          Set a new password
        </h1>
        <p className="mt-1.5 text-[14px] text-gray-600 leading-relaxed">
          Choose a strong password you haven&rsquo;t used before.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(15,23,42,0.12)] p-7">
        <form onSubmit={onSubmit} className="space-y-5">
          {/* New password */}
          <div>
            <label
              htmlFor="newPassword"
              className="block text-[12.5px] font-semibold text-gray-800 mb-1.5"
            >
              New password
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                strokeWidth={2}
              />
              <input
                id="newPassword"
                type={showNew ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="form-input pl-10 pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowNew((v: boolean) => !v)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                {showNew ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
              </button>
            </div>

            {newPassword.length > 0 && (
              <div className="mt-2.5">
                <div className="flex items-center gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i < strength.score ? strength.color : 'bg-gray-100'
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-1.5 text-[11.5px] font-medium text-gray-600">
                  Strength: <span className="text-gray-900 font-semibold">{strength.label}</span>
                </p>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-[12.5px] font-semibold text-gray-800 mb-1.5"
            >
              Confirm new password
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                strokeWidth={2}
              />
              <input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`form-input pl-10 pr-10 ${
                  confirmPassword.length > 0 && !passwordsMatch ? 'form-input--error' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v: boolean) => !v)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                {showConfirm ? (
                  <EyeOff size={16} strokeWidth={2} />
                ) : (
                  <Eye size={16} strokeWidth={2} />
                )}
              </button>
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-medium text-red-600">
                <AlertCircle size={12} strokeWidth={2.4} />
                Passwords don&rsquo;t match.
              </p>
            )}
          </div>

          <ul className="grid grid-cols-2 gap-y-1.5 gap-x-3 px-3.5 py-3 rounded-lg bg-gray-50 border border-gray-100">
            {checks.map((c) => (
              <li
                key={c.label}
                className={`flex items-center gap-1.5 text-[11.5px] transition-colors ${
                  c.ok ? 'text-emerald-700' : 'text-gray-500'
                }`}
              >
                <CheckCircle2
                  size={12}
                  strokeWidth={2.4}
                  className={c.ok ? 'text-emerald-500' : 'text-gray-300'}
                />
                {c.label}
              </li>
            ))}
          </ul>

          <button
            type="submit"
            disabled={!canSave || resetting}
            className="group relative w-full mt-1 inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-blue-600 text-white font-semibold text-[14px] shadow-sm transition-all disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed enabled:hover:bg-blue-700 enabled:active:translate-y-[1px]"
          >
            {resetting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving…</span>
              </>
            ) : (
              <>
                <span>Save new password</span>
                <ArrowRight
                  size={16}
                  className="transition-transform group-enabled:group-hover:translate-x-0.5"
                />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* Stage 4 — Success                                                          */
/* ------------------------------------------------------------------------- */
function DoneStage() {
  return (
    <div className="stage-enter">
      <div className="bg-white border border-gray-200 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(15,23,42,0.12)] p-7 text-center">
        <div className="mx-auto flex items-center justify-center size-14 rounded-full bg-emerald-50 mb-5">
          <ShieldCheck size={26} className="text-emerald-600" strokeWidth={2.2} />
        </div>

        <h1 className="text-[22px] leading-[1.25] tracking-tight font-semibold text-gray-900">
          Password updated
        </h1>
        <p className="mt-2 text-[14px] text-gray-600 leading-relaxed">
          Your password has been changed successfully. You can now sign in with your new password.
        </p>

        <a
          href="#/login"
          className="group mt-6 w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-blue-600 text-white font-semibold text-[14px] shadow-sm hover:bg-blue-700 active:translate-y-[1px] transition-all"
        >
          <span>Continue to sign in</span>
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
        </a>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* Progress indicators                                                        */
/* ------------------------------------------------------------------------- */
function Dot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        className={`size-2.5 rounded-full transition-all ${
          done ? 'bg-blue-600' : active ? 'bg-blue-600 ring-4 ring-blue-100' : 'bg-gray-200'
        }`}
      />
      <span
        className={`text-[10px] uppercase tracking-[0.12em] font-semibold transition-colors ${
          active || done ? 'text-gray-800' : 'text-gray-400'
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function Connector({ done }: { done: boolean }) {
  return (
    <span
      className={`block h-px w-10 mb-5 transition-colors ${done ? 'bg-blue-600' : 'bg-gray-200'}`}
    />
  );
}

/* ------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* ------------------------------------------------------------------------- */
function scorePassword(pw: string): Strength {
  if (!pw) return { score: 0, label: '—', color: 'bg-gray-200' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const capped = Math.min(score, 4);
  if (capped <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' };
  if (capped === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
  if (capped === 3) return { score: 3, label: 'Good', color: 'bg-blue-500' };
  return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
}

const LOGIN_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  .login-root { font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif; }

  .form-input {
    width: 100%;
    height: 40px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 0 12px;
    color: #111827;
    font-size: 14px;
    transition: border-color 150ms ease, box-shadow 150ms ease;
    outline: none;
  }
  .form-input::placeholder { color: #9ca3af; }
  .form-input:hover { border-color: #d1d5db; }
  .form-input:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.15);
  }
  .form-input--error,
  .form-input--error:hover { border-color: #dc2626; }
  .form-input--error:focus { box-shadow: 0 0 0 3px rgba(220,38,38,0.15); border-color: #dc2626; }

  .otp-box {
    width: 100%;
    aspect-ratio: 1 / 1;
    max-width: 52px;
    text-align: center;
    font-size: 20px;
    font-weight: 600;
    color: #111827;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    transition: border-color 150ms ease, box-shadow 150ms ease, background 150ms ease;
    outline: none;
    caret-color: #2563eb;
  }
  .otp-box::-webkit-outer-spin-button,
  .otp-box::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  .otp-box:hover { border-color: #d1d5db; }
  .otp-box--filled { background: #f8fafc; border-color: #cbd5e1; }
  .otp-box:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.15); background: #ffffff; }
  .otp-box--error { border-color: #dc2626 !important; }
  .otp-box--error:focus { box-shadow: 0 0 0 3px rgba(220,38,38,0.15) !important; }

  @keyframes otp-shake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-4px); }
    40%, 80% { transform: translateX(4px); }
  }
  .otp-shake { animation: otp-shake 320ms ease-in-out; }

  @keyframes stage-in {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .stage-enter { animation: stage-in 280ms cubic-bezier(.2,.7,.2,1) both; }
`;
