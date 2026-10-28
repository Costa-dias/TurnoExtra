import { useState } from 'react';
import type { Shift } from '@/types';
import { formatCurrency, formatDateBR } from '@/lib/dateUtils';
import { outstanding } from '@/lib/receivables';

export function CollectionFollowUp({ shift, onSave }: { shift: Shift; onSave: (id: string, changes: Partial<Shift>) => Promise<boolean> }) {
  const [lastContact, setLastContact] = useState(shift.collection?.lastContact || '');
  const [expectedDate, setExpectedDate] = useState(shift.collection?.expectedDate || '');
  const [status, setStatus] = useState<NonNullable<Shift['collection']>['status'] | ''>(shift.collection?.status || '');
  const [note, setNote] = useState(shift.collection?.note || '');
  const draft = `Olá! Tudo bem? Passando para lembrar do valor pendente de ${formatCurrency(outstanding(shift))} referente ao serviço realizado em ${formatDateBR(shift.date)}. Você tem uma previsão de pagamento?`;
  const [message, setMessage] = useState(draft);
  const [draftBasis, setDraftBasis] = useState(draft);
  const stale = draftBasis !== draft;
  const [saved, setSaved] = useState('');
  const field = 'w-full rounded border border-slate-300 bg-white p-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white';
  return <details className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
    <summary className="cursor-pointer font-medium">{shift.location} · {formatCurrency(outstanding(shift))}{shift.collection?.expectedDate ? ` · Retorno: ${formatDateBR(shift.collection.expectedDate)}` : ''}{shift.collection?.status ? ` · ${shift.collection.status}` : ''}</summary>
    <form className="mt-3 grid gap-3" onSubmit={async e => { e.preventDefault(); const ok = await onSave(shift.id, { collection: { lastContact: lastContact || undefined, expectedDate: expectedDate || undefined, status: status || undefined, note: note.trim() || undefined } }); setSaved(ok ? 'Acompanhamento salvo.' : 'Não foi possível salvar.'); }}>
      <label>Último contato<input className={field} type="date" value={lastContact} onChange={e => setLastContact(e.target.value)} /></label>
      <label>Previsão de retorno ou pagamento<input className={field} type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} /></label>
      <label>Situação<select className={field} value={status} onChange={e => setStatus(e.target.value as typeof status)}><option value="">Não informada</option><option value="Aguardando retorno">Aguardando retorno</option><option value="Pagamento combinado">Pagamento combinado</option><option value="Precisa de contato">Precisa de contato</option></select></label>
      <label>Observação<textarea className={field} maxLength={500} value={note} onChange={e => setNote(e.target.value)} /></label>
      <button className="rounded bg-teal-700 px-3 py-2 text-white" type="submit">Salvar acompanhamento</button><span role="status">{saved}</span>
    </form>
    <label className="mt-3 block">Mensagem para revisar<textarea className={field} rows={4} value={message} onChange={e => setMessage(e.target.value)} /></label>
    {stale && <div role="alert" className="my-2 rounded border border-amber-500 p-2">O saldo ou a data mudou. Revise sua mensagem antes de enviar. <button type="button" className="underline" onClick={() => { if (message !== draftBasis && !confirm('Substituir sua mensagem personalizada pelo texto com o saldo atual?')) return; setMessage(draft); setDraftBasis(draft); }}>Atualizar com o saldo atual</button><button type="button" className="ml-3 underline" onClick={() => setDraftBasis(draft)}>Revisei e quero manter meu texto</button></div>}
    {shift.history?.length ? <details className="my-2"><summary>Histórico de ajustes (últimos 100)</summary>{[...shift.history].reverse().map((h, i) => <div key={i} className="my-2"><p>{new Date(h.at).toLocaleString('pt-BR')}</p><p className="break-words">Antes: {h.before}</p><p className="break-words">Depois: {h.after}</p></div>)}</details> : null}
    <a aria-disabled={stale} onClick={e => { if (stale) e.preventDefault(); }} className="mt-2 inline-block underline" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">Abrir no WhatsApp</a><p className="mt-1 text-xs">Você escolhe o contato e confirma o envio no WhatsApp.</p>
  </details>;
}
