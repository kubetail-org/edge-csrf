/**
 * Create new secret (cryptographically secure)
 * @param {int} length Byte length of secret
 */
export function createSecret(length) {
  const secret= new Uint8Array(length);
  crypto.getRandomValues(secret);
  return secret;
}

/**
 * Encode Uint8Array as base64 string
 */
export function utoa(input) {
  let i = input.byteLength;
  let output = new Array(i);
  while (i--) output[i] = String.fromCharCode(input[i]);
  return btoa(output.join(''));
}

/**
 * Decode base64 string into Uint8Array
 */
export function atou(input) {
  input = atob(input);
  let i = input.length;
  let output = new Uint8Array(i);
  while (i--) output[i] = input.charCodeAt(i);
  return output;
}

/**
 * Get CSRF token from request
 */
export async function getTokenString(request, valueFn) {
  if (valueFn !== null) return valueFn(request);

  // check the `x-csrf-token` request header
  let token = request.headers.get('x-csrf-token');
  if (token !== null) return token;
  
  // check request body
  const contentType = request.headers.get('content-type') || 'text/plain';

  // url-encoded
  if (contentType === 'application/x-www-form-urlencoded') {
    const formData = await request.formData();
    return formData.get('csrf_token');
  }

  // json-encoded
  if (contentType === 'application/json' ||
      contentType === 'application/ld+json') {
    const json = await request.json();
    return json['csrf_token'];
  }

  return await request.text();
}

/**
 * Create new CSRF token (cryptographically insecure salt hashed with secret)
 * @param {Uint8Array} secret Secret
 * @param {int} saltByteLength Salt length in number of bytes
 */
export async function createToken(secret, saltByteLength) {
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
 * @param {Uint8Array} token The CSRF token
 * @param {Uint8Array} secret The CSRF secret
 */
export async function verifyToken(token, secret) {
  // extract salt and hash from token
  const saltByteLength = token[1];
  const salt = token.subarray(2, 2 + saltByteLength);
  const hash = token.subarray(2 + saltByteLength);

  // generate new hash to verify old hash
  const hashCheck = await _hash(secret, salt);
  
  let i = hash.byteLength;
  
  // check hash length
  if (i !== hashCheck.byteLength) return false;
  
  // check hash values
  while (i--) {
    if (hash[i] !== hashCheck[i]) return false;
  }
  
  return true;
}

/**
 * Create new salt
 * @param {int} length Salt length in number of bytes
 */
export function _createSalt(byteLength) {
  const salt = new Uint8Array(byteLength);
  let i = byteLength;
  while (i--) salt[i] = Math.floor(Math.random() * 255);
  return salt;
}

/**
 * Calculate hash of secret and salt
 * @param {Uint8Array} secret The secret
 * @param {Uint8Array} salt The salt
 */
export async function _hash(secret, salt) {
  const data = new Uint8Array(secret.byteLength + salt.byteLength);
  data.set(secret);
  data.set(salt, secret.byteLength);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  return new Uint8Array(hashBuffer);
}
