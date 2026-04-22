'use client';
import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { SidePanelContent, LayerId, NewsItem } from '@/lib/types';
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
  const newsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
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
      'esri/layers/GraphicsLayer',
      'esri/Graphic',
      'esri/geometry/Point',
      'esri/renderers/SimpleRenderer',
      'esri/symbols/SimpleMarkerSymbol',
      'esri/symbols/SimpleLineSymbol',
      'esri/symbols/SimpleFillSymbol',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ], (esriConfig: any, ArcGISMap: any, MapView: any, FeatureLayer: any, GraphicsLayer: any, Graphic: any, Point: any, SimpleRenderer: any, SimpleMarkerSymbol: any, SimpleLineSymbol: any, SimpleFillSymbol: any) => {
      void esriConfig;

      const ORDER = { polygon: 1, polyline: 2, point: 3 };
      const featureLayers = [...LAYER_CONFIGS]
        .filter(cfg => cfg.serviceUrl)
        .sort((a, b) => {
          if (a.id === 'CALENVIRO') return -1;
          if (b.id === 'CALENVIRO') return 1;
          return ORDER[a.symbolType] - ORDER[b.symbolType];
        })
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
            ...(cfg.id === 'OIL_WELLS' ? {
              featureReduction: {
                type: 'cluster',
                clusterRadius: '80px',
                symbol: {
                  type: 'simple-marker',
                  color: '#E8A020',
                  size: 18,
                  outline: { color: 'white', width: 1.5 },
                },
                labelingInfo: [{
                  labelExpressionInfo: { expression: '$feature.cluster_count' },
                  symbol: {
                    type: 'text',
                    color: 'white',
                    font: { size: 11, weight: 'bold' },
                  },
                }],
              },
            } : {}),
          });

          layer.when(
            () => { /* loaded */ },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (err: any) => setLayerErrors(prev => [...prev, `${cfg.id}: ${err?.message ?? err}`])
          );
          layerMapRef.current.set(cfg.id, layer);
          return layer;
        });

      // News GraphicsLayer — rendered on top of all feature layers
      const newsLayer = new GraphicsLayer({
        visible: LAYER_CONFIGS.find(c => c.id === 'NEWS')?.defaultVisible ?? true,
      });
      layerMapRef.current.set('NEWS', newsLayer);

      const map = new ArcGISMap({ basemap: 'gray', layers: [...featureLayers, newsLayer] });

      const view = new MapView({
        container: mapDivRef.current!,
        map,
        center: [-118.5, 33.8],
        zoom: 9,
        ui: { components: ['zoom', 'compass'] },
      });

      viewRef.current = view;

      // Fetch news articles and place markers on the map
      const newsSymbol = new SimpleMarkerSymbol({
        color: '#CC3333',
        size: 16,
        style: 'square',
        outline: { color: 'white', width: 1.5 },
      });

      const fetchNews = async () => {
        try {
          const res = await fetch('/api/news');
          if (!res.ok) return;
          const { items } = await res.json() as { items: NewsItem[] };
          newsLayer.removeAll();
          for (const item of items) {
            if (item.lat == null || item.lng == null) continue;
            newsLayer.add(new Graphic({
              geometry: new Point({ latitude: item.lat, longitude: item.lng }),
              symbol: newsSymbol,
              attributes: { _type: 'news', ...item },
            }));
          }
        } catch { /* silently fail */ }
      };

      fetchNews();
      newsIntervalRef.current = setInterval(fetchNews, 120_000);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      view.on('click', async (event: any) => {
        const response = await view.hitTest(event);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hit = response.results.find((r: any) =>
          r.type === 'graphic' && r.graphic?.attributes &&
          (r.graphic?.layer?.type === 'feature' || r.graphic?.attributes?._type === 'news')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ) as any;
        if (!hit) return;

        const { graphic } = hit;

        if (graphic.attributes?._type === 'news') {
          const a = graphic.attributes;
          onFeatureClickRef.current({
            layerId: 'NEWS',
            attributes: {
              Title: a.title,
              Published: a.pubDate,
              Summary: a.description,
              ...(a.fullDescription && a.fullDescription !== a.description
                ? { Details: a.fullDescription }
                : {}),
              Link: a.link,
            },
          });
          return;
        }

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
      if (newsIntervalRef.current) clearInterval(newsIntervalRef.current);
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
