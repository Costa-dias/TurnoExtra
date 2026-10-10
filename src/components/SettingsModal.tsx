import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Lock,
  Download,
  Upload,
  Shield,
  Info,
  AlertTriangle,
  Sun,
  Moon,
} from 'lucide-react';
import type { AppData } from '@/types';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { SiteFooter } from '@/components/SiteFooter';
import { checkNewPin, sanitizeString } from '@/lib/validation';
import { changePin, clearAllData } from '@/lib/storage';
import { exportBackup, importBackup, downloadBackup } from '@/lib/backup';
import { useTheme } from '@/lib/theme';
import { markBackupDone } from '@/lib/backupReminder';
import { buildShiftsCsv } from '@/lib/exportCsv';

const MAX_BACKUP_BYTES = 5 * 1024 * 1024; // 5 MB

const itemButton =
  'flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-slate-600 dark:hover:bg-slate-800';
const sectionTitle =
  'mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300';
const statCard =
  'rounded-xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-700 dark:bg-slate-800/50';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  data: AppData;
  pin: string;
  onImported: (data: AppData) => Promise<boolean>;
  onPinChanged: (newPin: string) => void;
  onPinReset: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function SettingsModal({
  open,
  onClose,
  data,
  pin,
  onImported,
  onPinChanged,
  onPinReset,
  showToast,
}: SettingsModalProps) {
  const [section, setSection] = useState<'main' | 'changePin' | 'resetPin'>('main');
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [resetConfirmPin, setResetConfirmPin] = useState('');
  const [resetError, setResetError] = useState('');
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();

  // Ao fechar, limpa PINs digitados e volta para a tela principal
  useEffect(() => {
    if (!open) {
      setSection('main');
      setOldPin('');
      setNewPin('');
      setConfirmNewPin('');
      setPinError('');
      setResetConfirmPin('');
      setResetError('');
    }
  }, [open]);

  const handleChangePin = useCallback(async () => {
    if (busy) return;
    setPinError('');
    if (!oldPin) {
      setPinError('Digite seu PIN atual.');
      return;
    }
    const pinErr = checkNewPin(newPin);
    if (pinErr) {
      setPinError(pinErr);
      return;
    }
    if (newPin === oldPin) {
      setPinError('O novo PIN deve ser diferente do atual.');
      return;
    }
    if (newPin !== confirmNewPin) {
      setPinError('Os PINs não coincidem.');
      return;
    }
    setBusy(true);
    try {
      const ok = await changePin(oldPin, newPin);
      if (ok) {
        onPinChanged(newPin);
        showToast('PIN alterado com sucesso.', 'success');
        setSection('main');
        setOldPin('');
        setNewPin('');
        setConfirmNewPin('');
      } else {
        setPinError('PIN atual incorreto.');
      }
    } catch {
      setPinError('Não foi possível alterar o PIN. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }, [busy, oldPin, newPin, confirmNewPin, showToast, onPinChanged]);

  const handleResetPin = useCallback(async () => {
    if (busy || resetConfirmPin !== 'APAGAR') return;
    setResetError('');
    setBusy(true);
    try {
      await clearAllData();
      showToast('PIN e dados redefinidos.', 'info');
      onPinReset();
      onClose();
    } catch {
      setResetError('Não foi possível apagar os dados. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }, [busy, resetConfirmPin, showToast, onPinReset, onClose]);

  const handleExport = useCallback(async () => {
    try {
      const blob = await exportBackup(data, pin);
      const date = new Date().toISOString().slice(0, 10);
      downloadBackup(blob, `turnoextra-backup-${date}.json`);
      markBackupDone();
      showToast('Backup exportado com sucesso.', 'success');
    } catch {
      showToast('Erro ao exportar backup.', 'error');
    }
  }, [data, pin, showToast]);

  const handleExportCsv = useCallback(() => {
    if (data.shifts.length === 0) {
      showToast('Não há serviços para exportar.', 'error');
      return;
    }
    try {
      const blob = buildShiftsCsv(data.shifts);
      const date = new Date().toISOString().slice(0, 10);
      downloadBackup(blob, `turnoextra-servicos-${date}.csv`);
      showToast('Planilha exportada. O arquivo não é criptografado: guarde com cuidado.', 'success');
    } catch {
      showToast('Erro ao exportar a planilha.', 'error');
    }
  }, [data.shifts, showToast]);

  const handleImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
        if (!file || busy) return;
      const clearInput = () => {
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      if (file.size === 0 || file.size > MAX_BACKUP_BYTES) {
        showToast('Arquivo inválido ou maior que 5 MB.', 'error');
        clearInput();
        return;
      }
        setBusy(true);
        try {
        const imported = await importBackup(file, pin);
        if (!(await onImported(imported))) return;
        showToast('Backup importado com sucesso.', 'success');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao importar.';
        showToast(msg, 'error');
        } finally { setBusy(false); clearInput(); }
    },
    [pin, onImported, showToast, busy]
  );

  const totalShifts = data.shifts.length;
  const paidShifts = data.shifts.filter((s) => s.paid).length;

  // Compara "AAAA-MM" direto no texto da data (evita erro de fuso horário)
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthRevenue = data.shifts
    .filter((s) => s.date.startsWith(currentMonth))
    .reduce((sum, s) => sum + s.value, 0);

  const themeButton = (active: boolean) =>
    `flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
      active
        ? 'border-teal-600 bg-teal-50 text-teal-800 dark:border-teal-500 dark:bg-teal-600/20 dark:text-teal-400'
        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:border-slate-600'
    }`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Configurações"
      maxWidth="max-w-lg"
      footer={
        section !== 'main' ? (
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setSection('main');
                setPinError('');
                setResetError('');
                setResetConfirmPin('');
              }}
            >
              Voltar
            </Button>
            {section === 'changePin' && (
              <Button variant="primary" onClick={handleChangePin} disabled={busy}>
                {busy ? 'Alterando...' : 'Confirmar alteração'}
              </Button>
            )}
            {section === 'resetPin' && (
              <Button
                variant="danger"
                onClick={handleResetPin}
                disabled={busy || resetConfirmPin !== 'APAGAR'}
              >
                Redefinir tudo
              </Button>
            )}
          </>
        ) : (
          <Button variant="ghost" onClick={onClose}>Fechar</Button>
        )
      }
    >
      {section === 'main' && (
        <div className="space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className={statCard}>
              <p className="text-2xl font-bold text-teal-700 dark:text-teal-400">{totalShifts}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Serviços</p>
            </div>
            <div className={statCard}>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{paidShifts}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Pagos</p>
            </div>
            <div className={statCard}>
              <p className="text-lg font-bold text-amber-700 dark:text-amber-400">
                {new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(monthRevenue)}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Mês atual</p>
            </div>
          </div>

          {/* Aparência */}
          <div>
            <h3 className={sectionTitle}>
              <Sun size={15} className="text-teal-700 dark:text-teal-400" />
              Aparência
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTheme('light')}
                aria-pressed={theme === 'light'}
                className={themeButton(theme === 'light')}
              >
                <Sun size={16} /> Claro
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                aria-pressed={theme === 'dark'}
                className={themeButton(theme === 'dark')}
              >
                <Moon size={16} /> Escuro
              </button>
            </div>
          </div>

          {/* PIN */}
          <div>
            <h3 className={sectionTitle}>
              <Lock size={15} className="text-teal-700 dark:text-teal-400" />
              Segurança
            </h3>
            <div className="space-y-1.5">
              <button
                onClick={() => setSection('changePin')}
                className={`${itemButton} justify-between`}
              >
                <span className="text-sm text-slate-800 dark:text-slate-200">Alterar PIN</span>
                <span className="text-slate-500">→</span>
              </button>
              <button
                onClick={() => setSection('resetPin')}
                className="flex w-full items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left transition hover:border-red-300 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/20 dark:hover:border-red-800 dark:hover:bg-red-950/40"
              >
                <span className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                  <AlertTriangle size={14} />
                  Redefinir PIN e apagar dados
                </span>
                <span className="text-red-500">→</span>
              </button>
            </div>
          </div>

          {/* Backup */}
          <div>
            <h3 className={sectionTitle}>
              <Shield size={15} className="text-teal-700 dark:text-teal-400" />
              Backup & Transferência
            </h3>
            <div className="space-y-1.5">
              <button onClick={handleExport} className={itemButton}>
                <Download size={18} className="text-teal-700 dark:text-teal-400" />
                <div>
                  <p className="text-sm text-slate-800 dark:text-slate-200">Exportar backup</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Arquivo .json criptografado</p>
                </div>
              </button>
              <button onClick={handleExportCsv} className={itemButton}>
                <Download size={18} className="text-teal-700 dark:text-teal-400" />
                <div>
                  <p className="text-sm text-slate-800 dark:text-slate-200">Exportar planilha (CSV)</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Legível no celular e no PC, sem criptografia
                  </p>
                </div>
              </button>
              <button onClick={() => fileInputRef.current?.click()} className={itemButton}>
                <Upload size={18} className="text-teal-700 dark:text-teal-400" />
                <div>
                  <p className="text-sm text-slate-800 dark:text-slate-200">Importar backup</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Restaurar de arquivo .json (até 5 MB)
                  </p>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImport}
                className="hidden"
              />
            </div>
          </div>

          {/* About */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/30">
            <div className="flex items-start gap-2">
              <Info size={16} className="mt-0.5 shrink-0 text-slate-500" />
              <div className="text-xs text-slate-600 dark:text-slate-400">
                <p className="font-medium text-slate-800 dark:text-slate-300">TurnoExtra</p>
                <p className="mt-1">
                  Seus dados são armazenados localmente e criptografados com AES-256
                  usando seu PIN como chave. Nenhum dado é enviado para servidores
                  externos.
                </p>
                <SiteFooter className="mt-2" />
              </div>
            </div>
          </div>
        </div>
      )}

      {section === 'changePin' && (
        <div className="space-y-4">
          <Input
            label="PIN atual"
            type="password"
            inputMode="numeric"
            placeholder="••••"
            value={oldPin}
            onChange={(e) => setOldPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
          <Input
            label="Novo PIN (4 a 6 dígitos)"
            type="password"
            inputMode="numeric"
            placeholder="••••"
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
          <Input
            label="Confirmar novo PIN"
            type="password"
            inputMode="numeric"
            placeholder="••••"
            value={confirmNewPin}
            onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
          {pinError && <p className="text-sm text-red-600 dark:text-red-400">{pinError}</p>}
        </div>
      )}

      {section === 'resetPin' && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
            <AlertTriangle size={20} className="mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
            <div className="text-sm text-red-800 dark:text-red-300">
              <p className="font-semibold">Atenção — ação irreversível</p>
              <p className="mt-1">
                Redefinir o PIN apagará permanentemente todos os seus serviços,
                modelos e configurações. Certifique-se de exportar um backup antes
                de continuar.
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Confirme digitando <strong className="text-slate-900 dark:text-slate-300">APAGAR</strong> abaixo:
          </p>
          <Input
            placeholder="APAGAR"
            value={resetConfirmPin}
            onChange={(e) => setResetConfirmPin(sanitizeString(e.target.value, 10))}
          />
          <Button
            variant="danger"
            onClick={handleResetPin}
            disabled={busy || resetConfirmPin !== 'APAGAR'}
            className="w-full"
          >
            <AlertTriangle size={16} /> Redefinir PIN e apagar todos os dados
          </Button>
          {resetError && <p className="text-sm text-red-600 dark:text-red-400">{resetError}</p>}
        </div>
      )}
    </Modal>
  );
}
