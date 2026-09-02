import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { supabase, hasSupabase } from '../../lib/supabase';
import { useLanguage } from '../../context/LanguageContext';

const Login = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [forgotPassword, setForgotPassword] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!hasSupabase) return undefined;

    const recoveryType = new URLSearchParams(window.location.hash.slice(1)).get('type');
    if (recoveryType === 'recovery') {
      setRecoveryMode(true);
    }

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true);
        setForgotPassword(false);
        setError('');
      }
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setResetMessage('');
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setError('');
    setResetMessage('');

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        formData.email,
        {
          redirectTo:
            import.meta.env.VITE_PASSWORD_RESET_REDIRECT_URL ||
            (window.location.hostname === 'localhost'
              ? `${window.location.origin}/login/`
              : 'https://symphonious-empanada-f72dca.netlify.app/login/'),
        }
      );

      if (resetError) {
        setError(t.auth.resetLinkError);
        return;
      }

      setResetMessage(t.auth.resetLinkSent);
    } catch {
      setError(t.auth.resetLinkError);
    } finally {
      setResetLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setError('');
    setResetMessage('');

    if (newPassword !== confirmNewPassword) {
      setError(t.auth.passwordsDoNotMatch);
      setResetLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(t.auth.passwordUpdateError);
        return;
      }

      setResetMessage(t.auth.passwordUpdated);
      setNewPassword('');
      setConfirmNewPassword('');
      setRecoveryMode(false);
    } catch {
      setError(t.auth.passwordUpdateError);
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        const isInvalidLogin = /invalid.*(login|credentials)|email or password/i.test(
          error.message || ''
        );

        setError(isInvalidLogin ? t.auth.invalidCredentials : error.message || t.auth.genericError);
        return;
      }

      if (!data?.session?.user) {
        setError(t.auth.confirmEmail);
        return;
      }

      const user = data.session.user;
      const profileResponse = await supabase
        .from('profiles')
        .select('username,email,avatar_url,wallet_balance')
        .eq('id', user.id)
        .maybeSingle();

      const profile = profileResponse?.data || { username: '', email: user.email, wallet_balance: 0, avatar_url: '' };
      const metadata = user.user_metadata || {};
      const balanceValue = Number(
        profile.wallet_balance ?? profile.balance ?? metadata.wallet_balance ?? metadata.balance ?? 0
      );
      const avatarValue = profile.avatar_url || metadata.avatar_url || metadata.avatar || '';
      const usernameValue = profile.username || metadata.username || '';

      const nextProfile = {
        id: user.id,
        email: user.email,
        username: usernameValue || user.email.split('@')[0],
        wallet_balance: balanceValue,
        avatar_url: avatarValue,
      };

      await supabase.from('profiles').upsert(nextProfile, { onConflict: 'id' });

      localStorage.setItem(
        'user',
        JSON.stringify({
          id: user.id,
          email: user.email,
          username: usernameValue || user.email.split('@')[0],
          balance: balanceValue,
          wallet_balance: balanceValue,
          avatar: avatarValue,
        })
      );
      localStorage.setItem('token', data.session.access_token);
      navigate('/home', { replace: true });
    } catch {
      setError(t.auth.genericError);
    } finally {
      setLoading(false);
    }
  };

  if (!hasSupabase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10 text-slate-900">
        <div className="rounded-[2rem] bg-white p-10 shadow-2xl shadow-slate-200 text-center max-w-xl">
          <h1 className="text-3xl font-bold mb-4">{t.auth.supabaseNotConfigured}</h1>
          <p className="text-slate-600">{t.auth.supabaseConfigText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3f5f7] px-4 py-8 text-slate-900">
      <div className="w-full max-w-[660px]">
        <div className="mb-6 flex items-center justify-end px-1">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none"
          >
            <option value="en">English</option>
            <option value="vi">Tiếng Việt</option>
          </select>
        </div>

        <div className="rounded-[28px] bg-[#f5f8fb] p-5 shadow-[0_10px_25px_rgba(148,163,184,0.15)] sm:p-7">
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-extrabold text-slate-800 sm:text-[2.2rem]">{t.auth.loginTitle}</h2>
            <p className="mt-2 text-base text-slate-500">{t.auth.loginSubtitle}</p>
          </div>

          <div className="space-y-5 rounded-[24px] bg-[#edf2f7] p-4 sm:p-6">
            {recoveryMode ? (
              <form onSubmit={handleUpdatePassword} className="space-y-5">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-slate-800">{t.auth.resetPasswordTitle}</h3>
                </div>

                <div>
                  <label htmlFor="new-password" className="mb-2 block text-lg font-medium text-slate-700">{t.auth.newPassword}</label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-[28px] border-2 border-slate-200 bg-white py-4 px-5 text-lg text-slate-800 shadow-inner outline-none placeholder:text-slate-500 focus:border-sky-400"
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <label htmlFor="confirm-new-password" className="mb-2 block text-lg font-medium text-slate-700">{t.auth.confirmNewPassword}</label>
                  <input
                    id="confirm-new-password"
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-[28px] border-2 border-slate-200 bg-white py-4 px-5 text-lg text-slate-800 shadow-inner outline-none placeholder:text-slate-500 focus:border-sky-400"
                    autoComplete="new-password"
                  />
                </div>

                {error && (
                  <div className="rounded-3xl bg-rose-50 px-4 py-3 text-center text-sm font-medium text-rose-700">{error}</div>
                )}

                {resetMessage && (
                  <div className="rounded-3xl bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-700">{resetMessage}</div>
                )}

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex w-full items-center justify-center rounded-[28px] bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-500 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-sky-200 transition disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {resetLoading ? t.auth.signingIn : t.auth.resetPasswordTitle}
                </button>
              </form>
            ) : forgotPassword ? (
              <form onSubmit={handlePasswordReset} className="space-y-5">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-slate-800">{t.auth.forgotPasswordTitle}</h3>
                  <p className="mt-2 text-sm text-slate-500">{t.auth.forgotPasswordText}</p>
                </div>

                <div>
                  <label htmlFor="reset-email" className="mb-2 block text-lg font-medium text-slate-700">{t.auth.email}</label>
                  <div className="relative">
                    <MdEmail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sky-500 text-2xl" />
                    <input
                      id="reset-email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full rounded-[28px] border-2 border-slate-200 bg-white py-4 pl-14 pr-4 text-lg text-slate-800 shadow-inner outline-none placeholder:text-slate-500 focus:border-sky-400"
                      placeholder={t.auth.emailPlaceholder}
                      autoComplete="email"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-3xl bg-rose-50 px-4 py-3 text-center text-sm font-medium text-rose-700">{error}</div>
                )}

                {resetMessage && (
                  <div className="rounded-3xl bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-700">{resetMessage}</div>
                )}

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex w-full items-center justify-center rounded-[28px] bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-500 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-sky-200 transition disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {resetLoading ? t.auth.signingIn : t.auth.sendResetLink}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setForgotPassword(false);
                    setError('');
                    setResetMessage('');
                  }}
                  className="block w-full text-center text-sm font-semibold text-sky-600 transition hover:text-sky-700"
                >
                  {t.auth.backToLogin}
                </button>
              </form>
            ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-lg font-medium text-slate-700">{t.auth.email}</label>
                <div className="relative">
                  <MdEmail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sky-500 text-2xl" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full rounded-[28px] border-2 border-[#3ec3f2] bg-white py-4 pl-14 pr-4 text-lg text-slate-800 shadow-inner outline-none placeholder:text-slate-500"
                    placeholder={t.auth.emailPlaceholder}
                    autoComplete="email"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setForgotPassword(true);
                  setError('');
                }}
                className="block w-full text-right text-sm font-semibold text-sky-600 transition hover:text-sky-700"
              >
                {t.auth.forgotPassword}
              </button>

              <div>
                <label htmlFor="password" className="mb-2 block text-lg font-medium text-slate-700">{t.auth.password}</label>
                <div className="relative">
                  <MdLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sky-500 text-2xl" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full rounded-[28px] border-2 border-slate-200 bg-white py-4 pl-14 pr-14 text-lg text-slate-800 shadow-inner outline-none placeholder:text-slate-500 focus:border-sky-400"
                    placeholder={t.auth.passwordPlaceholder}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                  >
                    {showPassword ? <MdVisibilityOff className="h-5 w-5" /> : <MdVisibility className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-3xl bg-rose-50 px-4 py-3 text-center text-sm font-medium text-rose-700">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`flex w-full items-center justify-center rounded-[28px] bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-500 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-sky-200 transition ${loading ? 'cursor-not-allowed opacity-70' : 'hover:scale-[1.01]'}`}
              >
                {loading ? t.auth.signingIn : t.auth.signIn}
              </button>
            </form>
            )}

            {!forgotPassword && <p className="mt-5 text-center text-sm text-slate-600">
              {t.auth.noAccount}{' '}
              <Link to="/register" className="font-semibold text-sky-600 transition hover:text-sky-700">
                {t.auth.signUp}
              </Link>
            </p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
