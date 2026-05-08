'use server';

import { loginSchema } from '@/lib/validators/auth';
import { createSession, comparePasswords } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

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
