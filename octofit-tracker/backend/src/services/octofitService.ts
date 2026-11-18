import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

const objectIdPattern = /^[a-f\d]{24}$/i;

export async function createActivity(input: Record<string, unknown> | undefined) {
  const { userId, teamId, type, minutes } = input ?? {};
  if (!userId || !teamId || typeof type !== 'string' || typeof minutes !== 'number') {
    throw Object.assign(new Error('userId, teamId, type, and minutes are required'), { status: 400 });
  }
  if (typeof userId !== 'string' || typeof teamId !== 'string' || !objectIdPattern.test(userId) || !objectIdPattern.test(teamId)) {
    throw Object.assign(new Error('userId and teamId must be valid ids'), { status: 400 });
  }
  const [userExists, teamExists] = await Promise.all([User.exists({ _id: userId }), Team.exists({ _id: teamId })]);
  if (!userExists || !teamExists) {
    throw Object.assign(new Error('User or team not found'), { status: 404 });
  }
  return Activity.create({ user: userId, team: teamId, type, minutes, points: minutes, occurredAt: new Date() });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: Record<string, unknown> | undefined) {
  const { name, mascot, members = [] } = input ?? {};
  if (typeof name !== 'string' || !name.trim() || typeof mascot !== 'string' || !mascot.trim()) {
    throw Object.assign(new Error('name and mascot are required'), { status: 400 });
  }
  if (!Array.isArray(members) || !members.every((id) => typeof id === 'string' && objectIdPattern.test(id))) {
    throw Object.assign(new Error('members must be valid ids'), { status: 400 });
  }
  return Team.create({ name, mascot, members });
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1 } },
    { $lookup: { from: Team.collection.name, localField: '_id', foreignField: '_id', as: 'team' } },
    { $unwind: '$team' },
    { $project: { _id: 0, teamId: '$_id', teamName: '$team.name', totalPoints: 1 } },
  ]);
  return totals.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

const activityFocus: Record<string, string> = {
  run: 'endurance',
  cycle: 'endurance',
  walk: 'endurance',
  strength: 'strength',
  yoga: 'mobility',
  stretch: 'mobility',
};

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }
  const [topType] = await Activity.aggregate([
    { $match: { user: user._id } },
    { $group: { _id: '$type', minutes: { $sum: '$minutes' } } },
    { $sort: { minutes: -1 } },
    { $limit: 1 },
  ]);
  const focus = (topType && activityFocus[topType._id]) ?? user.fitnessGoal;
  const reason = topType ? `Matches your ${topType._id} activity` : `Matches your ${user.fitnessGoal} goal`;
  const workouts = await Workout.find({ focus }).sort({ minutes: 1 }).limit(3).lean();
  return workouts.map((workout) => ({ ...workout, reason }));
}

export { User };
