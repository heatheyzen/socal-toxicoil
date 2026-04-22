'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { SidePanelContent } from '@/lib/types';

interface SidePanelProps {
  content: SidePanelContent | null;
  onClose: () => void;
}

export default function SidePanel({ content, onClose }: SidePanelProps) {
  const { t } = useI18n();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      {content && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.15)', zIndex: 40,
            }}
          />

          <motion.aside
            key="panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            role="complementary"
            aria-label="Feature details"
            style={{
              position: 'absolute', top: 0, right: 0, bottom: 0,
              width: 'var(--side-panel-width)',
              background: 'white',
              borderLeft: '2px solid var(--color-teal)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 50,
              display: 'flex', flexDirection: 'column',
            }}
          >
            <div style={{
              background: 'var(--color-teal)', padding: '14px 16px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{
                color: 'white', fontFamily: 'var(--font-display)',
                fontWeight: 700, fontSize: 14,
              }}>
                {content.layerId.replace('_', ' ')}
              </span>
              <button
                onClick={onClose}
                aria-label={t('sidePanel.close')}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: 4, color: 'white',
                  width: 28, height: 28, cursor: 'pointer',
                  fontSize: 14, display: 'flex', alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: 18, overflowY: 'auto', flex: 1 }}>
              {/* TODO Milestone Step 5: Replace with per-layer content schema components */}
              {Object.entries(content.attributes).map(([key, val]) => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <p style={{
                    fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.08em', color: 'var(--color-grey-400)', marginBottom: 4,
                  }}>
                    {key}
                  </p>
                  {key === 'Image' && typeof val === 'string' && val.startsWith('http') ? (
                    <img
                      src={val}
                      alt=""
                      style={{ width: '100%', borderRadius: 6, display: 'block', marginTop: 2 }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : typeof val === 'string' && val.startsWith('http') ? (
                    <a
                      href={val}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 13, color: 'var(--color-teal)', fontWeight: 600 }}
                    >
                      {t('sidePanel.learnMore')}
                    </a>
                  ) : (
                    <p style={{ fontSize: 13, color: 'var(--color-dark)' }}>
                      {val ?? '—'}
                    </p>
                  )}
                </div>
              ))}
              <p style={{
                fontSize: 11, color: 'var(--color-grey-400)',
                fontStyle: 'italic', marginTop: 16,
                padding: '10px 12px',
                background: 'var(--color-grey-100)',
                borderRadius: 6,
              }}>
                Full content schema wired in Milestone Step 5.
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
