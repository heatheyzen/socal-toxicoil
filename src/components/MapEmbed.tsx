'use client';
import { SidePanelContent, LayerId } from '@/lib/types';

interface MapEmbedProps {
  onFeatureClick: (content: SidePanelContent) => void;
  visibleLayers: Record<LayerId, boolean>;
}

export default function MapEmbed({ onFeatureClick, visibleLayers }: MapEmbedProps) {
  // TODO Milestone Step 4: Replace this placeholder with the ArcGIS Maps SDK
  // integration. Use LAYER_CONFIGS and env vars for each layer's serviceUrl.
  // Wire feature click events to call onFeatureClick() with SidePanelContent.
  // Toggle layer visibility by watching visibleLayers prop.

  const handleTestClick = () => {
    onFeatureClick({
      layerId: 'OIL_RIGS',
      attributes: {
        PLATFORM_NAME: 'Ellen Platform (test)',
        OPERATOR: 'Internago Corp',
        INSTALL_YEAR: 1987,
        WATER_DEPTH_FT: 264,
      },
    });
  };

  return (
    <div style={{
      flex: 1, minHeight: 'var(--map-min-height)',
      background: 'linear-gradient(135deg, #C5DCE8 0%, #D4E8F0 60%, #BED5E2 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
      position: 'relative',
    }}>
      <p style={{
        fontFamily: 'var(--font-display)', fontSize: 15, color: '#5A8A9A',
        fontWeight: 600,
      }}>
        ArcGIS Map Embed
      </p>
      <p style={{ fontSize: 12, color: '#7AAABB' }}>
        Milestone Step 4 — ArcGIS SDK integration
      </p>
      <button
        onClick={handleTestClick}
        style={{
          background: 'var(--color-teal)', color: 'white',
          border: 'none', borderRadius: 6, padding: '8px 16px',
          fontSize: 12, cursor: 'pointer', fontWeight: 600,
        }}
      >
        Test Side Panel →
      </button>
      <p style={{ fontSize: 11, color: '#7AAABB', maxWidth: 280, textAlign: 'center', lineHeight: 1.5 }}>
        Active layers: {Object.entries(visibleLayers)
          .filter(([, v]) => v).map(([k]) => k).join(', ') || 'none'}
      </p>
    </div>
  );
}
