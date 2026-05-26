import React from 'react';
import { motion } from 'framer-motion';

/**
 * ConfirmBanner — Inline popup for warning alerts and action approvals (e.g. deleting).
 */
const ConfirmBanner = ({ message, onConfirm, onCancel, confirmText = 'Confirm', danger = false }) => (
  <motion.div
    initial={{ opacity: 0, y: -6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -6 }}
    className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-zinc-950/60 border border-white/[0.04] text-xs"
  >
    <span className="text-zinc-300 font-semibold">{message}</span>
    <div className="flex items-center gap-2 shrink-0">
      <button onClick={onCancel} className="px-3 py-1.5 rounded-lg bg-zinc-900 text-zinc-400 font-bold hover:text-white transition-colors cursor-pointer">Cancel</button>
      <button onClick={onConfirm} className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${danger ? 'bg-rose-900/80 hover:bg-rose-800 text-white' : 'bg-zinc-100 text-zinc-950'}`}>{confirmText}</button>
    </div>
  </motion.div>
);

export default ConfirmBanner;
