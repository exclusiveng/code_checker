import * as jwt from 'jsonwebtoken';
import { User } from '../entities/user.entity';
import { loadPrivateKey, loadPublicKeys } from '../utils/keys';
import { generateKeyPairSync } from 'crypto';

let PRIVATE_KEY = loadPrivateKey();
let PUBLIC_KEYS = loadPublicKeys();

// If no private key is configured, generate an ephemeral RSA keypair for development.
if (!PRIVATE_KEY) {
  if (process.env.NODE_ENV === 'production') {
    console.error('No JWT private key configured in production environment');
  } else {
    console.warn('No JWT private key configured — generating ephemeral keypair for development');
    const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048, publicKeyEncoding: { type: 'pkcs1', format: 'pem' }, privateKeyEncoding: { type: 'pkcs1', format: 'pem' } });
    PRIVATE_KEY = privateKey as unknown as string;
    // prepend generated public key to PUBLIC_KEYS for verification
    PUBLIC_KEYS = [publicKey as unknown as string, ...PUBLIC_KEYS];
  }
}


const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

export const signToken = (user: User): string => {
  if (!PRIVATE_KEY) {
    throw new Error('Private key not configured for JWT signing (JWT_PRIVATE_KEY or JWT_PRIVATE_KEY_PATH)');
  }

  const payload = {
    id: user.id,
    role: user.role,
  };

  // cast to jwt.Secret to satisfy TypeScript overloads
  // cast to any to satisfy jwt typings for PEM keys
  const key: any = PRIVATE_KEY as unknown as any;
  return jwt.sign(payload as any, key, { algorithm: 'RS256', expiresIn: JWT_EXPIRES_IN } as any);
};

// Verify against multiple public keys (rotation support)
export const verifyToken = (token: string): any => {
  for (const pub of PUBLIC_KEYS) {
    try {
  const key: any = pub as unknown as any;
  const decoded = jwt.verify(token as any, key, { algorithms: ['RS256'] } as any);
      return decoded;
    } catch (err) {
      // try next key
    }
  }
  return null;
};
