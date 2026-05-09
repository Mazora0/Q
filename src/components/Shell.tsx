import { Link, NavLink, useLocation } from 'react-router-dom';
import { Building2, CreditCard, Globe2, Home, LayoutDashboard, LogOut, Menu, MoonStar, Palette, Settings, Shield, Sparkles, SunMedium, Wand2, X } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { useApp, type AccentColor, type ThemeMode } from '../context/AppContext';
import { labels, type Lang } from '../lib/i18n';
import { countries, type Country } from '../lib/pricing';

const langs = [
  ['en', 'English'],
  ['ar', 'العربية'],
  ['fr', 'Français'],
  ['es', 'Español'],
  ['de', 'Deutsch'],
  ['tr', 'Türkçe'],
  ['ja', '日本語']
] as const;

const accents: { id: AccentColor; label: Record<Lang, string> }[] = [
  { id: 'orange', label: { en: 'Orange', ar: 'برتقالي', fr: 'Orange', es: 'Naranja', de: 'Orange', tr: 'Turuncu', ja: 'オレンジ' } },
  { id: 'violet', label: { en: 'Violet', ar: 'بنفسجي', fr: 'Violet', es: 'Violeta', de: 'Violett', tr: 'Mor', ja: 'バイオレット' } },
  { id: 'blue', label: { en: 'Blue', ar: 'أزرق', fr: 'Bleu', es: 'Azul', de: 'Blau', tr: 'Mavi', ja: 'ブルー' } },
  { id: 'emerald', label: { en: 'Emerald', ar: 'زمردي', fr: 'Émeraude', es: 'Esmeralda', de: 'Smaragd', tr: 'Zümrüt', ja: 'エメラルド' } }
];

const themeText: Record<ThemeMode, Record<Lang, string>> = {
  system: { en: 'System', ar: 'النظام', fr: 'Système', es: 'Sistema', de: 'System', tr: 'Sistem', ja: 'システム' },
  dark: { en: 'Dark', ar: 'داكن', fr: 'Sombre', es: 'Oscuro', de: 'Dunkel', tr: 'Koyu', ja: 'ダーク' },
  light: { en: 'Light', ar: 'فاتح', fr: 'Clair', es: 'Claro', de: 'Hell', tr: 'Açık', ja: 'ライト' }
};

function initials(name?: string | null, email?: string | null) {
  const raw = (name || email || 'Q').trim();
  return raw.slice(0, 1).toUpperCase();
}

export function Shell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { lang, setLang, theme, setTheme, accent, setAccent, country, setCountry, profile, signOut } = useApp();
  const t = labels[lang];

  const isAuthRoute = ['/login', '/signup', '/forgot-password'].includes(location.pathname);

  const nav = useMemo(
    () => [
      ['/', t.home, Home],
      ['/dashboard', t.dashboard, LayoutDashboard],
      ['/tools', t.tools, Wand2],
      ['/pricing', t.pricing, CreditCard],
      ['/company', t.company, Building2],
      ['/settings', t.settings, Settings],
      ['/legal', t.legal, Shield]
    ] as const,
    [t]
  );

  const drawer = (
    <aside className="drawer-surface h-full w-full max-w-md overflow-y-auto px-4 py-5">
      <div className="mb-6 flex items-center justify-between">
        <div className="text-lg font-black">Qalvero AI</div>
        <button className="rounded-full border border-white/10 bg-white/5 p-2" onClick={() => setOpen(false)} aria-label="Close navigation"><X size={18} /></button>
      </div>

      <div className="panel rounded-[2rem] p-5 text-center">
        <div className="mx-auto avatar-ring h-[84px] w-[84px] overflow-hidden">
          <div className="avatar-core grid h-full w-full place-items-center rounded-full text-2xl font-black">{initials(profile?.full_name, profile?.email)}</div>
        </div>
        <div className="mt-3 text-2xl font-black">{profile?.full_name || 'Ahmed'}</div>
        <div className="mt-1 text-sm text-slate-400">{profile?.email || localStorage.getItem('qv_demo_email') || 'Qalvero AI user'}</div>
      </div>

      <div className="mt-6 text-sm font-bold text-slate-400">{t.home}</div>
      <div className="mt-3">
        {nav.map(([to, label, Icon]) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className={({ isActive }) => `row-card setting-row ${isActive ? 'border-white/20 bg-white/10' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-white/5"><Icon size={18} /></div>
              <div className="font-bold">{label}</div>
            </div>
            <div className="text-slate-400">›</div>
          </NavLink>
        ))}
      </div>

      <div className="mt-6 text-sm font-bold text-slate-400">{t.settings}</div>
      <div className="mt-3 space-y-3">
        <div className="row-card setting-row">
          <div className="flex items-center gap-3"><Globe2 size={18} /><div className="meta"><div className="title">{t.language}</div></div></div>
          <select className="chip max-w-[180px] py-2" value={lang} onChange={(e) => setLang(e.target.value as Lang)}>{langs.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
        </div>
        <div className="row-card setting-row">
          <div className="flex items-center gap-3"><MoonStar size={18} /><div className="meta"><div className="title">{t.theme}</div><div className="desc">{themeText[theme][lang]}</div></div></div>
          <select className="chip max-w-[180px] py-2" value={theme} onChange={(e) => setTheme(e.target.value as ThemeMode)}>
            {(['system', 'dark', 'light'] as ThemeMode[]).map((item) => <option key={item} value={item}>{themeText[item][lang]}</option>)}
          </select>
        </div>
        <div className="row-card setting-row">
          <div className="flex items-center gap-3"><Palette size={18} /><div className="meta"><div className="title">{t.accent}</div><div className="desc">{accents.find((a) => a.id === accent)?.label[lang]}</div></div></div>
          <select className="chip max-w-[180px] py-2" value={accent} onChange={(e) => setAccent(e.target.value as AccentColor)}>{accents.map((item) => <option key={item.id} value={item.id}>{item.label[lang]}</option>)}</select>
        </div>
        <div className="row-card setting-row">
          <div className="flex items-center gap-3"><SunMedium size={18} /><div className="meta"><div className="title">{t.country}</div><div className="desc">{profile ? (lang === 'ar' ? 'مربوطة بالحساب' : 'Linked to account') : (lang === 'ar' ? 'سجّل دخول لتغييرها' : 'Login to change')}</div></div></div>
          {profile ? <select className="chip max-w-[180px] py-2" value={country} onChange={(e) => setCountry(e.target.value as Country)}>{countries.map((c) => <option key={c[0]} value={c[0]}>{c[1]}</option>)}</select> : <span className="soft-text text-sm">{country}</span>}
        </div>
      </div>

      <div className="mt-6">
        {profile ? (
          <button className="row-card setting-row w-full text-start" onClick={signOut}>
            <div className="flex items-center gap-3"><LogOut size={18} /><span className="font-bold">{t.logout}</span></div>
            <span className="text-slate-400">›</span>
          </button>
        ) : (
          <Link to="/login" onClick={() => setOpen(false)} className="btn btn-primary w-full">
            <Sparkles size={16} /> {t.login}
          </Link>
        )}
      </div>
    </aside>
  );

  if (isAuthRoute) {
    return <div className="bubble">{children}</div>;
  }

  return (
    <div className="bubble">
      <header className="sticky top-0 z-40 px-3 pt-3 md:px-6 md:pt-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between app-header rounded-[1.8rem] px-3 py-3 md:px-5">
          <Link to="/settings" className="flex min-w-0 items-center gap-3">
            <div className="avatar-ring h-[52px] w-[52px] overflow-hidden">
              <div className="avatar-core grid h-full w-full place-items-center rounded-full text-lg font-black">{initials(profile?.full_name, profile?.email)}</div>
            </div>
            <div className="hidden min-w-0 sm:block">
              <div className="truncate text-base font-black">{profile?.full_name || 'Qalvero User'}</div>
              <div className="truncate text-xs text-slate-400">{profile?.email || 'Qalvero AI'}</div>
            </div>
          </Link>

          <Link to="/" className="text-center">
            <div className="text-2xl font-black tracking-tight">Qalvero AI</div>
            <div className="text-[11px] uppercase tracking-[.28em] text-slate-400">QLO 1.2</div>
          </Link>

          <button onClick={() => setOpen(true)} aria-label="Open navigation" className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/5">
            <Menu size={24} />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-3 py-4 md:px-6 md:py-8">{children}</div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="ms-auto h-full w-[92%] max-w-md" onClick={(e) => e.stopPropagation()}>
            {drawer}
          </div>
        </div>
      )}
    </div>
  );
}
