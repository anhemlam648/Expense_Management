// import React, { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { MdVisibility, MdVisibilityOff } from 'react-icons/md';
// import { supabase, hasSupabase } from '../../lib/supabase';
// import { useCurrency, CURRENCIES } from '../../context/CurrencyContext';

// const Settings = () => {
//   const navigate = useNavigate();
//   const { currency, updateCurrency } = useCurrency();
//   const [profile, setProfile] = useState(null);
//   const [username, setUsername] = useState('');
//   const [currentBalance, setCurrentBalance] = useState(0);
//   const [balanceInput, setBalanceInput] = useState('');
//   const [balanceAction, setBalanceAction] = useState('add');
//   const [avatarPreview, setAvatarPreview] = useState('');
//   const [avatarData, setAvatarData] = useState('');
//   const [currentPassword, setCurrentPassword] = useState('');
//   const [newPassword, setNewPassword] = useState('');
//   const [showCurrentPassword, setShowCurrentPassword] = useState(false);
//   const [showNewPassword, setShowNewPassword] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [loadingProfile, setLoadingProfile] = useState(true);
//   const [message, setMessage] = useState(null);

//   useEffect(() => {
//     const fetchUserProfile = async () => {
//       const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
//       const savedBalance = savedUser.balance ?? 0;
//       const savedAvatar = savedUser.avatar || '';
//       const savedUsername = savedUser.username || '';

//       if (!hasSupabase) {
//         setProfile({
//           id: null,
//           email: savedUser.email || '',
//           username: savedUsername,
//         });
//         setUsername(savedUsername);
//         setCurrentBalance(Number(savedBalance));
//         setBalanceInput('');
//         setAvatarPreview(savedAvatar);
//         setAvatarData(savedAvatar);
//         setLoadingProfile(false);
//         return;
//       }

//       setLoadingProfile(true);
//       const { data: authData, error: authError } = await supabase.auth.getUser();
//       if (authError || !authData?.user) {
//         console.error('Failed to load auth user:', authError);
//         setLoadingProfile(false);
//         return;
//       }

//       const metadata = authData.user.user_metadata || {};
  
//       const userBalance = Number(metadata.balance ?? savedBalance ?? 0);
//       const userAvatar = metadata.avatar_url || metadata.avatar || savedAvatar;
//       const usernameValue =
//           metadata.username ||
//           savedUsername ||
//           authData.user.email?.split('@')[0] ||
//           'User';
//       setProfile({
//         id: authData.user.id,
//         email: authData.user.email,
//         username: usernameValue,
//       });
//       setUsername(usernameValue);
//       setCurrentBalance(userBalance);
//       setBalanceInput('');
//       setAvatarPreview(userAvatar);
//       setAvatarData(userAvatar);
//       setLoadingProfile(false);
//     };

//     fetchUserProfile();
//   }, []);

//   const getInitial = () => {
//     if (profile?.username) {
//       return profile.username.charAt(0).toUpperCase();
//     }
//     if (profile?.email) {
//       return profile.email.charAt(0).toUpperCase();
//     }
//     return 'U';
//   };

//   const handleAvatarUpload = (event) => {
//     const file = event.target.files?.[0];
//     if (!file) return;

//     const reader = new FileReader();
//     reader.onload = (e) => {
//       setAvatarPreview(e.target.result);
//       setAvatarData(e.target.result);
//     };
//     reader.readAsDataURL(file);
//   };

//   const handleLogout = () => {
//     localStorage.removeItem('token');
//     localStorage.removeItem('user');
//     navigate('/login');
//   };

//   const handleSave = async () => {
//     if (!username.trim()) {
//       setMessage('Username cannot be empty.');
//       return;
//     }

//     if (newPassword && !currentPassword) {
//       setMessage('Please enter your old password to update your new password.');
//       return;
//     }

//     setLoading(true);
//     setMessage(null);

//     try {
//       if (newPassword) {
//         const { error: verifyError } = await supabase.auth.signInWithPassword({
//           username: profile.username,
//           email: profile.email,
//           password: currentPassword,
//         });
//         if (verifyError) {
//           throw new Error('Old password is incorrect.');
//         }
//       }

//       const amountValue = Number(balanceInput || 0);
//       let nextBalance = currentBalance;

//       if (balanceInput !== '') {
//         if (Number.isNaN(amountValue) || amountValue < 0) {
//           throw new Error('Please enter a valid non-negative balance amount.');
//         }

//         if (balanceAction === 'add') {
//           nextBalance += amountValue;
//         } else {
//           nextBalance = amountValue;
//         }
//       }

//       const metadata = {
//         username: username.trim(),
//         balance: nextBalance,
//       };
//       if (avatarData) metadata.avatar_url = avatarData;

//       const authUpdate = await supabase.auth.updateUser({
//         password: newPassword || undefined,
//         data: metadata,
//       });

//       if (authUpdate.error) {
//         throw new Error(authUpdate.error.message || 'Failed to update auth information.');
//       }

//       const updatedProfile = { ...profile, username: username.trim() };
//       setProfile(updatedProfile);
//       setCurrentBalance(nextBalance);
//       setBalanceInput('');
//       const currentStorage = JSON.parse(localStorage.getItem('user') || '{}');
//       localStorage.setItem(
//         'user',
//         JSON.stringify({
//           ...currentStorage,
//           id: profile?.id,
//           email: profile?.email,
//           username: username.trim(),
//           balance: nextBalance,
//           avatar: avatarData || currentStorage.avatar || '',
//         })
//       );
//       setCurrentPassword('');
//       setNewPassword('');
//       setMessage('Settings saved successfully!');
//     } catch (error) {
//       setMessage(error.message || 'Failed to save settings. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!hasSupabase) {
//     return (
//       <div className="flex-1 min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-slate-50 text-slate-900">
//         <div className="max-w-3xl mx-auto w-full text-center">
//           <div className="rounded-[2rem] bg-white p-10 shadow-xl">
//             <h1 className="text-3xl font-bold text-slate-900">Supabase is not configured</h1>
//             <p className="mt-4 text-slate-600">Please add environment variables VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to load profile information.</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (loadingProfile) {
//     return (
//       <div className="flex-1 min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-slate-50 text-slate-900">
//         <div className="max-w-3xl mx-auto w-full text-center">
//           <div className="rounded-[2rem] bg-white p-10 shadow-xl">
//             <p className="text-slate-600">Loading profile information...</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (!profile) {
//     return (
//       <div className="flex-1 min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-slate-50 text-slate-900">
//         <div className="max-w-3xl mx-auto w-full text-center">
//           <div className="rounded-[2rem] bg-white p-10 shadow-xl">
//             <h1 className="text-3xl font-bold text-slate-900">Please log in</h1>
//             <p className="mt-4 text-slate-600">User information not found. Please log in again to continue.</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex-1 min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-slate-50 text-slate-900">
//       <div className="max-w-3xl mx-auto w-full">
//         <header className="mb-10 text-center">
//           <h1 className="text-3xl font-bold text-slate-900">Profile Settings</h1>
//           <p className="mt-2 text-sm sm:text-base text-slate-500">
//             Manage your profile and preferences
//           </p>
//         </header>

//         {profile ? (
//           <section className="p-6 sm:p-8 rounded-3xl shadow-xl bg-white">
//             <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
//               <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
//                 <div className="mx-auto mb-4 h-28 w-28 overflow-hidden rounded-full bg-white shadow-xl">
//                   {avatarPreview ? (
//                     <img src={avatarPreview} alt="Profile" className="h-full w-full object-cover" />
//                   ) : (
//                     <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-500 to-teal-500 text-4xl font-bold text-white">
//                       {getInitial()}
//                     </div>
//                   )}
//                 </div>
//                 <label className="block text-sm font-medium text-slate-600 mb-2">Profile photo</label>
//                 <input
//                   type="file"
//                   accept="image/*"
//                   onChange={handleAvatarUpload}
//                   className="mx-auto block w-full cursor-pointer rounded-3xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition hover:border-slate-300"
//                 />
//                 <p className="mt-4 text-sm text-slate-500">Hình ảnh này sẽ hiển thị trong phần profile của bạn.</p>
//               </div>

//               <div className="space-y-6">
//                 <div className="grid gap-4 sm:grid-cols-2">
//                   <div>
//                     <label className="block text-sm font-semibold text-slate-700">Current name</label>
//                     <div className="mt-2 rounded-3xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-700">
//                       {username || 'N/A'}
//                     </div>
//                   </div>
//                   <div>
//                     <label className="block text-sm font-semibold text-slate-700">Email</label>
//                     <input
//                       type="email"
//                       value={profile.email}
//                       disabled
//                       className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500 outline-none"
//                     />
//                   </div>
//                 </div>

//                 <div className="grid gap-4 sm:grid-cols-2">
//                   <div>
//                     <label className="block text-sm font-semibold text-slate-700">Currency</label>
//                     <select
//                       value={currency}
//                       onChange={(e) => updateCurrency(e.target.value)}
//                       className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
//                     >
//                       {Object.entries(CURRENCIES).map(([code, data]) => (
//                         <option key={code} value={code}>
//                           {data.symbol} {data.code} - {data.name}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                 </div>

//                 <div className="grid gap-4 sm:grid-cols-2">
//                   <div>
//                     <label className="block text-sm font-semibold text-slate-700">New Username (Optional)</label>
//                     <input
//                       type="text"
//                       value={username}
//                       onChange={(e) => setUsername(e.target.value)}
//                       className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
//                       placeholder="Nhập tên mới"
//                     />
//                   </div>
//                   <div />
//                 </div>

//                 <div className="grid gap-4 sm:grid-cols-2">
//                   <div>
//                     <label className="block text-sm font-semibold text-slate-700">Current Password</label>
//                     <div className="relative mt-2">
//                       <input
//                         type={showCurrentPassword ? 'text' : 'password'}
//                         value={currentPassword}
//                         onChange={(e) => setCurrentPassword(e.target.value)}
//                         className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 pr-24 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
//                         placeholder="Nhập mật khẩu cũ"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => setShowCurrentPassword((prev) => !prev)}
//                         className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm"
//                       >
//                         {showCurrentPassword ? 'Ẩn' : 'Hiện'}
//                       </button>
//                     </div>
//                     <p className="mt-2 text-sm text-slate-500">Enter your current password to verify your identity before changing your password.</p>
//                   </div>

//                   <div>
//                     <label className="block text-sm font-semibold text-slate-700">New Password</label>
//                     <div className="relative mt-2">
//                       <input
//                         type={showNewPassword ? 'text' : 'password'}
//                         value={newPassword}
//                         onChange={(e) => setNewPassword(e.target.value)}
//                         className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 pr-24 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
//                         placeholder="Nhập mật khẩu mới"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => setShowNewPassword((prev) => !prev)}
//                         className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm"
//                       >
//                         {showNewPassword ? 'Ẩn' : 'Hiện'}
//                       </button>
//                     </div>
//                     <p className="mt-2 text-sm text-slate-500">Enter your new password if you want to update it.</p>
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-semibold text-slate-700">Current Wallet Balance</label>
//                   <div className="mt-2 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900">
//                     ${currentBalance.toLocaleString()}
//                   </div>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-semibold text-slate-700">Update Balance</label>
//                   <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_auto]">
//                     <input
//                       type="number"
//                       step="0.01"
//                       min="0"
//                       value={balanceInput}
//                       onChange={(e) => setBalanceInput(e.target.value)}
//                       className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
//                       placeholder="Nhập số tiền"
//                     />
//                     <select
//                       value={balanceAction}
//                       onChange={(e) => setBalanceAction(e.target.value)}
//                       className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
//                     >
//                       <option value="add">Add Amount</option>
//                       <option value="set">Set New Value</option>
//                     </select>
//                   </div>
//                   <p className="mt-2 text-sm text-slate-500">
//                     If you select "Add Amount", the specified amount will be added to your current balance. If you select "Set New Value", your balance will be updated to the specified amount.
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </section>
//         ) : (
//           <p className="text-center text-slate-500 mb-8">Loading profile...</p>
//         )}

//         <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
//           <button
//             onClick={handleSave}
//             disabled={loading}
//             className="flex-1 rounded-3xl bg-teal-600 px-6 py-3 text-white font-semibold shadow-lg transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
//           >
//             {loading ? 'Saving...' : 'Save Settings'}
//           </button>
//           <button
//             onClick={handleLogout}
//             className="flex-1 rounded-3xl bg-rose-500 px-6 py-3 text-white font-semibold shadow-lg transition hover:bg-rose-600"
//           >
//             Logout
//           </button>
//         </div>
//         {message && (
//           <p className={`mt-4 text-center text-sm font-medium ${message.toLowerCase().includes('success') ? 'text-emerald-600' : 'text-rose-600'}`}>
//             {message}
//           </p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Settings;


//code mới 
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdVisibility,
  MdVisibilityOff,
  MdPerson,
  MdEmail,
  MdLock,
  MdAccountBalanceWallet,
  MdLogout,
  MdSave,
  MdCameraAlt,
  MdCurrencyExchange,
} from 'react-icons/md';

import { supabase, hasSupabase } from '../../lib/supabase';
import { useCurrency, CURRENCIES } from '../../context/CurrencyContext';
import { useLanguage } from '../../context/LanguageContext';

const Settings = () => {
  const navigate = useNavigate();
  const { currency, updateCurrency } = useCurrency();
  const { t } = useLanguage();

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
        setAvatarPreview(savedAvatar);
        setAvatarData(savedAvatar);
        setLoadingProfile(false);
        return;
      }

      setLoadingProfile(true);

      const savedId = savedUser?.id;
      if (!savedId) {
        setProfile({
          id: null,
          email: savedUser.email || '',
          username: savedUsername,
        });
        setUsername(savedUsername);
        setCurrentBalance(Number(savedBalance));
        setAvatarPreview(savedAvatar);
        setAvatarData(savedAvatar);
        setLoadingProfile(false);
        return;
      }

      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      const activeUser = authData?.user || { id: savedId, email: savedUser.email || '' };

      if (authError && !savedId) {
        console.error('Failed to load auth user:', authError);
        setLoadingProfile(false);
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('wallet_balance,avatar_url,username')
        .eq('id', activeUser.id)
        .maybeSingle();

      const metadata = activeUser.user_metadata || {};

      const userBalance = Number(
        profileData?.wallet_balance ?? metadata.wallet_balance ?? metadata.balance ?? savedBalance ?? 0
      );

      const userAvatar =
        profileData?.avatar_url ||
        metadata.avatar_url ||
        metadata.avatar ||
        savedAvatar;

      const usernameValue =
        profileData?.username ||
        metadata.username ||
        savedUsername ||
        activeUser.email?.split('@')[0] ||
        'User';

      setProfile({
        id: activeUser.id,
        email: activeUser.email,
        username: usernameValue,
      });

      setUsername(usernameValue);
      setCurrentBalance(userBalance);
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

  const parseAmountInput = (value) => {
    if (value === '' || value === null || value === undefined) {
      return 0;
    }

    const normalized = String(value).replace(/,/g, '').trim();
    const parsed = Number(normalized);

    return Number.isFinite(parsed) ? parsed : 0;
  };

  const handleBalanceInputChange = (event) => {
    const nextValue = event.target.value;
    const sanitized = nextValue.replace(/[^\d,.-]/g, '');
    setBalanceInput(sanitized);
  };

  const handleSave = async () => {
    if (!username.trim()) {
      setMessage(t.settings.usernameRequired);
      return;
    }

    if (newPassword && !currentPassword) {
      setMessage(t.settings.passwordRequired);
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      if (newPassword) {
        const { error: verifyError } =
          await supabase.auth.signInWithPassword({
            email: profile.email,
            password: currentPassword,
          });

        if (verifyError) {
          throw new Error(t.settings.oldPasswordIncorrect);
        }
      }

      const amountValue = parseAmountInput(balanceInput);

      let nextBalance = currentBalance;

      if (balanceInput !== '') {
        if (
          Number.isNaN(amountValue) ||
          amountValue < 0
        ) {
          throw new Error(t.settings.invalidBalance);
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

      if (avatarData) {
        metadata.avatar_url = avatarData;
      }

      const profilePayload = {
        id: profile?.id,
        email: profile?.email,
        username: username.trim(),
        wallet_balance: nextBalance,
      };

      if (avatarData) {
        profilePayload.avatar_url = avatarData;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profilePayload);

      if (profileError) {
        throw new Error(profileError.message || 'Failed to save wallet balance.');
      }

      const authUpdate = await supabase.auth.updateUser({
        password: newPassword || undefined,
        data: metadata,
      });

      if (authUpdate.error) {
        throw new Error(
          authUpdate.error.message ||
            'Failed to update auth information.'
        );
      }

      const updatedProfile = {
        ...profile,
        username: username.trim(),
      };

      setProfile(updatedProfile);
      setCurrentBalance(nextBalance);
      setBalanceInput('');
      setCurrentPassword('');
      setNewPassword('');

      const currentStorage = JSON.parse(
        localStorage.getItem('user') || '{}'
      );

      localStorage.setItem(
        'user',
        JSON.stringify({
          ...currentStorage,
          id: profile?.id,
          email: profile?.email,
          username: username.trim(),
          balance: nextBalance,
          avatar:
            avatarData ||
            currentStorage.avatar ||
            '',
        })
      );

      setMessage(t.settings.saveSuccess);
    } catch (error) {
      setMessage(
        error.message ||
          t.settings.saveError
      );
    } finally {
      setLoading(false);
    }
  };

  if (!hasSupabase) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-3xl">
              ⚠️
            </div>

            <h1 className="text-2xl font-bold text-slate-900">
              {t.settings.supabaseNotConfigured}
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              {t.settings.supabaseConfigText}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loadingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-teal-600" />

          <p className="mt-4 text-sm font-medium text-slate-500">
            {t.settings.loading}
          </p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            {t.settings.pleaseLogin}
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {t.settings.loginText}
          </p>

          <button
            onClick={() => navigate('/login')}
            className="mt-6 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {t.settings.goToLogin}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-teal-600">
            {t.settings.account}
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {t.settings.title}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {t.settings.subtitle}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">

          {/* LEFT PROFILE CARD */}
          <aside className="h-fit overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">

            <div className="relative h-28 bg-gradient-to-br from-teal-500 via-cyan-500 to-sky-500">
              <div className="absolute inset-0 opacity-20">
                <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,_white,_transparent_50%)]" />
              </div>
            </div>

            <div className="-mt-14 px-6 pb-7 text-center">

              {/* Avatar */}
              <div className="group relative mx-auto h-28 w-28">
                <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-xl">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-teal-500 to-sky-500 text-4xl font-bold text-white">
                      {getInitial()}
                    </div>
                  )}
                </div>

                <label className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-4 border-white bg-slate-900 text-white shadow-lg transition hover:scale-105 hover:bg-slate-800">
                  <MdCameraAlt size={17} />

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <h2 className="mt-4 text-xl font-bold text-slate-900">
                {profile.username || t.settings.accountMessage}
              </h2>

              <p className="mt-1 truncate text-sm text-slate-500">
                {profile.email}
              </p>

              {/* Balance */}
              <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-left">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
                    <MdAccountBalanceWallet size={21} />
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      {t.settings.walletBalance}
                    </p>

                    <p className="mt-0.5 text-lg font-bold text-slate-900">
                      {currentBalance.toLocaleString()} {CURRENCIES[currency]?.symbol || '$'}
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-xs leading-5 text-slate-400">
                {t.settings.updatePhoto}
              </p>
            </div>
          </aside>

          {/* RIGHT CONTENT */}
          <main className="space-y-6">

            {/* PERSONAL INFORMATION */}
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

              <div className="mb-7 flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                  <MdPerson size={23} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {t.settings.personalInfo}
                  </h2>

                  <p className="text-sm text-slate-500">
                    {t.settings.personalInfoText}
                  </p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">

                {/* Username */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.settings.username}
                  </label>

                  <div className="relative">
                    <MdPerson
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      size={19}
                    />

                    <input
                      type="text"
                      value={username}
                      onChange={(e) =>
                        setUsername(e.target.value)
                      }
                      placeholder={t.settings.usernamePlaceholder}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-50"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.settings.emailAddress}
                  </label>

                  <div className="relative">
                    <MdEmail
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      size={19}
                    />

                    <input
                      type="email"
                      value={profile.email || ''}
                      disabled
                      className="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-100 py-3.5 pl-11 pr-4 text-sm text-slate-500 outline-none"
                    />
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    {t.settings.emailHint}
                  </p>
                </div>

                {/* Currency */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.settings.currency}
                  </label>

                  <div className="relative">
                    <MdCurrencyExchange
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      size={20}
                    />

                    <select
                      value={currency}
                      onChange={(e) =>
                        updateCurrency(e.target.value)
                      }
                      className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-50"
                    >
                      {Object.entries(CURRENCIES).map(
                        ([code, data]) => (
                          <option
                            key={code}
                            value={code}
                          >
                            {data.symbol} {data.code} -{' '}
                            {data.name}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {/* PASSWORD */}
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

              <div className="mb-7 flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                  <MdLock size={22} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {t.settings.passwordSecurity}
                  </h2>

                  <p className="text-sm text-slate-500">
                    {t.settings.passwordSecurityText}
                  </p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">

                {/* Current Password */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.settings.currentPassword}
                  </label>

                  <div className="relative">
                    <input
                      type={
                        showCurrentPassword
                          ? 'text'
                          : 'password'
                      }
                      value={currentPassword}
                      onChange={(e) =>
                        setCurrentPassword(e.target.value)
                      }
                      placeholder={t.settings.enterCurrentPassword}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-4 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-50"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(
                          (prev) => !prev
                        )
                      }
                      className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      {showCurrentPassword ? (
                        <MdVisibilityOff size={20} />
                      ) : (
                        <MdVisibility size={20} />
                      )}
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    {t.settings.passwordHint}
                  </p>
                </div>

                {/* New Password */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.settings.newPassword}
                  </label>

                  <div className="relative">
                    <input
                      type={
                        showNewPassword
                          ? 'text'
                          : 'password'
                      }
                      value={newPassword}
                      onChange={(e) =>
                        setNewPassword(e.target.value)
                      }
                      placeholder={t.settings.enterNewPassword}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-4 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-50"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowNewPassword(
                          (prev) => !prev
                        )
                      }
                      className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      {showNewPassword ? (
                        <MdVisibilityOff size={20} />
                      ) : (
                        <MdVisibility size={20} />
                      )}
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    {t.settings.newPasswordHint}
                  </p>
                </div>
              </div>
            </section>

            {/* WALLET */}
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

              <div className="mb-7 flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <MdAccountBalanceWallet size={22} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {t.settings.wallet}
                  </h2>

                  <p className="text-sm text-slate-500">
                    {t.settings.walletText}
                  </p>
                </div>
              </div>

              {/* Current balance */}
              <div className="mb-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white">
                <p className="text-xs font-medium text-slate-400">
                  {t.settings.currentWalletBalance}
                </p>

                <p className="mt-1 text-3xl font-bold tracking-tight">
                  {currentBalance.toLocaleString()}{' '}
                  {CURRENCIES[currency]?.symbol || '$'}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-[1fr_180px]">

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.settings.amount}
                  </label>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={balanceInput}
                    onChange={handleBalanceInputChange}
                    placeholder={t.settings.amountPlaceholder}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.settings.action}
                  </label>

                  <select
                    value={balanceAction}
                    onChange={(e) =>
                      setBalanceAction(e.target.value)
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-50"
                  >
                    <option value="add">
                      {t.settings.addAmount}
                    </option>

                    <option value="set">
                      {t.settings.setNewValue}
                    </option>
                  </select>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs leading-5 text-slate-500">
                  <span className="font-semibold text-slate-700">
                    {t.settings.addAmount}:
                  </span>{' '}
                  {t.settings.addDesc}
                  <br />
                  <span className="font-semibold text-slate-700">
                    {t.settings.setNewValue}:
                  </span>{' '}
                  {t.settings.setDesc}
                </p>
              </div>
            </section>

            {/* ACTIONS */}
            <section className="flex flex-col gap-3 sm:flex-row sm:justify-end">

              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white px-6 py-3.5 text-sm font-semibold text-rose-600 shadow-sm transition hover:border-rose-300 hover:bg-rose-50"
              >
                <MdLogout size={20} />
                {t.settings.logout}
              </button>

              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-2xl bg-teal-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 hover:shadow-xl hover:shadow-teal-600/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <MdSave size={20} />

                {loading
                  ? t.settings.saving
                  : t.settings.saveChanges}
              </button>
            </section>

            {/* MESSAGE */}
            {message && (
              <div
                className={`rounded-2xl border px-4 py-3 text-center text-sm font-medium ${
                  message
                    .toLowerCase()
                    .includes('success')
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-rose-200 bg-rose-50 text-rose-700'
                }`}
              >
                {message}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Settings;

