import { useEffect, useMemo, useRef, useState } from 'react';
import { Brain, Code2, GraduationCap, Lightbulb, Send, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { labels } from '../lib/i18n';
import { getAccessToken } from '../lib/supabase';

type Msg = { role: 'user' | 'assistant'; content: string };
type ChatThread = { id: string; title: string; messages: Msg[]; createdAt: string };

const modes = [
  { id: 'Auto', label: { en: 'Auto', ar: 'تلقائي' } },
  { id: 'Study coach', label: { en: 'Study', ar: 'مذاكرة' } },
  { id: 'Writing studio', label: { en: 'Writing', ar: 'كتابة' } },
  { id: 'Business planner', label: { en: 'Ideas', ar: 'أفكار' } },
  { id: 'Code helper', label: { en: 'Code', ar: 'كود' } },
  { id: 'Reasoning', label: { en: 'Reasoning', ar: 'تحليل' } }
];

const guestModels = [
  { id: 'QLO Auto', name: 'QLO Auto' },
  { id: 'QLO Flash', name: 'QLO Flash' },
  { id: 'QLO Study', name: 'QLO Study' }
];

const accountModels = [
  ...guestModels,
  { id: 'QLO Pro', name: 'QLO Pro' },
  { id: 'QLO Reason', name: 'QLO Reason' },
  { id: 'QLO Code', name: 'QLO Code' },
  { id: 'QLO Creative', name: 'QLO Creative' }
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function loadThreads(): ChatThread[] {
  try {
    return JSON.parse(localStorage.getItem('qv_threads') || '[]');
  } catch {
    return [];
  }
}
function saveThreads(threads: ChatThread[]) {
  localStorage.setItem('qv_threads', JSON.stringify(threads.slice(0, 20)));
}

const copyByLang = {
  ar: {
    intro: 'أهلاً، أنا',
    subtitle: 'جاهز أساعدك تبدأ منين؟',
    cards: [
      { id: 'ask', title: 'اكتب سؤالك', desc: 'شات يومي، أفكار، كتابة، وخطط بسيطة.', prompt: '', mode: 'Auto', icon: Sparkles },
      { id: 'study', title: 'ساعدني أذاكر', desc: 'شرح، تبسيط، وأسئلة للمراجعة.', prompt: 'ساعدني أعمل خطة مذاكرة ذكية للنهارده.', mode: 'Study coach', icon: GraduationCap },
      { id: 'ideas', title: 'رتّب أفكاري', desc: 'حوّل الفكرة لخطة واضحة خطوة بخطوة.', prompt: 'رتّبلي الفكرة دي وخليها خطة عملية.', mode: 'Business planner', icon: Lightbulb },
      { id: 'code', title: 'حل مشكلة كود', desc: 'ديباج، شرح، وتحسين للكود.', prompt: 'ساعدني أحل مشكلة في المشروع بتاعي.', mode: 'Code helper', icon: Code2 }
    ],
    typing: 'QLO بيكتب...',
    backendDown: 'QLO backend مش واصل دلوقتي. راجع Vercel API routes و Environment Variables.',
    empty: 'QLO رجّع رد فاضي.',
    memorySaved: 'تم حفظ معلومة بسيطة في ذاكرة QLO.',
    guestHint: 'وضع الضيف: رسالتين Flash يوميًا فقط. موديلات Pro وما فوق محتاجة تسجيل دخول.'
  },
  en: {
    intro: 'Hello, I’m',
    subtitle: 'Ready to help you get started.',
    cards: [
      { id: 'ask', title: 'Ask a question', desc: 'Daily chat, writing, planning, and ideas.', prompt: '', mode: 'Auto', icon: Sparkles },
      { id: 'study', title: 'Help me study', desc: 'Explain, simplify, and quiz me.', prompt: 'Help me build a smart study plan for today.', mode: 'Study coach', icon: GraduationCap },
      { id: 'ideas', title: 'Organize ideas', desc: 'Turn a rough idea into a clear plan.', prompt: 'Organize this idea into an actionable plan.', mode: 'Business planner', icon: Lightbulb },
      { id: 'code', title: 'Solve code issue', desc: 'Debugging, coding help, and architecture.', prompt: 'Help me solve a bug in my project.', mode: 'Code helper', icon: Code2 }
    ],
    typing: 'QLO is typing...',
    backendDown: 'QLO backend is not reachable right now. Check Vercel API routes and environment variables.',
    empty: 'QLO returned an empty response.',
    memorySaved: 'A small detail was saved to QLO memory.',
    guestHint: 'Guest mode: 2 Flash messages/day only. Pro+ models require login.'
  }
} as const;

export default function Chat() {
  const { lang, user, profile } = useApp();
  const t = labels[lang];
  const copy = lang === 'ar' ? copyByLang.ar : copyByLang.en;
  const [threads, setThreads] = useState<ChatThread[]>(loadThreads());
  const [activeId, setActiveId] = useState<string>(() => loadThreads()[0]?.id || 'new');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [model, setModel] = useState('QLO Flash');
  const loggedIn = Boolean(user || profile);
  const availableModels = loggedIn ? accountModels : guestModels;
  const [mode, setMode] = useState('Auto');
  const [error, setError] = useState('');
  const [memoryNotice, setMemoryNotice] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const animatingRef = useRef(0);

  const active = useMemo(() => threads.find((x) => x.id === activeId), [threads, activeId]);
  const msgs = active?.messages || [];

  useEffect(() => {
    if (!availableModels.some((item) => item.id === model)) setModel('QLO Flash');
  }, [loggedIn, model]);

  function setThreadMessages(threadId: string, messages: Msg[]) {
    setThreads((prev) => {
      const next = prev.map((th) => (th.id === threadId ? { ...th, messages } : th));
      saveThreads(next);
      return next;
    });
  }

  function upsertThread(messages: Msg[], userText: string) {
    if (activeId === 'new' || !active) {
      const created: ChatThread = {
        id: crypto.randomUUID(),
        title: userText.slice(0, 42) || 'New chat',
        messages,
        createdAt: new Date().toISOString()
      };
      const next = [created, ...threads].slice(0, 20);
      setThreads(next);
      saveThreads(next);
      setActiveId(created.id);
      return created.id;
    }
    const next = threads.map((th) => (th.id === activeId ? { ...th, messages, title: th.title || userText.slice(0, 42) } : th));
    setThreads(next);
    saveThreads(next);
    return activeId;
  }

  async function animateReply(threadId: string, afterUser: Msg[], reply: string) {
    const ticket = Date.now();
    animatingRef.current = ticket;
    setTyping(true);
    const clean = reply || copy.empty;
    setThreadMessages(threadId, [...afterUser, { role: 'assistant', content: '' }]);
    await sleep(80);
    const step = clean.length > 1200 ? 24 : clean.length > 500 ? 12 : 7;
    for (let i = step; i <= clean.length; i += step) {
      if (animatingRef.current !== ticket) break;
      setThreadMessages(threadId, [...afterUser, { role: 'assistant', content: clean.slice(0, i) }]);
      await sleep(10);
    }
    setThreadMessages(threadId, [...afterUser, { role: 'assistant', content: clean }]);
    setTyping(false);
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setError('');
    setMemoryNotice('');
    const afterUser = [...msgs, { role: 'user', content: text } as Msg];
    const threadId = upsertThread(afterUser, text);
    setLoading(true);
    try {
      const token = await getAccessToken();
      const r = await fetch('/api/qalvero-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ message: text, history: msgs, model, mode, language: lang })
      });
      const data = await r.json();
      const reply = data.reply || data.error || copy.empty;
      if (!r.ok) setError(data.error || 'QLO request failed');
      if (data.memory_updated) setMemoryNotice(copy.memorySaved);
      await animateReply(threadId, afterUser, reply);
    } catch {
      const reply = copy.backendDown;
      setError(reply);
      await animateReply(threadId, afterUser, reply);
    } finally {
      setLoading(false);
    }
  }

  function selectCard(prompt: string, nextMode: string) {
    setMode(nextMode);
    setInput(prompt);
    textareaRef.current?.focus();
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-4xl flex-col">
      <div className="flex-1">
        {msgs.length === 0 ? (
          <div className="grid min-h-[60vh] place-items-center pb-8 pt-8 text-center md:pb-14 md:pt-16">
            <div className="w-full">
              <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-slate-200">
                <Brain size={16} className="text-[var(--accent-1)]" /> <span>{lang === 'ar' ? 'QLO 1.2' : 'QLO 1.2'}</span>
              </div>
              <h1 className="mt-8 text-4xl font-black leading-tight md:text-6xl">
                {copy.intro} <span className="grad">QLO 1.2</span>
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-lg text-slate-400 md:text-2xl">{copy.subtitle}</p>

              <div className="mt-10 grid gap-4 md:grid-cols-2">
                {copy.cards.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.id} onClick={() => selectCard(item.prompt, item.mode)} className="feature-card text-left">
                      <div className="icon-badge">
                        <Icon className="h-6 w-6 text-[var(--accent-1)]" />
                      </div>
                      <div className="mt-5 text-2xl font-black">{item.title}</div>
                      <div className="mt-2 text-sm leading-6 text-slate-400">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pb-6 pt-4 md:pt-8">
            {msgs.map((m, i) => (
              <div key={i} className={`message-bubble flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[92%] rounded-[1.7rem] px-4 py-3 md:max-w-[78%] ${m.role === 'user' ? 'bg-[linear-gradient(135deg,var(--accent-1),var(--accent-2))] text-white shadow-lg shadow-[var(--accent-glow)]' : 'panel text-inherit'}`}>
                  <div className="markdownish whitespace-pre-wrap text-[15px] leading-7">{m.content || (typing && i === msgs.length - 1 ? <span className="typing-cursor">▋</span> : '')}</div>
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="panel rounded-[1.7rem] px-4 py-3 text-sm text-slate-300">{copy.typing}</div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 safe-bottom pt-3">
        {!loggedIn && <div className="mb-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm soft-text">{copy.guestHint}</div>}
        {error && <div className="mb-3 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}
        {memoryNotice && <div className="mb-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm soft-text">{memoryNotice}</div>}
        <div className="composer">
          <textarea
            ref={textareaRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={t.placeholder}
            className="min-h-[66px] w-full resize-none border-0 bg-transparent px-2 py-2 text-lg text-inherit outline-none placeholder:text-slate-500"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select className="chip max-w-[190px] py-3" value={model} onChange={(e) => setModel(e.target.value)}>
              {availableModels.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <select className="chip max-w-[170px] py-3" value={mode} onChange={(e) => setMode(e.target.value)}>
              {modes.map((m) => <option key={m.id} value={m.id}>{m.label[lang === 'ar' ? 'ar' : 'en']}</option>)}
            </select>
            <button onClick={send} disabled={loading || !input.trim()} className="btn btn-primary ms-auto h-14 w-14 rounded-[1.3rem] p-0 disabled:cursor-not-allowed disabled:opacity-50">
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
