import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Store,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
  ArrowLeft,
  Key,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useFirebase } from '../../context/FirebaseContext';

interface AdminLoginProps {
  accessDeniedMessage?: string | null;
  onSuccessRedirect?: () => void;
}

type AdminAuthMode = 'LOGIN' | 'FORGOT' | 'RESET';

export const AdminLogin: React.FC<AdminLoginProps> = ({
  accessDeniedMessage,
  onSuccessRedirect,
}) => {
  const {
    adminLogin,
    adminSendForgotOtp,
    adminResetPasswordWithOtp,
    storeSettings,
    navigate,
    setActiveView,
  } = useStore();
  const { loginWithGoogle, isLoggingIn } = useFirebase();

  const [mode, setMode] = useState<AdminAuthMode>('LOGIN');
  const [email, setEmail] = useState('skgsurajshahu317@gmail.com');
  const [password, setPassword] = useState('Rajkumar@1122');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(accessDeniedMessage || null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Forgot / Reset state
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleGoogleAdminLogin = async () => {
    try {
      setErrorMessage(null);
      const user = await loginWithGoogle();
      if (user && user.email) {
        const emailLower = user.email.toLowerCase();
        const isAuthorized =
          emailLower === 'skgsurajshahu317@gmail.com' || emailLower === 'ms0736687@gmail.com';

        if (isAuthorized) {
          const result = await adminLogin(user.email, 'google-oauth');
          if (result.success) {
            setSuccessMessage(`Welcome Admin (${user.email})! Verified via Google.`);
            setTimeout(() => {
              if (onSuccessRedirect) {
                onSuccessRedirect();
              } else {
                setActiveView('ADMIN');
                navigate('/admin/dashboard');
              }
            }, 500);
            return;
          }
        }
        setErrorMessage(`Account ${user.email} is not authorized. Only registered administrator accounts can access this portal.`);
      }
    } catch (err: any) {
      if (
        err?.code !== 'auth/popup-closed-by-user' &&
        err?.code !== 'auth/cancelled-popup-request'
      ) {
        setErrorMessage(err?.message || 'Google administrator authentication could not be completed.');
      }
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const result = await adminLogin(email, password);
    setIsLoading(false);

    if (result.success) {
      setSuccessMessage('Credentials authenticated! Redirecting to Ops Dashboard...');
      setTimeout(() => {
        if (onSuccessRedirect) {
          onSuccessRedirect();
        } else {
          setActiveView('ADMIN');
          navigate('/admin/dashboard');
        }
      }, 500);
    } else {
      setErrorMessage(result.error || 'Access Denied: Invalid administrator credentials.');
    }
  };

  const handleSendForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await adminSendForgotOtp(email);
    setIsLoading(false);

    if (res.success) {
      setResetOtp('');
      setSuccessMessage('Security verification OTP has been dispatched to your authorized administrator email address.');
      setMode('RESET');
    } else {
      setErrorMessage(res.error || 'Failed to dispatch admin passkey reset code.');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMessage('New passkeys do not match. Please verify both fields.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('New passkey must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await adminResetPasswordWithOtp(email, resetOtp, newPassword);
    setIsLoading(false);

    if (res.success) {
      setPassword(newPassword);
      setSuccessMessage('Admin master passkey successfully updated! Please sign in with your new passkey.');
      setMode('LOGIN');
      setResetOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setErrorMessage(res.error || 'Passkey reset failed. Please verify your OTP code.');
    }
  };

  const handleAutoFillAdmin = () => {
    setEmail('skgsurajshahu317@gmail.com');
    setPassword('Rajkumar@1122');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background architectural grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370f_1px,transparent_1px),linear-gradient(to_bottom,#1f29370f_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand & Badge Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-widest">
            <Shield className="w-3.5 h-3.5" />
            <span>Operations &amp; Seller Hub</span>
          </div>

          <div className="flex items-center justify-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center font-black text-base shadow-lg shadow-amber-500/20">
              {storeSettings.brandName ? storeSettings.brandName.slice(0, 2).toUpperCase() : 'RX'}
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white">
              RIDEX MOTO - Admin Portal
            </h1>
          </div>
          <p className="text-xs text-neutral-400 max-w-xs mx-auto">
            {mode === 'LOGIN' && 'Restricted operations access for inventory control, fulfillment, analytics, and store management.'}
            {mode === 'FORGOT' && 'Enter your registered administrator email to dispatch a 2FA security passkey reset OTP.'}
            {mode === 'RESET' && 'Verify your 4-digit security OTP and establish a new master administrator passkey.'}
          </p>
        </div>

        {/* Access Denied / Error Warning Banner */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-950/70 border border-red-800/80 text-red-200 text-xs flex items-start gap-3 shadow-lg shadow-red-950/30 animate-fade-in" id="admin-auth-error-banner">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-red-300">Access Restricted</div>
              <p className="text-[11px] leading-relaxed text-red-200/90">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-800/80 text-emerald-200 text-xs flex items-center gap-3 shadow-lg shadow-emerald-950/30 animate-fade-in" id="admin-auth-success-banner">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold text-[11px]">{successMessage}</span>
          </div>
        )}

        {/* Auth Card */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm space-y-6">
          {/* MODE 1: LOGIN */}
          {mode === 'LOGIN' && (
            <>
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-amber-500" />
                    <span>Admin Email or Master Username</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="skgsurajshahu317@gmail.com"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                      id="admin-login-email"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Admin Passkey / Password</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage(null);
                        setSuccessMessage(null);
                        setMode('FORGOT');
                      }}
                      className="text-[11px] text-amber-400 hover:text-amber-300 transition-colors font-medium cursor-pointer"
                      id="admin-forgot-password-link"
                    >
                      Forgot Passkey?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors font-mono"
                      id="admin-login-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 transition-colors p-1"
                      title={showPassword ? 'Hide password' : 'Show password'}
                      id="toggle-admin-password-visibility"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-black font-black uppercase text-xs tracking-wider transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  id="admin-login-submit-btn"
                >
                  {isLoading ? (
                    <span>Authenticating Admin...</span>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Sign In as Administrator</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick Helper Options */}
              <div className="pt-4 border-t border-neutral-800/80 space-y-3">
                {/* Google Admin Login */}
                <button
                  type="button"
                  onClick={handleGoogleAdminLogin}
                  disabled={isLoggingIn}
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-neutral-100 active:scale-[0.99] text-neutral-900 font-bold text-xs flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
                  id="google-admin-signin-btn"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isLoggingIn ? 'Verifying with Google...' : 'Sign In with Google Admin'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleAutoFillAdmin}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  id="autofill-admin-btn"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Auto-fill Admin (skgsurajshahu317@gmail.com)</span>
                </button>

                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 text-[11px] text-neutral-400 flex items-center justify-between">
                  <div>
                    <span className="text-neutral-300 font-semibold block">RBAC Protected Administrator:</span>
                    <span className="text-amber-400 font-mono text-[11px]">skgsurajshahu317@gmail.com</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                    Authorized
                  </span>
                </div>
              </div>
            </>
          )}

          {/* MODE 2: FORGOT PASSWORD (REQUEST OTP) */}
          {mode === 'FORGOT' && (
            <form onSubmit={handleSendForgotOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-500" />
                  <span>Registered Admin Email Address</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="skgsurajshahu317@gmail.com"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                  id="admin-forgot-email-input"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>RBAC Multi-Factor Reset</span>
                </div>
                <p className="text-amber-300/90 text-[10px] leading-relaxed">
                  Only authorized administrator accounts can request passkey recovery. An OTP will be dispatched and registered in the Firestore security audit log.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-black font-black uppercase text-xs tracking-wider transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                id="admin-send-otp-btn"
              >
                {isLoading ? (
                  <span>Dispatching Security OTP...</span>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    <span>Send Admin Security OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setMode('LOGIN');
                  }}
                  className="text-xs text-neutral-400 hover:text-white transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  id="back-to-admin-login-btn"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Admin Sign In</span>
                </button>
              </div>
            </form>
          )}

          {/* MODE 3: RESET PASSKEY (ENTER OTP + NEW PASSWORD) */}
          {mode === 'RESET' && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                  <span>Security Verification OTP</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={resetOtp}
                  onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter security verification OTP"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm tracking-widest font-mono text-amber-400 text-center focus:outline-none focus:border-amber-500 transition-colors"
                  id="admin-reset-otp-input"
                  autoFocus
                />
                <p className="text-[10px] text-neutral-400">
                  Enter the verification code dispatched to your administrator email address. Valid for 5 minutes.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  <span>New Master Admin Passkey</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors font-mono"
                    id="admin-new-passkey-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 transition-colors p-1"
                    title={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Confirm New Passkey</span>
                </label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new passkey"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors font-mono"
                  id="admin-confirm-passkey-input"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-black font-black uppercase text-xs tracking-wider transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                id="admin-save-passkey-btn"
              >
                {isLoading ? (
                  <span>Updating Passkey in Firestore...</span>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Save &amp; Update Admin Passkey</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setMode('LOGIN');
                  }}
                  className="text-xs text-neutral-400 hover:text-white transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  id="back-to-admin-login-from-reset-btn"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Admin Sign In</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Portal Segregation Notice */}
        <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 text-center space-y-1">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
            Role-Based Access Control Segregation
          </span>
          <p className="text-[10px] text-neutral-500">
            Customers and Riders cannot authenticate in this portal. Customer sessions are quarantined to the consumer storefront.
          </p>
        </div>

        {/* Return to Customer Portal */}
        <div className="text-center">
          <button
            onClick={() => {
              setActiveView('HOME');
              navigate('/');
            }}
            className="text-xs text-neutral-400 hover:text-amber-400 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            id="back-to-storefront-link"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Looking for Rider Store? Return to Customer Storefront</span>
          </button>
        </div>
      </div>
    </div>
  );
};
