import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/index.js';
import { createHash, randomUUID } from 'crypto';
import { GenerateLinkParams } from '@supabase/supabase-js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string(),
  roleId: z.string().optional()
});

const verifyEmailSchema = z.object({
  token: z.string()
});

const resendVerificationSchema = z.object({
  email: z.string().email()
});

const forgotPasswordSchema = z.object({
  email: z.string().email()
});

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6)
});

// Helper function to generate a unique device ID
function generateDeviceId(request: any): string {
  const userAgent = request.headers['user-agent'] || '';
  const ip = request.ip || '';
  const platform = request.headers['sec-ch-ua-platform'] || '';
  const mobile = request.headers['sec-ch-ua-mobile'] || '';
  
  // Create a unique hash based on device characteristics
  const deviceString = `${userAgent}-${ip}-${platform}-${mobile}`;
  return createHash('sha256').update(deviceString).digest('hex');
}

// Helper function to track user device
async function trackUserDevice(userId: string, request: any) {
  const deviceId = generateDeviceId(request);
  const deviceInfo = {
    userAgent: request.headers['user-agent'],
    platform: request.headers['sec-ch-ua-platform'],
    mobile: request.headers['sec-ch-ua-mobile'],
    language: request.headers['accept-language']
  };

  return prisma.userDevice.upsert({
    where: {
      userId_deviceId: {
        userId,
        deviceId
      }
    },
    create: {
      userId,
      deviceId,
      deviceInfo,
      ipAddress: request.ip
    },
    update: {
      lastActiveAt: new Date(),
      deviceInfo,
      ipAddress: request.ip
    }
  });
}

export async function authRoutes(fastify: FastifyInstance) {
  // Login endpoint
  fastify.post('/auth/login', {
    schema: {
      description: 'Authenticate user and return JWT token',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                tenantId: { type: 'string' },
                emailVerified: { type: 'boolean' },
                role: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        403: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                emailVerified: { type: 'boolean' }
              }
            },
            requiresVerification: { type: 'boolean' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { email, password } = loginSchema.parse(request.body);
    
    try {
      const { data, error } = await fastify.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // Check if the error is due to unconfirmed email
        if (error.message === 'Email not confirmed') {
          // Get user from our database first
          let user = await prisma.user.findUnique({
            where: { email },
            include: { role: true }
          });

          if (!user) {
            // Get default role
            const defaultRole = await prisma.role.findFirst({ 
              where: { name: 'USER' } 
            });

            if (!defaultRole) {
              throw new Error('Default USER role not found');
            }

            // Create new user
            user = await prisma.user.create({
              data: {
                email,
                name: email.split('@')[0], // Use email prefix as name
                tenantId: '',
                roleId: defaultRole.id,
                emailVerified: false
              },
              include: { role: true }
            });
          }

          return reply.code(403).send({ 
            error: 'Email not verified',
            message: 'Please verify your email before logging in. Check your inbox for the verification link.',
            user: {
              id: user.id,
              email: user.email,
              emailVerified: false
            },
            requiresVerification: true
          });
        }

        // Map other Supabase errors to user-friendly messages
        const errorMessage = error.message === 'Invalid login credentials'
          ? 'Invalid email or password'
          : error.message;
        return reply.code(401).send({ error: errorMessage });
      }

      // Get user from our database to include role information
      let user = await prisma.user.findUnique({
        where: { id: data.user?.id },
        include: { role: true }
      });

      if (!user) {
        // If user exists in Supabase but not in our database, try to create them
        const { data: supabaseUser } = await fastify.supabase.auth.getUser(data.session?.access_token);
        if (supabaseUser.user) {
          try {
            // First check if user exists by email to avoid unique constraint violation
            const existingUser = await prisma.user.findUnique({
              where: { email: supabaseUser.user.email! },
              include: { role: true }
            });

            if (existingUser) {
              // If user exists by email, use that user
              user = existingUser;
            } else {
              // Get default role
              const defaultRole = await prisma.role.findFirst({ 
                where: { name: 'USER' } 
              });

              if (!defaultRole) {
                throw new Error('Default USER role not found');
              }

              // Create new user only if they don't exist
              user = await prisma.user.create({
                data: {
                  id: supabaseUser.user.id,
                  email: supabaseUser.user.email!,
                  name: supabaseUser.user.user_metadata?.name || 'User',
                  tenantId: supabaseUser.user.user_metadata?.tenant_id || '',
                  roleId: defaultRole.id,
                  emailVerified: !!supabaseUser.user.email_confirmed_at
                },
                include: { role: true }
              });
            }
          } catch (error) {
            console.error('Failed to create/find user in database:', error);
            return reply.code(500).send({ 
              error: 'Authentication failed',
              message: 'Failed to process user data. Please try again.'
            });
          }
        } else {
          return reply.code(404).send({ 
            error: 'Account not found',
            message: 'Please register first or check your email for verification'
          });
        }
      }

      if (!user) {
        return reply.code(404).send({ 
          error: 'User not found',
          message: 'Failed to retrieve user data. Please try again.'
        });
      }

      // Check if email is verified
      const { data: supabaseUser } = await fastify.supabase.auth.getUser(data.session?.access_token);
      if (!supabaseUser.user?.email_confirmed_at && !user.emailVerified) {
        return reply.code(403).send({ 
          error: 'Email not verified',
          message: 'Please verify your email before logging in. Check your inbox for the verification link.',
          user: {
            id: user.id,
            email: user.email,
            emailVerified: false
          },
          requiresVerification: true
        });
      }

      // If Supabase shows email is verified but our DB doesn't, update our DB
      if (supabaseUser.user?.email_confirmed_at && !user.emailVerified) {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: true }
        });
        user.emailVerified = true;
      }

      // Track the user's device
      await trackUserDevice(user.id, request);

      return {
        token: data.session?.access_token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          tenantId: user.tenantId,
          emailVerified: user.emailVerified,
          role: user.role
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      return reply.code(500).send({ 
        error: 'Authentication failed',
        message: 'An unexpected error occurred. Please try again later.'
      });
    }
  });

  // Register endpoint
  fastify.post('/auth/register', {
    schema: {
      description: 'Register a new user and create tenant',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          name: { type: 'string' },
          roleId: { type: 'string' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                tenantId: { type: 'string' },
                emailVerified: { type: 'boolean' },
                role: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' }
                  }
                }
              }
            },
            requiresVerification: { type: 'boolean' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { email, password, name, roleId } = registerSchema.parse(request.body);
      
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        return reply.code(400).send({ error: 'User already exists' });
      }

      // Get default role (USER) if no role is specified
      const defaultRole = await prisma.role.findFirst({
        where: { name: 'USER' }
      });

      if (!defaultRole) {
        console.error('Default USER role not found in database');
        return reply.code(500).send({ error: 'System configuration error: Default role not found' });
      }

      const finalRoleId = roleId || defaultRole.id;

      // Create tenant first with a unique domain
      const baseDomain = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      let domain = `${baseDomain}.loyaltystudio.ai`;
      let counter = 1;

      // Keep trying until we find a unique domain
      while (true) {
        const existingTenant = await prisma.tenant.findUnique({
          where: { domain }
        });

        if (!existingTenant) {
          break;
        }

        domain = `${baseDomain}-${counter}.loyaltystudio.ai`;
        counter++;
      }

      // Create tenant with UUID
      const tenant = await prisma.tenant.create({
        data: {
          name: `${name}'s Organization`,
          domain
        }
      }).catch(error => {
        console.error('Failed to create tenant:', error);
        throw new Error('Failed to create tenant');
      });

      // Create user in Supabase
      const { data: supabaseUser, error: supabaseError } = await fastify.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            tenant_id: tenant.id,
            role: 'user'
          },
          emailRedirectTo: `${process.env.MERCHANT_WEB_URL}/`
        }
      });

      if (supabaseError) {
        // Rollback tenant creation if user creation fails
        await prisma.tenant.delete({ where: { id: tenant.id } });
        console.error('Supabase user creation failed:', supabaseError);
        return reply.code(400).send({ error: supabaseError.message });
      }

      if (!supabaseUser.user?.id) {
        // Rollback tenant creation if no user ID returned
        await prisma.tenant.delete({ where: { id: tenant.id } });
        console.error('No user ID returned from Supabase');
        return reply.code(500).send({ error: 'Failed to create user account' });
      }

      // Create user in our database
      const user = await prisma.user.create({
        data: {
          id: supabaseUser.user.id,
          email,
          name,
          tenantId: tenant.id,
          roleId: finalRoleId,
          emailVerified: false // Set initial email verification status
        },
        include: {
          role: true
        }
      }).catch(async (error) => {
        console.error('Failed to create user in database:', error);
        // Rollback tenant creation
        await prisma.tenant.delete({ where: { id: tenant.id } });
        throw new Error('Failed to create user in database');
      });

      // Sign in the user immediately after registration
      const { data: signInData, error: signInError } = await fastify.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        console.error('Failed to sign in after registration:', signInError);
        return reply.code(201).send({
          message: 'Registration successful! Please check your email to verify your account.',
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            tenantId: user.tenantId,
            emailVerified: false,
            role: user.role
          },
          requiresVerification: true
        });
      }

      // Return success response with user data and token
      return reply.code(201).send({
        message: 'Registration successful! Please check your email to verify your account.',
        token: signInData.session?.access_token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          tenantId: user.tenantId,
          emailVerified: false,
          role: user.role
        },
        requiresVerification: true
      });
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid input data', details: error.errors });
      }
      return reply.code(500).send({ error: 'Registration failed', message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Logout endpoint
  fastify.post('/auth/logout', {
    schema: {
      description: 'Logout user and invalidate token',
      tags: ['auth'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader) {
        return reply.code(401).send({ error: 'No authorization header' });
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await fastify.supabase.auth.getUser(token);

      if (error || !user) {
        return reply.code(401).send({ error: 'Invalid token' });
      }

      // Sign out from Supabase
      await fastify.supabase.auth.signOut();

      return { message: 'Logged out successfully' };
    } catch (error) {
      console.error('Logout error:', error);
      return reply.code(500).send({ error: 'Logout failed' });
    }
  });

  // Verify email endpoint
  fastify.post('/auth/verify-email', {
    schema: {
      description: 'Verify user email address',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                emailVerified: { type: 'boolean' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { token } = verifyEmailSchema.parse(request.body);
      
      const { data, error } = await fastify.supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email'
      });

      if (error) {
        return reply.code(400).send({ error: error.message });
      }

      if (!data.user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      // Update user's email verification status in our database
      const user = await prisma.user.update({
        where: { id: data.user.id },
        data: { emailVerified: true }
      });

      // Redirect to success page with email
      return reply.redirect(`${process.env.MERCHANT_WEB_URL}/verify-email-success?email=${encodeURIComponent(user.email)}`);
    } catch (error) {
      console.error('Email verification error:', error);
      return reply.code(500).send({ error: 'Email verification failed' });
    }
  });

  // Resend verification email endpoint
  fastify.post('/auth/resend-verification', {
    schema: {
      description: 'Resend email verification link',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { email } = resendVerificationSchema.parse(request.body);
      
      const { error } = await fastify.supabase.auth.resend({
        type: 'signup',
        email
      });

      if (error) {
        return reply.code(400).send({ error: error.message });
      }

      return { message: 'Verification email sent successfully' };
    } catch (error) {
      console.error('Resend verification error:', error);
      return reply.code(500).send({ error: 'Failed to resend verification email' });
    }
  });

  // Forgot password endpoint
  fastify.post('/auth/forgot-password', {
    schema: {
      description: 'Send password reset email',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { email } = forgotPasswordSchema.parse(request.body);
      
      const { error } = await fastify.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.MERCHANT_WEB_URL}/reset-password`
      });

      if (error) {
        return reply.code(400).send({ error: error.message });
      }

      return { message: 'Password reset email sent successfully' };
    } catch (error) {
      console.error('Forgot password error:', error);
      return reply.code(500).send({ error: 'Failed to send password reset email' });
    }
  });

  // Reset password endpoint
  fastify.post('/auth/reset-password', {
    schema: {
      description: 'Reset user password',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['token', 'password'],
        properties: {
          token: { type: 'string' },
          password: { type: 'string', minLength: 6 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { token, password } = resetPasswordSchema.parse(request.body);
      
      const { error } = await fastify.supabase.auth.updateUser({
        password
      });

      if (error) {
        return reply.code(400).send({ error: error.message });
      }

      return { message: 'Password reset successfully' };
    } catch (error) {
      console.error('Reset password error:', error);
      return reply.code(500).send({ error: 'Failed to reset password' });
    }
  });

  // Verify session endpoint
  fastify.get('/auth/verify-session', {
    schema: {
      description: 'Verify the current session and return user data',
      tags: ['auth'],
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                tenantId: { type: 'string' },
                emailVerified: { type: 'boolean' },
                role: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return reply.code(401).send({ 
          error: 'No valid authorization header',
          message: 'Please log in again'
        });
      }

      const token = authHeader.split(' ')[1];
      const { data: supabaseUser, error } = await fastify.supabase.auth.getUser(token);

      if (error || !supabaseUser.user) {
        return reply.code(401).send({ 
          error: 'Invalid or expired token',
          message: 'Your session has expired. Please log in again.'
        });
      }

      // Get user from our database to include role information
      let user = await prisma.user.findUnique({
        where: { id: supabaseUser.user.id },
        include: { role: true }
      });

      // If user doesn't exist in our database, try to create them
      if (!user && supabaseUser.user) {
        try {
          // First check if user exists by email to avoid unique constraint violation
          const existingUser = await prisma.user.findUnique({
            where: { email: supabaseUser.user.email! },
            include: { role: true }
          });

          if (existingUser) {
            // If user exists by email, use that user
            user = existingUser;
          } else {
            // Get default role
            const defaultRole = await prisma.role.findFirst({ 
              where: { name: 'USER' } 
            });

            if (!defaultRole) {
              throw new Error('Default USER role not found');
            }

            // Create new user
            user = await prisma.user.create({
              data: {
                id: supabaseUser.user.id,
                email: supabaseUser.user.email!,
                name: supabaseUser.user.user_metadata?.name || 'User',
                tenantId: supabaseUser.user.user_metadata?.tenant_id || '',
                roleId: defaultRole.id,
                emailVerified: !!supabaseUser.user.email_confirmed_at
              },
              include: { role: true }
            });
          }
        } catch (error) {
          console.error('Failed to create/find user in database:', error);
          return reply.code(500).send({ 
            error: 'Session verification failed',
            message: 'Failed to process user data. Please try again.'
          });
        }
      }

      if (!user) {
        return reply.code(404).send({ 
          error: 'User not found',
          message: 'User data not found. Please try logging in again.'
        });
      }

      if (!user.role) {
        return reply.code(403).send({ 
          error: 'User role not found',
          message: 'User role not found. Please contact support.'
        });
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          tenantId: user.tenantId,
          emailVerified: user.emailVerified,
          role: user.role
        }
      };
    } catch (error) {
      console.error('Session verification error:', error);
      return reply.code(500).send({ 
        error: 'Session verification failed',
        message: 'An unexpected error occurred. Please try again.'
      });
    }
  });
} 