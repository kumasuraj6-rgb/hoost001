import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Lock,
  X,
  CheckCircle2,
  ArrowRight,
  Eye,
  EyeOff,
  ArrowLeft,
  KeyRound,
  Shield,
  Smartphone,
  RefreshCw,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useFirebase } from '../../context/FirebaseContext';
import { safeFetchJson } from '../../utils/apiClient';

interface CustomerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type AuthMode = 'SIGN_IN' | 'REGISTER' | 'FORGOT_PASSWORD';

export const CustomerLoginModal: React.FC<CustomerLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    customerLogin,
    customerRegister,
    customerResetPasswordWithOtp,
    storeSettings,
    navigate,
    setActiveView,
    setIsCustomerAuthModalOpen,
    showToast,
  } = useStore();
  const {
    loginWithGoogle,
    isLoggingIn,
    loginWithEmailPassword,
    registerWithEmailPassword,
    sendPasswordReset,
  } = useFirebase();

  // Mode management: Sign in (email+password only), Register, or Forgot Password (via OTP)
  const [mode, setMode] = useState<AuthMode>('SIGN_IN');

  // Sign In & Register Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password via OTP States
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<'REQUEST_EMAIL' | 'VERIFY_OTP' | 'SET_NEW_PASSWORD'>('REQUEST_EMAIL');
  const [resetToken, setResetToken] = useState('');
  const [forgotOtpDigits, setForgotOtpDigits] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 30s Countdown timer for OTP resend
  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Reset transient states when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsLoading(false);
      if (!forgotEmail && email) {
        setForgotEmail(email);
      }
    }
  }, [isOpen, email, forgotEmail]);

  if (!isOpen) return null;

  // ----------------------------------------------------
  // 1. Customer Login: ONLY Verify Email and Password
  // ----------------------------------------------------
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMessage('Please enter both your registered email and password.');
      setIsLoading(false);
      return;
    }

    try {
      // Synchronize Firebase Auth session
      loginWithEmailPassword(cleanEmail, password).catch(() => {});

      const result = await customerLogin(cleanEmail, password);
      if (result.success) {
        setIsCustomerAuthModalOpen(false);
        onClose();
        if (onSuccess) {
          onSuccess();
        } else {
          setActiveView('ACCOUNT');
          navigate('/account');
        }
      } else {
        setErrorMessage(result.error || 'Authentication failed. Please verify your email and password.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Login failed. Please verify your email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  // ----------------------------------------------------
  // 2. Customer Registration
  // ----------------------------------------------------
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    if (!name.trim() || !email.trim() || !password) {
      setErrorMessage('Please fill in all required fields.');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      setIsLoading(false);
      return;
    }

    try {
      // Synchronize Firebase Auth user creation
      registerWithEmailPassword(email.trim().toLowerCase(), password).catch(() => {});

      const result = await customerRegister(name, email, phone, password);
      if (result.success) {
        setIsCustomerAuthModalOpen(false);
        onClose();
        if (onSuccess) {
          onSuccess();
        } else {
          setActiveView('ACCOUNT');
          navigate('/account');
        }
      } else {
        setErrorMessage(result.error || 'Failed to create account.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // ----------------------------------------------------
  // 3. Forgot Password: Step 1 - Send 6-Digit OTP
  // ----------------------------------------------------
  const handleSendForgotOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = (forgotEmail || email).trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid registered email address.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await safeFetchJson('/api/auth/customer/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      if (!response.ok || !response.data?.success) {
        setErrorMessage(
          response.data?.error ||
            response.error ||
            'Unable to dispatch verification code. Please check your email configuration or try again.'
        );
        return;
      }

      setForgotStep('VERIFY_OTP');
      setCountdown(30);
      const digits =
        response.data?.devOtp && String(response.data.devOtp).length === 6
          ? String(response.data.devOtp).split('')
          : ['', '', '', '', '', ''];
      setForgotOtpDigits(digits);
      const msg =
        response.data?.message ||
        `A 6-digit verification code has been dispatched to ${cleanEmail}. (Code expires in 10 minutes)`;
      setSuccessMessage(msg);
      showToast(response.data?.message || `Verification code sent to ${cleanEmail}.`, 'info');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to dispatch verification code. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP paste in forgot password (6 digits)
  const handleForgotOtpPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (pasted) {
      const digits = pasted.slice(0, 6).split('');
      const newDigits = [...forgotOtpDigits];
      digits.forEach((d, i) => {
        if (i < 6) newDigits[i] = d;
      });
      setForgotOtpDigits(newDigits);
      const focusIndex = Math.min(digits.length - 1, 5);
      document.getElementById(`forgot-otp-${focusIndex}`)?.focus();
    }
  };

  // ----------------------------------------------------
  // 4. Forgot Password: Step 2 - Verify 6-Digit OTP
  // ----------------------------------------------------
  const handleVerifyResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = (forgotEmail || email).trim().toLowerCase();
    const otpCode = forgotOtpDigits.join('').trim();

    if (otpCode.length < 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await safeFetchJson('/api/auth/customer/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, otp: otpCode }),
      });

      if (!response.ok || !response.data?.success) {
        setErrorMessage(
          response.data?.error ||
            response.error ||
            'Invalid verification code. Please check and try again.'
        );
        return;
      }

      setResetToken(response.data.resetToken || '');
      setForgotStep('SET_NEW_PASSWORD');
      setSuccessMessage('Code verified successfully! Please enter your new password.');
      showToast('Code verified! Enter your new password.', 'success');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ----------------------------------------------------
  // 5. Forgot Password: Step 3 - Set New Password
  // ----------------------------------------------------
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = (forgotEmail || email).trim().toLowerCase();

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await safeFetchJson('/api/auth/customer/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          resetToken,
          otp: forgotOtpDigits.join('').trim(),
          newPassword,
        }),
      });

      if (!response.ok || !response.data?.success) {
        setErrorMessage(response.data?.error || response.error || 'Failed to update password. Please try again.');
        return;
      }

      // Sync password reset email notification with Firebase if available
      if (sendPasswordReset) {
        sendPasswordReset(cleanEmail).catch(() => {});
      }

      setEmail(cleanEmail);
      setPassword(newPassword);
      setSuccessMessage('Password reset successfully! Please sign in with your new password.');
      showToast('Password reset successfully! Please sign in.', 'success');
      setMode('SIGN_IN');
      setForgotStep('REQUEST_EMAIL');
      setForgotOtpDigits(['', '', '', '', '', '']);
      setResetToken('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Password reset failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth Login
  const handleGoogleLogin = async () => {
    try {
      setErrorMessage(null);
      const user = await loginWithGoogle();
      if (user && user.email) {
        await customerLogin(user.email, 'google-oauth');
        showToast(`Welcome, ${user.displayName || 'Rider'}! Signed in with Google.`, 'success');
        setIsCustomerAuthModalOpen(false);
        onClose();
        if (onSuccess) {
          onSuccess();
        } else {
          setActiveView('ACCOUNT');
          navigate('/account');
        }
      }
    } catch (err: any) {
      if (
        err?.code !== 'auth/popup-closed-by-user' &&
        err?.code !== 'auth/cancelled-popup-request'
      ) {
        setErrorMessage(err?.message || 'Google sign-in could not be completed. Please use email & password.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-md w-full p-6 sm:p-8 text-neutral-200 shadow-2xl space-y-5 relative max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => {
            setIsCustomerAuthModalOpen(false);
            onClose();
          }}
          className="absolute top-5 right-5 p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          id="close-customer-auth-modal"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
            {mode === 'FORGOT_PASSWORD' ? (
              <KeyRound className="w-6 h-6" />
            ) : mode === 'REGISTER' ? (
              <Shield className="w-6 h-6" />
            ) : (
              <User className="w-6 h-6" />
            )}
          </div>

          <h2 className="text-xl font-black uppercase text-white tracking-tight">
            {mode === 'FORGOT_PASSWORD'
              ? 'Reset Password via OTP'
              : mode === 'REGISTER'
              ? 'Create Rider Account'
              : 'Rider Sign In'}
          </h2>

          <p className="text-xs text-neutral-400">
            {mode === 'FORGOT_PASSWORD'
              ? 'Verify your registered email using a secure OTP to set a new password.'
              : mode === 'REGISTER'
              ? `Join ${storeSettings.brandName} to manage orders, addresses, and gear warranties.`
              : 'Sign in to your rider account with your registered email and password.'}
          </p>
        </div>

        {/* Alerts & Feedback */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-start gap-2 animate-fade-in">
            <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* VIEW 1: SIGN IN (Strictly Email & Password Verification) */}
        {/* ---------------------------------------------------- */}
        {mode === 'SIGN_IN' && (
          <div className="space-y-4">
            <form onSubmit={handlePasswordLogin} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-neutral-300 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Email Address *</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-neutral-100 focus:border-amber-500 focus:outline-none transition-colors"
                  id="customer-login-email"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-neutral-300 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Password *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setSuccessMessage(null);
                      setForgotEmail(email);
                      setForgotStep('REQUEST_EMAIL');
                      setForgotOtpDigits(['', '', '', '', '', '']);
                      setResetToken('');
                      setMode('FORGOT_PASSWORD');
                    }}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                    id="link-forgot-password"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 pr-10 text-neutral-100 focus:border-amber-500 focus:outline-none font-mono"
                    id="customer-login-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-black font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                id="customer-login-submit-btn"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Email &amp; Password...</span>
                  </div>
                ) : (
                  <>
                    <span>Sign In to Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Google Authentication */}
            <div className="pt-1">
              <div className="relative my-2.5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-800" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-neutral-900 px-3 text-neutral-500 uppercase tracking-widest font-mono text-[10px]">
                    or continue with
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-neutral-100 active:scale-[0.99] text-neutral-900 font-bold text-xs flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
                id="google-signin-btn"
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
                <span>{isLoggingIn ? 'Connecting to Google...' : 'Continue with Google'}</span>
              </button>
            </div>

            {/* Register Link */}
            <div className="pt-2.5 border-t border-neutral-800 text-center">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setMode('REGISTER');
                }}
                className="text-xs text-neutral-300 hover:text-white underline underline-offset-4 cursor-pointer"
                id="toggle-auth-mode-btn"
              >
                Don't have an account? Create one
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* VIEW 2: FORGOT PASSWORD (Strictly Verified through OTP) */}
        {/* ---------------------------------------------------- */}
        {mode === 'FORGOT_PASSWORD' && (
          <div className="space-y-4 text-xs">
            {forgotStep === 'REQUEST_EMAIL' && (
              /* Step 1: Request Verification OTP to Registered Customer Email */
              <form onSubmit={handleSendForgotOtp} className="space-y-3.5">
                <div className="space-y-1 text-center pb-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">FORGOT PASSWORD</h3>
                  <p className="text-[11px] text-neutral-400">
                    Enter your registered email address to receive a 6-digit verification code.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-300 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Enter registered email *</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="customer@example.com"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-neutral-100 focus:border-amber-500 focus:outline-none transition-colors font-mono"
                    id="forgot-email-input"
                  />
                  <p className="text-[10px] text-neutral-500">
                    We will send a 6-digit verification code to this email to securely verify your identity.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-black font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                  id="send-forgot-otp-btn"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Sending Code...</span>
                    </div>
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4" />
                      <span>SEND VERIFICATION CODE</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {forgotStep === 'VERIFY_OTP' && (
              /* Step 2: Enter 6-digit OTP Code */
              <form onSubmit={handleVerifyResetOtp} className="space-y-3.5">
                <div className="space-y-1 text-center pb-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">RESET PASSWORD VIA OTP</h3>
                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-400">
                    <span>Code sent to:</span>
                    <strong className="text-amber-400 font-mono">{forgotEmail}</strong>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotStep('REQUEST_EMAIL');
                        setErrorMessage(null);
                      }}
                      className="ml-1 text-neutral-400 hover:text-white underline cursor-pointer text-[10px]"
                    >
                      (Change)
                    </button>
                  </div>
                </div>

                {/* 6-digit OTP Code inputs with Paste Support */}
                <div className="flex justify-center gap-2 pt-1" onPaste={handleForgotOtpPaste}>
                  {forgotOtpDigits.map((digit, index) => (
                    <input
                      key={index}
                      id={`forgot-otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={1}
                      placeholder="•"
                      autoFocus={index === 0}
                      value={digit}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        const newDigits = [...forgotOtpDigits];
                        newDigits[index] = val;
                        setForgotOtpDigits(newDigits);
                        if (val && index < 5) {
                          document.getElementById(`forgot-otp-${index + 1}`)?.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !forgotOtpDigits[index] && index > 0) {
                          document.getElementById(`forgot-otp-${index - 1}`)?.focus();
                        }
                      }}
                      className="w-10 h-12 text-center text-lg font-mono font-black bg-neutral-950 border border-neutral-700 rounded-xl text-amber-400 focus:border-amber-500 focus:outline-none"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || forgotOtpDigits.join('').length < 6}
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-black font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                  id="verify-forgot-otp-btn"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Verifying OTP...</span>
                    </div>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>VERIFY OTP</span>
                    </>
                  )}
                </button>

                {/* Resend OTP countdown */}
                <div className="text-center text-[11px] text-neutral-400 pt-0.5">
                  {countdown > 0 ? (
                    <span>
                      Resend code in <strong className="text-amber-400 font-mono">{countdown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendForgotOtp()}
                      className="text-amber-400 hover:text-amber-300 underline font-semibold cursor-pointer"
                      id="resend-forgot-otp-btn"
                    >
                      Resend Verification Code
                    </button>
                  )}
                </div>
              </form>
            )}

            {forgotStep === 'SET_NEW_PASSWORD' && (
              /* Step 3: Enter & Confirm New Password */
              <form onSubmit={handleResetPassword} className="space-y-3.5">
                <div className="space-y-1 text-center pb-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">NEW PASSWORD</h3>
                  <p className="text-[11px] text-neutral-400">
                    Create a new strong password for <span className="text-neutral-200 font-mono">{forgotEmail}</span>
                  </p>
                </div>

                {/* New Password Input */}
                <div className="space-y-1">
                  <label className="text-neutral-300 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Enter new password (Min 6 Characters) *</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 pr-10 text-neutral-100 focus:border-amber-500 focus:outline-none font-mono"
                      id="forgot-new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-1">
                  <label className="text-neutral-300 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-neutral-400" />
                    <span>CONFIRM PASSWORD *</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 pr-10 text-neutral-100 focus:border-amber-500 focus:outline-none font-mono"
                      id="forgot-confirm-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-black font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                  id="reset-password-btn"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Updating Password...</span>
                    </div>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>RESET PASSWORD</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Back to Sign In button */}
            <div className="pt-2 text-center border-t border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setMode('SIGN_IN');
                  setForgotStep('REQUEST_EMAIL');
                }}
                className="text-xs text-neutral-400 hover:text-amber-400 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                id="back-to-login-from-forgot"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Rider Sign In</span>
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* VIEW 3: REGISTER NEW RIDER ACCOUNT */}
        {/* ---------------------------------------------------- */}
        {mode === 'REGISTER' && (
          <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <label className="text-neutral-300 font-bold uppercase tracking-wider text-[10px]">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-neutral-100 focus:border-amber-500 focus:outline-none"
                id="customer-register-name"
              />
            </div>

            <div className="space-y-1">
              <label className="text-neutral-300 font-bold uppercase tracking-wider text-[10px]">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-neutral-100 font-mono focus:border-amber-500 focus:outline-none"
                id="customer-register-phone"
              />
            </div>

            <div className="space-y-1">
              <label className="text-neutral-300 font-bold uppercase tracking-wider text-[10px]">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-neutral-100 focus:border-amber-500 focus:outline-none"
                id="customer-register-email"
              />
            </div>

            <div className="space-y-1">
              <label className="text-neutral-300 font-bold uppercase tracking-wider text-[10px]">
                Create Password (Min 6 characters) *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-neutral-100 focus:border-amber-500 focus:outline-none font-mono"
                id="customer-register-password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-black font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              id="customer-register-submit-btn"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Creating Rider Account...</span>
                </div>
              ) : (
                <>
                  <span>Create Account &amp; Continue</span>
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
                  setMode('SIGN_IN');
                }}
                className="text-xs text-neutral-300 hover:text-white underline underline-offset-4 cursor-pointer"
              >
                Already have an account? Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
