import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

const DAY_MS = 24 * 60 * 60 * 1000;

function getTodayDayNumber() {
  const d = new Date().getDay(); // 0=Sun
  return d === 0 ? 7 : d; // Mon=1 ... Sun=7
}

function getCurrentProgramWeek(startDate: Date): number {
  const daysSince = Math.floor((Date.now() - startDate.getTime()) / DAY_MS);
  return Math.min(Math.floor(daysSince / 7) + 1, 999);
}

const workoutDayInclude = {
  exercises: {
    orderBy: { order: 'asc' as const },
    include: { exercise: true },
  },
};

// GET /api/athlete/program — active assignment + full program
router.get('/program', authenticate, requireRole('ATHLETE'), async (req: AuthRequest, res: Response) => {
  const assignment = await prisma.workoutAssignment.findFirst({
    where: { athleteId: req.user!.id, isActive: true },
    include: {
      program: {
        include: {
          weeks: {
            orderBy: { weekNumber: 'asc' },
            include: {
              days: {
                orderBy: { dayNumber: 'asc' },
                include: workoutDayInclude,
              },
            },
          },
        },
      },
    },
  });
  if (!assignment) { res.json(null); return; }
  const currentWeek = getCurrentProgramWeek(assignment.startDate);
  res.json({ assignment, currentWeek });
});

// GET /api/athlete/today — today's workout day
router.get('/today', authenticate, requireRole('ATHLETE'), async (req: AuthRequest, res: Response) => {
  const assignment = await prisma.workoutAssignment.findFirst({
    where: { athleteId: req.user!.id, isActive: true },
    include: { program: { select: { id: true, name: true, durationWeeks: true } } },
  });
  if (!assignment) { res.json(null); return; }

  const currentWeek = getCurrentProgramWeek(assignment.startDate);
  const todayDay = getTodayDayNumber();

  if (currentWeek > assignment.program.durationWeeks) {
    res.json({ finished: true, program: assignment.program });
    return;
  }

  const week = await prisma.programWeek.findUnique({
    where: { programId_weekNumber: { programId: assignment.programId, weekNumber: currentWeek } },
    include: {
      days: {
        orderBy: { dayNumber: 'asc' },
        include: workoutDayInclude,
      },
    },
  });

  const day = week?.days.find(d => d.dayNumber === todayDay) ?? null;

  // Check if already logged today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + DAY_MS);

  let todayLog = null;
  if (day) {
    todayLog = await prisma.workoutLog.findFirst({
      where: {
        athleteId: req.user!.id,
        dayId: day.id,
        date: { gte: today, lt: tomorrow },
      },
      include: { setLogs: true },
    });
  }

  res.json({ assignment, currentWeek, week, day, todayLog });
});

// POST /api/athlete/logs — start workout log
const startLogSchema = z.object({
  dayId: z.string(),
  assignmentId: z.string(),
});

router.post('/logs', authenticate, requireRole('ATHLETE'), async (req: AuthRequest, res: Response) => {
  const result = startLogSchema.safeParse(req.body);
  if (!result.success) { res.status(400).json({ message: 'Invalid data' }); return; }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + DAY_MS);

  const existing = await prisma.workoutLog.findFirst({
    where: { athleteId: req.user!.id, dayId: result.data.dayId, date: { gte: today, lt: tomorrow } },
    include: { setLogs: true },
  });
  if (existing) { res.json(existing); return; }

  const log = await prisma.workoutLog.create({
    data: {
      athleteId: req.user!.id,
      assignmentId: result.data.assignmentId,
      dayId: result.data.dayId,
      date: new Date(),
    },
    include: { setLogs: true },
  });
  res.status(201).json(log);
});

// PUT /api/athlete/logs/:logId/complete
router.put('/logs/:logId/complete', authenticate, requireRole('ATHLETE'), async (req: AuthRequest, res: Response) => {
  const logId = req.params.logId as string;
  const log = await prisma.workoutLog.findFirst({ where: { id: logId, athleteId: req.user!.id } });
  if (!log) { res.status(404).json({ message: 'Log not found' }); return; }
  const updated = await prisma.workoutLog.update({
    where: { id: logId },
    data: { completed: true, notes: req.body.notes },
  });
  res.json(updated);
});

// POST /api/athlete/logs/:logId/sets — upsert a set
const setLogSchema = z.object({
  exerciseId: z.string(),
  setNumber: z.number().int().min(1),
  reps: z.number().int().min(0),
  weight: z.number().nullable().optional(),
  notes: z.string().optional(),
});

router.post('/logs/:logId/sets', authenticate, requireRole('ATHLETE'), async (req: AuthRequest, res: Response) => {
  const logId = req.params.logId as string;
  const result = setLogSchema.safeParse(req.body);
  if (!result.success) { res.status(400).json({ message: 'Invalid data' }); return; }

  const log = await prisma.workoutLog.findFirst({ where: { id: logId, athleteId: req.user!.id } });
  if (!log) { res.status(404).json({ message: 'Log not found' }); return; }

  const existing = await prisma.setLog.findFirst({
    where: { logId, exerciseId: result.data.exerciseId, setNumber: result.data.setNumber },
  });

  let setLog;
  if (existing) {
    setLog = await prisma.setLog.update({ where: { id: existing.id }, data: result.data });
  } else {
    setLog = await prisma.setLog.create({ data: { ...result.data, logId } });
  }
  res.json(setLog);
});

// GET /api/athlete/history — completed workout logs
router.get('/history', authenticate, requireRole('ATHLETE'), async (req: AuthRequest, res: Response) => {
  const logs = await prisma.workoutLog.findMany({
    where: { athleteId: req.user!.id, completed: true },
    include: {
      setLogs: true,
      assignment: { include: { program: { select: { name: true } } } },
    },
    orderBy: { date: 'desc' },
    take: 30,
  });
  res.json(logs);
});

// GET /api/athlete/stats
router.get('/stats', authenticate, requireRole('ATHLETE'), async (req: AuthRequest, res: Response) => {
  const athleteId = req.user!.id;
  const totalCompleted = await prisma.workoutLog.count({ where: { athleteId, completed: true } });

  // Streak: count consecutive days with completed workouts
  const recentLogs = await prisma.workoutLog.findMany({
    where: { athleteId, completed: true },
    orderBy: { date: 'desc' },
    select: { date: true },
  });

  let streak = 0;
  if (recentLogs.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const logDays = new Set(recentLogs.map(l => {
      const d = new Date(l.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }));

    let check = today.getTime();
    while (logDays.has(check)) {
      streak++;
      check -= DAY_MS;
    }
    if (streak === 0) {
      check = today.getTime() - DAY_MS;
      while (logDays.has(check)) {
        streak++;
        check -= DAY_MS;
      }
    }
  }

  res.json({ totalCompleted, streak });
});

export default router;
