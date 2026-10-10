import { APP_VERSION } from '@/lib/appVersion';

interface SiteFooterProps {
  className?: string;
}

export function SiteFooter({ className = '' }: SiteFooterProps) {
  return (
    <footer className={`text-xs text-slate-500 ${className}`}>
      © 2026 TurnoExtra — Created by{' '}
      <a
        href="https://github.com/Costa-dias"
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-slate-400 underline-offset-2 hover:text-teal-400 hover:underline"
      >
        Costa-Dias
      </a>
      <span className="ml-2 whitespace-nowrap">v{APP_VERSION}</span>
    </footer>
  );
}
