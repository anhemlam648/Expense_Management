import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { label: 'Home', path: '/home', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9.75L12 3l9 6.75V21a1.5 1.5 0 01-1.5 1.5H4.5A1.5 1.5 0 013 21V9.75z" />
      </svg>
    )},
  { label: 'Transactions', path: '/transaction', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m0-8h4m-4 0H8m-4 4h16" />
      </svg>
    )},
  { label: 'Categories', path: '/categories', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
      </svg>
    )},
  { label: 'Statistics', path: '/statistics', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3v18m4-15v12M7 12h10" />
      </svg>
    )},
  { label: 'Settings', path: '/settings', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8a4 4 0 110 8 4 4 0 010-8z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.93 4.93l2.12 2.12M1 12h3M4.93 19.07l2.12-2.12M12 21h0M19.07 19.07l-2.12-2.12M21 12h-3M19.07 4.93l-2.12 2.12" />
      </svg>
    )},
];

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  let user = null;
  const token = localStorage.getItem('token');

  try {
    user = JSON.parse(localStorage.getItem('user'));
  } catch (userError) {
    user = null;
  }

  if (!token || !user) return null;

  return (
    <aside className="hidden w-72 shrink-0 flex-col justify-between border-r border-slate-200 bg-white/95 p-6 shadow-2xl backdrop-blur-xl lg:flex min-h-screen">
      <div className="space-y-8">
        <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-2xl shadow-slate-900/10">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Expense manager</p>
          <h1 className="mt-3 text-2xl font-bold">Finance Studio</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">Fast, clean and modern expense tracking for your business.</p>
        </div>

        <nav className="space-y-3">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.label}
                onClick={() => {
                  const hasUser = Boolean(localStorage.getItem('token') && JSON.parse(localStorage.getItem('user') || '{}')?.id);

                  if (!hasUser) {
                    navigate('/login');
                    return;
                  }

                  navigate(item.path);
                }}
                className={`group flex w-full items-center gap-4 rounded-3xl px-4 py-4 text-left transition ${active ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`}
              >
                <span className={`grid h-11 w-11 place-items-center rounded-2xl ${active ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {item.icon}
                </span>
                <span className="font-semibold">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Header;
