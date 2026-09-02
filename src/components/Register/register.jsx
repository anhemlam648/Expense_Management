import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MdPerson, MdEmail, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { supabase, hasSupabase } from '../../lib/supabase';
import { useLanguage } from '../../context/LanguageContext';

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
            <h2 className="text-3xl font-extrabold text-slate-800 sm:text-[2.2rem]">{t.auth.registerTitle}</h2>
            <p className="mt-2 text-base text-slate-500">{t.auth.registerSubtitle}</p>
          </div>

          <div className="space-y-5 rounded-[24px] bg-[#edf2f7] p-4 sm:p-6">
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label htmlFor="username" className="mb-2 block text-lg font-medium text-slate-700">{t.auth.username}</label>
                <div className="relative">
                  <MdPerson className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sky-500 text-2xl" />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    placeholder={t.auth.usernamePlaceholder}
                    className="w-full rounded-[28px] border-2 border-slate-200 bg-white py-4 pl-14 pr-4 text-lg text-slate-800 shadow-inner outline-none placeholder:text-slate-500 focus:border-sky-400"
                  />
                </div>
              </div>

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
                    placeholder={t.auth.emailPlaceholder}
                    className="w-full rounded-[28px] border-2 border-slate-200 bg-white py-4 pl-14 pr-4 text-lg text-slate-800 shadow-inner outline-none placeholder:text-slate-500 focus:border-sky-400"
                  />
                </div>
              </div>

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
                    placeholder={t.auth.passwordPlaceholder}
                    className="w-full rounded-[28px] border-2 border-slate-200 bg-white py-4 pl-14 pr-14 text-lg text-slate-800 shadow-inner outline-none placeholder:text-slate-500 focus:border-sky-400"
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

              <div>
                <label htmlFor="confirmPassword" className="mb-2 block text-lg font-medium text-slate-700">{t.auth.confirmPassword}</label>
                <div className="relative">
                  <MdLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sky-500 text-2xl" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder={t.auth.confirmPasswordPlaceholder}
                    className="w-full rounded-[28px] border-2 border-slate-200 bg-white py-4 pl-14 pr-14 text-lg text-slate-800 shadow-inner outline-none placeholder:text-slate-500 focus:border-sky-400"
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
                className={`flex w-full items-center justify-center rounded-[28px] bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-500 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-sky-200 transition ${loading ? 'cursor-not-allowed opacity-70' : 'hover:scale-[1.01]'}`}
              >
                {loading ? t.auth.registering : t.auth.createAccount}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-600">
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
