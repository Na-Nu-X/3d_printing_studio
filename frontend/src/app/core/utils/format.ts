/** Slovak number & currency formatting helpers. */

const eur = new Intl.NumberFormat('sk-SK', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const eurPrecise = new Intl.NumberFormat('sk-SK', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 3,
});

const integer = new Intl.NumberFormat('sk-SK', { maximumFractionDigits: 0 });

export function formatEur(value: number | string, precise = false): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) return '—';
  return (precise ? eurPrecise : eur).format(n);
}

export function formatInt(value: number): string {
  return integer.format(value);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Maps Slovak color names used in the catalog to swatch values. */
const SWATCHES: Record<string, string> = {
  'Matná čierna': '#1f2328',
  'Technická sivá': '#8a939e',
  Biela: '#f8fafc',
  'Oranžová': '#ea580c',
  Modrá: '#1d4ed8',
  'Transparentná': 'transparent',
};

export function swatchFor(color: string): string {
  return SWATCHES[color] ?? '#cbd5e1';
}
