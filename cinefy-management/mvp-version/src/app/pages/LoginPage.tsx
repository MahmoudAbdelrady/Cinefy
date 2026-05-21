import { useState } from 'react';
import { Eye, EyeOff, Lock, User, ArrowRight, Loader2, Film } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = username.trim().length >= 2 && password.length >= 4;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setTimeout(() => setSubmitting(false), 1400);
  }

  return (
    <div className="login-root min-h-screen w-full bg-[#fafafa] text-gray-900 antialiased flex flex-col">
      <style>{LOGIN_STYLES}</style>

      {/* Top bar — brand + environment */}
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

      {/* Centered form */}
      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-[400px]">
          <div className="mb-7">
            <h1 className="text-[24px] leading-[1.2] tracking-tight font-semibold text-gray-900">
              Sign in
            </h1>
            <p className="mt-1.5 text-[14px] text-gray-600">
              Access the Cinefy management console.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(15,23,42,0.12)] p-7">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
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
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-[12.5px] font-semibold text-gray-800 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    strokeWidth={2}
                  />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v: boolean) => !v)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff size={16} strokeWidth={2} />
                    ) : (
                      <Eye size={16} strokeWidth={2} />
                    )}
                  </button>
                </div>
                <div className="mt-2 flex justify-end">
                  <a
                    href="#/forgot-password"
                    className="text-[12px] font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Forgot password?
                  </a>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className="group relative w-full mt-1 inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-blue-600 text-white font-semibold text-[14px] shadow-sm transition-all disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed enabled:hover:bg-blue-700 enabled:active:translate-y-[1px]"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Signing in…</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
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
      </main>

      {/* Footer — operational metadata */}
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
`;
