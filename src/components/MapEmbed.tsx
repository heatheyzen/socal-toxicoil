'use client';
import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { SidePanelContent, LayerId } from '@/lib/types';
import { LAYER_CONFIGS } from '@/lib/layers';

const ARCGIS_CDN = 'https://js.arcgis.com/4.32/';

interface MapEmbedProps {
  onFeatureClick: (content: SidePanelContent) => void;
  visibleLayers: Record<LayerId, boolean>;
}

function hexToRgba(hex: string, alpha: number): [number, number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b, alpha];
}

export default function MapEmbed({ onFeatureClick, visibleLayers }: MapEmbedProps) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layerMapRef = useRef<Map<LayerId, any>>(new Map());
  const onFeatureClickRef = useRef(onFeatureClick);
  const [sdkReady, setSdkReady] = useState(false);
  const [layerErrors, setLayerErrors] = useState<string[]>([]);

  useEffect(() => {
    onFeatureClickRef.current = onFeatureClick;
  });

  useEffect(() => {
    if (!sdkReady || !mapDivRef.current || viewRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const amdRequire = (window as any).require;
    if (!amdRequire) return;

    amdRequire([
      'esri/config',
      'esri/Map',
      'esri/views/MapView',
      'esri/layers/FeatureLayer',
      'esri/renderers/SimpleRenderer',
      'esri/symbols/SimpleMarkerSymbol',
      'esri/symbols/SimpleLineSymbol',
      'esri/symbols/SimpleFillSymbol',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ], (esriConfig: any, ArcGISMap: any, MapView: any, FeatureLayer: any, SimpleRenderer: any, SimpleMarkerSymbol: any, SimpleLineSymbol: any, SimpleFillSymbol: any) => {
      // API key only needed for Esri premium services (routing, geocoding).
      // All layers here are public — sending a key causes "Invalid token" errors.

      // Render order: polygons first (bottom), then polylines, then points (top)
      const ORDER = { polygon: 0, polyline: 1, point: 2 };
      const layers = [...LAYER_CONFIGS]
        .filter(cfg => cfg.serviceUrl)
        .sort((a, b) => ORDER[a.symbolType] - ORDER[b.symbolType])
        .map(cfg => {
          const isCalEnviro = cfg.id === 'CALENVIRO';
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let symbol: any;
          if (cfg.symbolType === 'point') {
            symbol = new SimpleMarkerSymbol({
              color: cfg.color,
              size: 8,
              outline: { color: [255, 255, 255, 0.9], width: 1 },
            });
          } else if (cfg.symbolType === 'polyline') {
            symbol = new SimpleLineSymbol({ color: cfg.color, width: 2.5 });
          } else {
            symbol = new SimpleFillSymbol({
              color: hexToRgba(cfg.color, isCalEnviro ? 0.07 : 0.18),
              outline: { color: cfg.color, width: isCalEnviro ? 0.4 : 1 },
            });
          }

          const layer = new FeatureLayer({
            url: cfg.serviceUrl,
            renderer: new SimpleRenderer({ symbol }),
            visible: cfg.defaultVisible,
            opacity: isCalEnviro ? 0.6 : 1,
            outFields: ['*'],
          });

          layer.when(
            () => { /* loaded */ },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (err: any) => setLayerErrors(prev => [...prev, `${cfg.id}: ${err?.message ?? err}`])
          );
          layerMapRef.current.set(cfg.id, layer);
          return layer;
        });

      const map = new ArcGISMap({ basemap: 'osm', layers });

      const view = new MapView({
        container: mapDivRef.current!,
        map,
        center: [-118.5, 33.8],
        zoom: 9,
        ui: { components: ['zoom', 'compass'] },
      });

      viewRef.current = view;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      view.on('click', async (event: any) => {
        const response = await view.hitTest(event);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hit = response.results.find((r: any) =>
          r.type === 'graphic' && r.graphic?.layer?.type === 'feature'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ) as any;
        if (!hit) return;

        const { graphic } = hit;
        const hitLayer = graphic.layer;
        let foundId: LayerId | null = null;
        layerMapRef.current.forEach((l, id) => {
          if (l === hitLayer) foundId = id;
        });
        if (!foundId) return;

        onFeatureClickRef.current({
          layerId: foundId,
          attributes: graphic.attributes ?? {},
        });
      });
    });

    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
      layerMapRef.current.clear();
    };
  }, [sdkReady]);

  useEffect(() => {
    layerMapRef.current.forEach((layer, id) => {
      layer.visible = visibleLayers[id] ?? false;
    });
  }, [visibleLayers]);

  return (
    <>
      <link rel="stylesheet" href={`${ARCGIS_CDN}esri/themes/light/main.css`} />
      <Script
        src={`${ARCGIS_CDN}init.js`}
        strategy="afterInteractive"
        onLoad={() => setSdkReady(true)}
      />
      <div
        ref={mapDivRef}
        style={{ flex: 1, minHeight: 'var(--map-min-height)', width: '100%', position: 'relative' }}
        className="arcgis-map-container"
      >
        {layerErrors.length > 0 && (
          <div style={{
            position: 'absolute', bottom: 8, left: 8, zIndex: 99,
            background: 'rgba(204,68,68,0.9)', color: 'white',
            fontSize: 11, padding: '6px 10px', borderRadius: 4,
            maxWidth: 320,
          }}>
            {layerErrors.map((e, i) => <div key={i}>{e}</div>)}
          </div>
        )}
      </div>
    </>
  );
}
