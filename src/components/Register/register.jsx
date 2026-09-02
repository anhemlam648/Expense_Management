import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MdPerson, MdEmail, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { supabase, hasSupabase } from '../../lib/supabase';
import { useLanguage } from '../../context/LanguageContext';
import logo from '../../assets/mobile-banking.png';
const Register = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError(t.auth.passwordMismatch);
      return;
    }

    if (!formData.username.trim()) {
      setError(t.auth.enterUsername);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp(
        {
          email: formData.email,
          password: formData.password,
        },
        {
          data: {
            username: formData.username.trim(),
          },
        }
      );

      if (error) {
        setError(error.message || t.auth.registrationFailed);
        return;
      }

      if (data?.user?.id) {
        const { error: profileError } = await supabase.from('profiles').upsert(
          {
            id: data.user.id,
            email: formData.email,
            username: formData.username.trim(),
            wallet_balance: 0,
          },
          { onConflict: 'id' }
        );

        if (profileError) {
          console.error('Profile setup failed:', profileError);
        }
      }

      navigate('/login');
    } catch (err) {
      setError(t.auth.genericRegisterError);
    } finally {
      setLoading(false);
    }
  };

  if (!hasSupabase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10 text-slate-900">
        <div className="rounded-[2rem] bg-white p-10 shadow-2xl shadow-slate-200 text-center max-w-xl">
          <h1 className="text-3xl font-bold mb-4">{t.auth.supabaseNotConfigured}</h1>
          <p className="text-slate-600">{t.auth.supabaseRegisterText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10 text-slate-900">
      <div className="relative mx-auto w-full max-w-xl overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-slate-200">
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500" />
        <div className="relative p-10 pt-24">
          <div className="mb-4 flex justify-end">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-xl border border-white/40 bg-white/10 px-3 py-2 text-sm text-white outline-none backdrop-blur-sm"
            >
              <option value="en" className="text-slate-900">English</option>
              <option value="vi" className="text-slate-900">Tiếng Việt</option>
            </select>
          </div>

          <div className="mb-10 text-center text-white">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 text-2xl font-bold shadow-lg shadow-slate-300/20">
              ✨
            </div>
            <h1 className="text-4xl font-extrabold">{t.auth.registerTitle}</h1>
            <p className="mt-3 text-sm text-slate-100/90">{t.auth.registerSubtitle}</p>
          </div>

          <div className="rounded-[2rem] bg-slate-50 p-8 shadow-xl shadow-slate-200/60">
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-semibold text-slate-700">{t.auth.username}</label>
                <div className="relative">
                  <MdPerson className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sky-500 text-xl" />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    placeholder={t.auth.usernamePlaceholder}
                    className="w-full rounded-3xl border border-slate-200 bg-white py-3 pl-14 pr-4 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-slate-700">{t.auth.email}</label>
                <div className="relative">
                  <MdEmail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sky-500 text-xl" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder={t.auth.emailPlaceholder}
                    className="w-full rounded-3xl border border-slate-200 bg-white py-3 pl-14 pr-4 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold text-slate-700">{t.auth.password}</label>
                <div className="relative">
                  <MdLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sky-500 text-xl" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder={t.auth.passwordPlaceholder}
                    className="w-full rounded-3xl border border-slate-200 bg-white py-3 pl-14 pr-4 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">{t.auth.confirmPassword}</label>
                <div className="relative">
                  <MdLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sky-500 text-xl" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder={t.auth.confirmPasswordPlaceholder}
                    className="w-full rounded-3xl border border-slate-200 bg-white py-3 pl-14 pr-16 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
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
                <p className="rounded-3xl bg-rose-50 px-4 py-3 text-center text-sm font-medium text-rose-700">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`flex w-full items-center justify-center rounded-3xl bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-sky-500/20 transition duration-300 ${loading ? 'cursor-not-allowed opacity-70' : 'hover:scale-[1.01]'}`}
              >
                {loading ? t.auth.registering : t.auth.createAccount}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              {t.auth.hasAccount}{' '}
              <Link to="/login" className="font-semibold text-sky-600 transition hover:text-sky-700">
                {t.auth.signInLink}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
