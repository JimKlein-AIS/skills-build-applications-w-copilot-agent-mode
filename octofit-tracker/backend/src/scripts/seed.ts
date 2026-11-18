import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { Activity, Team, User, Workout } from '../models/index.js';

// Teams are keyed by name. Nothing is deleted.
async function upsertTeam(name: string, mascot: string) {
  return Team.findOneAndUpdate({ name }, { $set: { name, mascot } }, { upsert: true, new: true, setDefaultsOnInsert: true });
}

// Users are keyed by email. The user is removed from every other team so it belongs only to the seeded team.
async function upsertUser(name: string, email: string, teamId: InstanceType<typeof Team>['_id'], fitnessGoal: string) {
  const user = await User.findOneAndUpdate(
    { email },
    { $set: { name, email, team: teamId, fitnessGoal } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  await Team.updateMany({ _id: { $ne: teamId } }, { $pull: { members: user._id } });
  await Team.updateOne({ _id: teamId }, { $addToSet: { members: user._id } });
  return user;
}

// Activities are keyed by user, team, type, and occurredAt. Dates are fixed so reruns match.
async function upsertActivity(demo: {
  user: InstanceType<typeof User>['_id'];
  team: InstanceType<typeof Team>['_id'];
  type: string;
  minutes: number;
  points: number;
  occurredAt: Date;
}) {
  const { user, team, type, occurredAt, minutes, points } = demo;
  await Activity.updateOne({ user, team, type, occurredAt }, { $set: { minutes, points } }, { upsert: true });
}

// Workouts are keyed by title. Nothing is deleted.
async function upsertWorkout(title: string, focus: string, minutes: number, difficulty: string) {
  await Workout.updateOne({ title }, { $set: { focus, minutes, difficulty } }, { upsert: true });
}

export async function seed() {
  await connectDatabase();
  try {
    const octocats = await upsertTeam('Octocats', 'Mona');
    const robocats = await upsertTeam('Robocats', 'Hubot');

    const mona = await upsertUser('Mona', 'mona@example.com', octocats._id, 'endurance');
    const hubot = await upsertUser('Hubot', 'hubot@example.com', robocats._id, 'strength');
    const sparkles = await upsertUser('Sparkles', 'sparkles@example.com', robocats._id, 'mobility');

    await upsertActivity({ user: mona._id, team: octocats._id, type: 'run', minutes: 40, points: 40, occurredAt: new Date('2026-01-10T12:00:00.000Z') });
    await upsertActivity({ user: hubot._id, team: robocats._id, type: 'cycle', minutes: 25, points: 25, occurredAt: new Date('2026-01-11T12:00:00.000Z') });
    await upsertActivity({ user: sparkles._id, team: robocats._id, type: 'walk', minutes: 20, points: 20, occurredAt: new Date('2026-01-12T12:00:00.000Z') });

    await upsertWorkout('Intervals', 'endurance', 30, 'moderate');
    await upsertWorkout('Strength Circuit', 'strength', 30, 'moderate');
    await upsertWorkout('Mobility Flow', 'mobility', 20, 'easy');
  } finally {
    await disconnectDatabase();
  }
}

if (process.argv[1]?.endsWith('seed.ts')) {
  await seed();
}
