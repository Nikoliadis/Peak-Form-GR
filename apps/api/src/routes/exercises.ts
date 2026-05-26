import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const exercises = await prisma.exercise.findMany({
    where: {
      OR: [{ isCustom: false }, { createdById: req.user!.id }],
    },
    orderBy: [{ muscleGroup: 'asc' }, { name: 'asc' }],
  });
  res.json(exercises);
});

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  muscleGroup: z.string().optional(),
  equipment: z.string().optional(),
});

router.post('/', authenticate, requireRole('TRAINER'), async (req: AuthRequest, res: Response) => {
  const result = createSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ message: 'Invalid data' });
    return;
  }
  const exercise = await prisma.exercise.create({
    data: { ...result.data, isCustom: true, createdById: req.user!.id },
  });
  res.status(201).json(exercise);
});

router.delete('/:id', authenticate, requireRole('TRAINER'), async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const exercise = await prisma.exercise.findUnique({ where: { id } });
  if (!exercise || !exercise.isCustom || exercise.createdById !== req.user!.id) {
    res.status(404).json({ message: 'Exercise not found' });
    return;
  }
  await prisma.exercise.delete({ where: { id } });
  res.json({ message: 'Deleted' });
});

export default router;
