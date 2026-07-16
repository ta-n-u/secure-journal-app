// All encryption happens here, in the browser. The server never sees
// the plaintext or the derived key — only ciphertext + iv.

// Convert a hex string (from the server's encryptionSalt) into a Uint8Array
function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function bufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

// Derive an AES-GCM key from the user's password + their per-user salt.
// PBKDF2 with 100,000 iterations — same key is re-derived on every login,
// never stored or sent anywhere.
export async function deriveKey(password, saltHex) {
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: hexToBytes(saltHex),
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    true, // extractable -- needed so we can export it for the session timeout
    ['encrypt', 'decrypt']
  );
}

// Export a CryptoKey to a base64 string, for temporary sessionStorage use.
export async function exportKey(key) {
  const raw = await crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
}

// Re-import a base64 string back into a usable CryptoKey.
export async function importKey(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  return crypto.subtle.importKey('raw', bytes, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

// Encrypt plaintext -> { ciphertext, iv }, both base64 strings safe to
// send to the server and store in MongoDB.
export async function encryptText(plaintext, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext)
  );

  return {
    ciphertext: bufferToBase64(ciphertextBuffer),
    iv: bufferToBase64(iv),
  };
}

// Decrypt { ciphertext, iv } (as returned from the API) back to plaintext.
export async function decryptText(ciphertext, iv, key) {
  const ciphertextBuffer = base64ToBuffer(ciphertext);
  const ivBuffer = new Uint8Array(base64ToBuffer(iv));

  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuffer },
    key,
    ciphertextBuffer
  );

  return new TextDecoder().decode(plaintextBuffer);
}
