import { useEffect, useState } from 'react';
import { FiHash, FiSearch, FiShield, FiCheckCircle } from 'react-icons/fi';
import EncodeView from './components/EncodeView';
import DecodeView from './components/DecodeView';
import './index.css';

type View = 'encode' | 'decode';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('encode');

  // اختصارات: 1 توليد، 2 فك
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === '1') setCurrentView('encode');
      if (e.key === '2') setCurrentView('decode');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div dir="rtl" className="min-h-screen">
      {/* Background (like the theme image) */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_400px_at_50%_10%,rgba(59,130,246,0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(700px_340px_at_20%_70%,rgba(34,197,94,0.12),transparent_60%)]" />
      </div>

      {/* Top Bar */}
      {/* Top Bar */}
      <div className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-white shadow-sm">
              <FiHash className="text-lg" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900">PAC</h1>
              <p className="text-xs text-slate-500 -mt-0.5">Personal Address Code</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
              <FiShield className="text-slate-500" />
              خصوصية كاملة — يعمل محلياً
            </div>

            {/* Download APK */}
            <a
              href="https://www.mediafire.com/file/ide6ti7do0qupld/PAC.apk/file"
              download="PAC.apk"
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-extrabold text-white shadow-sm transition hover:opacity-90 focus:outline-none focus:ring-4 focus:ring-blue-200"
            >
              تحميل APK
            </a>
          </div>
        </div>
      </div>


      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10">
        {/* Hero */}
        <header className="mb-8">
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur md:p-8">
            <div className="flex flex-col items-center text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                <FiCheckCircle className="text-emerald-600" />
                لا يتم تخزين بيانات الموقع
              </div>

              <h2 className="mt-4 text-3xl md:text-4xl font-black text-slate-900">
                تحويل موقعك إلى عنوان قصير قابل للمشاركة
              </h2>
              <p className="mt-2 max-w-2xl text-sm md:text-base text-slate-600">
                أنشئ عنوان PAC من الإحداثيات أو افكّه للعودة إلى الموقع وعرضه على الخريطة.
              </p>

              {/* Segmented Tabs */}
              <div className="mt-6 inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1 shadow-sm">
                <Tab
                  active={currentView === 'encode'}
                  onClick={() => setCurrentView('encode')}
                  icon={<FiHash />}
                  title="توليد عنوان"
                  hint="1"
                />
                <Tab
                  active={currentView === 'decode'}
                  onClick={() => setCurrentView('decode')}
                  icon={<FiSearch />}
                  title="فك عنوان"
                  hint="2"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Main card area */}
        <main className="max-w-4xl mx-auto">
          <div className="rounded-3xl border border-slate-200 bg-white shadow-[0_24px_70px_-45px_rgba(15,23,42,0.35)]">
            <div className="p-5 md:p-7">
              {currentView === 'encode' ? <EncodeView /> : <DecodeView />}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-slate-500">
          <p className="font-semibold text-slate-700">PAC v1.0</p>
          <p className="mt-1">نظام عنونة شخصي آمن — كل العمليات تتم داخل المتصفح</p>
        </footer>
      </div>
    </div>
  );
}

function Tab({
  active,
  onClick,
  icon,
  title,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'group inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold transition',
        'focus:outline-none focus:ring-4 focus:ring-blue-200',
        active
          ? 'bg-slate-900 text-white shadow-sm'
          : 'text-slate-700 hover:bg-white',
      ].join(' ')}
      aria-pressed={active}
    >
      <span className={active ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'}>
        {icon}
      </span>
      <span>{title}</span>
      {hint && (
        <span
          className={[
            'ms-2 rounded-full border px-2 py-0.5 text-[11px] font-black',
            active
              ? 'border-white/20 bg-white/10 text-white/90'
              : 'border-slate-200 bg-slate-100 text-slate-500',
          ].join(' ')}
          title={`Shortcut: ${hint}`}
        >
          {hint}
        </span>
      )}
    </button>
  );
}
