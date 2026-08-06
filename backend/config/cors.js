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

// Synchronous checker for internal non-CORS use
export const checkOriginSync = (origin) => {
  if (!origin) return true;
  return ALLOWED_ORIGINS.includes(origin);
};

// CORS-compatible origin checker (uses callback pattern required by cors package)
export const isAllowedOrigin = (origin, callback) => {
  console.log(`[CORS] isAllowedOrigin called | origin: ${origin || '<null>'}`);
  if (!origin) {
    console.log(`[CORS] isAllowedOrigin → true (no origin)`);
    return callback(null, true); // Allow non-browser requests (curl, Postman, server-to-server)
  }
  if (ALLOWED_ORIGINS.includes(origin)) {
    console.log(`[CORS] isAllowedOrigin → true (matched)`);
    return callback(null, true);
  }
  console.log(`[CORS] isAllowedOrigin → false (not in list)`);
  return callback(null, false);
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
  if (!origin || !checkOriginSync(origin)) return null;
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
