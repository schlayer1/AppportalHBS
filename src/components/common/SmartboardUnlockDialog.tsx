import React, { useEffect, useRef, useState } from 'react';
import { Lock, KeyRound, ShieldCheck, X } from 'lucide-react';
import { PortalUser, formatTeacherName } from '../../types/user';
import { MASTER_ADMIN_PIN } from '../../services/firebase';

interface SmartboardUnlockDialogProps {
  isOpen: boolean;
  currentUser: PortalUser | null;
  onUnlock: () => void;
  onCancel: () => void;
}

export const SmartboardUnlockDialog: React.FC<SmartboardUnlockDialogProps> = ({
  isOpen,
  currentUser,
  onUnlock,
  onCancel,
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pressedOutsideRef = useRef<boolean>(false);

  const [pinInput, setPinInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const isMasterAdmin = !currentUser || currentUser.id === 'master-admin';

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      setPinInput('');
      setErrorMsg('');
      if (!dialog.open) {
        dialog.showModal();
      }
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const verifyPin = (candidate: string): boolean => {
    const trimmed = candidate.trim();
    if (!trimmed) return false;
    if (trimmed === MASTER_ADMIN_PIN) return true;
    if (currentUser && currentUser.id !== 'master-admin' && trimmed === currentUser.pin) {
      return true;
    }
    return false;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyPin(pinInput)) {
      setPinInput('');
      setErrorMsg('');
      onUnlock();
    } else {
      setErrorMsg(
        isMasterAdmin
          ? 'Ungültiges Admin-Masterpasswort.'
          : 'Falsche PIN. Bitte Ihre 4-stellige Lehrkraft-PIN eingeben.'
      );
      setPinInput('');
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPinInput(val);
    if (errorMsg) setErrorMsg('');

    // Schnelles Auto-Entsperren, sobald die persönliche 4-stellige PIN vollständig passt
    if (!isMasterAdmin && currentUser && val.trim().length === 4 && val.trim() === currentUser.pin) {
      setPinInput('');
      setErrorMsg('');
      onUnlock();
    }
  };

  // Safari fallback for closedby="any" (pointer press + release outside dialog box)
  const isOutsideDialog = (e: React.PointerEvent<HTMLDialogElement>, dialog: HTMLDialogElement) => {
    const r = dialog.getBoundingClientRect();
    return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
  };

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' } as any)}
      aria-labelledby="smartboard-unlock-title"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onPointerDown={(e) => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        pressedOutsideRef.current = isOutsideDialog(e, dialog);
      }}
      onPointerUp={(e) => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (pressedOutsideRef.current && isOutsideDialog(e, dialog)) {
          onCancel();
        }
        pressedOutsideRef.current = false;
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-3xl bg-white p-0 text-hbs-slate-dark shadow-2xl border border-hbs-slate-border/80 backdrop:bg-slate-900/60 backdrop:backdrop-blur-xs"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-hbs-amber-light border border-hbs-amber/30 text-hbs-amber-dark flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 id="smartboard-unlock-title" className="text-base font-black text-hbs-slate-dark leading-tight">
                Smartboard-Modus entsperren
              </h2>
              <p className="text-xs text-hbs-slate-muted mt-0.5">
                {isMasterAdmin
                  ? 'Admin-Passwort zum Verlassen eingeben'
                  : `PIN für ${formatTeacherName(currentUser)} eingeben`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Abbrechen"
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-hbs-slate-muted flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-hbs-slate-muted leading-relaxed mb-4 bg-slate-50 border border-slate-200/80 rounded-2xl p-3">
          Der Smartboard-Modus schützt interne Kollegiumstools im Klassenraum. Zum Zurückkehren bitte mit Ihrer PIN bestätigen.
        </p>

        {errorMsg && (
          <div
            role="alert"
            className="mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700"
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="smartboard-unlock-pin" className="sr-only">
              {isMasterAdmin ? 'Admin-Masterpasswort' : '4-stellige Lehrkraft-PIN'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-hbs-slate-light">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                ref={inputRef}
                id="smartboard-unlock-pin"
                type="password"
                inputMode={isMasterAdmin ? 'text' : 'numeric'}
                autoComplete="one-time-code"
                value={pinInput}
                onChange={handlePinChange}
                placeholder={isMasterAdmin ? 'Masterpasswort...' : '••••'}
                autoFocus
                className={`w-full pl-10 pr-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-hbs-slate-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-hbs-amber/30 focus:border-hbs-amber ${
                  isMasterAdmin
                    ? 'text-sm font-bold'
                    : 'text-center tracking-[0.5em] text-xl font-mono font-black'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-hbs-slate-dark text-xs font-bold transition-colors"
            >
              Im Smartboard bleiben
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-hbs-amber to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all active:scale-[0.98]"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Entsperren</span>
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
};
