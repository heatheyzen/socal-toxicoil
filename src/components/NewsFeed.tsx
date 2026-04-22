'use client';
import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { NewsItem } from '@/lib/types';

export default function NewsFeed() {
  const { t } = useI18n();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () => {
      fetch('/api/news')
        .then(r => r.json())
        .then(d => { setItems(d.items ?? []); setLoading(false); })
        .catch(() => setLoading(false));
    };
    load();
    const id = setInterval(load, 120_000);
    return () => clearInterval(id);
  }, []);

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
            background: '#FDECEA', color: '#CC3333',
            borderRadius: 12, letterSpacing: '0.06em',
          }}>
            LIVE
          </span>
        </div>

        {loading ? (
          <p style={{ fontSize: 13, color: 'var(--color-grey-400)' }}>{t('sidePanel.loading')}</p>
        ) : items.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--color-grey-400)', fontStyle: 'italic' }}>
            {t('news.unavailable')}
          </p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 16,
          }}>
            {items.map((item, i) => (
              <article
                key={i}
                style={{
                  background: 'white',
                  borderRadius: 8,
                  padding: 16,
                  border: '1px solid var(--color-grey-200)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <p style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
                  textTransform: 'uppercase', color: 'var(--color-grey-400)',
                }}>
                  {item.source}
                  {item.pubDate && (
                    <> · {new Date(item.pubDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</>
                  )}
                </p>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-dark)', lineHeight: 1.4 }}>
                  {item.title}
                </h3>
                {item.description && (
                  <p style={{ fontSize: 12, color: 'var(--color-grey-400)', lineHeight: 1.5, flex: 1 }}>
                    {item.description}
                  </p>
                )}
                {item.link && (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 11, color: 'var(--color-teal)', fontWeight: 600 }}
                  >
                    {t('news.readMore')}
                  </a>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
