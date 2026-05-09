'use server';

import { loginSchema } from '@/lib/validators/auth';
import { createSession, comparePasswords, hashPassword } from '@/lib/auth';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const SESSION_COOKIE_NAME = 'session';

export async function logout() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    revalidatePath('/login');
    revalidatePath('/dashboard');
    redirect('/login');
  } catch (error) {
    console.error('Logout error:', error);
    redirect('/login');
  }
}

export async function login(formData: FormData) {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Validate input with Zod schema
    const result = loginSchema.safeParse({ email, password });

    if (!result.success) {
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    // Query user from database by email
    const user = await prisma.user.findUnique({
      where: { email: result.data.email },
    });

    if (!user) {
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    // Compare password with bcrypt
    const isPasswordValid = await comparePasswords(
      result.data.password,
      user.password_hash
    );

    if (!isPasswordValid) {
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    // On success: create session
    await createSession(user.id, user.email, user.role);

    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'Invalid email or password',
    };
  }
}

export async function requestPasswordReset(email: string) {
  try {
    // Validate email exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists for security
      return {
        success: true,
        message: 'If an account exists with this email, you will receive a reset link',
      };
    }

    // Generate reset token (32 random bytes)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Save token to database
    await prisma.passwordResetToken.create({
      data: {
        user_id: user.id,
        token,
        expires_at: expiresAt,
      },
    });

    // TODO: Send email with reset link
    console.log(`Password reset link: /reset-password?token=${token}`);

    return {
      success: true,
      message: 'If an account exists with this email, you will receive a reset link',
    };
  } catch (error) {
    console.error('Password reset request error:', error);
    return {
      success: false,
      error: 'Failed to process password reset request',
    };
  }
}

export async function resetPassword(token: string, newPassword: string) {
  try {
    // Find and validate token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return {
        success: false,
        error: 'Invalid or expired reset link',
      };
    }

    // Check if token expired
    if (new Date() > resetToken.expires_at) {
      // Delete expired token
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });

      return {
        success: false,
        error: 'Reset link has expired. Please request a new one.',
      };
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user password and delete token
    await prisma.user.update({
      where: { id: resetToken.user_id },
      data: { password_hash: hashedPassword },
    });

    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    });

    return {
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    };
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      error: 'Failed to reset password',
    };
  }
}
