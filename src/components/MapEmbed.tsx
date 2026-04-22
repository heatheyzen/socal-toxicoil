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

interface TooltipState {
  x: number;
  y: number;
  name: string;
  sub: string;
}

function hexToRgba(hex: string, alpha: number): [number, number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b, alpha];
}

// Priority-ordered attribute fields to use as tooltip title, per layer
const TOOLTIP_NAME_FIELDS: Partial<Record<string, string[]>> = {
  OIL_RIGS:   ['PlatformNa', 'PlatformName', 'Name', 'NAME', 'FACILITYNAME'],
  OIL_WELLS:  ['WellName', 'Well_Name', 'WELL_NAME', 'Name', 'NAME', 'API'],
  PIPELINE:   ['Name', 'NAME', 'PipeName', 'PipelineName', 'PIPE_NAME'],
  INDIGENOUS: ['NationName', 'Nation', 'TribeName', 'TRIBE_NAME', 'Name', 'NAME'],
  CALENVIRO:  ['ApproxLoc', 'Tract', 'ZIP', 'County'],
  ORGS:       ['OrgName', 'Organization', 'Name', 'NAME'],
  NEWS:       ['title'],
};

const LAYER_SUBLABEL: Partial<Record<string, string>> = {
  OIL_RIGS:   'Offshore Oil Rig',
  OIL_WELLS:  'Oil Well',
  PIPELINE:   'Pipeline',
  INDIGENOUS: 'Indigenous Territory',
  CALENVIRO:  'Census Tract — Air Quality',
  ORGS:       'Organization',
  NEWS:       'Oil Spill News',
};

function pickName(attrs: Record<string, unknown>, layerId: string): string {
  const fields = [
    ...(TOOLTIP_NAME_FIELDS[layerId] ?? []),
    'Name', 'NAME', 'name',
  ];
  for (const f of fields) {
    const v = attrs[f];
    if (v != null && String(v).trim() && String(v) !== 'null') return String(v);
  }
  return '';
}

export default function MapEmbed({ onFeatureClick, visibleLayers }: MapEmbedProps) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layerMapRef = useRef<Map<LayerId, any>>(new Map());
  const onFeatureClickRef = useRef(onFeatureClick);
  const newsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverGenRef = useRef(0);
  const [sdkReady, setSdkReady] = useState(false);
  const [layerErrors, setLayerErrors] = useState<string[]>([]);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

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
      'esri/renderers/ClassBreaksRenderer',
      'esri/symbols/SimpleMarkerSymbol',
      'esri/symbols/SimpleLineSymbol',
      'esri/symbols/SimpleFillSymbol',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ], (esriConfig: any, ArcGISMap: any, MapView: any, FeatureLayer: any, GraphicsLayer: any, Graphic: any, Point: any, SimpleRenderer: any, ClassBreaksRenderer: any, SimpleMarkerSymbol: any, SimpleLineSymbol: any, SimpleFillSymbol: any) => {
      void esriConfig;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const makeFill = (r: number, g: number, b: number, a: number): any =>
        new SimpleFillSymbol({ color: [r, g, b, a], outline: { color: [80, 80, 80, 0.75], width: 0.8 } });

      const ORDER = { polygon: 1, polyline: 2, point: 3 };
      const featureLayers = [...LAYER_CONFIGS]
        .filter(cfg => cfg.serviceUrl)
        .sort((a, b) => {
          if (a.id === 'CALENVIRO') return -1;
          if (b.id === 'CALENVIRO') return 1;
          return ORDER[a.symbolType] - ORDER[b.symbolType];
        })
        .map(cfg => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let renderer: any;

          if (cfg.id === 'CALENVIRO') {
            // Color-coded choropleth by PM2.5 percentile
            renderer = new ClassBreaksRenderer({
              field: 'PM2_5_Pctl',
              defaultSymbol: makeFill(180, 180, 180, 0.35),
              classBreakInfos: [
                { minValue: 0,  maxValue: 25,  symbol: makeFill(254, 240, 217, 0.35), label: '0–25th pct (low)' },
                { minValue: 25, maxValue: 50,  symbol: makeFill(253, 190,  90, 0.35), label: '25–50th pct' },
                { minValue: 50, maxValue: 75,  symbol: makeFill(240,  90,  40, 0.35), label: '50–75th pct' },
                { minValue: 75, maxValue: 101, symbol: makeFill(180,  30,  30, 0.35), label: '75–100th pct (high)' },
              ],
            });
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let symbol: any;
            if (cfg.symbolType === 'point') {
              symbol = new SimpleMarkerSymbol({ color: cfg.color, size: 8, outline: { color: [255, 255, 255, 0.9], width: 1 } });
            } else if (cfg.symbolType === 'polyline') {
              symbol = new SimpleLineSymbol({ color: cfg.color, width: 2.5 });
            } else {
              symbol = new SimpleFillSymbol({
                color: hexToRgba(cfg.color, 0.18),
                outline: { color: cfg.color, width: 1 },
              });
            }
            renderer = new SimpleRenderer({ symbol });
          }

          const layer = new FeatureLayer({
            url: cfg.serviceUrl,
            renderer,
            visible: cfg.defaultVisible,
            outFields: ['*'],
            ...(cfg.id === 'OIL_WELLS' ? {
              featureReduction: {
                type: 'cluster',
                clusterRadius: '80px',
                symbol: { type: 'simple-marker', color: '#E8A020', size: 18, outline: { color: 'white', width: 1.5 } },
                labelingInfo: [{
                  labelExpressionInfo: { expression: '$feature.cluster_count' },
                  symbol: { type: 'text', color: 'white', font: { size: 11, weight: 'bold' } },
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

      // ── News polling ─────────────────────────────────────────────
      const newsSymbol = new SimpleMarkerSymbol({
        color: '#CC3333', size: 16, style: 'square',
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

      // ── Hover tooltip ────────────────────────────────────────────
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      view.on('pointer-move', (event: any) => {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        const gen = ++hoverGenRef.current;

        hoverTimerRef.current = setTimeout(async () => {
          const response = await view.hitTest(event);
          if (gen !== hoverGenRef.current) return;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const hit = response.results.find((r: any) => {
            if (r.type !== 'graphic' || !r.graphic?.attributes) return false;
            if (r.graphic?.attributes?._type === 'news') return true;
            if (r.graphic?.layer?.type !== 'feature') return false;
            // Exclude INDIGENOUS — visual-only, so don't let it block layers beneath it
            let layerId: string | null = null;
            layerMapRef.current.forEach((l, id) => { if (l === r.graphic.layer) layerId = id; });
            return layerId !== null && layerId !== 'INDIGENOUS';
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          }) as any;

          if (!hit) { setTooltip(null); return; }

          const { graphic } = hit;
          const attrs: Record<string, unknown> = graphic.attributes ?? {};

          if (graphic.isAggregate) {
            const count = attrs.cluster_count ?? '';
            setTooltip({ x: event.x, y: event.y, name: `${count} oil wells`, sub: 'Click to zoom in' });
            return;
          }

          let foundId: string | null = null;
          if (attrs._type === 'news') {
            foundId = 'NEWS';
          } else {
            layerMapRef.current.forEach((l, id) => { if (l === graphic.layer) foundId = id; });
          }
          if (!foundId) { setTooltip(null); return; }

          // CalEnviroScreen: show district name + ZIP code
          if (foundId === 'CALENVIRO') {
            const district = String(attrs['ApproxLoc'] ?? attrs['Tract'] ?? '').trim();
            const zip = String(attrs['ZIP'] ?? '').trim();
            const parts = [district, zip ? `ZIP ${zip}` : ''].filter(Boolean);
            const calName = parts.join(' · ') || 'Census Tract';
            setTooltip({ x: event.x, y: event.y, name: calName, sub: LAYER_SUBLABEL['CALENVIRO'] ?? '' });
            return;
          }

          const name = pickName(attrs, foundId);
          const sub = LAYER_SUBLABEL[foundId] ?? '';
          setTooltip({ x: event.x, y: event.y, name: name || sub, sub: name ? sub : '' });
        }, 80);
      });

      view.on('pointer-leave', () => {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        hoverGenRef.current++;
        setTooltip(null);
      });

      // ── Click handler ────────────────────────────────────────────
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      view.on('click', async (event: any) => {
        const response = await view.hitTest(event);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hit = response.results.find((r: any) => {
          if (r.type !== 'graphic' || !r.graphic?.attributes) return false;
          if (r.graphic?.attributes?._type === 'news') return true;
          if (r.graphic?.layer?.type !== 'feature') return false;
          let layerId: string | null = null;
          layerMapRef.current.forEach((l, id) => { if (l === r.graphic.layer) layerId = id; });
          return layerId !== null && layerId !== 'INDIGENOUS';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any;
        if (!hit) return;

        const { graphic } = hit;

        // Cluster → zoom in instead of opening panel
        if (graphic.isAggregate) {
          view.goTo({ center: graphic.geometry, zoom: view.zoom + 3 });
          return;
        }

        // News marker
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

        // Feature layer
        const hitLayer = graphic.layer;
        let foundId: LayerId | null = null;
        layerMapRef.current.forEach((l, id) => { if (l === hitLayer) foundId = id; });
        if (!foundId) return;

        onFeatureClickRef.current({ layerId: foundId, attributes: graphic.attributes ?? {} });
      });
    });

    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
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

        {tooltip && (
          <div
            style={{
              position: 'absolute',
              left: tooltip.x + 14,
              top: tooltip.y - 36,
              zIndex: 100,
              pointerEvents: 'none',
              background: 'rgba(255,255,255,0.97)',
              border: '1px solid var(--color-grey-200)',
              borderRadius: 6,
              padding: '6px 10px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.14)',
              maxWidth: 220,
            }}
          >
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-dark)', lineHeight: 1.3 }}>
              {tooltip.name}
            </p>
            {tooltip.sub && (
              <p style={{ fontSize: 10, color: 'var(--color-grey-400)', marginTop: 2 }}>
                {tooltip.sub}
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
