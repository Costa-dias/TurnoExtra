import { ArrowRight, Sun, Moon } from 'lucide-react';
import { SiteFooter } from '@/components/SiteFooter';

interface LandingPageProps {
  onEnter: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

const TOPICS = [
  { label: 'Marcação de plantão', offset: 'ml-0' },
  { label: 'Serviços', offset: 'ml-8' },
  { label: 'Horas extras', offset: 'ml-16' },
  { label: 'Contratos', offset: 'ml-24' },
];

const STEPS = [
  {
    title: 'Crie seu PIN',
    text: 'Na primeira vez, escolha um PIN de 4 a 6 dígitos. Ele protege tudo e não pode ser recuperado: anote em um lugar seguro.',
  },
  {
    title: 'Adicione empresa, serviço ou contrato',
    text: 'Toque em Adicionar, escolha o tipo (plantão, serviço, hora extra ou contrato) e informe a empresa ou o cliente, a data, o horário e o valor.',
  },
  {
    title: 'Coloque os valores',
    text: 'Digite o valor combinado de cada serviço. O app soma o total do mês e mostra quantos já foram pagos.',
  },
  {
    title: 'Marque se foi pago',
    text: 'Abra o serviço e marque como pago, com a data do pagamento. O que não for marcado continua como a receber.',
  },
  {
    title: 'Faça seu backup',
    text: 'Em Configurações, escolha Exportar backup e guarde o arquivo no Drive ou no e-mail. O app avisa quando passar de 30 dias sem backup.',
  },
  {
    title: 'Importe quando precisar',
    text: 'No aparelho novo, crie o mesmo PIN do backup, abra Configurações, escolha Importar backup e selecione o arquivo .json.',
  },
];

const FORMATS = [
  {
    tag: 'Para guardar',
    title: 'Backup (.json)',
    points: [
      'Restaura seus dados dentro do app.',
      'Criptografado: só abre com o seu PIN.',
      'Não é legível no Excel nem no bloco de notas.',
    ],
  },
  {
    tag: 'Para conferir',
    title: 'Planilha (.csv)',
    points: [
      'Mostra serviços, horas e valores em linhas e colunas.',
      'Abre no Excel, no Google Planilhas e no celular.',
      'Sem criptografia e sem importação: guarde com cuidado.',
    ],
  },
];

// Estilo "vidro": fundo branco translúcido + desfoque + borda clara
const glassCard =
  'rounded-2xl border border-white/70 bg-white/50 shadow-lg shadow-teal-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5';

export function LandingPage({ onEnter, theme, onToggleTheme }: LandingPageProps) {
  const isDark = theme === 'dark';

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 transition-colors duration-200 selection:bg-teal-500 selection:text-white dark:bg-slate-950 dark:text-slate-100">
      {/* Fundo fixo: manchas coloridas que aparecem por trás do vidro */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-32 top-10 h-[420px] w-[420px] rounded-full bg-teal-300/60 blur-3xl dark:bg-teal-600/25" />
        <div className="absolute -right-32 top-40 h-[460px] w-[460px] rounded-full bg-emerald-300/60 blur-3xl dark:bg-emerald-600/20" />
        <div className="absolute -bottom-40 left-1/3 h-[420px] w-[520px] rounded-full bg-teal-200/70 blur-3xl dark:bg-teal-500/15" />
      </div>

      {/* Cabeçalho em cápsula de vidro */}
      <header className="relative z-20 px-4 pt-4 sm:pt-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between rounded-full border border-white/70 bg-white/50 px-6 py-3 shadow-lg shadow-teal-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
          <span className="text-xl font-extrabold tracking-tight">
            TurnoExtra<span className="text-teal-600 dark:text-teal-400">.</span>
          </span>

          <div className="flex items-center gap-3">
            <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 dark:text-slate-300 md:flex">
              <a href="#como-funciona" className="transition hover:text-teal-700 dark:hover:text-teal-400">
                Como funciona
              </a>
              <a href="#privacidade" className="transition hover:text-teal-700 dark:hover:text-teal-400">
                Privacidade
              </a>
            </nav>

            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="rounded-full border border-white/70 bg-white/60 p-2 text-slate-700 transition hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20"
                aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            )}

            <button
              onClick={onEnter}
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Entrar
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="mx-auto flex max-w-5xl flex-col items-center px-6 pb-20 pt-12 text-center sm:pt-16">
          <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl sm:leading-none md:text-6xl">
            Organize seus plantões, serviços e horas extras em um só lugar.
          </h1>
          <p className="mt-5 text-lg font-medium text-slate-700 dark:text-slate-300 sm:text-xl">
            Calendário, pagamentos, valores, contratos e relatórios — com seus dados protegidos no próprio dispositivo.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onEnter}
              className="inline-flex min-h-[52px] items-center gap-2 rounded-md bg-teal-600 px-9 text-base font-semibold text-white shadow-[5px_5px_0_0_#10b981] transition hover:bg-teal-700 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none dark:shadow-[5px_5px_0_0_#0f766e]"
            >
              Começar agora
              <ArrowRight size={18} />
            </button>
            <a
              href="#como-funciona"
              className="inline-flex min-h-[52px] items-center rounded-md border-[1.5px] border-slate-900 bg-white/40 px-8 text-base font-semibold text-slate-900 backdrop-blur-md transition hover:bg-white/70 dark:border-slate-200 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
            >
              Como funciona
            </a>
          </div>

          {/* Painel de vidro com os tópicos em escada, sobre as esferas */}
          <div className="relative mt-14 w-full max-w-md">
            <div
              aria-hidden="true"
              className="absolute -left-8 -top-8 h-28 w-28 rounded-full bg-linear-to-br/srgb from-teal-300 to-teal-600 shadow-xl shadow-teal-600/30 sm:-left-12 sm:h-40 sm:w-40 dark:from-teal-400 dark:to-teal-700"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-8 -right-6 h-24 w-24 rounded-full bg-linear-to-br/srgb from-emerald-300 to-emerald-600 shadow-xl shadow-emerald-600/30 sm:-right-10 sm:h-36 sm:w-36 dark:from-emerald-400 dark:to-emerald-700"
            />

            <div className="relative rounded-3xl border border-white/70 bg-white/30 p-6 shadow-2xl shadow-teal-900/15 ring-1 ring-inset ring-white/50 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:ring-white/5">
              <ul className="flex flex-col items-start gap-3 text-left">
                {TOPICS.map((topic) => (
                  <li
                    key={topic.label}
                    className={`${topic.offset} rounded-2xl border border-white/80 bg-white/60 px-5 py-3 text-base font-semibold shadow-md shadow-teal-900/10 backdrop-blur-md dark:border-white/10 dark:bg-white/10`}
                  >
                    {topic.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Como funciona */}
        <section id="como-funciona" className="mx-auto max-w-5xl scroll-mt-6 px-6 pb-20">
          <div className="mb-10 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">
              Como funciona
            </span>
            <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
              Do primeiro serviço ao backup, em poucos passos.
            </h2>
          </div>

          <div
            id="privacidade"
            className="mb-10 scroll-mt-6 rounded-2xl border border-white/10 bg-slate-900/90 p-6 text-slate-100 shadow-xl shadow-slate-900/20 backdrop-blur-xl sm:p-8"
          >
            <h3 className="mb-2 text-lg font-bold text-emerald-400">
              Nenhum dado sai do seu navegador.
            </h3>
            <p className="text-sm leading-relaxed text-slate-300">
              Tudo o que você anota fica salvo apenas neste navegador, neste aparelho,
              criptografado pelo seu PIN. Não existe conta, servidor nem nuvem. Por isso,
              limpar os dados do site ou trocar de aparelho apaga tudo: faça backup.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <div key={step.title} className={`${glassCard} p-6`}>
                <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white dark:bg-teal-500/20 dark:text-teal-300">
                  {index + 1}
                </div>
                <h4 className="mb-1 font-bold">{step.title}</h4>
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-400">
                  {step.text}
                </p>
              </div>
            ))}
          </div>

          <h3 className="mb-6 mt-16 text-xl font-bold">Backup .json ou planilha .csv?</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {FORMATS.map((format) => (
              <div key={format.title} className={`${glassCard} p-6`}>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                  {format.tag}
                </span>
                <h4 className="mb-3 text-lg font-bold">{format.title}</h4>
                <ul className="space-y-2">
                  {format.points.map((point) => (
                    <li key={point} className="text-sm leading-relaxed text-slate-700 dark:text-slate-400">
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Rodapé em vidro */}
      <footer className="relative z-10 w-full border-t border-white/60 bg-white/40 py-8 text-center text-xs text-slate-600 backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
        <SiteFooter className="flex flex-col items-center justify-center gap-2" />
      </footer>
    </div>
  );
}
