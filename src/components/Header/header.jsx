import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: t.nav.home, path: '/home', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9.75L12 3l9 6.75V21a1.5 1.5 0 01-1.5 1.5H4.5A1.5 1.5 0 013 21V9.75z" />
        </svg>
      )},
    { label: t.nav.transactions, path: '/transaction', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m0-8h4m-4 0H8m-4 4h16" />
        </svg>
      )},
    { label: t.nav.categories, path: '/categories', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
        </svg>
      )},
    { label: t.nav.statistics, path: '/statistics', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3v18m4-15v12M7 12h10" />
        </svg>
      )},
    { label: t.nav.settings, path: '/settings', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8a4 4 0 110 8 4 4 0 010-8z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.93 4.93l2.12 2.12M1 12h3M4.93 19.07l2.12-2.12M12 21h0M19.07 19.07l-2.12-2.12M21 12h-3M19.07 4.93l-2.12 2.12" />
        </svg>
      )},
  ];

  const handleNavigate = (path) => {
    const hasUser = Boolean(localStorage.getItem('token') && JSON.parse(localStorage.getItem('user') || '{}')?.id);

    if (!hasUser) {
      navigate('/login');
      return;
    }

    setMobileMenuOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setMobileMenuOpen(false);
    navigate('/login', { replace: true });
  };

  let user = null;
  const token = localStorage.getItem('token');

  try {
    user = JSON.parse(localStorage.getItem('user'));
  } catch (userError) {
    user = null;
  }

  if (!token || !user) return null;

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-4 py-3 shadow-sm lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/10"
            aria-label="Open navigation menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>

          <div className="flex-1 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600">{t.header.title}</p>
            <h1 className="text-base font-bold text-slate-900">Finance Studio</h1>
          </div>

          <div className="w-24">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-700 outline-none focus:border-sky-500"
            >
              <option value="en">{t.english}</option>
              <option value="vi">{t.vietnamese}</option>
            </select>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 shrink-0 transform border-r border-slate-200 bg-white p-6 shadow-2xl transition-transform duration-200 ease-out lg:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-6 flex items-center justify-between">
          <div className="rounded-2xl bg-slate-950 px-3 py-2 text-white shadow-lg">
            <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">{t.header.title}</p>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600"
            aria-label="Close sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">{t.language}</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-500"
          >
            <option value="en">{t.english}</option>
            <option value="vi">{t.vietnamese}</option>
          </select>
        </div>

        <nav className="mt-6 space-y-3">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => handleNavigate(item.path)}
                className={`group flex w-full items-center gap-4 rounded-3xl px-4 py-4 text-left transition ${active ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`}
              >
                <span className={`grid h-11 w-11 place-items-center rounded-2xl ${active ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {item.icon}
                </span>
                <span className="font-semibold">{item.label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={handleLogout}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
            </svg>
            {t.settings.logout}
          </button>
        </nav>
      </aside>

      <aside className="hidden min-h-screen w-72 shrink-0 flex-col justify-between border-r border-slate-200 bg-white p-6 shadow-2xl lg:flex">
        <div className="space-y-8">
          <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-2xl shadow-slate-900/10">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t.header.title}</p>
            <h1 className="mt-3 text-2xl font-bold">Finance Studio</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">{t.header.subtitle}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">{t.language}</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-500"
            >
              <option value="en">{t.english}</option>
              <option value="vi">{t.vietnamese}</option>
            </select>
          </div>

          <nav className="space-y-3">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleNavigate(item.path)}
                  className={`group flex w-full items-center gap-4 rounded-3xl px-4 py-4 text-left transition ${active ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`}
                >
                  <span className={`grid h-11 w-11 place-items-center rounded-2xl ${active ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {item.icon}
                  </span>
                  <span className="font-semibold">{item.label}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={handleLogout}
              className="mt-8 flex w-full items-center justify-center gap-3 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
              </svg>
              {t.settings.logout}
            </button>
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Header;
