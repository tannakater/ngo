import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, Loader2, Mail, Lock, Eye, EyeOff, 
  AlertCircle, ArrowLeft
} from 'lucide-react';
import { useOrgStore } from '../../store/useOrgStore';
import { useNgoStore } from '../../store/useNgoStore';
import { initAuth, signInWithEmail, googleSignIn, AdminUser } from '../../lib/auth';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [loading, setLoading] = useState(true);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const { organization, syncWithFirebase, webUsers } = useOrgStore();
  const { syncNgoWithUser } = useNgoStore();

  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setNeedsAuth(false);
        setLoading(false);
        if (currentUser?.uid) {
          syncWithFirebase(currentUser.uid);
          syncNgoWithUser(currentUser.uid);
        }
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [syncWithFirebase, syncNgoWithUser]);

  const sanitizeAuthError = (err: any, fallback: string): string => {
    if (!err) return fallback;
    const msg = String(err.message || err.code || err || '').toLowerCase();
    
    if (msg.includes('popup-closed') || msg.includes('cancelled') || msg.includes('canceled')) {
      return 'Sign-in was cancelled.';
    }
    if (msg.includes('network') || msg.includes('offline') || msg.includes('timeout')) {
      return 'Network connection issue. Please check your internet and try again.';
    }
    if (msg.includes('privilege') || msg.includes('denied') || msg.includes('unauthorized') || msg.includes('role')) {
      return 'Access denied. This account does not have administrative privileges.';
    }
    if (msg.includes('password') || msg.includes('email') || msg.includes('credential') || msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid') || msg.includes('auth')) {
      return 'Invalid email or password. Please try again.';
    }
    return 'Invalid email or password. Please try again.';
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setSubmitting(true);
    try {
      const result = await googleSignIn();
      if (result?.user) {
        setUser(result.user);
        setNeedsAuth(false);
        syncWithFirebase(result.user.uid);
        syncNgoWithUser(result.user.uid);
      }
    } catch (err: any) {
      console.warn('Google sign-in attempt warning:', err);
      setErrorMessage(sanitizeAuthError(err, 'Access denied or sign-in cancelled.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    try {
      const admin = await signInWithEmail(email, password, rememberMe);
      setUser(admin);
      setNeedsAuth(false);
      if (admin.uid) {
        syncWithFirebase(admin.uid);
        syncNgoWithUser(admin.uid);
      }
    } catch (err: any) {
      console.warn('Email sign-in attempt warning:', err);
      setErrorMessage(sanitizeAuthError(err, 'Invalid email or password. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (!needsAuth && user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <img 
              src="/daksheba.jpg" 
              alt="Logo" 
              className="h-14 w-14 rounded-full object-cover shadow-md border-2 border-slate-200" 
            />
          </div>
          <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-slate-900">
            Sign in to your account
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-200">
            {errorMessage && (
              <div className="mb-4 rounded-md bg-red-50 p-4 border border-red-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Login failed</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{errorMessage}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleEmailLogin}>
              <div>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={submitting}
                  className="flex w-full justify-center items-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold leading-6 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 cursor-pointer"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm font-medium leading-6">
                  <span className="bg-white px-6 text-slate-900">Or continue with email</span>
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium leading-6 text-slate-900">
                  Email address
                </label>
                <div className="mt-2 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-md border-0 py-1.5 pl-10 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium leading-6 text-slate-900">
                  Password
                </label>
                <div className="mt-2 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-md border-0 py-1.5 pl-10 pr-10 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                  />
                  <label htmlFor="remember-me" className="ml-3 block text-sm leading-6 text-slate-900">
                    Remember me
                  </label>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign in'}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-4 text-center">
            <Link to="/" className="text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to website
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
