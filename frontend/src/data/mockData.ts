export type Role = 'admin' | 'manager' | 'fan';

export interface User {
  id: string;
  name: string;
  role: Role;
  team?: string;
  avatar: string;
  email: string;
}

export interface Player {
  id: string;
  name: string;
  position: string;
  number: number;
  age: number;
  nationality: string;
  photo: string;
  health: 'Fit' | 'Doubtful' | 'Injured';
  fitnessScore: number;
  fatigueLevel: number;
  heartRate: number;
  predictedRating: number;
  goals: number;
  assists: number;
  passAccuracy: number;
  tackles: number;
  distanceCovered: number;
  speed: number;
  dribbles: number;
  shots: number;
  injuryRisk: 'Low' | 'Medium' | 'High';
  lastMatchRating: number;
  weeklyTrainingLoad: number;
  sleepQuality: number;
  hydration: number;
  muscleSoreness: number;
}

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  venue: string;
  competition: string;
  predictedScore: string;
  winProbability: number;
  drawProbability: number;
  lossProbability: number;
  status: 'upcoming' | 'live' | 'completed';
  homeScore?: number;
  awayScore?: number;
}

export const MOCK_USERS: User[] = [
  { id: '1', name: 'Alex Morgan', role: 'admin', avatar: 'AM', email: 'admin@soccerml.io' },
  { id: '2', name: 'Marcus Silva', role: 'manager', team: 'FC United', avatar: 'MS', email: 'manager@soccerml.io' },
  { id: '3', name: 'Jordan Lee', role: 'fan', avatar: 'JL', email: 'fan@soccerml.io' },
];

export const MOCK_PLAYERS: Player[] = [
  {
    id: 'p1', name: 'Lucas Hernandez', position: 'GK', number: 1, age: 28,
    nationality: 'Spain', photo: 'LH', health: 'Fit', fitnessScore: 94,
    fatigueLevel: 18, heartRate: 62, predictedRating: 8.2, goals: 0, assists: 1,
    passAccuracy: 87, tackles: 12, distanceCovered: 5.2, speed: 72, dribbles: 2,
    shots: 0, injuryRisk: 'Low', lastMatchRating: 8.0, weeklyTrainingLoad: 65,
    sleepQuality: 88, hydration: 92, muscleSoreness: 15,
  },
  {
    id: 'p2', name: 'Andre Santos', position: 'CB', number: 4, age: 26,
    nationality: 'Brazil', photo: 'AS', health: 'Fit', fitnessScore: 89,
    fatigueLevel: 32, heartRate: 68, predictedRating: 7.8, goals: 2, assists: 0,
    passAccuracy: 91, tackles: 48, distanceCovered: 9.8, speed: 78, dribbles: 8,
    shots: 4, injuryRisk: 'Low', lastMatchRating: 7.5, weeklyTrainingLoad: 78,
    sleepQuality: 82, hydration: 88, muscleSoreness: 28,
  },
  {
    id: 'p3', name: 'Marco Rossi', position: 'CB', number: 5, age: 30,
    nationality: 'Italy', photo: 'MR', health: 'Doubtful', fitnessScore: 71,
    fatigueLevel: 58, heartRate: 78, predictedRating: 6.4, goals: 1, assists: 0,
    passAccuracy: 88, tackles: 39, distanceCovered: 8.9, speed: 70, dribbles: 5,
    shots: 2, injuryRisk: 'High', lastMatchRating: 6.8, weeklyTrainingLoad: 92,
    sleepQuality: 70, hydration: 75, muscleSoreness: 62,
  },
  {
    id: 'p4', name: 'Kai Müller', position: 'LB', number: 3, age: 24,
    nationality: 'Germany', photo: 'KM', health: 'Fit', fitnessScore: 92,
    fatigueLevel: 22, heartRate: 65, predictedRating: 7.9, goals: 1, assists: 5,
    passAccuracy: 89, tackles: 52, distanceCovered: 11.2, speed: 85, dribbles: 18,
    shots: 3, injuryRisk: 'Low', lastMatchRating: 8.1, weeklyTrainingLoad: 72,
    sleepQuality: 90, hydration: 95, muscleSoreness: 20,
  },
  {
    id: 'p5', name: 'James Wilson', position: 'RB', number: 2, age: 25,
    nationality: 'England', photo: 'JW', health: 'Injured', fitnessScore: 45,
    fatigueLevel: 80, heartRate: 85, predictedRating: 5.0, goals: 0, assists: 2,
    passAccuracy: 82, tackles: 28, distanceCovered: 7.1, speed: 80, dribbles: 12,
    shots: 1, injuryRisk: 'High', lastMatchRating: 5.5, weeklyTrainingLoad: 30,
    sleepQuality: 65, hydration: 70, muscleSoreness: 85,
  },
  {
    id: 'p6', name: 'Diego Reyes', position: 'CM', number: 8, age: 27,
    nationality: 'Mexico', photo: 'DR', health: 'Fit', fitnessScore: 96,
    fatigueLevel: 15, heartRate: 60, predictedRating: 8.7, goals: 5, assists: 8,
    passAccuracy: 94, tackles: 41, distanceCovered: 12.3, speed: 82, dribbles: 35,
    shots: 14, injuryRisk: 'Low', lastMatchRating: 9.0, weeklyTrainingLoad: 68,
    sleepQuality: 92, hydration: 94, muscleSoreness: 12,
  },
  {
    id: 'p7', name: 'Yusuf Diallo', position: 'CM', number: 6, age: 23,
    nationality: 'Senegal', photo: 'YD', health: 'Fit', fitnessScore: 88,
    fatigueLevel: 30, heartRate: 67, predictedRating: 7.6, goals: 3, assists: 6,
    passAccuracy: 90, tackles: 58, distanceCovered: 13.1, speed: 84, dribbles: 22,
    shots: 8, injuryRisk: 'Low', lastMatchRating: 7.8, weeklyTrainingLoad: 80,
    sleepQuality: 85, hydration: 89, muscleSoreness: 25,
  },
  {
    id: 'p8', name: 'Takeshi Yamamoto', position: 'CAM', number: 10, age: 26,
    nationality: 'Japan', photo: 'TY', health: 'Doubtful', fitnessScore: 76,
    fatigueLevel: 48, heartRate: 72, predictedRating: 7.0, goals: 7, assists: 11,
    passAccuracy: 86, tackles: 18, distanceCovered: 10.5, speed: 79, dribbles: 45,
    shots: 22, injuryRisk: 'Medium', lastMatchRating: 7.3, weeklyTrainingLoad: 85,
    sleepQuality: 78, hydration: 82, muscleSoreness: 44,
  },
  {
    id: 'p9', name: 'Rafa Torres', position: 'LW', number: 11, age: 22,
    nationality: 'Argentina', photo: 'RT', health: 'Fit', fitnessScore: 91,
    fatigueLevel: 25, heartRate: 64, predictedRating: 8.4, goals: 12, assists: 7,
    passAccuracy: 85, tackles: 15, distanceCovered: 11.8, speed: 91, dribbles: 62,
    shots: 38, injuryRisk: 'Low', lastMatchRating: 8.6, weeklyTrainingLoad: 74,
    sleepQuality: 91, hydration: 93, muscleSoreness: 18,
  },
  {
    id: 'p10', name: 'Omar Hassan', position: 'RW', number: 7, age: 25,
    nationality: 'Egypt', photo: 'OH', health: 'Fit', fitnessScore: 93,
    fatigueLevel: 20, heartRate: 63, predictedRating: 8.5, goals: 10, assists: 9,
    passAccuracy: 83, tackles: 20, distanceCovered: 11.5, speed: 89, dribbles: 55,
    shots: 35, injuryRisk: 'Low', lastMatchRating: 8.8, weeklyTrainingLoad: 70,
    sleepQuality: 94, hydration: 96, muscleSoreness: 16,
  },
  {
    id: 'p11', name: 'Viktor Petrov', position: 'ST', number: 9, age: 29,
    nationality: 'Russia', photo: 'VP', health: 'Fit', fitnessScore: 90,
    fatigueLevel: 28, heartRate: 66, predictedRating: 8.9, goals: 18, assists: 4,
    passAccuracy: 75, tackles: 8, distanceCovered: 9.2, speed: 86, dribbles: 28,
    shots: 58, injuryRisk: 'Low', lastMatchRating: 9.2, weeklyTrainingLoad: 75,
    sleepQuality: 89, hydration: 91, muscleSoreness: 22,
  },
];

export const FATIGUE_DISTANCE_DATA = [
  { match: 'Match 1', fatigue: 22, hr: 148, distance: 10.2, opponent: 'City FC' },
  { match: 'Match 2', fatigue: 35, hr: 155, distance: 11.8, opponent: 'United SC' },
  { match: 'Match 3', fatigue: 28, hr: 151, distance: 9.5, opponent: 'Rovers FC' },
  { match: 'Match 4', fatigue: 45, hr: 162, distance: 12.4, opponent: 'Athletic CF' },
  { match: 'Match 5', fatigue: 38, hr: 158, distance: 11.1, opponent: 'Valley FC' },
];

export const GOAL_CONTRIBUTIONS_DATA = [
  { player: 'Viktor P.', predicted: 1.8, actual: 2, assists: 0.5 },
  { player: 'Rafa T.', predicted: 1.4, actual: 1, assists: 1.2 },
  { player: 'Omar H.', predicted: 1.2, actual: 1, assists: 0.8 },
  { player: 'Takeshi Y.', predicted: 0.9, actual: 0, assists: 1.5 },
  { player: 'Diego R.', predicted: 0.7, actual: 1, assists: 0.9 },
];

export const TEAM_FORM_DATA = [
  { week: 'GW28', rating: 71, opponent: 'City FC' },
  { week: 'GW29', rating: 78, opponent: 'United SC' },
  { week: 'GW30', rating: 65, opponent: 'Rovers FC' },
  { week: 'GW31', rating: 84, opponent: 'Athletic CF' },
  { week: 'GW32', rating: 80, opponent: 'Valley FC' },
  { week: 'GW33 (pred)', rating: 82, opponent: 'Dynamo FC' },
];

export const API_SYNC_STATUS = [
  { name: 'Opta Sports Feed', status: 'synced', lastSync: '2 min ago', records: 1247 },
  { name: 'FIFA Stats API', status: 'synced', lastSync: '5 min ago', records: 890 },
  { name: 'Wellness IoT Gateway', status: 'syncing', lastSync: '30 sec ago', records: 3421 },
  { name: 'GPS Tracker API', status: 'error', lastSync: '14 min ago', records: 0 },
  { name: 'Weather Data API', status: 'synced', lastSync: '1 min ago', records: 48 },
];

export const DB_METRICS = {
  players: 342,
  matches: 1856,
  wellnessRecords: 28743,
  predictions: 9124,
  accuracy: 78.4,
  uptime: 99.7,
};

export const UPCOMING_MATCH: Match = {
  id: 'm1',
  homeTeam: 'FC United',
  awayTeam: 'Dynamo FC',
  date: '2026-04-22',
  time: '20:45',
  venue: 'United Arena',
  competition: 'Premier League',
  predictedScore: '2 - 1',
  winProbability: 58,
  drawProbability: 22,
  lossProbability: 20,
  status: 'upcoming',
};

export const PLAYER_RADAR_DATA = (playerId: string) => {
  const player = MOCK_PLAYERS.find(p => p.id === playerId);
  if (!player) return [];
  return [
    { stat: 'Speed', value: player.speed, league: 75 },
    { stat: 'Passing', value: player.passAccuracy, league: 82 },
    { stat: 'Fitness', value: player.fitnessScore, league: 78 },
    { stat: 'Stamina', value: 100 - player.fatigueLevel, league: 70 },
    { stat: 'Dribble', value: Math.min(player.dribbles * 1.5, 100), league: 60 },
    { stat: 'Tackles', value: Math.min(player.tackles, 100), league: 50 },
  ];
};

export const COMPARISON_PLAYERS = MOCK_PLAYERS.filter(p => p.health === 'Fit');

export function getCountdown(dateStr: string, timeStr: string): string {
  const target = new Date(`${dateStr}T${timeStr}:00`);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return 'LIVE';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${days}d ${hours}h ${mins}m`;
}
