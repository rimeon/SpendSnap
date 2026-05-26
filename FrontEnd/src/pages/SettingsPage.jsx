import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import {
  User, Settings as SettingsIcon, Bell, Shield,
  CreditCard, Loader2, ChevronDown, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS = [
  { icon: User,          label: 'Profile'       },
  { icon: SettingsIcon,  label: 'Preferences'   },
  { icon: Bell,          label: 'Notifications', soon: true },
  { icon: Shield,        label: 'Security',      soon: true },
  { icon: CreditCard,    label: 'Billing',       soon: true },
];

// ─── Inline notification banner ───────────────────────────────────────────────
const Banner = ({ type, message }) => {
  if (!message) return null;
  const styles = {
    success: 'bg-emerald-500/8 border-emerald-500/20 text-emerald-400',
    error:   'bg-rose-500/8 border-rose-500/20 text-rose-400',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className={`flex items-center gap-2 p-3.5 rounded-xl border text-xs font-bold ${styles[type]}`}
    >
      {type === 'success' && <Check className="h-3.5 w-3.5 shrink-0" />}
      {message}
    </motion.div>
  );
};

// ─── Shared labeled input ─────────────────────────────────────────────────────
const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">{label}</label>
    {children}
  </div>
);

const SettingsPage = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('Profile');

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    confirmPassword: '',
  });
  const [profileSaving, setProfileSaving]   = useState(false);
  const [profileBanner, setProfileBanner]   = useState({ type: '', message: '' });

  // Preferences state
  const [preferredCurrency, setPreferredCurrency] = useState(user?.preferredCurrency || 'INR');
  const [prefSaving, setPrefSaving]   = useState(false);
  const [prefBanner, setPrefBanner]   = useState({ type: '', message: '' });

  // Keep local state in sync if user context refreshes
  useEffect(() => {
    if (user) {
      setProfileForm(prev => ({
        ...prev,
        name: user.name  || '',
        email: user.email || '',
        // Don't reset password fields — user might be mid-typing
      }));
      setPreferredCurrency(user.preferredCurrency || 'INR');
    }
  }, [user]);

  const showBanner = (setter, type, message, ms = 4000) => {
    setter({ type, message });
    setTimeout(() => setter({ type: '', message: '' }), ms);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileBanner({ type: '', message: '' });

    if (profileForm.password && profileForm.password !== profileForm.confirmPassword) {
      showBanner(setProfileBanner, 'error', 'Passwords do not match');
      return;
    }
    if (profileForm.password && profileForm.password.length < 6) {
      showBanner(setProfileBanner, 'error', 'Password must be at least 6 characters');
      return;
    }

    try {
      setProfileSaving(true);
      const payload = { name: profileForm.name, email: profileForm.email };
      if (profileForm.password) payload.password = profileForm.password;

      const res = await api.put('/auth/profile', payload);
      if (res.data.success) {
        updateUser(res.data.data);
        setProfileForm(prev => ({ ...prev, password: '', confirmPassword: '' }));
        showBanner(setProfileBanner, 'success', 'Profile updated successfully');
      }
    } catch (err) {
      showBanner(setProfileBanner, 'error', err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePrefSubmit = async (e) => {
    e.preventDefault();
    setPrefBanner({ type: '', message: '' });
    try {
      setPrefSaving(true);
      const res = await api.put('/auth/profile', { preferredCurrency });
      if (res.data.success) {
        updateUser(res.data.data);
        showBanner(setPrefBanner, 'success', 'Preferences saved');
      }
    } catch (err) {
      showBanner(setPrefBanner, 'error', err.response?.data?.message || 'Failed to update preferences');
    } finally {
      setPrefSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">

      {/* ─── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="page-header">
        <span className="layout-label block mb-1">Account Management</span>
        <h1 className="display-section text-white">Settings</h1>
        <p className="text-[var(--text-2)] text-sm font-medium mt-1.5">Manage your profile, preferences, and account security.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 items-start">

        {/* ─── SIDEBAR NAVIGATION ─────────────────────────────────────────── */}
        <nav className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-1.5 flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ icon: Icon, label, soon }) => (
            <button
              key={label}
              onClick={() => setActiveTab(label)}
              className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-md text-xs font-semibold transition-colors text-left cursor-pointer ${
                activeTab === label
                  ? 'text-white bg-[var(--surface-3)]'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-[var(--surface-3)]/50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Icon className={`h-3.5 w-3.5 shrink-0 ${activeTab === label ? 'text-[var(--accent)]' : 'text-zinc-600'}`} />
                {label}
              </span>
              {soon && (
                <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-600 border border-zinc-800 rounded px-1.5 py-0.5">Soon</span>
              )}
            </button>
          ))}
        </nav>

        {/* ─── CONTENT PANEL ──────────────────────────────────────────────── */}
        <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >

              {/* ── Profile ────────────────────────────────────────────────── */}
              {activeTab === 'Profile' && (
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <AnimatePresence>
                    <Banner type={profileBanner.type} message={profileBanner.message} />
                  </AnimatePresence>

                  {/* Avatar row */}
                  <div className="flex items-center gap-5 py-2">
                    <div className="h-14 w-14 rounded-full bg-zinc-900 border border-white/[0.05] flex items-center justify-center font-black text-[var(--accent)] text-xl shrink-0 select-none">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-200">{user?.name}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{user?.email}</p>
                    </div>
                  </div>

                  {/* Name + Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Full Name">
                      <input
                        required
                        type="text"
                        value={profileForm.name}
                        onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full input-cinematic"
                        placeholder="John Doe"
                      />
                    </Field>
                    <Field label="Email Address">
                      <input
                        required
                        type="email"
                        value={profileForm.email}
                        onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                        className="w-full input-cinematic"
                        placeholder="name@company.com"
                      />
                    </Field>
                  </div>

                  {/* Password section */}
                  <div className="pt-4 border-t border-white/[0.02]">
                    <h3 className="layout-label text-zinc-400 mb-4">Change Password</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="New Password (optional)">
                        <input
                          type="password"
                          placeholder="Leave blank to keep current"
                          value={profileForm.password}
                          onChange={e => setProfileForm({ ...profileForm, password: e.target.value })}
                          className="w-full input-cinematic"
                        />
                      </Field>
                      <Field label="Confirm New Password">
                        <input
                          type="password"
                          placeholder="Repeat new password"
                          value={profileForm.confirmPassword}
                          onChange={e => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                          className="w-full input-cinematic"
                        />
                      </Field>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/[0.02]">
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="px-6 py-2.5 bg-zinc-100 text-zinc-950 font-bold text-xs rounded-xl hover:scale-[1.01] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer button-tactile"
                    >
                      {profileSaving ? <Loader2 className="animate-spin h-4 w-4" /> : 'Save Changes'}
                    </button>
                  </div>
                </form>
              )}

              {/* ── Preferences ────────────────────────────────────────────── */}
              {activeTab === 'Preferences' && (
                <form onSubmit={handlePrefSubmit} className="space-y-6">
                  <AnimatePresence>
                    <Banner type={prefBanner.type} message={prefBanner.message} />
                  </AnimatePresence>

                  <Field label="Preferred Currency">
                    <p className="text-zinc-500 text-xs font-medium mb-3 leading-relaxed">
                      All dashboard totals, charts, and AI insights will be converted into this currency automatically.
                    </p>
                    <div className="relative">
                      <select
                        value={preferredCurrency}
                        onChange={e => setPreferredCurrency(e.target.value)}
                        className="w-full appearance-none bg-zinc-950/60 border border-white/[0.04] text-zinc-200 rounded-xl pl-4 pr-10 py-3 text-sm font-semibold focus:ring-1 focus:ring-[var(--accent)]/40 outline-none cursor-pointer transition-colors"
                      >
                        <option value="INR" className="bg-[#121316] text-[#f5f5f5]">INR (₹) — Indian Rupee</option>
                        <option value="USD" className="bg-[#121316] text-[#f5f5f5]">USD ($) — US Dollar</option>
                        <option value="EUR" className="bg-[#121316] text-[#f5f5f5]">EUR (€) — Euro</option>
                        <option value="GBP" className="bg-[#121316] text-[#f5f5f5]">GBP (£) — British Pound</option>
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                    </div>
                  </Field>

                  <div className="pt-4 border-t border-white/[0.02]">
                    <button
                      type="submit"
                      disabled={prefSaving}
                      className="px-6 py-2.5 bg-zinc-100 text-zinc-950 font-bold text-xs rounded-xl hover:scale-[1.01] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer button-tactile"
                    >
                      {prefSaving ? <Loader2 className="animate-spin h-4 w-4" /> : 'Save Preferences'}
                    </button>
                  </div>
                </form>
              )}

              {/* ── Coming soon tabs ────────────────────────────────────────── */}
              {activeTab !== 'Profile' && activeTab !== 'Preferences' && (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-zinc-900/60 border border-white/[0.03] flex items-center justify-center">
                    {React.createElement(
                      NAV_ITEMS.find(n => n.label === activeTab)?.icon || SettingsIcon,
                      { className: 'h-6 w-6 text-zinc-600' }
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-300">{activeTab}</p>
                    <p className="text-zinc-600 text-xs font-medium mt-1">This section is coming in a future release.</p>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

export default SettingsPage;
