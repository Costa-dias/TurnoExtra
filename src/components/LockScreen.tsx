import { useState, useEffect, useCallback } from 'react';
import { Lock, Shield, Delete, AlertTriangle, Sun, Moon } from 'lucide-react';
import { checkNewPin } from '@/lib/validation';
import { isPinSet } from '@/lib/storage';
import { SiteFooter } from '@/components/SiteFooter';

interface LockScreenProps {
  mode: 'setup' | 'unlock';
  error: string;
  lockedSeconds: number;
  onSetup: (pin: string) => void;
  onUnlock: (pin: string) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export function LockScreen({
  mode,
  error,
  lockedSeconds,
  onSetup,
  onUnlock,
  theme,
  onToggleTheme,
}: LockScreenProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [localError, setLocalError] = useState('');
  const [hasPin, setHasPin] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try { setHasPin(await isPinSet()); }
      catch { setLocalError('O armazenamento local está indisponível. Tente reabrir o aplicativo sem limpar os dados.'); }
    })();
  }, []);

  const displayError = error || localError;
  const isLocked = lockedSeconds > 0;

  const handleDigit = useCallback(
    (digit: string) => {
      if (isLocked) return;
      setLocalError('');
      if (mode === 'setup') {
        if (step === 'create') {
          if (pin.length < 6) setPin((prev) => prev + digit);
        } else {
          if (confirmPin.length < 6) setConfirmPin((prev) => prev + digit);
        }
      } else {
        if (pin.length < 6) setPin((prev) => prev + digit);
      }
    },
    [isLocked, mode, step, pin.length, confirmPin.length]
  );

  const handleBackspace = useCallback(() => {
    if (isLocked) return;
    setLocalError('');
    if (mode === 'setup' && step === 'confirm') {
      setConfirmPin((prev) => prev.slice(0, -1));
    } else {
      setPin((prev) => prev.slice(0, -1));
    }
  }, [isLocked, mode, step]);

  const handleSubmitSetup = useCallback(() => {
    if (step === 'create') {
      const err = checkNewPin(pin);
      if (err) {
        setLocalError(err);
        setPin('');
        return;
      }
      setStep('confirm');
      setLocalError('');
    } else {
      if (pin !== confirmPin) {
        setLocalError('Os PINs não coincidem. Tente novamente.');
        setConfirmPin('');
        return;
      }
      onSetup(pin);
    }
  }, [step, pin, confirmPin, onSetup]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLocked) return;

      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        if (mode === 'setup' && step === 'create' && pin.length >= 4) {
          handleSubmitSetup();
        } else if (mode === 'unlock' && pin.length >= 4) {
          onUnlock(pin);
          setPin('');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, handleDigit, handleBackspace, handleSubmitSetup, mode, step, pin, onUnlock]);

  useEffect(() => {
    if (mode === 'unlock' && pin.length === 6) {
      const timer = setTimeout(() => {
        onUnlock(pin);
        setPin('');
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [pin, mode, onUnlock]);

  useEffect(() => {
    if (mode === 'setup' && step === 'confirm' && confirmPin.length === pin.length && pin.length >= 4) {
      handleSubmitSetup();
    }
  }, [confirmPin, pin, step, mode, handleSubmitSetup]);

  const currentPin = mode === 'setup' && step === 'confirm' ? confirmPin : pin;
  const dotsLength = mode === 'setup' && step === 'create' ? pin.length : currentPin.length;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-6 py-10 text-slate-900 dark:text-slate-100 transition-colors selection:bg-teal-500 selection:text-white overflow-hidden">
      
      {/* Background Orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0 dark:hidden">
        <div className="absolute top-12 left-10 h-72 w-72 rounded-full bg-teal-200/30 blur-3xl" />
        <div className="absolute top-1/3 right-10 h-64 w-64 rounded-full bg-emerald-200/30 blur-3xl" />
      </div>

      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0 hidden dark:block">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-teal-900/20 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-slate-900/50 blur-3xl" />
      </div>

      {/* Theme Toggle Button */}
      {onToggleTheme && (
        <div
          className="absolute right-4 z-20"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
        >
          <button
            onClick={onToggleTheme}
            className="rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-slate-700 dark:text-slate-300 shadow-sm transition hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center w-full max-w-xs">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-600/10 dark:bg-teal-600/20 border border-teal-600/30 text-teal-700 dark:text-teal-400 shadow-sm">
            <Shield size={32} />
          </div>
          <h1 className="text-2xl font-black !text-slate-900 dark:!text-white tracking-tight">TurnoExtra</h1>
          <p className="text-xs !text-slate-700 dark:!text-slate-300 font-semibold">
            {mode === 'setup'
              ? step === 'create'
                ? 'Crie um PIN de acesso (4 a 6 dígitos)'
                : 'Confirme seu PIN'
              : 'Digite seu PIN para acessar'}
          </p>
        </div>

        {/* PIN Dots */}
        <div
          className="mb-8 flex justify-center gap-3"
          role="status"
          aria-label={`${dotsLength} de 6 dígitos inseridos`}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`h-3.5 w-3.5 rounded-full transition-all duration-200 ${
                i < dotsLength
                  ? 'bg-teal-600 dark:bg-teal-400 scale-110 shadow-md shadow-teal-500/30'
                  : 'border border-slate-400 dark:border-slate-700 bg-white dark:bg-slate-900/80'
              }`}
            />
          ))}
        </div>

        {/* Error Notification */}
        {displayError && (
          <div className="mb-6 flex w-full items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs !text-red-700 dark:!text-red-400 font-medium">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{displayError}</span>
          </div>
        )}

        {isLocked && (
          <div className="mb-6 flex w-full items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs !text-amber-700 dark:!text-amber-400 font-medium">
            <AlertTriangle size={16} className="shrink-0" />
            <span>Aguarde {lockedSeconds}s para tentar novamente.</span>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid w-full grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleDigit(d)}
              disabled={isLocked}
              aria-label={`Dígito ${d}`}
              className="flex h-16 items-center justify-center rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/90 text-2xl font-bold !text-slate-900 dark:!text-white shadow-sm transition-all hover:border-teal-500 dark:hover:border-teal-500 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 disabled:opacity-40"
            >
              {d}
            </button>
          ))}
          <div className="flex h-16 items-center justify-center">
            {mode === 'setup' && step === 'create' && pin.length >= 4 && (
              <button
                type="button"
                onClick={handleSubmitSetup}
                className="text-xs font-bold !text-teal-700 dark:!text-teal-400 hover:underline active:scale-95 transition-all"
              >
                Próximo
              </button>
            )}
            {mode === 'unlock' && pin.length >= 4 && pin.length < 6 && (
              <button
                type="button"
                onClick={() => {
                  onUnlock(pin);
                  setPin('');
                }}
                disabled={isLocked}
                className="text-xs font-bold !text-teal-700 dark:!text-teal-400 hover:underline disabled:opacity-40 active:scale-95 transition-all"
              >
                Entrar
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            disabled={isLocked}
            aria-label="Dígito 0"
            className="flex h-16 items-center justify-center rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/90 text-2xl font-bold !text-slate-900 dark:!text-white shadow-sm transition-all hover:border-teal-500 dark:hover:border-teal-500 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 disabled:opacity-40"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            disabled={isLocked}
            aria-label="Apagar último dígito"
            className="flex h-16 items-center justify-center rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/90 !text-slate-900 dark:!text-slate-300 shadow-sm transition-all hover:bg-slate-100 dark:hover:bg-slate-800 hover:!text-slate-900 dark:hover:!text-white active:scale-95 disabled:opacity-40"
          >
            <Delete size={22} />
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center gap-2 text-xs !text-slate-700 dark:!text-slate-400 font-medium">
          <Lock size={12} />
          <span>Seus dados são criptografados localmente com AES-256</span>
        </div>

        {mode === 'setup' && hasPin === false && (
          <p className="mt-3 text-center text-xs !text-slate-700 dark:!text-slate-400 font-medium leading-relaxed">
            Este PIN protege o acesso aos seus plantões e dados financeiros. Não há como recuperá-lo se esquecer.
          </p>
        )}

        <SiteFooter className="mt-8 text-center" />
      </div>
    </div>
  );
}
