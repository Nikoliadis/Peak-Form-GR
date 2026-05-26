import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const exercises = [
  // Chest
  { name: 'Bench Press', muscleGroup: 'Στήθος', equipment: 'Barbell' },
  { name: 'Incline Bench Press', muscleGroup: 'Στήθος', equipment: 'Barbell' },
  { name: 'Decline Bench Press', muscleGroup: 'Στήθος', equipment: 'Barbell' },
  { name: 'Dumbbell Flyes', muscleGroup: 'Στήθος', equipment: 'Dumbbell' },
  { name: 'Incline Dumbbell Press', muscleGroup: 'Στήθος', equipment: 'Dumbbell' },
  { name: 'Cable Crossover', muscleGroup: 'Στήθος', equipment: 'Cable' },
  { name: 'Push-ups', muscleGroup: 'Στήθος', equipment: 'Bodyweight' },
  { name: 'Chest Dips', muscleGroup: 'Στήθος', equipment: 'Bodyweight' },
  // Back
  { name: 'Pull-ups', muscleGroup: 'Πλάτη', equipment: 'Bodyweight' },
  { name: 'Barbell Row', muscleGroup: 'Πλάτη', equipment: 'Barbell' },
  { name: 'Deadlift', muscleGroup: 'Πλάτη', equipment: 'Barbell' },
  { name: 'Lat Pulldown', muscleGroup: 'Πλάτη', equipment: 'Cable' },
  { name: 'Seated Cable Row', muscleGroup: 'Πλάτη', equipment: 'Cable' },
  { name: 'One-arm Dumbbell Row', muscleGroup: 'Πλάτη', equipment: 'Dumbbell' },
  { name: 'T-bar Row', muscleGroup: 'Πλάτη', equipment: 'Barbell' },
  { name: 'Face Pulls', muscleGroup: 'Πλάτη', equipment: 'Cable' },
  // Shoulders
  { name: 'Overhead Press', muscleGroup: 'Ώμοι', equipment: 'Barbell' },
  { name: 'Dumbbell Shoulder Press', muscleGroup: 'Ώμοι', equipment: 'Dumbbell' },
  { name: 'Arnold Press', muscleGroup: 'Ώμοι', equipment: 'Dumbbell' },
  { name: 'Lateral Raises', muscleGroup: 'Ώμοι', equipment: 'Dumbbell' },
  { name: 'Front Raises', muscleGroup: 'Ώμοι', equipment: 'Dumbbell' },
  { name: 'Rear Delt Flyes', muscleGroup: 'Ώμοι', equipment: 'Dumbbell' },
  { name: 'Cable Lateral Raises', muscleGroup: 'Ώμοι', equipment: 'Cable' },
  // Biceps
  { name: 'Barbell Curl', muscleGroup: 'Δικέφαλοι', equipment: 'Barbell' },
  { name: 'Dumbbell Curl', muscleGroup: 'Δικέφαλοι', equipment: 'Dumbbell' },
  { name: 'Hammer Curl', muscleGroup: 'Δικέφαλοι', equipment: 'Dumbbell' },
  { name: 'Preacher Curl', muscleGroup: 'Δικέφαλοι', equipment: 'Barbell' },
  { name: 'Cable Curl', muscleGroup: 'Δικέφαλοι', equipment: 'Cable' },
  { name: 'Concentration Curl', muscleGroup: 'Δικέφαλοι', equipment: 'Dumbbell' },
  // Triceps
  { name: 'Tricep Pushdown', muscleGroup: 'Τρικέφαλοι', equipment: 'Cable' },
  { name: 'Skull Crushers', muscleGroup: 'Τρικέφαλοι', equipment: 'Barbell' },
  { name: 'Close-grip Bench Press', muscleGroup: 'Τρικέφαλοι', equipment: 'Barbell' },
  { name: 'Overhead Tricep Extension', muscleGroup: 'Τρικέφαλοι', equipment: 'Dumbbell' },
  { name: 'Tricep Dips', muscleGroup: 'Τρικέφαλοι', equipment: 'Bodyweight' },
  { name: 'Rope Pushdown', muscleGroup: 'Τρικέφαλοι', equipment: 'Cable' },
  // Legs
  { name: 'Squat', muscleGroup: 'Πόδια', equipment: 'Barbell' },
  { name: 'Romanian Deadlift', muscleGroup: 'Πόδια', equipment: 'Barbell' },
  { name: 'Leg Press', muscleGroup: 'Πόδια', equipment: 'Machine' },
  { name: 'Leg Curl', muscleGroup: 'Πόδια', equipment: 'Machine' },
  { name: 'Leg Extension', muscleGroup: 'Πόδια', equipment: 'Machine' },
  { name: 'Walking Lunges', muscleGroup: 'Πόδια', equipment: 'Dumbbell' },
  { name: 'Bulgarian Split Squat', muscleGroup: 'Πόδια', equipment: 'Dumbbell' },
  { name: 'Calf Raises', muscleGroup: 'Πόδια', equipment: 'Machine' },
  { name: 'Hack Squat', muscleGroup: 'Πόδια', equipment: 'Machine' },
  { name: 'Glute Bridge', muscleGroup: 'Πόδια', equipment: 'Barbell' },
  // Core
  { name: 'Plank', muscleGroup: 'Κοιλιακοί', equipment: 'Bodyweight' },
  { name: 'Crunches', muscleGroup: 'Κοιλιακοί', equipment: 'Bodyweight' },
  { name: 'Russian Twist', muscleGroup: 'Κοιλιακοί', equipment: 'Bodyweight' },
  { name: 'Hanging Leg Raise', muscleGroup: 'Κοιλιακοί', equipment: 'Bodyweight' },
  { name: 'Cable Crunch', muscleGroup: 'Κοιλιακοί', equipment: 'Cable' },
  { name: 'Ab Rollout', muscleGroup: 'Κοιλιακοί', equipment: 'Other' },
  { name: 'Mountain Climbers', muscleGroup: 'Κοιλιακοί', equipment: 'Bodyweight' },
];

async function main() {
  const existing = await prisma.exercise.count({ where: { isCustom: false } });
  if (existing > 0) {
    console.log(`Exercises already seeded (${existing} found). Skipping.`);
    return;
  }
  await prisma.exercise.createMany({ data: exercises.map(e => ({ ...e, isCustom: false })) });
  console.log(`Seeded ${exercises.length} exercises.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
