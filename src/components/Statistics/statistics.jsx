import React, { useEffect, useMemo, useState } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { supabase, hasSupabase } from '../../lib/supabase';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const Statistics = () => {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!hasSupabase) {
        setLoading(false);
        return;
      }

      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        setLoading(false);
        return;
      }
      setUser(authData.user);

      const [txRes, catRes] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', authData.user.id),
        supabase.from('categories').select('*').eq('user_id', authData.user.id),
      ]);

      setTransactions(txRes.data || []);
      setCategories(catRes.data || []);
      setLoading(false);
    };

    loadData();
  }, []);

  const totalIncome = useMemo(
    () => transactions.reduce((sum, tx) => {
      const category = categories.find((c) => c.id === tx.category_id);
      return category?.type === 'INCOME' ? sum + Number(tx.amount) : sum;
    }, 0),
    [transactions, categories]
  );

  const totalExpenses = useMemo(
    () => transactions.reduce((sum, tx) => {
      const category = categories.find((c) => c.id === tx.category_id);
      return category?.type === 'EXPENSE' ? sum + Number(tx.amount) : sum;
    }, 0),
    [transactions, categories]
  );

  const balance = totalIncome - totalExpenses;

  const monthlyLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyStats = useMemo(() => {
    const incomeData = Array(12).fill(0);
    const expenseData = Array(12).fill(0);

    transactions.forEach((tx) => {
      const date = new Date(tx.date);
      const index = date.getMonth();
      const category = categories.find((c) => c.id === tx.category_id);
      if (category?.type === 'INCOME') {
        incomeData[index] += Number(tx.amount);
      } else if (category?.type === 'EXPENSE') {
        expenseData[index] += Number(tx.amount);
      }
    });

    return { incomeData, expenseData };
  }, [transactions, categories]);

  const monthlySpendingData = {
    labels: monthlyLabels,
    datasets: [
      {
        label: 'Income',
        data: monthlyStats.incomeData,
        borderColor: '#14b8a6',
        backgroundColor: 'rgba(20, 184, 166, 0.25)',
        tension: 0.3,
      },
      {
        label: 'Expenses',
        data: monthlyStats.expenseData,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.25)',
        tension: 0.3,
      },
    ],
  };

  const quarterlyData = useMemo(() => {
    const quarters = [0, 1, 2, 3].map((quarter) => ({ income: 0, expense: 0 }));

    transactions.forEach((tx) => {
      const date = new Date(tx.date);
      const quarterIndex = Math.floor(date.getMonth() / 3);
      const category = categories.find((c) => c.id === tx.category_id);
      if (category?.type === 'INCOME') {
        quarters[quarterIndex].income += Number(tx.amount);
      } else if (category?.type === 'EXPENSE') {
        quarters[quarterIndex].expense += Number(tx.amount);
      }
    });

    return quarters;
  }, [transactions, categories]);

  const quarterlyChartData = {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [
      {
        label: 'Expenses',
        data: quarterlyData.map((item) => item.expense),
        backgroundColor: '#ef4444',
      },
      {
        label: 'Income',
        data: quarterlyData.map((item) => item.income),
        backgroundColor: '#14b8a6',
      },
    ],
  };

  const categorySpendingData = useMemo(() => {
    const summary = categories.map((category) => ({
      name: category.name,
      total: transactions
        .filter((tx) => tx.category_id === category.id && category.type === 'EXPENSE')
        .reduce((sum, tx) => sum + Number(tx.amount), 0),
    })).filter((item) => item.total > 0);

    return {
      labels: summary.map((item) => item.name),
      datasets: [
        {
          data: summary.map((item) => item.total),
          backgroundColor: ['#22c55e', '#38bdf8', '#f97316', '#ef4444', '#a855f7', '#facc15'],
        },
      ],
    };
  }, [categories, transactions]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700">Loading statistics...</div>;
  }

  if (!hasSupabase) {
    return (
      <main className="flex-1 p-8 bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-4xl rounded-[2rem] bg-white p-10 shadow-xl shadow-slate-200">
          <h1 className="text-4xl font-bold text-slate-900">Statistics</h1>
          <p className="mt-4 text-slate-600">Supabase chưa được cấu hình. Vui lòng thêm VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex-1 p-8 bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-4xl rounded-[2rem] bg-white p-10 shadow-xl shadow-slate-200">
          <h1 className="text-4xl font-bold text-slate-900">Statistics</h1>
          <p className="mt-4 text-slate-600">Sign in to view personalized expense analytics.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-8 bg-slate-50 text-slate-900">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Spending Analytics</h1>
          <p className="mt-2 text-slate-500">Track where your wallet is spent each month.</p>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-3 mb-8">
        <div className="rounded-[2rem] bg-white p-6 shadow-xl">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Total Income</p>
          <p className="mt-4 text-3xl font-semibold text-emerald-600">${totalIncome.toLocaleString()}</p>
        </div>
        <div className="rounded-[2rem] bg-white p-6 shadow-xl">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Total Expenses</p>
          <p className="mt-4 text-3xl font-semibold text-rose-600">${totalExpenses.toLocaleString()}</p>
        </div>
        <div className="rounded-[2rem] bg-white p-6 shadow-xl">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Balance</p>
          <p className="mt-4 text-3xl font-semibold text-slate-900">${balance.toLocaleString()}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2 mb-6">
        <div className="rounded-[2rem] bg-white p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Monthly Spending Analysis</h2>
          <div className="h-[360px]">
            <Line data={monthlySpendingData} options={{ responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } }} />
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Quarterly Income vs Expense</h2>
          <div className="h-[360px]">
            <Bar data={quarterlyChartData} options={{ responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } }} />
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Expense Breakdown by Category</h2>
        <div className="h-[360px]">
          <Doughnut data={categorySpendingData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
        </div>
      </section>
    </main>
  );
};

export default Statistics;
