import { cookies } from 'next/headers';
import * as bcrypt from 'bcrypt';
import { jwtVerify, SignJWT, type JWTPayload } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'your-session-secret-here'
);

const SESSION_COOKIE_NAME = 'session';
const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

export interface SessionPayload extends JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export async function createSession(userId: string, email: string, role: string) {
  const payload: SessionPayload = {
    userId,
    email,
    role,
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);

  return token;
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as SessionPayload;
  } catch (err) {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function comparePasswords(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
