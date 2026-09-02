import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { supabase, hasSupabase } from '../../lib/supabase';
import { useLanguage } from '../../context/LanguageContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Home = () => {
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const savedBalance = Number(savedUser.balance || 0);
      setWalletBalance(savedBalance);

      if (!hasSupabase) {
        setLoading(false);
        return;
      }

      const { data: authData } = await supabase.auth.getUser();
      const activeUser = authData?.user || (savedUser?.id ? { id: savedUser.id, email: savedUser.email || '' } : null);

      if (!activeUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(activeUser);

      const [{ data: txData }, { data: categoryData }, { data: profileData }] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', activeUser.id),
        supabase.from('categories').select('*').eq('user_id', activeUser.id),
        supabase.from('profiles').select('wallet_balance').eq('id', activeUser.id).maybeSingle(),
      ]);

      const dbBalance = Number(profileData?.wallet_balance ?? savedBalance ?? 0);
      setWalletBalance(dbBalance);
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
        label: t.home.income,
        data: monthlyData.income,
        borderColor: '#14b8a6',
        backgroundColor: 'rgba(20, 184, 166, 0.25)',
        fill: true,
      },
      {
        label: t.home.expensesChart,
        data: monthlyData.expense,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.25)',
        fill: true,
      },
    ],
  };

  const incomeExpensesChart = {
    labels: [t.home.income, t.home.expensesChart],
    datasets: [
      {
        data: [totalIncome, totalExpenses],
        backgroundColor: ['#14b8a6', '#ef4444'],
      },
    ],
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700">{t.home.loading}</div>;
  }

  if (!user) {
    return (
      <main className="flex-1 p-8 bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-4xl rounded-[2rem] bg-white p-10 shadow-xl shadow-slate-200">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] items-center">
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900">{t.home.welcomeTitle}</h1>
              <p className="mt-4 text-slate-600">{t.home.welcomeText}</p>
              {/* <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link to="/login" className="rounded-3xl bg-sky-600 px-6 py-3 text-white shadow-lg shadow-sky-500/20 text-center hover:bg-sky-700">
                  Sign In
                </Link>
                <Link to="/register" className="rounded-3xl border border-slate-200 px-6 py-3 text-slate-900 text-center hover:bg-slate-100">
                  Create Account
                </Link>
              </div> */}
            </div>
            <div className="rounded-[2rem] bg-slate-50 p-6 shadow-lg">
              <p className="text-sm uppercase tracking-[0.3em] text-sky-600">{t.home.gettingStarted}</p>
              <ul className="mt-6 space-y-4 text-slate-600">
                <li>• {t.home.step1}</li>
                <li>• {t.home.step2}</li>
                <li>• {t.home.step3}</li>
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
          <p className="text-sm uppercase tracking-[0.3em] text-sky-100/90">{t.home.overview}</p>
          <h1 className="mt-4 text-4xl font-extrabold">{t.home.overviewTitle}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-100/90">{t.home.overviewText}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-white/10 p-5 backdrop-blur-xl h-32 flex flex-col justify-center">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-100/80">{t.home.wallet}</p>
              <p className="mt-3 text-3xl font-semibold">${walletBalance.toLocaleString()}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-5 backdrop-blur-xl h-32 flex flex-col justify-center">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-100/80">{t.home.expenses}</p>
              <p className="mt-4 text-3xl font-semibold">${totalExpenses.toLocaleString()}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-5 backdrop-blur-xl h-32 flex flex-col justify-center">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-100/80">{t.home.walletBalance}</p>
              <p className={`mt-3 text-3xl font-semibold ${balanceSignClass}`}>${currentBalance.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/70">
          <h2 className="text-xl font-semibold text-slate-900">{t.home.latestInsights}</h2>
          <p className="mt-2 text-sm text-slate-500">{t.home.latestInsightsText}</p>
          <div className="mt-6 space-y-4">
            <div className="rounded-3xl bg-slate-50 p-5 shadow-sm">
              <p className="text-sm text-slate-500">{t.home.topCategory}</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{categorySummary[0]?.name || t.home.noCategories}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5 shadow-sm">
              <p className="text-sm text-slate-500">{t.home.transactionCount}</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{transactions.length}</p>
            </div>
          </div>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr] mb-6">
        <div className="rounded-[2rem] bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">{t.home.expenseVsIncome}</h2>
            <div style={{ height: '200px' }}>
              <Doughnut data={incomeExpensesChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 12 } } } } }} />
            </div>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">{t.home.expenseByCategory}</h2>
          <div style={{ height: '200px' }}>
            <Doughnut data={expenseByCategoryData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 12 } } } } }} />
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white p-6 shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">{t.home.monthlyTrend}</h2>
          <p className="text-sm text-slate-500">{t.home.basedOn}</p>
        </div>
        <div style={{ height: '250px' }}>
          <Bar data={monthlyChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { font: { size: 12 } } }, title: { display: false } }, scales: { y: { beginAtZero: true } } }} />
        </div>
      </section>
    </main>
  );
};

export default Home;
