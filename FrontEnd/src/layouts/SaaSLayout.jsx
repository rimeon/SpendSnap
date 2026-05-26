import React, { useContext, useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Activity, LayoutDashboard, List, PieChart, BarChart2, Settings, LogOut, Plus, User } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/axios';

const SaaSLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [seeding, setSeeding] = useState(false);

  const handleSeedDemoData = async () => {
    if (window.confirm('This will replace all your current subscriptions and budgets with realistic demo data. Continue?')) {
      try {
        setSeeding(true);
        const { data } = await api.post('/dev/seed');
        alert(data.message || 'Demo data loaded successfully!');
        window.location.reload();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to load demo data.');
      } finally {
        setSeeding(false);
      }
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Subscriptions', path: '/subscriptions', icon: List },
    { name: 'Budget', path: '/budget', icon: PieChart },
    { name: 'Analytics', path: '/analytics', icon: BarChart2 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  // Global Budget listener to toggle Warning / Default Mode
  useEffect(() => {
    const checkBudgetWarning = async () => {
      try {
        const [budgetRes, analyticsRes] = await Promise.all([
          api.get('/budget'),
          api.get('/analytics')
        ]);
        const budgetLimit = budgetRes.data.data.budgetLimit || 0;
        const totalSpend = analyticsRes.data.data.totalMonthlySpend || 0;
        
        if (budgetLimit > 0 && totalSpend > budgetLimit) {
          document.documentElement.setAttribute('data-theme', 'warning');
        } else {
          document.documentElement.setAttribute('data-theme', 'default');
        }
      } catch (err) {
        console.error('Failed to resolve budget threshold state', err);
      }
    };

    if (user) {
      checkBudgetWarning();
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

    // Bind reactive updates
    window.addEventListener('budget-update', checkBudgetWarning);
    return () => window.removeEventListener('budget-update', checkBudgetWarning);
  }, [user]);

  const handleOpenAddSub = () => {
    navigate('/subscriptions');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open-add-subscription'));
    }, 100);
  };

  return (
    <div className="flex h-screen bg-[var(--bg)] text-[var(--text)] font-['Outfit'] overflow-hidden relative transition-colors duration-300">
      
      {/* ─── DESKTOP SIDEBAR ────────────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-[232px] h-screen bg-[var(--surface)] border-r border-[var(--border)] justify-between shrink-0 z-20 py-5 px-3">
        
        {/* Brand */}
        <div className="space-y-7">
          <div className="flex items-center gap-2.5 px-2.5 py-1 select-none mb-1">
            <div className="h-6 w-6 rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/25 flex items-center justify-center shrink-0">
              <Activity className="h-3.5 w-3.5 text-[var(--accent)]" />
            </div>
            <span className="text-sm font-bold tracking-tight text-white">SpendSnap</span>
          </div>
 
          {/* Navigation */}
          <div>
            <p className="px-2.5 mb-2 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">Menu</p>
            <nav className="flex flex-col gap-0.5">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 py-2 px-2.5 rounded-md text-sm font-medium transition-all select-none ${
                      isActive
                        ? 'bg-[var(--surface-3)] text-white'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-[var(--surface-2)]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={`h-4 w-4 shrink-0 transition-colors ${isActive ? 'text-[var(--accent)]' : 'text-zinc-500'}`} />
                      <span className="flex-1">{item.name}</span>
                      {isActive && (
                        <motion.span
                          layoutId="activePill"
                          className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Demo Sandbox Tool */}
          <div className="pt-2 px-2.5">
            <button
              onClick={handleSeedDemoData}
              disabled={seeding}
              className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15 active:scale-95 transition-all border border-emerald-500/20 disabled:opacity-50 cursor-pointer"
            >
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              {seeding ? 'Seeding...' : 'Load Demo Data'}
            </button>
          </div>
        </div>
 
        {/* User Profile & Logout */}
        <div className="space-y-0.5 pt-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-3 px-2.5 py-2.5 rounded-md">
            <div className="h-7 w-7 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center font-bold text-[var(--accent)] text-xs shrink-0 select-none">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-xs font-semibold text-zinc-200 truncate">{user?.name}</p>
              <p className="text-[10px] text-zinc-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-sm font-medium text-zinc-500 hover:text-rose-400 hover:bg-rose-500/[0.06] transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>
 
      {/* ─── MOBILE CONTAINER & CONTENT WRAPPER ───────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        
        {/* Mobile header */}
        <header className="md:hidden h-12 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between px-5 z-20 shrink-0 select-none">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-md bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
              <Activity className="h-3 w-3 text-[var(--accent)]" />
            </div>
            <span className="text-xs font-bold tracking-tight text-white">SpendSnap</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSeedDemoData}
              disabled={seeding}
              className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15 py-1 px-2.5 rounded border border-emerald-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {seeding ? 'Seeding...' : 'Demo Data'}
            </button>
            <NavLink to="/settings" className="h-7 w-7 rounded-full bg-white/[0.05] border border-[var(--border)] flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors">
              <User className="h-3.5 w-3.5" />
            </NavLink>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto bg-[var(--bg)]">
          <div className="max-w-4xl mx-auto px-7 md:px-10 py-8 md:py-10 pb-28 md:pb-12">
            <Outlet />
          </div>
        </main>

        {/* ─── MOBILE BOTTOM BAR ──────────────────────────────────────────────── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--surface)]/95 backdrop-blur-xl border-t border-[var(--border)] z-50 flex items-center justify-around px-2 pb-safe select-none">
          
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-colors ${
                isActive ? 'text-[var(--accent)]' : 'text-zinc-500'
              }`
            }
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="text-[8px] font-bold mt-1 uppercase tracking-wide">Home</span>
          </NavLink>

          <NavLink
            to="/subscriptions"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-colors ${
                isActive ? 'text-[var(--accent)]' : 'text-zinc-500'
              }`
            }
          >
            <List className="h-4 w-4" />
            <span className="text-[8px] font-bold mt-1 uppercase tracking-wide">List</span>
          </NavLink>

          {/* FAB */}
          <button
            onClick={handleOpenAddSub}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--accent)] text-zinc-950 shadow-lg hover:scale-105 active:scale-95 transition-all transform -translate-y-1.5 cursor-pointer"
          >
            <Plus className="h-5 w-5 stroke-[2.5]" />
          </button>

          <NavLink
            to="/budget"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-colors ${
                isActive ? 'text-[var(--accent)]' : 'text-zinc-500'
              }`
            }
          >
            <PieChart className="h-4 w-4" />
            <span className="text-[8px] font-bold mt-1 uppercase tracking-wide">Budget</span>
          </NavLink>

          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-colors ${
                isActive ? 'text-[var(--accent)]' : 'text-zinc-500'
              }`
            }
          >
            <BarChart2 className="h-4 w-4" />
            <span className="text-[8px] font-bold mt-1 uppercase tracking-wide">Stats</span>
          </NavLink>

        </nav>
      </div>
    </div>
  );
};

export default SaaSLayout;
