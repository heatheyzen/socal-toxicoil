'use client';
import { useI18n } from '@/lib/i18n';

export default function Footer() {
  const { t } = useI18n();
  const cols = [
    { key: 'landAck', label: 'Land Acknowledgment' },
    { key: 'disclaimer', label: 'Disclaimer' },
    { key: 'credits', label: 'Credits' },
  ] as const;

  return (
    <footer style={{
      background: 'var(--color-dark)', padding: '36px 28px',
    }}>
      <div style={{
        maxWidth: 'var(--max-width)', margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '28px 40px',
      }}>
        {cols.map(({ key, label }) => (
          <div key={key}>
            <p style={{
              fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.12em', color: 'rgba(255,255,255,0.35)',
              marginBottom: 10,
            }}>
              {label}
            </p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8 }}>
              {t(`footer.${key}`)}
            </p>
          </div>
        ))}
      </div>
    </footer>
  );
}
