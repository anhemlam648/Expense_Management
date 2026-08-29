import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MdPerson, MdEmail, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { supabase, hasSupabase } from '../../lib/supabase';
import logo from '../../assets/mobile-banking.png';
const Register = () => {
  const navigate = useNavigate();
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
      setError('Passwords do not match');
      return;
    }

    if (!formData.username.trim()) {
      setError('Please enter a username');
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
        setError(error.message || 'Registration failed');
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
      setError('An error occurred while registering.');
    } finally {
      setLoading(false);
    }
  };

  if (!hasSupabase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10 text-slate-900">
        <div className="rounded-[2rem] bg-white p-10 shadow-2xl shadow-slate-200 text-center max-w-xl">
          <h1 className="text-3xl font-bold mb-4">Supabase chưa cấu hình</h1>
          <p className="text-slate-600">Vui lòng thêm biến môi trường VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY để đăng ký người dùng.</p>
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
              ✨
            </div>
            <h1 className="text-4xl font-extrabold">Create Your Wallet</h1>
            <p className="mt-3 text-sm text-slate-100/90">Set up a virtual wallet and start tracking your expenses.</p>
          </div>

          <div className="rounded-[2rem] bg-slate-50 p-8 shadow-xl shadow-slate-200/60">
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-semibold text-slate-700">Username</label>
                <div className="relative">
                  <MdPerson className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sky-500 text-xl" />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    placeholder="Username"
                    className="w-full rounded-3xl border border-slate-200 bg-white py-3 pl-14 pr-4 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  />
                </div>
              </div>

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
                    placeholder="Email address"
                    className="w-full rounded-3xl border border-slate-200 bg-white py-3 pl-14 pr-4 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
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
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Password"
                    className="w-full rounded-3xl border border-slate-200 bg-white py-3 pl-14 pr-4 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">Confirm Password</label>
                <div className="relative">
                  <MdLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sky-500 text-xl" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Confirm password"
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
                {loading ? 'Registering...' : 'Sign Up'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-sky-600 transition hover:text-sky-700">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
