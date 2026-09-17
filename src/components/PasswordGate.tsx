import React, { useState, useMemo } from 'react';
import { 
  Lock, 
  KeyRound, 
  User, 
  Search, 
  ShieldCheck, 
  ArrowRight, 
  Check, 
  Sparkles,
  Users,
  Eye,
  EyeOff,
  Shield
} from 'lucide-react';
import { PORTAL_CONFIG } from '../config/apps';
import { useAuth } from '../context/AuthContext';

interface PasswordGateProps {
  onAuthenticated: () => void;
}

export const PasswordGate: React.FC<PasswordGateProps> = ({ onAuthenticated }) => {
  const { users, loginWithUser, loginWithAdminMaster, loginAsGuest } = useAuth();

  const [mode, setMode] = useState<'teacher' | 'admin' | 'guest'>('teacher');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [adminPin, setAdminPin] = useState<string>('');
  const [showAdminPin, setShowAdminPin] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Filter active teachers by search
  const filteredUsers = useMemo(() => {
    return users.filter(u => u.active !== false && u.name.toLowerCase().includes(searchQuery.toLowerCase().trim()));
  }, [users, searchQuery]);

  // Handle Teacher PIN Submit
  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setHasError(true);
      setErrorMessage('Bitte wählen Sie Ihren Namen aus der Liste aus.');
      return;
    }
    if (!pin.trim()) {
      setHasError(true);
      setErrorMessage('Bitte geben Sie Ihre 4-stellige PIN ein.');
      return;
    }

    const success = await loginWithUser(selectedUserId, pin);
    if (success) {
      onAuthenticated();
    } else {
      setHasError(true);
      setErrorMessage('Falsche PIN. Bitte prüfen Sie Ihre 4-stellige Eingabe.');
      setPin('');
    }
  };

  // Handle Admin Master PIN Submit
  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPin.trim()) {
      setHasError(true);
      setErrorMessage('Bitte geben Sie das Admin-Passwort ein.');
      return;
    }

    const success = loginWithAdminMaster(adminPin);
    if (success) {
      onAuthenticated();
    } else {
      setHasError(true);
      setErrorMessage('Ungültiges Admin-Passwort.');
    }
  };

  // Handle Guest Login
  const handleGuestSubmit = () => {
    loginAsGuest();
    onAuthenticated();
  };

  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#F0F8FA] via-[#F8FBFC] to-[#EDF4FF] flex flex-col justify-center items-center px-4 py-8 sm:py-12 relative overflow-hidden font-sans pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(2rem+env(safe-area-inset-top))]">
      {/* Decorative background glow circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-hbs-blue-light/50 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-hbs-teal-light/40 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Main Card */}
        <div className={`bg-white rounded-3xl p-6 sm:p-8 shadow-2xl shadow-hbs-slate-dark/15 border border-hbs-slate-border/70 backdrop-blur-sm transition-all duration-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] ${hasError ? 'animate-shake' : ''}`}>
          
          {/* School Emblem & Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative mb-3 group">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-hbs-blue-soft p-2 flex items-center justify-center border-2 border-hbs-blue/20 shadow-md transition-transform duration-300 group-hover:scale-105 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]">
                <img 
                  src="/Siegel_bunt.png" 
                  alt="Schulsiegel Heimbürgeschule" 
                  className="w-full h-full object-contain filter drop-shadow-sm"
                />
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 bg-hbs-blue text-white p-1 rounded-full shadow-md">
                <Lock className="w-3.5 h-3.5" />
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-hbs-slate-dark tracking-tight">
              {PORTAL_CONFIG.portalTitle}
            </h1>
            <p className="text-xs font-semibold text-hbs-slate-muted mt-0.5">
              {PORTAL_CONFIG.schoolName} • {PORTAL_CONFIG.schoolLocation}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => { setMode('teacher'); setHasError(false); setErrorMessage(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mode === 'teacher'
                  ? 'bg-white text-hbs-blue-deep shadow-xs'
                  : 'text-hbs-slate-muted hover:text-hbs-slate-dark'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Kollegium</span>
            </button>

            <button
              type="button"
              onClick={() => { setMode('admin'); setHasError(false); setErrorMessage(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mode === 'admin'
                  ? 'bg-white text-hbs-slate-dark shadow-xs'
                  : 'text-hbs-slate-muted hover:text-hbs-slate-dark'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              <span>Admin</span>
            </button>

            <button
              type="button"
              onClick={() => { setMode('guest'); setHasError(false); setErrorMessage(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mode === 'guest'
                  ? 'bg-white text-hbs-teal-deep shadow-xs'
                  : 'text-hbs-slate-muted hover:text-hbs-slate-dark'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tafel-Gast</span>
            </button>
          </div>

          {/* Error Message */}
          {hasError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-600 flex items-center gap-2 animate-fadeIn">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* MODE 1: TEACHER NAME + 4-DIGIT PIN */}
          {mode === 'teacher' && (
            <form onSubmit={handleTeacherSubmit} className="space-y-4">
              {/* Teacher Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-hbs-slate-muted mb-1.5">
                  1. Name der Lehrkraft auswählen:
                </label>

                {/* Search / Filter */}
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-hbs-slate-light absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Kollegen suchen..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-hbs-slate-dark placeholder:text-hbs-slate-muted/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-hbs-blue/20"
                  />
                </div>

                {/* Teachers List Dropdown */}
                <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white">
                  {filteredUsers.length === 0 ? (
                    <div className="p-3 text-center text-xs text-hbs-slate-muted">
                      Keine Lehrkraft gefunden
                    </div>
                  ) : (
                    filteredUsers.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setSelectedUserId(u.id);
                          setHasError(false);
                        }}
                        className={`w-full px-3 py-2 text-xs font-bold text-left flex items-center justify-between transition-colors ${
                          selectedUserId === u.id
                            ? 'bg-hbs-blue-soft text-hbs-blue-deep'
                            : 'hover:bg-slate-50 text-hbs-slate-dark'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-hbs-slate-light" />
                          <span>{u.name}</span>
                          {u.role === 'admin' && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                              Admin
                            </span>
                          )}
                        </span>
                        {selectedUserId === u.id && (
                          <Check className="w-4 h-4 text-hbs-blue shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* 4-Digit PIN */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-hbs-slate-muted mb-1.5">
                  2. Persönliche 4-stellige PIN:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-hbs-slate-light">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value);
                      if (hasError) setHasError(false);
                    }}
                    placeholder="••••"
                    className="w-full pl-10 pr-3 py-2.5 text-center tracking-[0.5em] text-xl font-mono font-black bg-slate-50 rounded-xl border border-slate-200 text-hbs-slate-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-hbs-blue/30 focus:border-hbs-blue"
                  />
                </div>
                <span className="text-[10px] text-hbs-slate-muted mt-1 block">
                  PIN wie in der Vertretungsstatistik (Standard: 1234 oder persönlich vergeben).
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 px-4 bg-gradient-to-r from-hbs-blue to-hbs-blue-deep hover:from-hbs-blue-deep hover:to-[#093d56] text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>Anmelden & Arbeitsplatz laden</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* MODE 2: ADMIN MASTER PIN */}
          {mode === 'admin' && (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-200 rounded-2xl flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900 leading-snug">
                  <strong>Admin-Zugang:</strong> Zugriff auf das Admin-Panel zur Benutzerverwaltung, PIN-Listen, Vertretungsstatistik-Synchronisation und Schulvorlagen.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-hbs-slate-muted mb-1.5">
                  Master-Passwort:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-hbs-slate-light">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showAdminPin ? 'text' : 'password'}
                    value={adminPin}
                    onChange={(e) => {
                      setAdminPin(e.target.value);
                      if (hasError) setHasError(false);
                    }}
                    placeholder="Admin Master-Passwort eingeben..."
                    className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 rounded-xl border border-slate-200 text-hbs-slate-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPin(!showAdminPin)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-hbs-slate-light hover:text-hbs-slate-dark"
                  >
                    {showAdminPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>Als Admin anmelden</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* MODE 3: GUEST / SMARTBOARD MODE */}
          {mode === 'guest' && (
            <div className="space-y-4 text-center">
              <div className="p-4 bg-teal-50 border border-teal-100 rounded-2xl">
                <Sparkles className="w-8 h-8 text-hbs-teal-deep mx-auto mb-2" />
                <h3 className="text-sm font-black text-hbs-slate-dark">
                  Tafel-Gastzugang
                </h3>
                <p className="text-xs text-hbs-slate-muted mt-1 leading-relaxed">
                  Ideal für Klassenräume, Smartboards oder schnelle Nutzung ohne persönliche Benutzerdaten. Unterrichts-Apps und Tafeltools stehen sofort bereit.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGuestSubmit}
                className="w-full py-3 px-4 bg-gradient-to-r from-hbs-teal-deep to-[#005f56] hover:from-[#005f56] hover:to-[#004a43] text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>Tafel ohne Login starten</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Footer Security Badges */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-4 text-[11px] font-semibold text-hbs-slate-muted">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Firebase Cloud Sync</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-hbs-blue" />
              <span>{users.length} Lehrkräfte</span>
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};
