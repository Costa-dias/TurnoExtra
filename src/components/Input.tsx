import { type InputHTMLAttributes, type TextareaHTMLAttributes, useId } from 'react';

const fieldBase =
  'w-full rounded-xl border bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-hidden focus:ring-2 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500';
const fieldOk =
  'border-slate-300 focus:border-teal-600 focus:ring-teal-600/40 dark:border-slate-700 dark:focus:border-teal-500 dark:focus:ring-teal-500/50';
const fieldError = 'border-red-500 focus:ring-red-500/50';
const labelClass = 'text-sm font-medium text-slate-700 dark:text-slate-300';
const errorClass = 'text-xs text-red-600 dark:text-red-400';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  const autoId = useId();
  const id = props.id ?? autoId;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
      )}
      <input
        {...props}
        id={id}
        aria-invalid={error ? true : undefined}
        className={`${fieldBase} ${error ? fieldError : fieldOk} ${className}`}
      />
      {error && <span className={errorClass}>{error}</span>}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = '', ...props }: TextareaProps) {
  const autoId = useId();
  const id = props.id ?? autoId;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
      )}
      <textarea
        {...props}
        id={id}
        aria-invalid={error ? true : undefined}
        className={`${fieldBase} ${error ? fieldError : fieldOk} ${className}`}
      />
      {error && <span className={errorClass}>{error}</span>}
    </div>
  );
}
