/**
 * Short-lived HMAC-SHA256 room tokens for WebSocket connection auth.
 *
 * Token format (URL-safe base64, dot-separated):
 *   base64url(JSON payload) . base64url(HMAC signature)
 *
 * Payload: { projectId: string; userId: string; exp: number }
 */

export interface RoomTokenPayload {
  projectId: string;
  userId: string;
  exp: number; // Unix seconds
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function base64urlEncode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64urlDecode(s: string): Uint8Array {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  const base64 = padded + '='.repeat(padLen);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function importKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Mint a signed room token.
 * @param payload   { projectId, userId } — exp is computed from ttlSec
 * @param secret    ROOM_TOKEN_SECRET binding value
 * @param ttlSec    Time-to-live in seconds (default 120)
 */
export async function signRoomToken(
  payload: Omit<RoomTokenPayload, 'exp'>,
  secret: string,
  ttlSec = 120,
): Promise<{ token: string; exp: number }> {
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const body: RoomTokenPayload = { ...payload, exp };

  const enc = new TextEncoder();
  const headerB64 = base64urlEncode(enc.encode(JSON.stringify(body)).buffer as ArrayBuffer);

  const key = await importKey(secret);
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(headerB64));
  const sigB64 = base64urlEncode(sigBuf);

  return { token: `${headerB64}.${sigB64}`, exp };
}

/**
 * Verify a room token.
 * Returns the payload if valid and not expired; throws otherwise.
 */
export async function verifyRoomToken(
  token: string,
  secret: string,
): Promise<RoomTokenPayload> {
  const dot = token.lastIndexOf('.');
  if (dot === -1) throw new Error('Invalid token format');

  const headerB64 = token.slice(0, dot);
  const sigB64 = token.slice(dot + 1);

  // Verify signature
  const enc = new TextEncoder();
  const key = await importKey(secret);
  const sigBytes = base64urlDecode(sigB64);
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    sigBytes,
    enc.encode(headerB64),
  );
  if (!valid) throw new Error('Invalid token signature');

  // Decode payload
  const payloadBytes = base64urlDecode(headerB64);
  const payload: RoomTokenPayload = JSON.parse(new TextDecoder().decode(payloadBytes));

  // Check expiry
  if (Math.floor(Date.now() / 1000) > payload.exp) {
    throw new Error('Token expired');
  }

  return payload;
}
