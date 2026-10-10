import { Trash2, Layers, Plus } from 'lucide-react';
import type { ShiftTemplate } from '@/types';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { formatTimeRange, formatCurrency } from '@/lib/dateUtils';

interface TemplateModalProps {
  open: boolean;
  onClose: () => void;
  templates: ShiftTemplate[];
  onDelete: (id: string) => void;
  onAddNew: () => void;
  onUse: (template: ShiftTemplate) => void;
}

export function TemplateModal({
  open,
  onClose,
  templates,
  onDelete,
  onAddNew,
  onUse,
}: TemplateModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Modelos"
      maxWidth="max-w-lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Fechar</Button>
          <Button variant="primary" onClick={onAddNew}>
            <Plus size={16} /> Novo Modelo
          </Button>
        </>
      }
    >
      {templates.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
            <Layers size={28} className="text-slate-500" />
          </div>
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-300">Nenhum modelo salvo</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-500">
              Crie modelos para preencher serviços com 1 clique.
            </p>
          </div>
          <Button variant="secondary" onClick={onAddNew}>
            <Plus size={16} /> Criar primeiro modelo
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-slate-600"
            >
              <div
                className="h-10 w-1.5 rounded-full"
                style={{ backgroundColor: tpl.color }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900 dark:text-slate-200">{tpl.name}</p>
                <p className="truncate text-xs text-slate-600 dark:text-slate-400">
                  {tpl.location} · {formatTimeRange(tpl.startTime, tpl.endTime)}
                  {tpl.value > 0 && ` · ${formatCurrency(tpl.value)}`}
                </p>
              </div>
              <Button variant="secondary" onClick={() => onUse(tpl)}>Usar</Button>
              <button
                onClick={() => {
                  if (confirm('Excluir este modelo?')) onDelete(tpl.id);
                }}
                aria-label={`Excluir modelo ${tpl.name}`}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
