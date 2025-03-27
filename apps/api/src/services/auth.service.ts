import { sign } from 'jsonwebtoken';
import { compare, hash } from 'bcryptjs';
import prisma from '../utils/prisma';
import { logger } from '../utils/logger';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  tenantId: string;
  role: string;
}

export class AuthService {
  async register(data: RegisterData) {
    try {
      const hashedPassword = await hash(data.password, 10);
      
      const user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          password: hashedPassword,
          tenantId: data.tenantId,
          role: data.role
        }
      });

      logger.info(`User registered: ${user.email}`);
      return this.generateTokens(user);
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  async login(credentials: LoginCredentials) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: credentials.email }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const isValidPassword = await compare(credentials.password, user.password);
      if (!isValidPassword) {
        throw new Error('Invalid password');
      }

      logger.info(`User logged in: ${user.email}`);
      return this.generateTokens(user);
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  private generateTokens(user: any) {
    const accessToken = sign(
      {
        id: user.id,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '15m' }
    );

    const refreshToken = sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
      { expiresIn: '7d' }
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    };
  }

  async refreshToken(token: string) {
    try {
      const decoded = sign(token, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key') as { id: string };
      const user = await prisma.user.findUnique({
        where: { id: decoded.id }
      });

      if (!user) {
        throw new Error('User not found');
      }

      return this.generateTokens(user);
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw error;
    }
  }
} 