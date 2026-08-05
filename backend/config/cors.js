import crypto from 'crypto';

// ─────────────────────────────────────────────────────
// CORS Configuration
// ─────────────────────────────────────────────────────
export const ALLOWED_ORIGINS = [
  'https://internlink.adeelkhan.online',
  'https://intern-link-brrv.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean);

export const isAllowedOrigin = (origin) => {
  if (!origin) return true; // Allow non-browser requests (curl, Postman, server-to-server)
  return ALLOWED_ORIGINS.includes(origin);
};

// ─────────────────────────────────────────────────────
// OAuth Origin Tracking (multi-frontend redirect support)
// Maps a short-lived nonce → frontend origin so that
// after Google/GitHub OAuth we can redirect the user
// back to the correct production frontend.
// ─────────────────────────────────────────────────────
const oauthOriginMap = new Map();
const OAUTH_ORIGIN_TTL = 5 * 60 * 1000; // 5 minutes

export const storeOAuthOrigin = (origin) => {
  if (!origin || !isAllowedOrigin(origin)) return null;
  const nonce = crypto.randomBytes(16).toString('hex');
  oauthOriginMap.set(nonce, origin);
  setTimeout(() => oauthOriginMap.delete(nonce), OAUTH_ORIGIN_TTL);
  return nonce;
};

export const getOAuthOrigin = (nonce) => {
  const origin = oauthOriginMap.get(nonce);
  if (origin) oauthOriginMap.delete(nonce);
  return origin;
};

// Version for health endpoint
export const APP_VERSION = '1.0.0';
