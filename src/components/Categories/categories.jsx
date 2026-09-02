import React, { useCallback, useEffect, useState } from 'react';
import { supabase, hasSupabase } from '../../lib/supabase';
import { useLanguage } from '../../context/LanguageContext';

const Categories = () => {
  const { t } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState('EXPENSE');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('EXPENSE');
  const [user, setUser] = useState(null);
  const [fallbackMode, setFallbackMode] = useState(false);

  const getCategoryStorageKey = useCallback((userId) => `local_categories_${userId}`, []);
  const loadLocalCategories = useCallback((userId) => {
    try {
      return JSON.parse(localStorage.getItem(getCategoryStorageKey(userId)) || '[]');
    } catch {
      return [];
    }
  }, [getCategoryStorageKey]);
  const saveLocalCategories = useCallback((userId, items) => {
    localStorage.setItem(getCategoryStorageKey(userId), JSON.stringify(items));
  }, [getCategoryStorageKey]);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    const savedUser = JSON.parse(localStorage.getItem('user') || '{}');

    if (!hasSupabase) {
      setError(t.categories.supabaseNotConfigured);
      setLoading(false);
      return;
    }

    if (!token || !savedUser?.id) {
      setUser(null);
      setLoading(false);
      return;
    }

    setUser({ id: savedUser.id, email: savedUser.email || '' });
    setLoading(false);
  }, [t]);

  const fetchCategories = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    if (!hasSupabase) {
      const localItems = loadLocalCategories(user.id);
      setCategories(localItems);
      setError(`${t.categories.supabaseNotConfigured}. ${t.categories.fallbackLocal}`);
      setFallbackMode(true);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.message?.includes("Could not find the table")) {
        const localItems = loadLocalCategories(user.id);
        setCategories(localItems);
        setFallbackMode(true);
        setError('Could not find the categories table on Supabase. Using local data.');
        setLoading(false);
        return;
      }
      setError(error.message || 'Failed to load categories.');
      setCategories([]);
    } else {
      setCategories(data || []);
      saveLocalCategories(user.id, data || []);
      setError('');
    }
    setLoading(false);
  }, [user, t, loadLocalCategories, saveLocalCategories]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user, fetchCategories]);

  if (!hasSupabase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10 text-slate-900">
        <div className="rounded-[2rem] bg-white p-10 shadow-2xl shadow-slate-200 text-center max-w-xl">
          <h1 className="text-3xl font-bold mb-4">{t.categories.supabaseNotConfigured}</h1>
          <p className="text-slate-600">{t.categories.supabaseConfigText}</p>
        </div>
      </div>
    );
  }

  if (!user && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10 text-slate-900">
        <div className="rounded-[2rem] bg-white p-10 shadow-2xl shadow-slate-200 text-center max-w-xl">
          <h1 className="text-3xl font-bold mb-4">{t.categories.loginRequiredTitle}</h1>
          <p className="text-slate-600">{t.categories.loginRequiredText}</p>
          {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
        </div>
      </div>
    );
  }

  const handleAddCategory = async () => {
    if (!categoryName.trim()) {
      setError(t.categories.errorName);
      return;
    }

    if (!user) {
      setError(t.categories.loginFirst);
      return;
    }

    if (fallbackMode || !hasSupabase) {
      const newCategory = {
        id: `local-${Date.now()}`,
        name: categoryName.trim(),
        type: categoryType,
        user_id: user.id,
        created_at: new Date().toISOString(),
      };
      const nextCategories = [newCategory, ...categories];
      setCategories(nextCategories);
      saveLocalCategories(user.id, nextCategories);
      setCategoryName('');
      setCategoryType('EXPENSE');
      setError(t.categories.fallbackLocal);
      return;
    }

    const { error } = await supabase.from('categories').insert([
      {
        name: categoryName.trim(),
        type: categoryType,
        user_id: user.id,
      },
    ]);

    if (error) {
      if (error.message?.includes("Could not find the table")) {
        setFallbackMode(true);
        handleAddCategory();
        return;
      }
      setError(error.message || 'Error adding category');
      return;
    }

    setCategoryName('');
    setCategoryType('EXPENSE');
    fetchCategories();
  };

  const handleDeleteCategory = async (id) => {
    if (!user) {
      setError('Please login first.');
      return;
    }

    if (fallbackMode || !hasSupabase) {
      const nextCategories = categories.filter((c) => c.id !== id);
      setCategories(nextCategories);
      saveLocalCategories(user.id, nextCategories);
      return;
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      if (error.message?.includes("Could not find the table")) {
        setFallbackMode(true);
        handleDeleteCategory(id);
        return;
      }
      setError(error.message || 'Error deleting category');
    } else {
      const nextCategories = categories.filter((c) => c.id !== id);
      setCategories(nextCategories);
      saveLocalCategories(user.id, nextCategories);
    }
  };

  const handleEditClick = (category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditType(category.type);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditType('EXPENSE');
  };

  const handleUpdateCategory = async () => {
    if (!editName.trim()) {
      setError(t.categories.emptyName);
      return;
    }

    if (!user) {
      setError(t.categories.deleteLogin);
      return;
    }

    if (fallbackMode || !hasSupabase) {
      const nextCategories = categories.map((category) =>
        category.id === editingId ? { ...category, name: editName.trim(), type: editType } : category
      );
      setCategories(nextCategories);
      saveLocalCategories(user.id, nextCategories);
      handleCancelEdit();
      return;
    }

    const { error } = await supabase
      .from('categories')
      .update({ name: editName.trim(), type: editType })
      .eq('id', editingId)
      .eq('user_id', user.id);

    if (error) {
      if (error.message?.includes("Could not find the table")) {
        setFallbackMode(true);
        handleUpdateCategory();
        return;
      }
      setError(error.message || 'Error updating category.');
    } else {
      await fetchCategories();
      handleCancelEdit();
    }
  };

  return (
    <div className="mx-auto w-full max-w-[520px] bg-[#f4f6f8] px-3 py-4 sm:max-w-5xl sm:p-8">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-3xl font-bold text-slate-900">{t.categories.title}</h1>
        <p className="mt-2 text-slate-500">{t.categories.subtitle}</p>
      </header>
      {loading && !user ? (
        <div className="rounded-[2rem] bg-white p-8 shadow-xl text-center text-slate-600">{t.categories.loading}</div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <section className="rounded-[2rem] bg-white p-4 shadow-xl shadow-slate-200/70 sm:p-6">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">{t.categories.addTitle}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">{t.categories.nameLabel}</label>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder={t.categories.namePlaceholder}
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">{t.categories.typeLabel}</label>
              <select
                value={categoryType}
                onChange={(e) => setCategoryType(e.target.value)}
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              >
                <option value="EXPENSE">{t.categories.expense}</option>
                <option value="INCOME">{t.categories.income}</option>
              </select>
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <button
              onClick={handleAddCategory}
              className="inline-flex w-full items-center justify-center rounded-3xl bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:scale-[1.01]"
            >
              {t.categories.addButton}
            </button>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-4 shadow-xl shadow-slate-200/70 sm:p-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-slate-900">{t.categories.yourCategories}</h2>
            <span className="text-sm text-slate-500">{categories.length} {t.categories.items}</span>
          </div>
          {loading ? (
            <p className="text-slate-600">{t.categories.loading}</p>
          ) : categories.length === 0 ? (
            <p className="text-slate-500">{t.categories.noCategories}</p>
          ) : (
            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                  {editingId === category.id ? (
                    <div className="space-y-3">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 outline-none"
                      />
                      <select
                        value={editType}
                        onChange={(e) => setEditType(e.target.value)}
                        className="w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 outline-none"
                      >
                        <option value="EXPENSE">{t.categories.expense}</option>
                        <option value="INCOME">{t.categories.income}</option>
                      </select>
                      <div className="flex gap-3">
                        <button onClick={handleUpdateCategory} className="rounded-3xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600">
                          {t.categories.save}
                        </button>
                        <button onClick={handleCancelEdit} className="rounded-3xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300">
                          {t.categories.cancel}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-base font-semibold text-slate-900">{category.name}</p>
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${category.type === 'INCOME' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {category.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                        <button onClick={() => handleEditClick(category)} className="transition hover:text-sky-600">
                          {t.categories.edit}
                        </button>
                        <button onClick={() => handleDeleteCategory(category.id)} className="text-rose-600 transition hover:text-rose-700">
                          {t.categories.delete}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Categories;
