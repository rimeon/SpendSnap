/**
 * src/utils/brandStyles.js — Shared Brand Icon/Color Mappings
 *
 * Centralises service brand recognition logic so DashboardOverview,
 * SubscriptionsPage, and any future page all use the exact same map.
 */

export const SERVICE_BRANDS = {
  netflix:  { bg: 'bg-red-500/10 border-red-500/10 text-red-500',      icon: 'N'  },
  spotify:  { bg: 'bg-green-500/10 border-green-500/10 text-green-400', icon: 'S'  },
  youtube:  { bg: 'bg-red-600/10 border-red-600/10 text-red-500',       icon: 'Y'  },
  amazon:   { bg: 'bg-amber-500/10 border-amber-500/10 text-amber-500', icon: 'A'  },
  apple:    { bg: 'bg-zinc-100/5 border-zinc-100/5 text-zinc-200',      icon: '🍎' },
  github:   { bg: 'bg-zinc-800 border-zinc-700 text-zinc-100',           icon: 'G'  },
  adobe:    { bg: 'bg-red-500/10 border-red-500/10 text-red-400',       icon: 'A'  },
  figma:    { bg: 'bg-orange-500/10 border-orange-500/10 text-orange-400', icon: 'F' },
  notion:   { bg: 'bg-zinc-100/5 border-zinc-100/5 text-zinc-300',      icon: 'N'  },
  chatgpt:  { bg: 'bg-emerald-500/10 border-emerald-500/10 text-emerald-400', icon: 'AI' },
  discord:  { bg: 'bg-indigo-500/10 border-indigo-500/10 text-indigo-400', icon: 'D' },
  slack:    { bg: 'bg-fuchsia-500/10 border-fuchsia-500/10 text-fuchsia-400', icon: 'S' },
  dropbox:  { bg: 'bg-blue-500/10 border-blue-500/10 text-blue-400',    icon: '⬡'  },
  zoom:     { bg: 'bg-blue-600/10 border-blue-600/10 text-blue-500',    icon: 'Z'  },
  microsoft:{ bg: 'bg-sky-500/10 border-sky-500/10 text-sky-400',       icon: 'M'  },
  google:   { bg: 'bg-amber-400/10 border-amber-400/10 text-amber-400', icon: 'G'  },
  canva:    { bg: 'bg-cyan-500/10 border-cyan-500/10 text-cyan-400',    icon: 'C'  },
  hulu:     { bg: 'bg-lime-500/10 border-lime-500/10 text-lime-400',    icon: 'H'  },
  disney:   { bg: 'bg-blue-700/10 border-blue-700/10 text-blue-400',   icon: 'D'  },
};

/**
 * Returns the brand color/icon config for a service name.
 * Falls back to a generic accent-colored initial if not found.
 *
 * @param {string} serviceName
 */
export const getBrandStyles = (serviceName = '') => {
  const norm = serviceName.toLowerCase().trim();
  const matchedKey = Object.keys(SERVICE_BRANDS).find(k => norm.includes(k));
  if (matchedKey) return SERVICE_BRANDS[matchedKey];
  return {
    bg:   'bg-zinc-950 border-white/[0.03] text-[var(--accent)]',
    icon: serviceName.charAt(0).toUpperCase() || '?',
  };
};

/**
 * Returns a Tailwind color string for a category badge.
 *
 * @param {string} cat
 */
export const getCategoryBadgeColor = (cat = '') => {
  const norm = cat.toLowerCase();
  if (norm.includes('streaming') || norm.includes('entertainment')) return 'border-purple-500/20 bg-purple-500/[0.03] text-purple-400';
  if (norm.includes('music'))       return 'border-pink-500/20 bg-pink-500/[0.03] text-pink-400';
  if (norm.includes('gaming'))      return 'border-blue-500/20 bg-blue-500/[0.03] text-blue-400';
  if (norm.includes('productivity') || norm.includes('software')) return 'border-amber-500/20 bg-amber-500/[0.03] text-amber-400';
  if (norm.includes('education'))   return 'border-cyan-500/20 bg-cyan-500/[0.03] text-cyan-400';
  if (norm.includes('health'))      return 'border-emerald-500/20 bg-emerald-500/[0.03] text-emerald-400';
  if (norm.includes('finance'))     return 'border-lime-500/20 bg-lime-500/[0.03] text-lime-400';
  if (norm.includes('utilities') || norm.includes('cloud')) return 'border-sky-500/20 bg-sky-500/[0.03] text-sky-400';
  return 'border-zinc-800 bg-zinc-900/50 text-zinc-400';
};
