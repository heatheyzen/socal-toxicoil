'use client';
import { useI18n } from '@/lib/i18n';

export default function Header() {
  const { t, lang, setLang } = useI18n();
  return (
    <header
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 'var(--header-height)',
        background: 'var(--color-teal)',
        display: 'flex', alignItems: 'center',
        padding: '0 24px', justifyContent: 'space-between',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{
          fontFamily: 'var(--font-display)', color: 'white',
          fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em',
        }}>
          {t('site.title')}
        </span>
        <span className="header-subtitle" style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.02em' }}>
          {t('site.subtitle')}
        </span>
      </div>
      <button
        onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
        aria-label="Toggle language"
        style={{
          background: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: 20, padding: '5px 16px',
          fontFamily: 'var(--font-display)',
          fontWeight: 700, fontSize: 12,
          color: 'white', cursor: 'pointer',
          letterSpacing: '0.06em',
          transition: 'background var(--transition-fast)',
        }}
      >
        {lang === 'en' ? 'ES' : 'EN'}
      </button>
    </header>
  );
}
