export function assetUrl(path: string): string {
  const meta = typeof import.meta !== 'undefined' ? (import.meta as any) : null;
  let base = meta?.env?.BASE_URL || './';

  if (typeof window !== 'undefined' && window.location?.pathname) {
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length > 0 && (parts[0] === 'woool-survivor-game' || parts[0] === 'woool')) {
      base = `/${parts[0]}/`;
    }
  }

  const cleanBase = base.endsWith('/') ? base : base + '/';
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${cleanBase}${cleanPath}`;
}
