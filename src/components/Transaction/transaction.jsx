import React, { useEffect, useState } from 'react';
import { supabase, hasSupabase } from '../../lib/supabase';

const Transaction = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [openDetails, setOpenDetails] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fallbackMode, setFallbackMode] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    categoryId: '',
    date: new Date().toISOString().slice(0, 10),
    note: '',
  });

  const fetchUser = async () => {
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
  };

  const getLocalCategoriesKey = (userId) => `local_categories_${userId}`;
  const getLocalTransactionsKey = (userId) => `local_transactions_${userId}`;

  const loadLocalCategories = (userId) => {
    try {
      return JSON.parse(localStorage.getItem(getLocalCategoriesKey(userId)) || '[]');
    } catch {
      return [];
    }
  };
  const saveLocalCategories = (userId, items) => {
    localStorage.setItem(getLocalCategoriesKey(userId), JSON.stringify(items));
  };

  const loadLocalTransactions = (userId) => {
    try {
      return JSON.parse(localStorage.getItem(getLocalTransactionsKey(userId)) || '[]');
    } catch {
      return [];
    }
  };
  const saveLocalTransactions = (userId, items) => {
    localStorage.setItem(getLocalTransactionsKey(userId), JSON.stringify(items));
  };

  const fetchCategories = async (userId) => {
    if (!hasSupabase) {
      setFallbackMode(true);
      setError('Supabase chưa được cấu hình. Đang sử dụng dữ liệu cục bộ.');
      return loadLocalCategories(userId);
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.message?.includes("Could not find the table")) {
        setFallbackMode(true);
        setError('Không tìm thấy bảng categories. Đang dùng dữ liệu local.');
        return loadLocalCategories(userId);
      }
      setError(error.message || 'Failed to load categories.');
      return [];
    }

    setError('');
    saveLocalCategories(userId, data || []);
    return data || [];
  };

  const fetchTransactions = async (userId) => {
    if (!hasSupabase) {
      setFallbackMode(true);
      setError('Supabase chưa được cấu hình. Đang sử dụng dữ liệu cục bộ.');
      return loadLocalTransactions(userId);
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      if (error.message?.includes("Could not find the table")) {
        setFallbackMode(true);
        setError('Không tìm thấy bảng transactions. Đang dùng dữ liệu local.');
        return loadLocalTransactions(userId);
      }
      setError(error.message || 'Failed to load transactions.');
      return [];
    }

    setError('');
    saveLocalTransactions(userId, data || []);
    return data || [];
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchUser();
      setLoading(false);
    };

    loadData();
  }, []);

  if (!hasSupabase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10 text-slate-900">
        <div className="rounded-[2rem] bg-white p-10 shadow-2xl shadow-slate-200 text-center max-w-xl">
          <h1 className="text-3xl font-bold mb-4">Supabase chưa cấu hình</h1>
          <p className="text-slate-600">Vui lòng thêm VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY để quản lý giao dịch.</p>
        </div>
      </div>
    );
  }

  if (!user && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10 text-slate-900">
        <div className="rounded-[2rem] bg-white p-10 shadow-2xl shadow-slate-200 text-center max-w-xl">
          <h1 className="text-3xl font-bold mb-4">Yêu cầu đăng nhập</h1>
          <p className="text-slate-600">Vui lòng đăng nhập để quản lý giao dịch của bạn.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const loadRecords = async () => {
      if (!user) return;
      setLoading(true);
      const categoryData = await fetchCategories(user.id);
      const transactionData = await fetchTransactions(user.id);
      setCategories(categoryData);
      setTransactions(transactionData);
      setFormData((prev) => ({
        ...prev,
        categoryId: categoryData[0]?.id || '',
      }));
      setLoading(false);
    };

    loadRecords();
  }, [user]);

  const getCategoryInfo = (categoryId) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat ? { name: cat.name, type: cat.type } : { name: 'Unknown', type: 'UNKNOWN' };
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!formData.description.trim() || !formData.amount || !formData.categoryId) {
      setError('Please complete all transaction fields.');
      return;
    }

    if (fallbackMode || !hasSupabase) {
      const newTransaction = {
        id: `local-${Date.now()}`,
        user_id: user.id,
        category_id: formData.categoryId,
        description: formData.description.trim(),
        amount: Number(formData.amount),
        date: formData.date,
        note: formData.note.trim(),
      };
      const nextTransactions = [newTransaction, ...transactions];
      setTransactions(nextTransactions);
      saveLocalTransactions(user.id, nextTransactions);
      setFormData({
        description: '',
        amount: '',
        categoryId: categories[0]?.id || '',
        date: new Date().toISOString().slice(0, 10),
        note: '',
      });
      setError('Giao dịch được lưu cục bộ do Supabase không khả dụng.');
      return;
    }

    const { error } = await supabase.from('transactions').insert([
      {
        user_id: user.id,
        category_id: formData.categoryId,
        description: formData.description.trim(),
        amount: Number(formData.amount),
        date: formData.date,
        note: formData.note.trim(),
      },
    ]);

    if (error) {
      if (error.message?.includes("Could not find the table")) {
        setFallbackMode(true);
        handleAddTransaction(e);
        return;
      }
      setError('Failed to add transaction.');
      return;
    }

    const newTransactions = await fetchTransactions(user.id);
    setTransactions(newTransactions);
    setFormData({
      description: '',
      amount: '',
      categoryId: categories[0]?.id || '',
      date: new Date().toISOString().slice(0, 10),
      note: '',
    });
    setError('');
  };

  const toggleDetails = (id) => {
    setOpenDetails(openDetails === id ? null : id);
  };

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;

    if (fallbackMode || !hasSupabase) {
      const updatedTransactions = transactions.filter((t) => t.id !== id);
      setTransactions(updatedTransactions);
      saveLocalTransactions(user.id, updatedTransactions);
      return;
    }

    const { error } = await supabase.from('transactions').delete().eq('id', id);

    if (error) {
      setError('Failed to delete transaction.');
      return;
    }

    const newTransactions = await fetchTransactions(user.id);
    setTransactions(newTransactions);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/50">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-sky-600">Transactions</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">Transaction Management</h1>
            </div>
            <p className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 shadow-sm">
              {transactions.length} records found
            </p>
          </div>
        </div>

        <section className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/50">
          <h2 className="text-xl font-semibold text-slate-900 mb-5">Add New Transaction</h2>
          <form onSubmit={handleAddTransaction} className="grid gap-4 lg:grid-cols-3">
            <div className="col-span-2 grid gap-4 sm:grid-cols-2">
              <input
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                placeholder="Description"
              />
              <input
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                type="number"
                step="0.01"
                className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                placeholder="Amount"
              />
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              >
                <option value="">Choose category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.type})
                  </option>
                ))}
              </select>
              <input
                name="date"
                value={formData.date}
                onChange={handleChange}
                type="date"
                className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              />
              <input
                name="note"
                value={formData.note}
                onChange={handleChange}
                className="col-span-2 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                placeholder="Note (optional)"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-3xl bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:scale-[1.01]"
              >
                Add Transaction
              </button>
            </div>
          </form>
          {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
        </section>

        <div className="grid gap-6 xl:grid-cols-3">
          {transactions.map((t) => {
            const categoryInfo = getCategoryInfo(t.category_id);
            const isIncome = categoryInfo.type === 'INCOME';
            const isOpen = openDetails === t.id;

            return (
              <article key={t.id} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lg transition hover:-translate-y-1 hover:shadow-xl">
                <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
                  <span>{new Date(t.date).toLocaleDateString()}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {categoryInfo.type !== 'UNKNOWN' ? categoryInfo.type : 'Unknown'}
                  </span>
                </div>
                <div className="mt-5 space-y-3">
                  <h2 className="text-xl font-semibold text-slate-900">{t.description}</h2>
                  <p className={`text-3xl font-bold ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isIncome ? '+' : '-'}${Number(t.amount).toLocaleString()}
                  </p>
                </div>
                <div className="mt-5 flex items-center justify-between gap-4">
                  <button
                    onClick={() => toggleDetails(t.id)}
                    className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                  >
                    {isOpen ? 'Hide Details' : 'View Details'}
                  </button>
                  <div className="flex gap-2">
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                      {categoryInfo.name}
                    </span>
                    <button
                      onClick={() => handleDeleteTransaction(t.id)}
                      className="rounded-full bg-rose-100 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {isOpen && (
                  <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    <p className="font-semibold text-slate-800">Note</p>
                    <p className="mt-2 leading-6">{t.note || 'No additional notes available.'}</p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Transaction;
