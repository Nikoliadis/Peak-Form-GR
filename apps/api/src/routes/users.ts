import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

// GET /api/users/trainer/athletes
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
    orderBy: { createdAt: 'desc' },
  });

  const athletes = await Promise.all(relations.map(async (r) => {
    const activeAssignment = await prisma.workoutAssignment.findFirst({
      where: { athleteId: r.athlete.id, isActive: true },
      include: { program: { select: { id: true, name: true, goal: true, durationWeeks: true } } },
    });
    const workoutCount = await prisma.workoutLog.count({
      where: { athleteId: r.athlete.id, completed: true },
    });
    return { ...r.athlete, activeAssignment, workoutCount, linkedSince: r.createdAt };
  }));

  res.json(athletes);
});

// GET /api/users/trainer/athletes/:athleteId
router.get('/trainer/athletes/:athleteId', authenticate, requireRole('TRAINER'), async (req: AuthRequest, res: Response) => {
  const athleteId = req.params.athleteId as string;
  const relation = await prisma.trainerAthlete.findUnique({
    where: { trainerId_athleteId: { trainerId: req.user!.id, athleteId } },
  });
  if (!relation || relation.status !== 'active') {
    res.status(404).json({ message: 'Athlete not found' });
    return;
  }
  const athlete = await prisma.user.findUnique({
    where: { id: athleteId },
    select: { id: true, email: true, firstName: true, lastName: true, avatar: true, bio: true, phone: true, createdAt: true },
  });
  const activeAssignment = await prisma.workoutAssignment.findFirst({
    where: { athleteId, isActive: true },
    include: { program: true },
  });
  const allAssignments = await prisma.workoutAssignment.findMany({
    where: { athleteId },
    include: { program: { select: { id: true, name: true, goal: true } } },
    orderBy: { createdAt: 'desc' },
  });
  const workoutCount = await prisma.workoutLog.count({ where: { athleteId, completed: true } });
  res.json({ ...athlete, activeAssignment, allAssignments, workoutCount, linkedSince: relation.createdAt });
});

// POST /api/users/trainer/invite
const inviteSchema = z.object({ athleteEmail: z.string().email() });

router.post('/trainer/invite', authenticate, requireRole('TRAINER'), async (req: AuthRequest, res: Response) => {
  const result = inviteSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ message: 'Invalid email' });
    return;
  }
  const athlete = await prisma.user.findUnique({ where: { email: result.data.athleteEmail } });
  if (!athlete || athlete.role !== 'ATHLETE') {
    res.status(404).json({ message: 'Δεν βρέθηκε athlete με αυτό το email' });
    return;
  }
  const existing = await prisma.trainerAthlete.findUnique({
    where: { trainerId_athleteId: { trainerId: req.user!.id, athleteId: athlete.id } },
  });
  if (existing) {
    res.status(409).json({ message: 'Ο athlete είναι ήδη στη λίστα σου' });
    return;
  }
  await prisma.trainerAthlete.create({ data: { trainerId: req.user!.id, athleteId: athlete.id } });
  res.status(201).json({ id: athlete.id, email: athlete.email, firstName: athlete.firstName, lastName: athlete.lastName });
});

// DELETE /api/users/trainer/athletes/:athleteId
router.delete('/trainer/athletes/:athleteId', authenticate, requireRole('TRAINER'), async (req: AuthRequest, res: Response) => {
  const athleteId = req.params.athleteId as string;
  const relation = await prisma.trainerAthlete.findUnique({
    where: { trainerId_athleteId: { trainerId: req.user!.id, athleteId } },
  });
  if (!relation) {
    res.status(404).json({ message: 'Athlete not found' });
    return;
  }
  await prisma.trainerAthlete.update({
    where: { trainerId_athleteId: { trainerId: req.user!.id, athleteId } },
    data: { status: 'ended' },
  });
  res.json({ message: 'Removed' });
});

// POST /api/users/trainer/athletes/:athleteId/assign
const assignSchema = z.object({
  programId: z.string(),
  startDate: z.string().default(() => new Date().toISOString()),
});

router.post('/trainer/athletes/:athleteId/assign', authenticate, requireRole('TRAINER'), async (req: AuthRequest, res: Response) => {
  const athleteId = req.params.athleteId as string;
  const result = assignSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ message: 'Invalid data' });
    return;
  }
  const relation = await prisma.trainerAthlete.findUnique({
    where: { trainerId_athleteId: { trainerId: req.user!.id, athleteId } },
  });
  if (!relation || relation.status !== 'active') {
    res.status(404).json({ message: 'Athlete not found' });
    return;
  }
  const program = await prisma.workoutProgram.findFirst({
    where: { id: result.data.programId, creatorId: req.user!.id },
  });
  if (!program) {
    res.status(404).json({ message: 'Program not found' });
    return;
  }
  // Deactivate existing assignments
  await prisma.workoutAssignment.updateMany({
    where: { athleteId, isActive: true },
    data: { isActive: false, endDate: new Date() },
  });
  const assignment = await prisma.workoutAssignment.create({
    data: { athleteId, programId: result.data.programId, startDate: new Date(result.data.startDate), isActive: true },
    include: { program: { select: { id: true, name: true, goal: true, durationWeeks: true } } },
  });
  res.status(201).json(assignment);
});

// DELETE /api/users/trainer/athletes/:athleteId/assign
router.delete('/trainer/athletes/:athleteId/assign', authenticate, requireRole('TRAINER'), async (req: AuthRequest, res: Response) => {
  const athleteId = req.params.athleteId as string;
  await prisma.workoutAssignment.updateMany({
    where: { athleteId, isActive: true },
    data: { isActive: false, endDate: new Date() },
  });
  res.json({ message: 'Unassigned' });
});

// GET /api/users/athlete/trainer
router.get('/athlete/trainer', authenticate, requireRole('ATHLETE'), async (req: AuthRequest, res: Response) => {
  const relation = await prisma.trainerAthlete.findFirst({
    where: { athleteId: req.user!.id, status: 'active' },
    include: {
      trainer: {
        select: { id: true, email: true, firstName: true, lastName: true, avatar: true, bio: true },
      },
    },
  });
  res.json(relation?.trainer ?? null);
});

export default router;
