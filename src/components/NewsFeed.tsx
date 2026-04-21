'use client';
import { useI18n } from '@/lib/i18n';

export default function NewsFeed() {
  const { t } = useI18n();
  // TODO Milestone Step 6: fetch('/api/news'), render NewsItem cards in 3-col grid
  return (
    <section
      aria-label={t('news.sectionTitle')}
      style={{
        padding: '32px 28px',
        background: '#FAFAFA',
        borderTop: '1px solid var(--color-grey-200)',
      }}
    >
      <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>
            {t('news.sectionTitle')}
          </h2>
          <span style={{
            fontSize: 10, fontWeight: 600, padding: '3px 10px',
            background: 'var(--color-teal-light)', color: 'var(--color-teal)',
            borderRadius: 12, letterSpacing: '0.06em',
          }}>
            P2 — DEFERRED
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--color-grey-400)', fontStyle: 'italic' }}>
          {t('news.unavailable')}
        </p>
      </div>
    </section>
  );
}
