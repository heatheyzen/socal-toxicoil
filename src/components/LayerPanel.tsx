'use client';
import { useI18n } from '@/lib/i18n';
import { LAYER_CONFIGS } from '@/lib/layers';
import { LayerId } from '@/lib/types';

interface LayerPanelProps {
  visible: Record<LayerId, boolean>;
  onToggle: (id: LayerId) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  P0: 'var(--color-teal-light)',
  P1: '#EDF0F8',
  P2: 'var(--color-grey-100)',
};
const PRIORITY_TEXT: Record<string, string> = {
  P0: 'var(--color-teal)',
  P1: '#4A5080',
  P2: 'var(--color-grey-400)',
};

export default function LayerPanel({ visible, onToggle }: LayerPanelProps) {
  const { t } = useI18n();
  return (
    <aside
      style={{
        width: 'var(--layer-panel-width)', background: 'white',
        borderLeft: '1px solid var(--color-grey-200)',
        padding: '16px 14px', overflowY: 'auto', flexShrink: 0,
      }}
      aria-label="Map layer controls"
    >
      <p style={{
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.1em', color: 'var(--color-grey-400)',
        marginBottom: 14, paddingBottom: 10,
        borderBottom: '1px solid var(--color-grey-200)',
      }}>
        {t('layers.title')}
      </p>

      {LAYER_CONFIGS.map(layer => (
        <div
          key={layer.id}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 0', borderBottom: '1px solid var(--color-grey-100)',
            opacity: layer.deferred ? 0.4 : 1,
          }}
        >
          <div style={{
            width: 10, height: layer.symbolType === 'polyline' ? 3 : 10,
            borderRadius: layer.symbolType === 'point' ? '50%' : 2,
            background: layer.color, flexShrink: 0,
          }} />
          <span style={{ flex: 1, fontSize: 11, color: 'var(--color-dark)', lineHeight: 1.3 }}>
            {t(layer.nameKey)}
          </span>
          <span style={{
            fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 3,
            background: PRIORITY_COLORS[layer.priority],
            color: PRIORITY_TEXT[layer.priority],
          }}>
            {layer.priority}
          </span>
          <button
            onClick={() => !layer.deferred && onToggle(layer.id)}
            disabled={layer.deferred}
            aria-label={`Toggle ${t(layer.nameKey)}`}
            aria-pressed={visible[layer.id]}
            style={{
              width: 30, height: 17, borderRadius: 9, border: 'none',
              cursor: layer.deferred ? 'not-allowed' : 'pointer',
              background: visible[layer.id] ? 'var(--color-teal)' : 'var(--color-grey-200)',
              position: 'relative', flexShrink: 0,
              transition: 'background var(--transition-fast)',
            }}
          >
            <span style={{
              position: 'absolute', width: 13, height: 13, borderRadius: '50%',
              background: 'white', top: 2,
              left: visible[layer.id] ? 15 : 2,
              transition: 'left var(--transition-fast)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </button>
        </div>
      ))}

      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--color-grey-200)' }}>
        <p style={{ fontSize: 10, color: 'var(--color-grey-400)', lineHeight: 1.6 }}>
          ⊘ {t('layers.deferred')}: News Feed · Incident Posts
        </p>
      </div>
    </aside>
  );
}
