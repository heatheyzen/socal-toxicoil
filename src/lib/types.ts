export type Language = 'en' | 'es';

export type LayerId =
  | 'OIL_RIGS'
  | 'OIL_WELLS'
  | 'CALENVIRO'
  | 'PIPELINE'
  | 'INDIGENOUS'
  | 'ORGS'
  | 'NEWS';

export type LayerPriority = 'P0' | 'P1' | 'P2';

export interface LayerConfig {
  id: LayerId;
  nameKey: string;
  serviceUrl: string;
  priority: LayerPriority;
  color: string;
  symbolType: 'point' | 'polygon' | 'polyline';
  defaultVisible: boolean;
  deferred: boolean;
}

export interface SidePanelContent {
  layerId: LayerId;
  attributes: Record<string, string | number | null>;
}

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  description: string;
  fullDescription?: string;
  imageUrl?: string;
  lat?: number;
  lng?: number;
}
