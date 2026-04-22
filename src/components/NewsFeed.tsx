'use client';
import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { NewsItem } from '@/lib/types';

export default function NewsFeed() {
  const { t } = useI18n();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState(3);

  useEffect(() => {
    const update = () =>
      setColumns(window.innerWidth < 640 ? 1 : window.innerWidth < 1024 ? 2 : 3);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

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

  // Images-first sort for bento layout
  const sorted = [
    ...items.filter(i => i.imageUrl),
    ...items.filter(i => !i.imageUrl),
  ];

  return (
    <section
      aria-label={t('news.sectionTitle')}
      style={{ padding: '32px 28px', background: '#FAFAFA', borderTop: '1px solid var(--color-grey-200)' }}
    >
      <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>
            {t('news.sectionTitle')}
          </h2>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', background: '#FDECEA', color: '#CC3333', borderRadius: 12, letterSpacing: '0.06em' }}>
            LIVE
          </span>
        </div>

        {loading ? (
          <p style={{ fontSize: 13, color: 'var(--color-grey-400)' }}>{t('sidePanel.loading')}</p>
        ) : sorted.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--color-grey-400)', fontStyle: 'italic' }}>
            {t('news.unavailable')}
          </p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gridAutoFlow: 'dense',
            gap: 14,
          }}>
            {sorted.map((item, i) => {
              const wide = !!item.imageUrl && columns >= 2;
              return (
                <article
                  key={i}
                  style={{
                    gridColumn: wide ? 'span 2' : 'span 1',
                    background: 'white',
                    borderRadius: 10,
                    border: '1px solid var(--color-grey-200)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: wide ? '0 2px 12px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  {item.imageUrl && (
                    <div style={{ height: wide ? 180 : 130, overflow: 'hidden', flexShrink: 0 }}>
                      <img
                        src={item.imageUrl}
                        alt=""
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                      />
                    </div>
                  )}

                  <div style={{
                    padding: wide ? '14px 16px 16px' : '12px 14px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 7,
                    flex: 1,
                    borderTop: !item.imageUrl ? '3px solid #CC3333' : 'none',
                  }}>
                    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-grey-400)' }}>
                      {item.source}
                      {item.pubDate && (
                        <span style={{ fontWeight: 400 }}>
                          {' · '}{new Date(item.pubDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                    </p>

                    <h3 style={{ fontSize: wide ? 14 : 12, fontWeight: 700, color: 'var(--color-dark)', lineHeight: 1.4, margin: 0 }}>
                      {item.title}
                    </h3>

                    {item.description && (
                      <p style={{ fontSize: 12, color: 'var(--color-grey-400)', lineHeight: 1.55, flex: 1, margin: 0 }}>
                        {item.description}
                      </p>
                    )}

                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 11, color: 'var(--color-teal)', fontWeight: 600, marginTop: 2 }}
                      >
                        {t('news.readMore')}
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
