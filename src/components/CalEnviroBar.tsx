'use client';
import { SidePanelContent } from '@/lib/types';

interface CalEnviroBarProps {
  content: SidePanelContent | null;
  onClose: () => void;
}

const FIELD_LABELS: Record<string, string> = {
  ApproxLoc:       'Community',
  Tract:           'Census Tract',
  ZIP:             'ZIP',
  County:          'County',
  CIscore:         'CES Score',
  CIscoreP:        'CES Percentile',
  Pollution:       'Pollution Score',
  Pollution_Pctl:  'Pollution Pct',
  PopChar:         'Pop. Char. Score',
  PopCharP:        'Pop. Char. Pct',
  PM2_5:           'PM2.5',
  PM2_5_Pctl:      'PM2.5 Pct',
  Ozone:           'Ozone',
  Ozone_Pctl:      'Ozone Pct',
  Diesel_PM:       'Diesel PM',
  Diesel_PM_Pctl:  'Diesel PM Pct',
  Asthma:          'Asthma',
  Asthma_Pctl:     'Asthma Pct',
  LowBirthW_Pctl:  'Low Birthwt Pct',
  Cardiovasc_Pctl: 'Cardiovasc Pct',
  Lead:            'Lead',
  Lead_Pctl:       'Lead Pct',
  Poverty:         'Poverty',
  Poverty_Pctl:    'Poverty Pct',
  Unemployment:    'Unemployment',
  Unemploy_Pctl:   'Unemploy Pct',
  Ling_Isol:       'Ling. Isolation',
  Ling_Isol_Pctl:  'Ling. Isol. Pct',
  HousBurd:        'Housing Burden',
  HousBurd_Pctl:   'Housing Burden Pct',
  Haz_Waste:       'Hazardous Waste',
  Haz_Waste_Pctl:  'Haz. Waste Pct',
  Cleanups_Pctl:   'Cleanups Pct',
  GW_Threats_Pctl: 'Groundwater Pct',
  ImpWaterBodPctl: 'Imp. Water Pct',
  Solid_Waste_Pctl:'Solid Waste Pct',
  Tox_Releases_Pctl:'Toxic Releases Pct',
  Traffic_Pctl:    'Traffic Pct',
  DrinkingWaterPctl:'Drinking Water Pct',
  Pesticides_Pctl: 'Pesticides Pct',
  Population:      'Population',
  Hispanic:        'Hispanic %',
  African_American:'Black %',
  Asian_American:  'Asian %',
  Native_American: 'Native Am. %',
};

const PRIORITY = [
  'ApproxLoc', 'Tract', 'ZIP', 'County',
  'PM2_5_Pctl', 'PM2_5',
  'CIscoreP', 'CIscore',
  'Ozone_Pctl', 'Diesel_PM_Pctl', 'Traffic_Pctl',
  'Asthma_Pctl', 'Cardiovasc_Pctl', 'LowBirthW_Pctl',
  'Lead_Pctl', 'Haz_Waste_Pctl', 'Tox_Releases_Pctl',
  'DrinkingWaterPctl', 'GW_Threats_Pctl',
  'Pollution_Pctl', 'PopCharP',
  'Poverty_Pctl', 'Unemploy_Pctl', 'Ling_Isol_Pctl', 'HousBurd_Pctl',
  'Population',
];

const SKIP = new Set([
  'OBJECTID', 'Shape__Area', 'Shape__Length', 'GlobalID', 'FID', 'SHAPE',
]);

function pctColor(val: number): string {
  if (val >= 75) return '#CC3333';
  if (val >= 50) return '#D96820';
  if (val >= 25) return '#C8900A';
  return '#1A6B5C';
}

function isPctField(key: string): boolean {
  return key.endsWith('_Pctl') || key === 'CIscoreP' || key === 'PopCharP';
}

export default function CalEnviroBar({ content, onClose }: CalEnviroBarProps) {
  if (!content) return null;

  const attrs = content.attributes;
  const header = String(
    attrs['ApproxLoc'] ?? attrs['Tract'] ?? attrs['ZIP'] ?? attrs['County'] ?? 'District'
  );

  const entries = Object.entries(attrs)
    .filter(([k, v]) =>
      !SKIP.has(k) &&
      v != null &&
      String(v).trim() !== '' &&
      String(v) !== '0' &&
      String(v) !== 'null'
    )
    .sort(([a], [b]) => {
      const ai = PRIORITY.indexOf(a);
      const bi = PRIORITY.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return 0;
    });

  return (
    <div
      role="region"
      aria-label="CalEnviroScreen district details"
      style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        zIndex: 30,
        display: 'flex',
        alignItems: 'stretch',
        height: 68,
        background: 'rgba(255,255,255,0.97)',
        borderTop: '2px solid var(--color-teal)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.14)',
      }}
    >
      <div style={{
        background: 'var(--color-teal)',
        color: 'white',
        padding: '0 18px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        flexShrink: 0,
        minWidth: 140,
      }}>
        <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.8, marginBottom: 3 }}>
          Air Quality District
        </p>
        <p style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.3 }}>{header}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', flex: 1 }}>
        {entries.map(([key, val]) => {
          const numVal = typeof val === 'number' ? val : parseFloat(String(val));
          const isPercentile = !isNaN(numVal) && numVal >= 0 && numVal <= 100 && isPctField(key);
          return (
            <div key={key} style={{ padding: '0 16px', borderRight: '1px solid var(--color-grey-100)', flexShrink: 0 }}>
              <p style={{ fontSize: 8, fontWeight: 600, color: 'var(--color-grey-400)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4, whiteSpace: 'nowrap' }}>
                {FIELD_LABELS[key] ?? key}
              </p>
              <p style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', color: isPercentile ? pctColor(numVal) : 'var(--color-dark)' }}>
                {isPercentile ? `${Math.round(numVal)}th` : String(val)}
              </p>
            </div>
          );
        })}
      </div>

      <button
        onClick={onClose}
        aria-label="Dismiss district panel"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 16px', color: 'var(--color-grey-400)', fontSize: 18, flexShrink: 0, alignSelf: 'center' }}
      >
        ✕
      </button>
    </div>
  );
}
