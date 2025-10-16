export const QUAD_TOKEN_DISPLAY_NAME = '$四';
export const QUAD_TOKEN_CA = (import.meta.env.VITE_QUAD_TOKEN_CA as string) || '0x0A43fC31a73013089DF59194872Ecae4cAe14444';

// Compute four.meme token page URL consistently and dynamically from CA
const envBuyUrl = (import.meta.env.VITE_QUAD_TOKEN_BUY_URL as string | undefined)?.trim();

function computeBuyUrl(ca: string, envUrl?: string): string {
  const defaultBase = 'https://four.meme/token';
  if (!envUrl || envUrl === '') {
    return `${defaultBase}/${ca}`;
  }

  // Support placeholder replacement
  if (envUrl.includes('{CA}')) {
    return envUrl.replace('{CA}', ca);
  }

  // Normalize trailing slash
  const normalized = envUrl.replace(/\/+$/, '');

  // If env points to base token path, append CA
  if (/^https?:\/\/[^/]+\/token$/i.test(normalized)) {
    return `${normalized}/${ca}`;
  }

  // If env points to domain root of four.meme, build token path
  if (/^https?:\/\/four\.meme$/i.test(normalized)) {
    return `${normalized}/token/${ca}`;
  }

  // Otherwise assume env already points to a full URL
  return envUrl;
}

export const QUAD_TOKEN_BUY_URL = computeBuyUrl(QUAD_TOKEN_CA, envBuyUrl);

export const QUAD_TOKEN_DECIMALS_OVERRIDE = import.meta.env.VITE_QUAD_TOKEN_DECIMALS
  ? parseInt(import.meta.env.VITE_QUAD_TOKEN_DECIMALS as string, 10)
  : undefined;