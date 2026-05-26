export type Role = 'TRAINER' | 'ATHLETE';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  dualRole?: boolean;
  avatar?: string;
  bio?: string;
  phone?: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface AthleteProfile extends User {
  activeAssignment?: {
    id: string;
    startDate: string;
    program: { id: string; name: string; goal?: string | null; durationWeeks: number };
  } | null;
  workoutCount: number;
  linkedSince: string;
}

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  muscleGroup?: string;
  equipment?: string;
  isCustom: boolean;
  createdById?: string;
}

export interface WorkoutExercise {
  id: string;
  order: number;
  sets: number;
  reps: string;
  weight?: number | null;
  restSecs?: number | null;
  notes?: string | null;
  exerciseId: string;
  exercise: Exercise;
  dayId: string;
}

export interface WorkoutDay {
  id: string;
  dayNumber: number;
  name?: string | null;
  isRestDay: boolean;
  weekId: string;
  exercises: WorkoutExercise[];
}

export interface ProgramWeek {
  id: string;
  weekNumber: number;
  programId: string;
  days: WorkoutDay[];
}

export interface SetLog {
  id: string;
  logId: string;
  exerciseId: string;
  setNumber: number;
  reps: number;
  weight?: number | null;
  notes?: string | null;
}

export interface WorkoutLog {
  id: string;
  athleteId: string;
  assignmentId: string;
  dayId: string;
  date: string;
  completed: boolean;
  notes?: string | null;
  setLogs: SetLog[];
}

export interface WorkoutProgram {
  id: string;
  name: string;
  description?: string | null;
  goal?: string | null;
  durationWeeks: number;
  creatorId: string;
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
  weeks: ProgramWeek[];
}
