import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

router.get('/trainer/athletes', authenticate, requireRole('TRAINER'), async (req: AuthRequest, res: Response) => {
  const relations = await prisma.trainerAthlete.findMany({
    where: { trainerId: req.user!.id, status: 'active' },
    include: {
      athlete: {
        select: {
          id: true, email: true, firstName: true, lastName: true,
          avatar: true, createdAt: true,
        },
      },
    },
  });
  res.json(relations.map((r) => r.athlete));
});

const inviteSchema = z.object({ athleteEmail: z.string().email() });

router.post('/trainer/invite', authenticate, requireRole('TRAINER'), async (req: AuthRequest, res: Response) => {
  const result = inviteSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ message: 'Invalid email' });
    return;
  }

  const athlete = await prisma.user.findUnique({
    where: { email: result.data.athleteEmail },
  });

  if (!athlete || athlete.role !== 'ATHLETE') {
    res.status(404).json({ message: 'Athlete not found' });
    return;
  }

  const existing = await prisma.trainerAthlete.findUnique({
    where: { trainerId_athleteId: { trainerId: req.user!.id, athleteId: athlete.id } },
  });

  if (existing) {
    res.status(409).json({ message: 'Already linked' });
    return;
  }

  const relation = await prisma.trainerAthlete.create({
    data: { trainerId: req.user!.id, athleteId: athlete.id },
  });

  res.status(201).json(relation);
});

router.get('/athlete/trainer', authenticate, requireRole('ATHLETE'), async (req: AuthRequest, res: Response) => {
  const relation = await prisma.trainerAthlete.findFirst({
    where: { athleteId: req.user!.id, status: 'active' },
    include: {
      trainer: {
        select: {
          id: true, email: true, firstName: true, lastName: true, avatar: true, bio: true,
        },
      },
    },
  });
  res.json(relation?.trainer ?? null);
});

export default router;
