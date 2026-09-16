import React, { useState } from 'react';
import { Lock, KeyRound, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';
import { PORTAL_CONFIG } from '../config/apps';

interface PasswordGateProps {
  onAuthenticated: () => void;
}

export const PasswordGate: React.FC<PasswordGateProps> = ({ onAuthenticated }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setHasError(true);
      setErrorMessage('Bitte geben Sie das Schulpasswort ein.');
      return;
    }

    if (password === PORTAL_CONFIG.portalPassword) {
      if (rememberMe) {
        localStorage.setItem('hbs_portal_auth', 'true');
        localStorage.setItem('hbs_portal_auth_timestamp', Date.now().toString());
      } else {
        sessionStorage.setItem('hbs_portal_auth', 'true');
      }
      onAuthenticated();
    } else {
      setHasError(true);
      setErrorMessage('Ungültiges Passwort. Bitte überprüfen Sie die Eingabe.');
    }
  };

  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#F0F8FA] via-[#F8FBFC] to-[#EDF4FF] flex flex-col justify-center items-center px-4 py-8 sm:py-12 relative overflow-hidden font-sans pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(2rem+env(safe-area-inset-top))]">
      {/* Decorative background glow circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-hbs-blue-light/50 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-hbs-teal-light/40 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Card with Linear-Style Inset Light Edge & Depth Shadow */}
        <div className={`bg-white rounded-3xl p-8 sm:p-10 shadow-2xl shadow-hbs-slate-dark/15 border border-hbs-slate-border/70 backdrop-blur-sm transition-all duration-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] ${hasError ? 'animate-shake' : ''}`}>
          
          {/* School Emblem & Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="relative mb-4 group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-hbs-blue-soft p-2.5 flex items-center justify-center border-2 border-hbs-blue/20 shadow-md transition-transform duration-300 group-hover:scale-105 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]">
                <img 
                  src="/Siegel_bunt.png" 
                  alt="Schulsiegel Heimbürgeschule" 
                  className="w-full h-full object-contain filter drop-shadow-sm"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-hbs-blue text-white p-1.5 rounded-full shadow-md">
                <Lock className="w-4 h-4" />
              </div>
            </div>

            <span className="text-[11px] font-extrabold uppercase tracking-wider text-hbs-blue px-3 py-1 bg-hbs-blue-soft rounded-full border border-hbs-blue/15 mb-2 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7)]">
              Kollegiumszugang
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-hbs-slate-dark tracking-tight">
              {PORTAL_CONFIG.portalTitle}
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-hbs-slate-muted mt-1">
              {PORTAL_CONFIG.schoolName} • {PORTAL_CONFIG.schoolLocation}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-hbs-slate-muted mb-2">
                Schul-Passwort
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-hbs-slate-light">
                  <KeyRound className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (hasError) setHasError(false);
                  }}
                  placeholder="Passwort eingeben..."
                  className={`w-full min-h-[48px] pl-11 pr-12 py-3 text-sm bg-hbs-bg rounded-xl border font-medium text-hbs-slate-dark placeholder-hbs-slate-light/70 focus:outline-none focus:ring-2 transition-all ${
                    hasError 
                      ? 'border-red-400 focus:ring-red-300 bg-red-50/40' 
                      : 'border-hbs-slate-border focus:border-hbs-blue focus:ring-hbs-blue/20'
                  }`}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-hbs-slate-light hover:text-hbs-blue transition-colors min-h-[44px] min-w-[44px]"
                  aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {hasError && (
                <p className="mt-2 text-xs font-semibold text-red-600 flex items-center gap-1">
                  <span>⚠️</span> {errorMessage}
                </p>
              )}
            </div>

            {/* Remember Me Checkbox with 44px min touch target */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs sm:text-sm text-hbs-slate-muted font-medium min-h-[44px] py-1">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-hbs-blue border-hbs-slate-border focus:ring-hbs-blue focus:ring-offset-0 transition cursor-pointer"
                />
                <span>Auf diesem Gerät merken</span>
              </label>
            </div>

            {/* Submit Button with Linear Light Edge & Haptic Feedback */}
            <button
              type="submit"
              className="w-full min-h-[48px] py-3 px-6 rounded-xl bg-gradient-to-r from-hbs-blue-deep to-hbs-blue text-white font-bold text-sm tracking-wide shadow-md hover:shadow-lg hover:from-hbs-blue hover:to-hbs-blue-dark active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 group shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)] select-none"
            >
              <span>Portal öffnen</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-hbs-slate-light font-medium text-center">
            <ShieldCheck className="w-4 h-4 text-hbs-teal" />
            <span>Geschützter Bereich der Heimbürgeschule Kahla</span>
          </div>

        </div>

        <p className="text-center text-xs text-hbs-slate-muted mt-6 px-4">
          Passwort vergessen? Bitte an die Schulleitung oder Systembetreuung wenden.
        </p>
      </div>
    </div>
  );
};
