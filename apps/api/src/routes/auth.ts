import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['TRAINER', 'ATHLETE']),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

function generateTokens(userId: string, email: string, role: string) {
  const accessToken = jwt.sign(
    { id: userId, email, role },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
}

router.post('/register', async (req: Request, res: Response) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ message: 'Invalid data', errors: result.error.errors });
    return;
  }

  const { email, password, firstName, lastName, role } = result.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ message: 'Email already in use' });
    return;
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, password: hashed, firstName, lastName, role },
    select: { id: true, email: true, firstName: true, lastName: true, role: true },
  });

  const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  res.status(201).json({ user, accessToken, refreshToken });
});

router.post('/login', async (req: Request, res: Response) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ message: 'Invalid data' });
    return;
  }

  const { email, password } = result.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const { password: _, ...safeUser } = user;
  res.json({ user: safeUser, accessToken, refreshToken });
});

router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ message: 'Refresh token required' });
    return;
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!stored || stored.expiresAt < new Date()) {
    res.status(401).json({ message: 'Invalid refresh token' });
    return;
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { id: string };
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    await prisma.refreshToken.delete({ where: { token: refreshToken } });
    const tokens = generateTokens(user.id, user.email, user.role);

    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json(tokens);
  } catch {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

router.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }
  res.json({ message: 'Logged out' });
});

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true, email: true, firstName: true, lastName: true,
      role: true, avatar: true, bio: true, phone: true, createdAt: true,
    },
  });
  res.json(user);
});

export default router;
