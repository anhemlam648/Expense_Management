import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { supabase, hasSupabase } from '../../lib/supabase';
import logo from '../../assets/mobile-banking.png';
const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
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
        setError(error.message || 'Invalid email or password');
        return;
      }

      if (!data?.session?.user) {
        setError('Please confirm your email or check your credentials.');
        return;
      }

      const user = data.session.user;
      const profileResponse = await supabase
        .from('profiles')
        .select('username,email')
        .eq('id', user.id)
        .single();

      const profile = profileResponse.data || { username: '', email: user.email };
      const metadata = user.user_metadata || {};
      const balanceValue = Number(profile.balance ?? metadata.balance ?? 0);
      const avatarValue = profile.avatar_url || metadata.avatar_url || metadata.avatar || '';
      const usernameValue = profile.username || metadata.username || '';

      localStorage.setItem(
        'user',
        JSON.stringify({
          id: user.id,
          email: user.email,
          username: usernameValue,
          balance: balanceValue,
          avatar: avatarValue,
        })
      );
      localStorage.setItem('token', data.session.access_token);
      navigate('/');
    } catch {
      setError('An error occurred while signing in.');
    } finally {
      setLoading(false);
    }
  };

  if (!hasSupabase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10 text-slate-900">
        <div className="rounded-[2rem] bg-white p-10 shadow-2xl shadow-slate-200 text-center max-w-xl">
          <h1 className="text-3xl font-bold mb-4">Supabase chưa cấu hình</h1>
          <p className="text-slate-600">Vui lòng thêm biến môi trường VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY để đăng nhập.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10 text-slate-900">
      <div className="relative mx-auto w-full max-w-xl overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-slate-200">
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500" />
        <div className="relative p-10 pt-24">
          <div className="mb-10 text-center text-white">

            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 text-2xl font-bold shadow-lg shadow-slate-300/20">
              <img src={logo} alt="Logo" className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-extrabold">Wallet Login</h1>
            <p className="mt-3 text-sm text-slate-100/90">Sign in to access your virtual wallet and expense reports.</p>
          </div>

          <div className="rounded-[2rem] bg-slate-50 p-8 shadow-xl shadow-slate-200/60">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-slate-700">Email</label>
                <div className="relative">
                  <MdEmail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sky-500 text-xl" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full rounded-3xl border border-slate-200 bg-white py-3 pl-14 pr-4 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                    placeholder="Email address"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <MdLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sky-500 text-xl" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full rounded-3xl border border-slate-200 bg-white py-3 pl-14 pr-16 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                    placeholder="Password"
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
                className={`flex w-full items-center justify-center rounded-3xl bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-sky-500/20 transition duration-300 ${loading ? 'cursor-not-allowed opacity-70' : 'hover:scale-[1.01]'}`}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              Don’t have an account?{' '}
              <Link to="/register" className="font-semibold text-sky-600 transition hover:text-sky-700">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
