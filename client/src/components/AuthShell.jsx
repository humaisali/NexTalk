import { Code2, Languages, Sparkles } from 'lucide-react';
import BrandMark from './BrandMark';

const benefits = [
  { icon: Sparkles, title: 'Catch up quickly', text: 'Summaries help you return without losing the thread.' },
  { icon: Languages, title: 'Understand each other', text: 'Translate messages while keeping the original in view.' },
  { icon: Code2, title: 'Share technical context', text: 'Send readable code with explanations when you need them.' },
];

const AuthShell = ({ eyebrow, title, description, children }) => (
  <main className="auth-page">
    <section className="auth-showcase" aria-labelledby="auth-showcase-title">
      <div className="auth-showcase-glow auth-showcase-glow-one" aria-hidden="true" />
      <div className="auth-showcase-glow auth-showcase-glow-two" aria-hidden="true" />

      <div className="relative z-10">
        <BrandMark inverse />
      </div>

      <div className="relative z-10 max-w-lg">
        <p className="auth-eyebrow">AI-assisted conversations</p>
        <p id="auth-showcase-title" className="mt-4 text-4xl font-bold leading-tight tracking-[-0.04em] text-white xl:text-5xl">
          Stay in context.<br />Respond with confidence.
        </p>
        <p className="mt-5 max-w-md text-base leading-7 text-slate-300">
          Clear communication for conversations that move fast, with helpful AI only when you ask.
        </p>

        <div className="mt-10 grid gap-3">
          {benefits.map(({ icon: Icon, title: benefitTitle, text }) => (
            <div key={benefitTitle} className="auth-benefit">
              <span className="auth-benefit-icon" aria-hidden="true"><Icon size={18} /></span>
              <span>
                <strong className="block text-sm font-semibold text-white">{benefitTitle}</strong>
                <span className="mt-0.5 block text-sm leading-5 text-slate-400">{text}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="relative z-10 text-xs text-slate-500">Built by SkyTech Developers</p>
    </section>

    <section className="auth-panel" aria-labelledby="auth-form-title">
      <div className="mb-10 lg:hidden">
        <BrandMark />
      </div>
      <div className="w-full max-w-md">
        <p className="auth-eyebrow text-brand-700 dark:text-brand-300">{eyebrow}</p>
        <h1 id="auth-form-title" className="mt-3 text-3xl font-bold tracking-[-0.035em] text-gray-950 dark:text-white">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-slate-400">{description}</p>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  </main>
);

export default AuthShell;
