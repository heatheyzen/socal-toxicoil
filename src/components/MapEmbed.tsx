'use client';
import { useEffect, useRef } from 'react';
import { SidePanelContent, LayerId } from '@/lib/types';
import { LAYER_CONFIGS } from '@/lib/layers';

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

  // Keep callback ref current without re-initializing the map
  useEffect(() => {
    onFeatureClickRef.current = onFeatureClick;
  });

  // Initialize map once on mount
  useEffect(() => {
    if (!mapDivRef.current || viewRef.current) return;
    let destroyed = false;

    (async () => {
      const [
        { default: esriConfig },
        { default: ArcGISMap },
        { default: MapView },
        { default: FeatureLayer },
        { default: SimpleRenderer },
        { default: SimpleMarkerSymbol },
        { default: SimpleLineSymbol },
        { default: SimpleFillSymbol },
      ] = await Promise.all([
        import('@arcgis/core/config'),
        import('@arcgis/core/Map'),
        import('@arcgis/core/views/MapView'),
        import('@arcgis/core/layers/FeatureLayer'),
        import('@arcgis/core/renderers/SimpleRenderer'),
        import('@arcgis/core/symbols/SimpleMarkerSymbol'),
        import('@arcgis/core/symbols/SimpleLineSymbol'),
        import('@arcgis/core/symbols/SimpleFillSymbol'),
      ]);

      if (destroyed) return;

      esriConfig.apiKey = process.env.NEXT_PUBLIC_ARCGIS_API_KEY ?? '';
      esriConfig.assetsPath = 'https://cdn.jsdelivr.net/npm/@arcgis/core@5.0.17/assets/';

      const layers = LAYER_CONFIGS
        .filter(cfg => cfg.serviceUrl)
        .map(cfg => {
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
              color: hexToRgba(cfg.color, 0.18),
              outline: { color: cfg.color, width: 1 },
            });
          }

          const layer = new FeatureLayer({
            url: cfg.serviceUrl,
            renderer: new SimpleRenderer({ symbol }),
            visible: cfg.defaultVisible,
            outFields: ['*'],
          });

          layerMapRef.current.set(cfg.id, layer);
          return layer;
        });

      const map = new ArcGISMap({ basemap: 'osm', layers });

      const view = new MapView({
        container: mapDivRef.current!,
        map,
        center: [-118.5, 33.8], // Southern California coast
        zoom: 9,
        ui: { components: ['zoom', 'compass'] },
      });

      viewRef.current = view;

      view.on('click', async (event: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await view.hitTest(event as any);
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
    })().catch(console.error);

    return () => {
      destroyed = true;
      viewRef.current?.destroy();
      viewRef.current = null;
      layerMapRef.current.clear();
    };
  }, []);

  // Sync layer visibility when props change
  useEffect(() => {
    layerMapRef.current.forEach((layer, id) => {
      layer.visible = visibleLayers[id] ?? false;
    });
  }, [visibleLayers]);

  return (
    <div
      ref={mapDivRef}
      style={{ flex: 1, minHeight: 'var(--map-min-height)' }}
      className="arcgis-map-container"
    />
  );
}
