import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { supabase, hasSupabase } from '../../lib/supabase';
import { useCurrency, CURRENCIES } from '../../context/CurrencyContext';

const Settings = () => {
  const navigate = useNavigate();
  const { currency, updateCurrency } = useCurrency();
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState('');
  const [currentBalance, setCurrentBalance] = useState(0);
  const [balanceInput, setBalanceInput] = useState('');
  const [balanceAction, setBalanceAction] = useState('add');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarData, setAvatarData] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const savedBalance = savedUser.balance ?? 0;
      const savedAvatar = savedUser.avatar || '';
      const savedUsername = savedUser.username || '';

      if (!hasSupabase) {
        setProfile({
          id: null,
          email: savedUser.email || '',
          username: savedUsername,
        });
        setUsername(savedUsername);
        setCurrentBalance(Number(savedBalance));
        setBalanceInput('');
        setAvatarPreview(savedAvatar);
        setAvatarData(savedAvatar);
        setLoadingProfile(false);
        return;
      }

      setLoadingProfile(true);
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        console.error('Failed to load auth user:', authError);
        setLoadingProfile(false);
        return;
      }

      const metadata = authData.user.user_metadata || {};
  
      const userBalance = Number(metadata.balance ?? savedBalance ?? 0);
      const userAvatar = metadata.avatar_url || metadata.avatar || savedAvatar;
      const usernameValue =
          metadata.username ||
          savedUsername ||
          authData.user.email?.split('@')[0] ||
          'User';
      setProfile({
        id: authData.user.id,
        email: authData.user.email,
        username: usernameValue,
      });
      setUsername(usernameValue);
      setCurrentBalance(userBalance);
      setBalanceInput('');
      setAvatarPreview(userAvatar);
      setAvatarData(userAvatar);
      setLoadingProfile(false);
    };

    fetchUserProfile();
  }, []);

  const getInitial = () => {
    if (profile?.username) {
      return profile.username.charAt(0).toUpperCase();
    }
    if (profile?.email) {
      return profile.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target.result);
      setAvatarData(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleSave = async () => {
    if (!username.trim()) {
      setMessage('Username cannot be empty.');
      return;
    }

    if (newPassword && !currentPassword) {
      setMessage('Vui lòng nhập mật khẩu cũ để cập nhật mật khẩu mới.');
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      if (newPassword) {
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          username: profile.username,
          email: profile.email,
          password: currentPassword,
        });
        if (verifyError) {
          throw new Error('Old password is incorrect.');
        }
      }

      const amountValue = Number(balanceInput || 0);
      let nextBalance = currentBalance;

      if (balanceInput !== '') {
        if (Number.isNaN(amountValue) || amountValue < 0) {
          throw new Error('Please enter a valid non-negative balance amount.');
        }

        if (balanceAction === 'add') {
          nextBalance += amountValue;
        } else {
          nextBalance = amountValue;
        }
      }

      const metadata = {
        username: username.trim(),
        balance: nextBalance,
      };
      if (avatarData) metadata.avatar_url = avatarData;

      const authUpdate = await supabase.auth.updateUser({
        password: newPassword || undefined,
        data: metadata,
      });

      if (authUpdate.error) {
        throw new Error(authUpdate.error.message || 'Failed to update auth information.');
      }

      const updatedProfile = { ...profile, username: username.trim() };
      setProfile(updatedProfile);
      setCurrentBalance(nextBalance);
      setBalanceInput('');
      const currentStorage = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem(
        'user',
        JSON.stringify({
          ...currentStorage,
          id: profile?.id,
          email: profile?.email,
          username: username.trim(),
          balance: nextBalance,
          avatar: avatarData || currentStorage.avatar || '',
        })
      );
      setCurrentPassword('');
      setNewPassword('');
      setMessage('Settings saved successfully!');
    } catch (error) {
      setMessage(error.message || 'Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!hasSupabase) {
    return (
      <div className="flex-1 min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-slate-50 text-slate-900">
        <div className="max-w-3xl mx-auto w-full text-center">
          <div className="rounded-[2rem] bg-white p-10 shadow-xl">
            <h1 className="text-3xl font-bold text-slate-900">Supabase is not configured</h1>
            <p className="mt-4 text-slate-600">Please add environment variables VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to load profile information.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loadingProfile) {
    return (
      <div className="flex-1 min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-slate-50 text-slate-900">
        <div className="max-w-3xl mx-auto w-full text-center">
          <div className="rounded-[2rem] bg-white p-10 shadow-xl">
            <p className="text-slate-600">Loading profile information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-slate-50 text-slate-900">
        <div className="max-w-3xl mx-auto w-full text-center">
          <div className="rounded-[2rem] bg-white p-10 shadow-xl">
            <h1 className="text-3xl font-bold text-slate-900">Please log in</h1>
            <p className="mt-4 text-slate-600">User information not found. Please log in again to continue.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-slate-50 text-slate-900">
      <div className="max-w-3xl mx-auto w-full">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Profile Settings</h1>
          <p className="mt-2 text-sm sm:text-base text-slate-500">
            Manage your profile and preferences
          </p>
        </header>

        {profile ? (
          <section className="p-6 sm:p-8 rounded-3xl shadow-xl bg-white">
            <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
                <div className="mx-auto mb-4 h-28 w-28 overflow-hidden rounded-full bg-white shadow-xl">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-500 to-teal-500 text-4xl font-bold text-white">
                      {getInitial()}
                    </div>
                  )}
                </div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Profile photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="mx-auto block w-full cursor-pointer rounded-3xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition hover:border-slate-300"
                />
                <p className="mt-4 text-sm text-slate-500">Hình ảnh này sẽ hiển thị trong phần profile của bạn.</p>
              </div>

              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Tên hiện tại</label>
                    <div className="mt-2 rounded-3xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-700">
                      {username || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Email</label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Đơn vị tiền tệ</label>
                    <select
                      value={currency}
                      onChange={(e) => updateCurrency(e.target.value)}
                      className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                    >
                      {Object.entries(CURRENCIES).map(([code, data]) => (
                        <option key={code} value={code}>
                          {data.symbol} {data.code} - {data.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Tên mới (nếu muốn thay đổi)</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                      placeholder="Nhập tên mới"
                    />
                  </div>
                  <div />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Nhập khẩu hiện tại</label>
                    <div className="relative mt-2">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 pr-24 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                        placeholder="Nhập mật khẩu cũ"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword((prev) => !prev)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm"
                      >
                        {showCurrentPassword ? 'Ẩn' : 'Hiện'}
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">Nhập mật khẩu cũ để xác thực trước khi đổi mật khẩu mới.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Mật khẩu mới</label>
                    <div className="relative mt-2">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 pr-24 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                        placeholder="Nhập mật khẩu mới"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm"
                      >
                        {showNewPassword ? 'Ẩn' : 'Hiện'}
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">Nhập mật khẩu mới nếu bạn muốn cập nhật.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">Số dư ví hiện tại</label>
                  <div className="mt-2 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900">
                    ${currentBalance.toLocaleString()}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Cập nhật số dư</label>
                  <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_auto]">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={balanceInput}
                      onChange={(e) => setBalanceInput(e.target.value)}
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                      placeholder="Nhập số tiền"
                    />
                    <select
                      value={balanceAction}
                      onChange={(e) => setBalanceAction(e.target.value)}
                      className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                    >
                      <option value="add">Cộng thêm</option>
                      <option value="set">Gán giá trị mới</option>
                    </select>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    Nếu chọn “Cộng thêm”, số tiền sẽ được cộng vào số dư hiện tại. Nếu chọn “Gán giá trị mới”, số dư sẽ được đặt lại.
                  </p>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <p className="text-center text-slate-500 mb-8">Loading profile...</p>
        )}

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 rounded-3xl bg-teal-600 px-6 py-3 text-white font-semibold shadow-lg transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 rounded-3xl bg-rose-500 px-6 py-3 text-white font-semibold shadow-lg transition hover:bg-rose-600"
          >
            Logout
          </button>
        </div>
        {message && (
          <p className={`mt-4 text-center text-sm font-medium ${message.toLowerCase().includes('success') ? 'text-emerald-600' : 'text-rose-600'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default Settings;
