import { useState, useEffect, useCallback } from 'react';

const THRESHOLDS = [
  { failCount: 5, durationMs: 10 * 60 * 1000 },
  { failCount: 10, durationMs: 30 * 60 * 1000 },
  { failCount: 15, durationMs: Infinity },
];

function getStorageState(storageKey) {
  try {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return { attempts: 0, lockedUntil: null, permanent: false };
    return JSON.parse(raw);
  } catch (_e) {
    return { attempts: 0, lockedUntil: null, permanent: false };
  }
}

function saveStorageState(storageKey, state) {
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(state));
  } catch (_e) { /* storage write may fail in private browsing */ }
}

function clearStorageState(storageKey) {
  try {
    sessionStorage.removeItem(storageKey);
  } catch (_e) { /* storage remove may fail in private browsing */ }
}

/**
 * @param {string} storageKey - Kunci unik di sessionStorage (misalnya 'login_rl_frontend')
 * @returns {{ isLocked, isPermanent, remainingMs, remainingLabel, attempts, recordFailure, resetAttempts }}
 */
export function useLoginRateLimit(storageKey = 'login_rate_limit') {
  const [state, setState] = useState(() => getStorageState(storageKey));
  const [now, setNow] = useState(() => Date.now());

  // Tick setiap detik untuk update countdown
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Hitung sisa waktu lock
  const lockedUntilMs = state.lockedUntil || 0;
  const remainingMs = state.permanent ? Infinity : Math.max(0, lockedUntilMs - now);
  const isLocked = state.permanent || remainingMs > 0;
  const isPermanent = state.permanent;

  // Format label countdown "MM:SS" atau "mm menit ss detik"
  const remainingLabel = useCallback(() => {
    if (state.permanent) return 'Sesi ini telah diblokir permanen.';
    if (remainingMs <= 0) return '';
    const totalSec = Math.ceil(remainingMs / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }, [state.permanent, remainingMs]);

  // Helper: find the matching threshold for a given attempt count
  const findThreshold = (attempts) => {
    for (let i = THRESHOLDS.length - 1; i >= 0; i--) {
      if (attempts >= THRESHOLDS[i].failCount) return THRESHOLDS[i];
    }
    return null;
  };

  // Helper: apply a matched threshold to produce new state
  const applyThreshold = (baseState, threshold) => {
    if (!threshold) return baseState;
    if (threshold.durationMs === Infinity) {
      return { ...baseState, permanent: true, lockedUntil: null };
    }
    return { ...baseState, permanent: false, lockedUntil: Date.now() + threshold.durationMs };
  };

  /**
   * Dipanggil setiap kali login gagal.
   * Mengembalikan { isLocked, isPermanent } setelah update.
   */
  const recordFailure = useCallback(() => {
    const current = getStorageState(storageKey);
    if (current.permanent) return { isLocked: true, isPermanent: true };

    const newAttempts = current.attempts + 1;
    const threshold = findThreshold(newAttempts);
    const newState = applyThreshold({ ...current, attempts: newAttempts }, threshold);

    saveStorageState(storageKey, newState);
    setState(newState);
    return { isLocked: newState.permanent || (newState.lockedUntil > Date.now()), isPermanent: newState.permanent };
  }, [storageKey]);

  /**
   * Dipanggil saat login BERHASIL untuk mereset counter.
   */
  const resetAttempts = useCallback(() => {
    clearStorageState(storageKey);
    setState({ attempts: 0, lockedUntil: null, permanent: false });
  }, [storageKey]);

  return {
    isLocked,
    isPermanent,
    remainingMs,
    remainingLabel,
    attempts: state.attempts,
    recordFailure,
    resetAttempts,
  };
}
