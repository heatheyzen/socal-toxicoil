'use client';
import { useState } from 'react';
import { useI18n } from '@/lib/i18n';

const SOURCES = [
  { label: 'BSEE', url: 'https://www.data.bsee.gov' },
  { label: 'CalEnviroScreen 4.0', url: 'https://oehha.ca.gov/calenviroscreen' },
  { label: 'CA State GIS', url: 'https://gis.data.ca.gov' },
  { label: 'Native Land Digital', url: 'https://native-land.ca' },
];

export default function AboutSection() {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(true);
  const body = t('about.body');
  const paragraphs = body.split('\n\n');

  return (
    <section
      aria-label={t('about.sectionTitle')}
      className="about-section"
      style={{
        background: 'var(--color-teal-light)',
        padding: '24px 28px',
        borderBottom: '1px solid rgba(26,107,92,0.15)',
      }}
    >
      <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            color: 'var(--color-teal)', marginBottom: 12,
          }}>
            {t('about.sectionTitle')}
          </h2>
          <button
            onClick={() => setExpanded(e => !e)}
            aria-expanded={expanded}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, color: 'var(--color-teal)', fontWeight: 600,
              flexShrink: 0, padding: '2px 0',
            }}
          >
            {expanded ? t('about.readLess') : t('about.readMore')}
          </button>
        </div>

        {expanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {paragraphs.map((para, i) => (
              <p key={i} style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--color-dark)', maxWidth: 900 }}>
                {para}
              </p>
            ))}
          </div>
        )}

        {!expanded && (
          <p style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--color-dark)', maxWidth: 900 }}>
            {paragraphs[0]}
          </p>
        )}

        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-teal)' }}>
            {t('about.sourcesLabel')}
          </span>
          {SOURCES.map(s => (
            <a
              key={s.label}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 11, background: 'white',
                border: '1px solid rgba(26,107,92,0.2)',
                borderRadius: 4, padding: '2px 8px',
                color: 'var(--color-teal)', textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
