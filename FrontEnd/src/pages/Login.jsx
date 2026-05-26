import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#0b0b0c] font-['Outfit'] relative overflow-hidden items-center justify-center p-6 md:p-12 select-none">
      
      {/* Soft cinematic ambient fog layer (very low opacity, no chaotic particles) */}
      <div className="absolute top-1/3 left-1/4 w-[450px] h-[450px] bg-[var(--accent)] rounded-full blur-[140px] opacity-[0.03] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[450px] h-[450px] bg-zinc-400 rounded-full blur-[140px] opacity-[0.02] pointer-events-none" />

      <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center justify-between gap-12 z-10 relative">
        
        {/* ─── CENTER-LEFT ALIGNED HERO INTENSITY ──────────────────────────────── */}
        <div className="flex-1 text-left space-y-6 max-w-lg lg:pr-6">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[var(--accent)]" />
            <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">SpendSnap Intelligence</span>
          </div>
          
          <h1 className="layout-hero text-white tracking-tight">
            Control every subscription in one intelligent workspace.
          </h1>
          
          <p className="text-zinc-500 text-xs font-semibold leading-relaxed max-w-sm">
            An editorial ecosystem designed to trace, analyze, and optimize your monthly recurring spending cycles.
          </p>

          {/* Left-Aligned Buttons Placement Style */}
          <div className="flex items-center gap-3 pt-2">
            <Link 
              to="/register" 
              className="py-2.5 px-5 bg-white text-zinc-950 text-xs font-bold rounded-lg hover:scale-[1.01] active:scale-98 transition-all shadow-md button-tactile"
            >
              Start tracking
            </Link>
            <a 
              href="#learn-more" 
              className="py-2.5 px-4 border border-white/[0.06] text-zinc-300 text-xs font-bold rounded-lg hover:text-white transition-colors button-tactile"
            >
              Explore Telemetry
            </a>
          </div>
        </div>

        {/* ─── FLOATING GLASS CARD (COMPACT WIDTH) ────────────────────────────── */}
        <div className="w-full max-w-[360px] shrink-0">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="rounded-[1.5rem] p-8 cinematic-glass relative"
          >
            <div className="mb-6">
              <h2 className="text-base font-bold text-white tracking-tight">Welcome Back</h2>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Enter credentials coordinates</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-rose-500/5 text-rose-400 p-3 rounded-lg text-[10px] font-bold border border-rose-500/10">
                  {error}
                </div>
              )}

              <div className="space-y-3.5">
                {/* Email address */}
                <div className="space-y-1">
                  <label htmlFor="login-email" className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block px-0.5">Email Address</label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    className="w-full input-cinematic focus:brightness-105"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label htmlFor="login-password" className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block px-0.5">Password</label>
                  <input
                    id="login-password"
                    type="password"
                    required
                    className="w-full input-cinematic focus:brightness-105"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--text)] text-zinc-950 rounded-xl py-3 text-xs font-bold hover:scale-[1.01] active:scale-98 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer button-tactile"
              >
                {loading ? 'Signing In...' : 'Sign In'}
                <ArrowRight className="h-4 w-4 stroke-[2.5]" />
              </button>
            </form>

            <p className="mt-6 text-center text-zinc-500 text-[10px] font-semibold">
              New to SpendSnap?{' '}
              <Link to="/register" className="text-[var(--accent)] font-bold hover:underline">
                Create free account
              </Link>
            </p>
          </motion.div>
        </div>

      </div>
    </div>
  );
};

export default Login;
