import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { supabase, hasSupabase } from '../../lib/supabase';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Home = () => {
  const [user, setUser] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
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
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      setWalletBalance(Number(savedUser.balance || 0));
      if (!authData?.user) {
        setLoading(false);
        return;
      }

      const userId = authData.user.id;
      setUser(authData.user);

      const [{ data: txData }, { data: categoryData }] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', userId),
        supabase.from('categories').select('*').eq('user_id', userId),
      ]);

      setTransactions(txData || []);
      setCategories(categoryData || []);
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
  const currentBalance = walletBalance + balance;
  const balanceSignClass = currentBalance >= 0 ? 'text-emerald-600' : 'text-rose-600';

  const categorySummary = useMemo(() => {
    return categories.map((category) => {
      const total = transactions
        .filter((tx) => tx.category_id === category.id)
        .reduce((sum, tx) => sum + Number(tx.amount), 0);
      return { name: category.name, amount: total };
    }).filter((item) => item.amount > 0);
  }, [categories, transactions]);

  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const incomeByMonth = Array(12).fill(0);
    const expenseByMonth = Array(12).fill(0);

    transactions.forEach((tx) => {
      const date = new Date(tx.date);
      const idx = date.getMonth();
      const category = categories.find((c) => c.id === tx.category_id);
      if (category?.type === 'INCOME') {
        incomeByMonth[idx] += Number(tx.amount);
      } else if (category?.type === 'EXPENSE') {
        expenseByMonth[idx] += Number(tx.amount);
      }
    });

    return {
      labels: months,
      income: incomeByMonth,
      expense: expenseByMonth,
    };
  }, [transactions, categories]);

  const expenseByCategoryData = {
    labels: categorySummary.map((item) => item.name),
    datasets: [
      {
        data: categorySummary.map((item) => item.amount),
        backgroundColor: ['#22c55e', '#38bdf8', '#f97316', '#ef4444', '#a855f7', '#facc15'],
        borderWidth: 0,
      },
    ],
  };

  const monthlyChartData = {
    labels: monthlyData.labels,
    datasets: [
      {
        label: 'Income',
        data: monthlyData.income,
        borderColor: '#14b8a6',
        backgroundColor: 'rgba(20, 184, 166, 0.25)',
        fill: true,
      },
      {
        label: 'Expenses',
        data: monthlyData.expense,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.25)',
        fill: true,
      },
    ],
  };

  const incomeExpensesChart = {
    labels: ['Income', 'Expenses'],
    datasets: [
      {
        data: [totalIncome, totalExpenses],
        backgroundColor: ['#14b8a6', '#ef4444'],
      },
    ],
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700">Loading dashboard...</div>;
  }

  if (!user) {
    return (
      <main className="flex-1 p-8 bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-4xl rounded-[2rem] bg-white p-10 shadow-xl shadow-slate-200">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] items-center">
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900">Welcome to Finance Studio</h1>
              <p className="mt-4 text-slate-600">Track expenses, categorize spending, and explore your dashboard even before signing in.</p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link to="/login" className="rounded-3xl bg-sky-600 px-6 py-3 text-white shadow-lg shadow-sky-500/20 text-center hover:bg-sky-700">
                  Sign In
                </Link>
                <Link to="/register" className="rounded-3xl border border-slate-200 px-6 py-3 text-slate-900 text-center hover:bg-slate-100">
                  Create Account
                </Link>
              </div>
            </div>
            <div className="rounded-[2rem] bg-slate-50 p-6 shadow-lg">
              <p className="text-sm uppercase tracking-[0.3em] text-sky-600">Getting started</p>
              <ul className="mt-6 space-y-4 text-slate-600">
                <li>• Add categories and manage your budget</li>
                <li>• Log payments and income in seconds</li>
                <li>• View performance charts and trends</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-8 bg-slate-50 text-slate-900">
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr] mb-6">
        <div className="rounded-[2.5rem] bg-gradient-to-br from-sky-600 via-teal-500 to-emerald-500 p-8 text-white shadow-2xl shadow-sky-500/20">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-100/90">Dashboard overview</p>
          <h1 className="mt-4 text-4xl font-extrabold">Manage your money with clarity</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-100/90">A modern expense tracker with quick insights, smart category control, and trend analytics for your finances.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-white/10 p-5 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-100/80">Starting Wallet</p>
              <p className="mt-3 text-3xl font-semibold">${walletBalance.toLocaleString()}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-5 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-100/80">Expenses</p>
              <p className="mt-3 text-3xl font-semibold">${totalExpenses.toLocaleString()}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-5 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-100/80">Wallet Balance</p>
              <p className={`mt-3 text-3xl font-semibold ${balanceSignClass}`}>${currentBalance.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/70">
          <h2 className="text-xl font-semibold text-slate-900">Latest insights</h2>
          <p className="mt-2 text-sm text-slate-500">A quick snapshot of your spending categories and cash flow.</p>
          <div className="mt-6 space-y-4">
            <div className="rounded-3xl bg-slate-50 p-5 shadow-sm">
              <p className="text-sm text-slate-500">Top category</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{categorySummary[0]?.name || 'No categories yet'}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5 shadow-sm">
              <p className="text-sm text-slate-500">Transaction count</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{transactions.length}</p>
            </div>
          </div>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr] mb-6">
        <div className="rounded-[2rem] bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Expense vs Income</h2>
            <Doughnut data={incomeExpensesChart} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Expenses by Category</h2>
          <div className="h-[320px]">
            <Doughnut data={expenseByCategoryData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white p-6 shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Monthly Trend</h2>
          <p className="text-sm text-slate-500">Based on your recorded transactions</p>
        </div>
        <div className="h-[380px]">
          <Bar data={monthlyChartData} options={{ responsive: true, plugins: { legend: { position: 'top' }, title: { display: false } }, scales: { y: { beginAtZero: true } } }} />
        </div>
      </section>
    </main>
  );
};

export default Home;
