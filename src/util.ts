import type { NextRequest } from 'next/server';

export type TokenValueFunction = {
  (request: NextRequest): Promise<string>
}

/**
 * Create new secret (cryptographically secure)
 * @param {int} length - Byte length of secret
 */
export function createSecret(length: number): Uint8Array {
  const secret= new Uint8Array(length);
  crypto.getRandomValues(secret);
  return secret;
}

/**
 * Encode Uint8Array as base64 string
 * @param {Uint8Array} input - The data to be converted from Uint8Array to base64
 */
export function utoa(input: Uint8Array): string {
  let output = '';
  for (let i = 0; i < input.byteLength; i++) {
    output += String.fromCharCode(input[i]);
  }
  return btoa(output);
}

/**
 * Decode base64 string into Uint8Array
 * @param {string} input - The data to be converted from base64 to Uint8Array
 */
export function atou(input: string): Uint8Array {
  input = atob(input);
  let output = new Uint8Array(input.length);
  for (let i = 0; i < input.length; i++) output[i] = input.charCodeAt(i);
  return output;
}

/**
 * Get CSRF token from request
 * @param {NextRequest} request - The request object
 * @param {ValueFunc|null} valueFn - Function to retrieve token value from request
 */
export async function getTokenString(request: NextRequest, valueFn?: TokenValueFunction): Promise<string> {
  if (valueFn !== undefined) return valueFn(request);

  // check the `x-csrf-token` request header
  let token = request.headers.get('x-csrf-token');
  if (token !== null) return token;
  
  // check request body
  const contentType = request.headers.get('content-type') || 'text/plain';

  // url-encoded
  if (contentType === 'application/x-www-form-urlencoded') {
    const formData = await request.formData();
    const formDataVal = formData.get('csrf_token')
    if (typeof formDataVal === 'string') return formDataVal
    return ''
  }

  // json-encoded
  if (contentType === 'application/json' ||
      contentType === 'application/ld+json') {
    const json = await request.json();
    const jsonVal = json['csrf_token']
    if (typeof jsonVal === 'string') return jsonVal
    return ''
  }

  return await request.text();
}

/**
 * Create new CSRF token (cryptographically insecure salt hashed with secret)
 * @param {Uint8Array} secret - The secret
 * @param {int} saltByteLength - Salt length in number of bytes
 */
export async function createToken(secret: Uint8Array, saltByteLength: number): Promise<Uint8Array> {
  const salt = _createSalt(saltByteLength);
  const hash = await _hash(secret, salt);

  // build token
  let token = new Uint8Array(2 + saltByteLength + hash.byteLength);

  // first byte is hashing algo id (0 for now)
  token[0] = 0;

  // second byte is salt length
  token[1] = saltByteLength;

  // next bytes are salt
  token.set(salt, 2);

  // next bytes are hash
  token.set(hash, saltByteLength + 2);

  return token;
}

/**
 * Verify CSRF token
 * @param {Uint8Array} token - The CSRF token
 * @param {Uint8Array} secret - The CSRF secret
 */
export async function verifyToken(token: Uint8Array, secret: Uint8Array): Promise<boolean> {
  // check byteLength (must be greater than hash length (20) + reserved (2))
  if (token.byteLength < 22) return false
  
  // extract salt and hash from token
  const saltByteLength = token[1];
  const salt = token.subarray(2, 2 + saltByteLength);
  const hash = token.subarray(2 + saltByteLength);

  // generate new hash to verify old hash
  const hashCheck = await _hash(secret, salt);
  
  // check hash length
  if (hash.byteLength !== hashCheck.byteLength) return false;
  
  // check hash values
  for (let i = 0; i < hash.byteLength; i++) {
    if (hash[i] !== hashCheck[i]) return false;
  }
  
  return true;
}

/**
 * Create new salt
 * @param {int} length - Salt length in number of bytes
 */
export function _createSalt(byteLength: number): Uint8Array {
  const salt = new Uint8Array(byteLength);
  for (let i = 0; i < byteLength; i++) {
    salt[i] = Math.floor(Math.random() * 255);
  }
  return salt;
}

/**
 * Calculate hash of secret and salt
 * @param {Uint8Array} secret - The secret
 * @param {Uint8Array} salt - The salt
 */
export async function _hash(secret: Uint8Array, salt: Uint8Array): Promise<Uint8Array> {
  const data = new Uint8Array(secret.byteLength + salt.byteLength);
  data.set(secret);
  data.set(salt, secret.byteLength);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  return new Uint8Array(hashBuffer);
}
