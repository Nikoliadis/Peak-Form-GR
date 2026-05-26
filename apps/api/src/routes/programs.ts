import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

const fullProgramInclude = {
  weeks: {
    orderBy: { weekNumber: 'asc' as const },
    include: {
      days: {
        orderBy: { dayNumber: 'asc' as const },
        include: {
          exercises: {
            orderBy: { order: 'asc' as const },
            include: { exercise: true },
          },
        },
      },
    },
  },
};

// GET /api/programs
router.get('/', authenticate, requireRole('TRAINER'), async (req: AuthRequest, res: Response) => {
  const programs = await prisma.workoutProgram.findMany({
    where: { creatorId: req.user!.id },
    include: fullProgramInclude,
    orderBy: { createdAt: 'desc' },
  });
  res.json(programs);
});

// POST /api/programs
const createProgramSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  goal: z.string().optional(),
  durationWeeks: z.number().int().min(1).max(52).default(4),
});

router.post('/', authenticate, requireRole('TRAINER'), async (req: AuthRequest, res: Response) => {
  const result = createProgramSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ message: 'Invalid data', errors: result.error.errors });
    return;
  }
  const { durationWeeks, ...rest } = result.data;
  const program = await prisma.workoutProgram.create({
    data: {
      ...rest,
      durationWeeks,
      creatorId: req.user!.id,
      weeks: {
        create: Array.from({ length: durationWeeks }, (_, i) => ({ weekNumber: i + 1 })),
      },
    },
    include: fullProgramInclude,
  });
  res.status(201).json(program);
});

// GET /api/programs/:id
router.get('/:id', authenticate, requireRole('TRAINER'), async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const program = await prisma.workoutProgram.findFirst({
    where: { id, creatorId: req.user!.id },
    include: fullProgramInclude,
  });
  if (!program) { res.status(404).json({ message: 'Program not found' }); return; }
  res.json(program);
});

// PUT /api/programs/:id
const updateProgramSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  goal: z.string().optional(),
});

router.put('/:id', authenticate, requireRole('TRAINER'), async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const result = updateProgramSchema.safeParse(req.body);
  if (!result.success) { res.status(400).json({ message: 'Invalid data' }); return; }
  const program = await prisma.workoutProgram.findFirst({ where: { id, creatorId: req.user!.id } });
  if (!program) { res.status(404).json({ message: 'Program not found' }); return; }
  const updated = await prisma.workoutProgram.update({ where: { id }, data: result.data });
  res.json(updated);
});

// DELETE /api/programs/:id
router.delete('/:id', authenticate, requireRole('TRAINER'), async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const program = await prisma.workoutProgram.findFirst({ where: { id, creatorId: req.user!.id } });
  if (!program) { res.status(404).json({ message: 'Program not found' }); return; }
  await prisma.workoutProgram.delete({ where: { id } });
  res.json({ message: 'Deleted' });
});

// POST /api/programs/:id/days
const addDaySchema = z.object({
  weekId: z.string(),
  name: z.string().min(1),
  dayNumber: z.number().int().min(1).max(7),
});

router.post('/:id/days', authenticate, requireRole('TRAINER'), async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const result = addDaySchema.safeParse(req.body);
  if (!result.success) { res.status(400).json({ message: 'Invalid data' }); return; }
  const week = await prisma.programWeek.findFirst({
    where: { id: result.data.weekId, program: { id, creatorId: req.user!.id } },
  });
  if (!week) { res.status(404).json({ message: 'Week not found' }); return; }
  const existing = await prisma.workoutDay.findUnique({
    where: { weekId_dayNumber: { weekId: result.data.weekId, dayNumber: result.data.dayNumber } },
  });
  if (existing) { res.status(409).json({ message: 'Day already exists' }); return; }
  const day = await prisma.workoutDay.create({
    data: { weekId: result.data.weekId, name: result.data.name, dayNumber: result.data.dayNumber },
    include: { exercises: { include: { exercise: true } } },
  });
  res.status(201).json(day);
});

// PUT /api/programs/:id/days/:dayId
router.put('/:id/days/:dayId', authenticate, requireRole('TRAINER'), async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const dayId = req.params.dayId as string;
  const { name, isRestDay } = req.body;
  const day = await prisma.workoutDay.findFirst({
    where: { id: dayId, week: { program: { id, creatorId: req.user!.id } } },
  });
  if (!day) { res.status(404).json({ message: 'Day not found' }); return; }
  const data: { name?: string; isRestDay?: boolean } = {};
  if (name !== undefined) data.name = name;
  if (isRestDay !== undefined) data.isRestDay = isRestDay;
  const updated = await prisma.workoutDay.update({ where: { id: dayId }, data });
  res.json(updated);
});

// DELETE /api/programs/:id/days/:dayId
router.delete('/:id/days/:dayId', authenticate, requireRole('TRAINER'), async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const dayId = req.params.dayId as string;
  const day = await prisma.workoutDay.findFirst({
    where: { id: dayId, week: { program: { id, creatorId: req.user!.id } } },
  });
  if (!day) { res.status(404).json({ message: 'Day not found' }); return; }
  await prisma.workoutDay.delete({ where: { id: dayId } });
  res.json({ message: 'Deleted' });
});

// POST /api/programs/:id/days/:dayId/exercises
const addExerciseSchema = z.object({
  exerciseId: z.string(),
  sets: z.number().int().min(1).default(3),
  reps: z.string().default('8-12'),
  weight: z.number().optional(),
  restSecs: z.number().int().optional(),
  notes: z.string().optional(),
});

router.post('/:id/days/:dayId/exercises', authenticate, requireRole('TRAINER'), async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const dayId = req.params.dayId as string;
  const result = addExerciseSchema.safeParse(req.body);
  if (!result.success) { res.status(400).json({ message: 'Invalid data' }); return; }
  const day = await prisma.workoutDay.findFirst({
    where: { id: dayId, week: { program: { id, creatorId: req.user!.id } } },
  });
  if (!day) { res.status(404).json({ message: 'Day not found' }); return; }
  const maxOrder = await prisma.workoutExercise.aggregate({
    where: { dayId },
    _max: { order: true },
  });
  const order = (maxOrder._max.order ?? 0) + 1;
  const workoutExercise = await prisma.workoutExercise.create({
    data: { ...result.data, dayId, order },
    include: { exercise: true },
  });
  res.status(201).json(workoutExercise);
});

// PUT /api/programs/:id/days/:dayId/exercises/:weId
const updateExerciseSchema = z.object({
  sets: z.number().int().min(1).optional(),
  reps: z.string().optional(),
  weight: z.number().nullable().optional(),
  restSecs: z.number().int().nullable().optional(),
  notes: z.string().optional(),
});

router.put('/:id/days/:dayId/exercises/:weId', authenticate, requireRole('TRAINER'), async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const dayId = req.params.dayId as string;
  const weId = req.params.weId as string;
  const result = updateExerciseSchema.safeParse(req.body);
  if (!result.success) { res.status(400).json({ message: 'Invalid data' }); return; }
  const we = await prisma.workoutExercise.findFirst({
    where: { id: weId, dayId, day: { week: { program: { id, creatorId: req.user!.id } } } },
  });
  if (!we) { res.status(404).json({ message: 'Exercise not found' }); return; }
  const updated = await prisma.workoutExercise.update({
    where: { id: weId },
    data: result.data,
    include: { exercise: true },
  });
  res.json(updated);
});

// DELETE /api/programs/:id/days/:dayId/exercises/:weId
router.delete('/:id/days/:dayId/exercises/:weId', authenticate, requireRole('TRAINER'), async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const dayId = req.params.dayId as string;
  const weId = req.params.weId as string;
  const we = await prisma.workoutExercise.findFirst({
    where: { id: weId, dayId, day: { week: { program: { id, creatorId: req.user!.id } } } },
  });
  if (!we) { res.status(404).json({ message: 'Exercise not found' }); return; }
  await prisma.workoutExercise.delete({ where: { id: weId } });
  res.json({ message: 'Deleted' });
});

export default router;
