import * as fs from 'fs';
import * as path from 'path';

// Simple key loader for RS256 keys. Keys may be provided via env pointing to files
// or inline PEM strings. Supports rotation by allowing multiple public keys in CSV.

export function loadPrivateKey(): string | null {
  const keyPath = process.env.JWT_PRIVATE_KEY_PATH;
  const inline = process.env.JWT_PRIVATE_KEY;
  if (inline) return inline;
  if (keyPath) {
    try {
      const full = path.resolve(keyPath);
      return fs.readFileSync(full, 'utf8');
    } catch (err) {
      console.error('Failed to load private key:', err);
      return null;
    }
  }
  return null;
}

export function loadPublicKeys(): string[] {
  // Support multiple environment variable names for flexibility
  const csv = process.env.JWT_PUBLIC_KEYS || process.env.JWT_PUBLIC_KEY || process.env.JWT_PUBLIC_KEYS_PATHS || process.env.JWT_PUBLIC_KEY_PATHS || '';
  const keys: string[] = [];
  if (!csv) return keys;
  // CSV may contain file paths or inline PEMs separated by ||
  const parts = csv.split('||').map(p => p.trim()).filter(Boolean);
  parts.forEach(p => {
    // if looks like a path
    if (p.startsWith('/') || p.startsWith('./') || p.startsWith('../') || p.match(/^[A-Za-z]:\\/)) {
      try {
        keys.push(fs.readFileSync(path.resolve(p), 'utf8'));
      } catch (err) {
        console.error('Failed to load public key from path', p, err);
      }
    } else {
      keys.push(p);
    }
  });
  return keys;
}
