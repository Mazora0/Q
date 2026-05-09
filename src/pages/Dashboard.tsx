import { Link } from 'react-router-dom';
import { BarChart3, BrainCircuit, CreditCard, Database, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { limits, price } from '../lib/pricing';

const copy = {
  ar: {
    badge: 'مركز التحكم',
    title: 'أهلاً في Qalvero',
    currentPlan: 'الخطة الحالية',
    upgrade: 'ترقية الخطة',
    daily: 'رسائل الذكاء يوميًا',
    serverTracked: 'التتبع بيتم من السيرفر عن طريق Supabase.',
    region: 'منطقة الدفع',
    models: 'موديلات QLO',
    next: 'خطوة الإنتاج الجاية',
    nextText: 'ضيف مفاتيح Vercel، شغّل ملف Supabase SQL، وبعدها الذاكرة والاستخدام والخطط هتشتغل بشكل كامل.',
    cards: [
      ['QLO Flash', 'طبقة سريعة للردود اليومية مع حدود مناسبة للخطة.', Zap],
      ['توجيه ذكي', 'اختيار Flash أو Pro أو Code حسب نوع الطلب.', BrainCircuit],
      ['ذاكرة بسيطة', 'تحفظ معلومات صغيرة من الشات زي الاسم والدراسة والهدف.', Database],
      ['أمان الحساب', 'Supabase Auth و RLS ومفاتيح API على السيرفر.', ShieldCheck]
    ]
  },
  en: {
    badge: 'Control Center',
    title: 'Welcome to Qalvero',
    currentPlan: 'Current plan',
    upgrade: 'Upgrade plan',
    daily: 'Daily AI messages',
    serverTracked: 'Tracked server-side through Supabase usage controls.',
    region: 'Billing region',
    models: 'QLO models',
    next: 'Next production step',
    nextText: 'Add Vercel environment variables, run the Supabase SQL file, then auth, memory, usage, and plans will activate fully.',
    cards: [
      ['QLO Flash', 'Fast daily layer for normal assistant replies.', Zap],
      ['Smart routing', 'Chooses Flash, Pro, Reason, Code, Study, or Creative by task.', BrainCircuit],
      ['Compact memory', 'Stores small user basics from chat like name, study level, and goals.', Database],
      ['Account security', 'Supabase Auth, RLS policies, and server-side API keys.', ShieldCheck]
    ]
  }
} as const;

export default function Dashboard() {
  const { profile, country, lang } = useApp();
  const c = lang === 'ar' ? copy.ar : copy.en;
  const plan = (profile?.plan || 'Free') as keyof typeof limits;
  const current = limits[plan];

  return (
    <section className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-black uppercase tracking-[.18em]"><Sparkles size={14} /> {c.badge}</div>
          <h1 className="text-4xl font-black md:text-6xl">{c.title} <span className="grad">AI</span></h1>
          <p className="mt-3 soft-text">{profile?.email || 'Qalvero AI user'} · {c.currentPlan}: <b className="strong-muted">{plan}</b></p>
        </div>
        <Link to="/pricing" className="btn btn-primary"><CreditCard size={18} /> {c.upgrade}</Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card rounded-[2rem] p-5"><p className="text-sm soft-text">{c.daily}</p><h2 className="mt-2 text-2xl font-black leading-tight">{current.messages}</h2><p className="mt-2 text-sm soft-text">{c.serverTracked}</p></div>
        <div className="card rounded-[2rem] p-5"><p className="text-sm soft-text">{c.region}</p><h2 className="mt-2 text-4xl font-black">{country}</h2><p className="mt-2 text-sm soft-text">Standard: {price(country, 'standard')} · Premium: {price(country, 'premium')}</p></div>
        <div className="card rounded-[2rem] p-5"><p className="text-sm soft-text">{c.models}</p><h2 className="mt-2 text-4xl font-black">{current.models.length}</h2><p className="mt-2 text-sm soft-text">{current.models.join(', ')}</p></div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {c.cards.map(([title, text, Icon]) => <div key={title} className="card rounded-[2rem] p-5"><Icon className="mb-4 text-[var(--accent-1)]" /><h3 className="text-xl font-black">{title}</h3><p className="mt-2 text-sm leading-6 soft-text">{text}</p></div>)}
      </div>

      <div className="mt-5 rounded-[2rem] border border-white/10 bg-white/5 p-5">
        <div className="flex items-start gap-3"><BarChart3 className="mt-1 text-[var(--accent-1)]" /><div><h3 className="font-black">{c.next}</h3><p className="mt-1 text-sm soft-text">{c.nextText}</p></div></div>
      </div>
    </section>
  );
}
