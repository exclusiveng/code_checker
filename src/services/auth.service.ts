import * as jwt from 'jsonwebtoken';
import { User } from '../entities/user.entity';
import { loadPrivateKey, loadPublicKeys } from '../utils/keys';
import { generateKeyPairSync } from 'crypto';

let PRIVATE_KEY = loadPrivateKey();
let PUBLIC_KEYS = loadPublicKeys();


const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

export const signToken = (user: User): string => {
  if (!PRIVATE_KEY) {
    throw new Error('Private key not configured for JWT signing (JWT_PRIVATE_KEY or JWT_PRIVATE_KEY_PATH)');
  }

  const payload = {
    id: user.id,
    role: user.role,
  };

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
    }
  }
  return null;
};
