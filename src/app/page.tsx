'use client';
import { useState, useCallback, useEffect } from 'react';
import { LAYER_CONFIGS } from '@/lib/layers';
import { LayerId, SidePanelContent } from '@/lib/types';
import Header from '@/components/Header';
import AboutSection from '@/components/AboutSection';
import MapEmbed from '@/components/MapEmbed';
import LayerPanel from '@/components/LayerPanel';
import SidePanel from '@/components/SidePanel';
import CalEnviroBar from '@/components/CalEnviroBar';
import NewsFeed from '@/components/NewsFeed';
import Footer from '@/components/Footer';

function defaultVisibility(): Record<LayerId, boolean> {
  return Object.fromEntries(
    LAYER_CONFIGS.map(l => [l.id, l.defaultVisible])
  ) as Record<LayerId, boolean>;
}

export default function Home() {
  const [visibleLayers, setVisibleLayers] = useState<Record<LayerId, boolean>>(defaultVisibility);
  const [sidePanelContent, setSidePanelContent] = useState<SidePanelContent | null>(null);
  const [calEnviroContent, setCalEnviroContent] = useState<SidePanelContent | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handleToggleLayer = useCallback((id: LayerId) => {
    setVisibleLayers(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleFeatureClick = useCallback((content: SidePanelContent) => {
    if (content.layerId === 'CALENVIRO') {
      setCalEnviroContent(content);
    } else {
      setSidePanelContent(content);
    }
  }, []);

  const handleClosePanel = useCallback(() => {
    setSidePanelContent(null);
  }, []);

  const handleCloseCalEnviro = useCallback(() => {
    setCalEnviroContent(null);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />

      <main style={{ paddingTop: 'var(--header-height)', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <AboutSection />

        <div
          className="map-row"
          style={{ display: 'flex', flex: 1, position: 'relative', minHeight: 'var(--map-min-height)' }}
        >
          <MapEmbed
            onFeatureClick={handleFeatureClick}
            visibleLayers={visibleLayers}
          />
          {!isMobile && (
            <LayerPanel
              visible={visibleLayers}
              onToggle={handleToggleLayer}
            />
          )}
          <SidePanel
            content={sidePanelContent}
            onClose={handleClosePanel}
          />
          <CalEnviroBar
            content={calEnviroContent}
            onClose={handleCloseCalEnviro}
          />
        </div>

        {isMobile && (
          <LayerPanel
            visible={visibleLayers}
            onToggle={handleToggleLayer}
            isMobile
          />
        )}

        <NewsFeed />
      </main>

      <Footer />
    </div>
  );
}
