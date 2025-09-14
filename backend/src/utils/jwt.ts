import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class JWTUtils {
  private static readonly ACCESS_TOKEN_EXPIRY = '1h';
  private static readonly REFRESH_TOKEN_EXPIRY = '7d';
  private static readonly REMEMBER_ME_ACCESS_TOKEN_EXPIRY = '24h';
  private static readonly REMEMBER_ME_REFRESH_TOKEN_EXPIRY = '30d';

  static generateAccessToken(payload: Omit<JWTPayload, 'type'>): string {
    return jwt.sign(
      { ...payload, type: 'access' },
      process.env.JWT_SECRET!,
      { expiresIn: this.ACCESS_TOKEN_EXPIRY }
    );
  }

  static generateRefreshToken(payload: Omit<JWTPayload, 'type'>): string {
    return jwt.sign(
      { ...payload, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: this.REFRESH_TOKEN_EXPIRY }
    );
  }

  static generateAccessTokenWithRememberMe(payload: Omit<JWTPayload, 'type'>): string {
    return jwt.sign(
      { ...payload, type: 'access' },
      process.env.JWT_SECRET!,
      { expiresIn: this.REMEMBER_ME_ACCESS_TOKEN_EXPIRY }
    );
  }

  static generateRefreshTokenWithRememberMe(payload: Omit<JWTPayload, 'type'>): string {
    return jwt.sign(
      { ...payload, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: this.REMEMBER_ME_REFRESH_TOKEN_EXPIRY }
    );
  }

  static generateTokenPair(payload: Omit<JWTPayload, 'type'>): TokenPair {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  static generateTokenPairWithRememberMe(payload: Omit<JWTPayload, 'type'>): TokenPair {
    return {
      accessToken: this.generateAccessTokenWithRememberMe(payload),
      refreshToken: this.generateRefreshTokenWithRememberMe(payload),
    };
  }

  static verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  static verifyRefreshToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as JWTPayload;
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  static generateRefreshTokenId(): string {
    return uuidv4();
  }

  static getRefreshTokenExpiry(rememberMe: boolean = false): Date {
    const now = new Date();
    const days = rememberMe ? 30 : 7; // 30 days for remember me, 7 days for session-only
    const expiry = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return expiry;
  }
}
