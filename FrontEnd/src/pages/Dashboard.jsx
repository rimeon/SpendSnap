import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { Plus, LogOut, DollarSign, PieChart, Activity, TrendingUp, Calendar, Trash2, ArrowUpRight } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [subscriptions, setSubscriptions] = useState([]);
  const [budgetLimit, setBudgetLimit] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSub, setNewSub] = useState({
    serviceName: '',
    amount: '',
    billingCycle: 'monthly',
    nextBillingDate: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subsRes, budgetRes] = await Promise.all([
        api.get('/subscriptions'),
        api.get('/budget')
      ]);
      setSubscriptions(subsRes.data.data);
      setBudgetLimit(budgetRes.data.data.budgetLimit || 0);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSubscription = async (e) => {
    e.preventDefault();
    try {
      await api.post('/subscriptions', newSub);
      setShowAddModal(false);
      setNewSub({ serviceName: '', amount: '', billingCycle: 'monthly', nextBillingDate: '' });
      fetchData();
    } catch (err) {
      console.error('Failed to add subscription', err);
      alert(err.response?.data?.message || 'Failed to add subscription');
    }
  };

  const handleUpdateBudget = async (e) => {
    e.preventDefault();
    const newLimit = prompt('Enter new monthly budget limit:', budgetLimit);
    if (newLimit !== null && !isNaN(newLimit)) {
      try {
        await api.put('/budget', { budgetLimit: Number(newLimit) });
        setBudgetLimit(Number(newLimit));
      } catch (err) {
        console.error('Failed to update budget', err);
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this subscription?')) {
      try {
        await api.delete(`/subscriptions/${id}`);
        fetchData();
      } catch (err) {
        console.error('Failed to delete', err);
      }
    }
  };

  const totalMonthlySpend = subscriptions.reduce((acc, sub) => {
    return acc + (sub.billingCycle === 'yearly' ? sub.amount / 12 : sub.amount);
  }, 0);

  const entertainmentSpend = subscriptions
    .filter(sub => sub.category === 'Entertainment')
    .reduce((acc, sub) => acc + (sub.billingCycle === 'yearly' ? sub.amount / 12 : sub.amount), 0);

  const entertainmentPercentage = totalMonthlySpend ? ((entertainmentSpend / totalMonthlySpend) * 100).toFixed(0) : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      {/* Navigation - Glassmorphism */}
      <nav className="bg-white/70 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex-shrink-0 flex items-center group cursor-pointer">
              <div className="bg-indigo-600 p-2 rounded-xl group-hover:rotate-12 transition-transform duration-300">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <span className="ml-3 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                SpendSnap
              </span>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Account</span>
                <span className="text-sm font-bold text-slate-700">{user?.name}</span>
              </div>
              <button
                onClick={logout}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all active:scale-95"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Your Dashboard</h1>
            <p className="text-slate-500 mt-1">Manage and optimize your subscriptions seamlessly.</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl shadow-xl text-white bg-indigo-600 hover:bg-indigo-700 font-bold transition-all hover:-translate-y-1 active:scale-95"
          >
            <Plus className="h-5 w-5" /> Add New Service
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-12">
          {/* Total Spend Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-indigo-50 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                <TrendingUp className="h-6 w-6 text-indigo-600 group-hover:text-white" />
              </div>
              <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">+2.5% vs last month</span>
            </div>
            <p className="text-sm font-medium text-slate-500">Monthly Spending</p>
            <h2 className="text-4xl font-black text-slate-900 mt-1">₹{totalMonthlySpend.toFixed(2)}</h2>
          </div>

          {/* Budget Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-50 rounded-2xl">
                <PieChart className="h-6 w-6 text-emerald-600" />
              </div>
              <button onClick={handleUpdateBudget} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                <ArrowUpRight className="h-4 w-4 text-slate-400" />
              </button>
            </div>
            <p className="text-sm font-medium text-slate-500">Budget Limit</p>
            <h2 className="text-4xl font-black text-slate-900 mt-1">₹{budgetLimit}</h2>

            <div className="mt-6">
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${totalMonthlySpend > budgetLimit ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min((totalMonthlySpend / (budgetLimit || 1)) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Usage Intensity</span>
                <span className={`text-xs font-bold ${totalMonthlySpend > budgetLimit ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {totalMonthlySpend > budgetLimit ? 'Limit Exceeded' : `${(budgetLimit - totalMonthlySpend).toFixed(0)} remaining`}
                </span>
              </div>
            </div>
          </div>

          {/* AI Insights Card - Premium Gradient */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-500/20 group">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-indigo-500/20 blur-3xl rounded-full"></div>
            <div className="relative z-10">
              <div className="inline-block px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
                AI Insights
              </div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                Smart Analysis <span className="animate-pulse">✨</span>
              </h3>
              {subscriptions.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
                    <div className="p-1.5 bg-indigo-400/20 rounded-lg text-indigo-400">
                      <Activity className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-medium opacity-90 leading-snug">You are spending <span className="text-indigo-400 font-bold">{entertainmentPercentage}%</span> on Entertainment.</p>
                  </div>
                  {totalMonthlySpend > budgetLimit && (
                    <p className="text-sm text-rose-300 font-medium leading-snug">⚠️ Over budget detected. Review subscriptions below.</p>
                  )}
                  <button className="text-xs font-bold text-indigo-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    View optimization report <ArrowUpRight className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <p className="text-sm opacity-70 leading-relaxed italic">Add your first subscription to generate personalized AI spending insights.</p>
              )}
            </div>
          </div>
        </div>

        {/* Subscriptions List */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
          <div className="px-8 py-7 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <div>
              <h3 className="text-xl font-black text-slate-900">Active Subscriptions</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Tracking {subscriptions.length} recurring payments</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Service & Cycle</th>
                  <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Classification</th>
                  <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monthly Cost</th>
                  <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Next Billing</th>
                  <th className="px-8 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan="5" className="px-8 py-20 text-center"><div className="flex justify-center"><Activity className="animate-spin h-8 w-8 text-indigo-200" /></div></td></tr>
                ) : subscriptions.length === 0 ? (
                  <tr><td colSpan="5" className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center">
                      <div className="bg-slate-50 p-6 rounded-full mb-4"><Calendar className="h-10 w-10 text-slate-200" /></div>
                      <p className="text-slate-400 font-bold">No subscriptions yet</p>
                      <button onClick={() => setShowAddModal(true)} className="mt-4 text-indigo-600 text-sm font-bold hover:underline">Click here to add your first</button>
                    </div>
                  </td></tr>
                ) : (
                  subscriptions.map((sub) => (
                    <tr key={sub._id} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 mr-3 group-hover:bg-white group-hover:text-indigo-600 transition-all shadow-sm">
                            {sub.serviceName.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{sub.serviceName}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase">{sub.billingCycle}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="inline-flex flex-col">
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 mb-1 self-start">
                            {sub.category}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1 font-medium">{sub.subcategory}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="text-sm font-black text-slate-900">₹{sub.amount}</div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="flex items-center text-sm text-slate-600 font-medium">
                          <Calendar className="h-3.5 w-3.5 mr-2 text-slate-400" />
                          {new Date(sub.nextBillingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleDelete(sub._id)}
                          className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modern Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="relative bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-10">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-900">Add Service</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                  <Plus className="h-6 w-6 rotate-45" />
                </button>
              </div>
              <form onSubmit={handleAddSubscription} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Service Name</label>
                  <input type="text" required value={newSub.serviceName} onChange={e => setNewSub({ ...newSub, serviceName: e.target.value })} className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 focus:ring-2 focus:ring-indigo-500 transition-all font-medium" placeholder="e.g. Netflix" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Amount (₹)</label>
                    <input type="number" required min="0" step="0.01" value={newSub.amount} onChange={e => setNewSub({ ...newSub, amount: e.target.value })} className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 focus:ring-2 focus:ring-indigo-500 transition-all font-medium" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Cycle</label>
                    <select value={newSub.billingCycle} onChange={e => setNewSub({ ...newSub, billingCycle: e.target.value })} className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 focus:ring-2 focus:ring-indigo-500 transition-all font-medium appearance-none">
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Next Billing Date</label>
                  <input type="date" required value={newSub.nextBillingDate} onChange={e => setNewSub({ ...newSub, nextBillingDate: e.target.value })} className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 focus:ring-2 focus:ring-indigo-500 transition-all font-medium" />
                </div>
                <div className="pt-4">
                  <button type="submit" className="w-full bg-indigo-600 text-white rounded-2xl py-5 font-black shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-[0.98]">
                    Add & Smart Categorize
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
