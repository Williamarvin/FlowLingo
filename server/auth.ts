import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { users, sessions } from '@shared/schema';
import { getDB } from './db-helper';
import { eq } from 'drizzle-orm';
import type { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'flowlingo-secret-key-change-in-production';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Generate JWT token
export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

// Verify JWT token
export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Authentication middleware
export async function requireAuth(req: Request & { userId?: string }, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Check if session exists in database
  const { db } = await getDB();
  const [session] = await db.select().from(sessions)
    .where(eq(sessions.token, token));

  if (!session || session.expiresAt < new Date()) {
    return res.status(401).json({ error: 'Session expired' });
  }

  req.userId = payload.userId;
  next();
}

// Create session
export async function createSession(userId: string): Promise<string> {
  const token = generateToken(userId);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  const { db } = await getDB();
  await db.insert(sessions).values({
    userId,
    token,
    expiresAt,
  });

  return token;
}

// Verify Google token
export async function verifyGoogleToken(idToken: string) {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return payload;
  } catch (error) {
    console.error('Google token verification failed:', error);
    return null;
  }
}

// Get or create user from Google OAuth
export async function getOrCreateGoogleUser(googleUser: any) {
  const email = googleUser.email;
  const googleId = googleUser.sub;
  const profilePicture = googleUser.picture;
  const username = googleUser.name;

  const { db } = await getDB();
  
  // Check if user exists
  const [existingUser] = await db.select().from(users)
    .where(eq(users.email, email));

  if (existingUser) {
    // Update Google ID if not set
    if (!existingUser.googleId) {
      await db.update(users)
        .set({ googleId, profilePicture })
        .where(eq(users.id, existingUser.id));
    }
    return existingUser;
  }

  // Create new user
  const [newUser] = await db.insert(users).values({
    email,
    googleId,
    profilePicture,
    username,
    authMethod: 'google',
    emailVerified: true,
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    hearts: 5,
    maxHearts: 5,
  }).returning();

  return newUser;
}