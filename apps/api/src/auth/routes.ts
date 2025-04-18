import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/index.js';
import { createHash } from 'crypto';
import { env } from '../config/env.js';

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
      // Sign in with password
      const { data, error } = await fastify.supabase.auth.signInWithPassword({
        email,
        password
      });

      // Log JWT expiry time for debugging
      if (data?.session) {
        const expiresAt = new Date(data.session.expires_at || '');
        console.log(`JWT token created with expiry: ${expiresAt.toISOString()}`);

        // Set a longer session by refreshing the token
        // This will extend the session beyond the default JWT expiry
        try {
          const { data: refreshData } = await fastify.supabase.auth.refreshSession();
          if (refreshData?.session) {
            console.log(`Session refreshed, new expiry: ${new Date(refreshData.session.expires_at || '').toISOString()}`);
          }
        } catch (refreshError) {
          console.error('Failed to refresh session:', refreshError);
        }
      }

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

              // Get or create a tenant for the user
              let tenantId = supabaseUser.user.user_metadata?.tenant_id;
              console.log('User metadata tenant ID:', tenantId);

              // Verify the tenant exists if a tenant ID is provided
              if (tenantId) {
                const existingTenant = await prisma.tenant.findUnique({
                  where: { id: tenantId }
                });

                if (!existingTenant) {
                  console.log(`Tenant with ID ${tenantId} not found, will create default tenant`);
                  tenantId = null; // Reset tenant ID if it doesn't exist
                } else {
                  console.log(`Found existing tenant: ${existingTenant.name}`);
                }
              }

              if (!tenantId) {
                // Check if a default tenant exists
                const defaultTenant = await prisma.tenant.findFirst({
                  where: { name: 'Default Tenant' }
                });

                if (defaultTenant) {
                  console.log(`Using existing default tenant: ${defaultTenant.name}`);
                  tenantId = defaultTenant.id;
                } else {
                  // Create a default tenant if none exists
                  console.log('Creating new default tenant');
                  const newTenant = await prisma.tenant.create({
                    data: {
                      name: 'Default Tenant',
                      domain: `default-${Date.now()}.loyaltystudio.com`
                    }
                  });
                  console.log(`Created new default tenant with ID: ${newTenant.id}`);
                  tenantId = newTenant.id;
                }
              }

              // Create new user only if they don't exist
              console.log('Creating new user with the following data:');
              console.log('- ID:', supabaseUser.user.id);
              console.log('- Email:', supabaseUser.user.email);
              console.log('- Name:', supabaseUser.user.user_metadata?.name || 'User');
              console.log('- Tenant ID:', tenantId);
              console.log('- Role ID:', defaultRole.id);

              // Verify tenant exists one more time before creating user
              if (!tenantId) {
                throw new Error('No valid tenant ID available for user creation');
              }

              const tenantCheck = await prisma.tenant.findUnique({
                where: { id: tenantId }
              });

              if (!tenantCheck) {
                console.error(`Fatal error: Tenant with ID ${tenantId} not found before user creation`);
                throw new Error(`Tenant with ID ${tenantId} not found`);
              }

              console.log(`Verified tenant exists: ${tenantCheck.name}`);

              user = await prisma.user.create({
                data: {
                  id: supabaseUser.user.id,
                  email: supabaseUser.user.email!,
                  name: supabaseUser.user.user_metadata?.name || 'User',
                  tenantId: tenantId,
                  roleId: defaultRole.id,
                  emailVerified: !!supabaseUser.user.email_confirmed_at
                },
                include: { role: true }
              });
            }
          } catch (error) {
            console.error('Failed to create/find user in database:', error);

            // Provide more detailed error message
            let errorMessage = 'Failed to process user data. Please try again.';
            if (error instanceof Error) {
              errorMessage = error.message;
            }

            return reply.code(500).send({
              error: 'Authentication failed',
              message: errorMessage
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

      // Check if user is a super admin - super admins can bypass email verification
      const isSuperAdmin = user.role?.name === 'SUPER_ADMIN';

      // If not a super admin and email is not verified, return error
      if (!isSuperAdmin && !supabaseUser.user?.email_confirmed_at && !user.emailVerified) {
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
      // Also, if user is a super admin, mark email as verified regardless
      if ((supabaseUser.user?.email_confirmed_at && !user.emailVerified) || isSuperAdmin) {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: true }
        });
        user.emailVerified = true;
      }

      // Check if user is approved
      if (!user.isApproved && user.status !== 'APPROVED') {
        // Check if user has a demo request
        const demoRequest = await prisma.demoRequest.findUnique({
          where: { userId: user.id }
        });

        if (demoRequest) {
          return reply.code(403).send({
            error: 'Account pending approval',
            message: 'Your account is pending approval. You will receive an email when your account is approved.',
            demoRequestStatus: demoRequest.status
          });
        } else {
          return reply.code(403).send({
            error: 'Account not approved',
            message: 'Your account has not been approved. Please contact support for assistance.'
          });
        }
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
          isApproved: user.isApproved,
          status: user.status,
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
    // Direct registration is disabled, users must request a demo first
    return reply.code(403).send({
      error: 'Registration disabled',
      message: 'Direct registration is disabled. Please request a demo to get access to the platform.',
      redirectTo: '/request-demo'
    });
  });

  /* Original registration code (disabled)
  fastify.post('/auth/register-original', async (request, reply) => {
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

  // Log JWT expiry time for debugging
  if (supabaseUser?.session) {
    const expiresAt = new Date(supabaseUser.session.expires_at || '');
    console.log(`Registration: JWT token created with expiry: ${expiresAt.toISOString()}`);

    // Set a longer session by refreshing the token
    // This will extend the session beyond the default JWT expiry
    try {
      const { data: refreshData } = await fastify.supabase.auth.refreshSession();
      if (refreshData?.session) {
        console.log(`Registration: Session refreshed, new expiry: ${new Date(refreshData.session.expires_at || '').toISOString()}`);
      }
    } catch (refreshError) {
      console.error('Failed to refresh session after registration:', refreshError);
    }
  }

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
  */

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

      console.log(`Logging out user: ${user.email} (ID: ${user.id})`);

      // Sign out from Supabase with the scope parameter set to 'global'
      // This will invalidate all sessions for the user across all devices
      const { error: signOutError } = await fastify.supabase.auth.signOut({ scope: 'global' });

      if (signOutError) {
        console.error('Error during signOut:', signOutError);
        return reply.code(500).send({ error: 'Failed to invalidate session' });
      }

      console.log(`Successfully invalidated all sessions for user: ${user.email}`);

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

      // Get the user to check if they exist
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, name: true }
      });

      if (!user) {
        console.log(`User with email ${email} not found, but returning success for security reasons`);
        // For security reasons, don't reveal that the email doesn't exist
        return { message: 'If your email is registered, you will receive a password reset link' };
      }

      // Construct the redirect URL with the correct port
      const redirectUrl = `${env.MERCHANT_WEB_URL}/reset-password`;
      console.log(`Sending password reset email to ${email} with redirect to ${redirectUrl}`);

      const { error } = await fastify.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      if (error) {
        console.error('Failed to send password reset email:', error);
        return reply.code(400).send({ error: error.message });
      }

      console.log('Password reset email sent successfully to', email);
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

      console.log(`Attempting to reset password with token/code: ${token.substring(0, 10)}...`);

      let result;

      // Check if this is a code from PKCE flow or a token
      if (token.includes('-') && token.length < 50) {
        // This is likely a code from PKCE flow
        console.log('Detected code from PKCE flow, exchanging for session');

        try {
          // For PKCE flow, we need both the code and code verifier
          // Since we don't have the code verifier (it's stored in the browser),
          // we'll use a different approach

          // First, try to use the admin API to update the user's password directly
          // Since we can't get the user directly from the code in the API,
          // we'll need to use a different approach

          // Try to exchange the code for a session first
          const { data: sessionData, error: sessionError } = await fastify.supabase.auth.exchangeCodeForSession(token);

          if (sessionError || !sessionData?.session) {
            console.log('Could not exchange code for session:', sessionError);

            // Alternative approach: Create a new password reset for the user
            // This requires knowing the user's email, which we don't have from just the code
            // So we'll return a more specific error message
            return reply.code(400).send({
              error: 'Password reset link expired or invalid',
              message: 'Please request a new password reset link.'
            });
          }

          // If we got the session, update the user's password
          console.log('Successfully exchanged code for session');
          result = await fastify.supabase.auth.updateUser({ password });

          console.log('Updated password using admin API');
        } catch (exchangeError) {
          console.error('Error during password reset:', exchangeError);
          return reply.code(400).send({
            error: 'Invalid or expired code',
            message: 'Please request a new password reset link.'
          });
        }
      } else {
        // This is likely a token
        console.log('Detected token, setting session directly');

        // Use the token to update the password
        // First set the session with the token
        const { error: sessionError } = await fastify.supabase.auth.setSession({
          access_token: token,
          refresh_token: ''
        });

        if (sessionError) {
          console.error('Failed to set session:', sessionError);
          return reply.code(400).send({ error: sessionError.message });
        }

        // Then update the user's password
        result = await fastify.supabase.auth.updateUser({ password });
      }

      // Check the result of the password update
      if (result.error) {
        console.error('Failed to update password:', result.error);
        return reply.code(400).send({ error: result.error.message });
      }

      console.log('Password reset successfully for user:', result.data?.user?.email);
      return { message: 'Password reset successfully' };
    } catch (error) {
      console.error('Reset password error:', error);
      return reply.code(500).send({ error: 'Failed to reset password' });
    }
  });

  // Refresh token endpoint
  fastify.post('/auth/refresh-token', {
    schema: {
      description: 'Refresh the authentication token',
      tags: ['auth'],
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

      // Refresh the session using the current session
      const { data, error } = await fastify.supabase.auth.refreshSession();

      if (error || !data.session || !data.user) {
        return reply.code(401).send({
          error: 'Failed to refresh token',
          message: 'Your session has expired. Please log in again.'
        });
      }

      // Get user from our database to include role information
      const user = await prisma.user.findUnique({
        where: { id: data.user.id },
        include: { role: true }
      });

      if (!user) {
        return reply.code(401).send({
          error: 'User not found',
          message: 'User account not found. Please log in again.'
        });
      }

      // Return the new token and user data
      return {
        token: data.session.access_token,
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
      console.error('Token refresh error:', error);
      return reply.code(500).send({
        error: 'Internal server error',
        message: 'Failed to refresh token. Please try again.'
      });
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

      // First check if the session is valid using the provided token
      // We need to verify the token directly rather than checking the current session
      // because the current session might be different from the token being verified
      const { data: sessionData, error: sessionError } = await fastify.supabase.auth.getSession();

      console.log(`Verifying session for token: ${token ? token.substring(0, 10) : 'undefined'}...`);

      // If there's no active session, the token is invalid
      if (sessionError) {
        console.log('Session error during verify-session:', sessionError);
        return reply.code(401).send({
          error: 'Session error',
          message: 'Your session has expired. Please log in again.'
        });
      }

      // Check if the session exists and is valid
      if (!sessionData.session) {
        console.log('No active session found during verify-session');
        return reply.code(401).send({
          error: 'No active session',
          message: 'Your session has expired. Please log in again.'
        });
      }

      // Now verify the token
      const { data: supabaseUser, error } = await fastify.supabase.auth.getUser(token);

      if (error || !supabaseUser.user) {
        console.log('Invalid token during verify-session:', error);
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