import React, { useCallback, useEffect, useState } from 'react';
import { supabase, hasSupabase } from '../../lib/supabase';

const Categories = () => {
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

  const getCategoryStorageKey = (userId) => `local_categories_${userId}`;
  const loadLocalCategories = (userId) => {
    try {
      return JSON.parse(localStorage.getItem(getCategoryStorageKey(userId)) || '[]');
    } catch {
      return [];
    }
  };
  const saveLocalCategories = (userId, items) => {
    localStorage.setItem(getCategoryStorageKey(userId), JSON.stringify(items));
  };

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    const savedUser = JSON.parse(localStorage.getItem('user') || '{}');

    if (!hasSupabase) {
      setError('Supabase chưa được cấu hình.');
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
  }, []);

  const fetchCategories = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    if (!hasSupabase) {
      const localItems = loadLocalCategories(user.id);
      setCategories(localItems);
      setError('Supabase chưa được cấu hình. Đang sử dụng dữ liệu tạm thời.');
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
        setError('Không tìm thấy bảng categories trên Supabase. Đang sử dụng dữ liệu local.');
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
  }, [user]);

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
          <h1 className="text-3xl font-bold mb-4">Supabase not configured</h1>
          <p className="text-slate-600">Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to manage categories.</p>
        </div>
      </div>
    );
  }

  if (!user && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10 text-slate-900">
        <div className="rounded-[2rem] bg-white p-10 shadow-2xl shadow-slate-200 text-center max-w-xl">
          <h1 className="text-3xl font-bold mb-4">Login required</h1>
          <p className="text-slate-600">Please login to view and manage your categories.</p>
          {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
        </div>
      </div>
    );
  }

  const handleAddCategory = async () => {
    if (!categoryName.trim()) {
      setError('Please enter a category name');
      return;
    }

    if (!user) {
      setError('Please login first to add a category.');
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
      setError('Đã lưu danh mục cục bộ do Supabase không khả dụng.');
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
      setError('Category name cannot be empty!');
      return;
    }

    if (!user) {
      setError('Please login first.');
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
    <div className="p-4 sm:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Category Management</h1>
        <p className="mt-2 text-slate-500">Create, edit, and organize your income and expense categories.</p>
      </header>
      {loading && !user ? (
        <div className="rounded-[2rem] bg-white p-8 shadow-xl text-center text-slate-600">Loading categories...</div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <section className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/70">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Add Category</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Category Name</label>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Enter category name"
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Category Type</label>
              <select
                value={categoryType}
                onChange={(e) => setCategoryType(e.target.value)}
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              >
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
              </select>
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <button
              onClick={handleAddCategory}
              className="inline-flex w-full items-center justify-center rounded-3xl bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:scale-[1.01]"
            >
              Add Category
            </button>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/70">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Your Categories</h2>
            <span className="text-sm text-slate-500">{categories.length} items</span>
          </div>
          {loading ? (
            <p className="text-slate-600">Loading categories...</p>
          ) : categories.length === 0 ? (
            <p className="text-slate-500">No categories yet. Start by adding a category.</p>
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
                        <option value="EXPENSE">Expense</option>
                        <option value="INCOME">Income</option>
                      </select>
                      <div className="flex gap-3">
                        <button onClick={handleUpdateCategory} className="rounded-3xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600">
                          Save
                        </button>
                        <button onClick={handleCancelEdit} className="rounded-3xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300">
                          Cancel
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
                          Edit
                        </button>
                        <button onClick={() => handleDeleteCategory(category.id)} className="text-rose-600 transition hover:text-rose-700">
                          Delete
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
