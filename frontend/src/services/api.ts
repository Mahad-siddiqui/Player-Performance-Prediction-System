import { User, Player } from '../data/mockData';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const payload = await response.json();
      if (payload?.detail) message = payload.detail;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function loginByEmail(email: string): Promise<User> {
  return request<User>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function fetchUsers(): Promise<User[]> {
  return request<User[]>('/api/auth/users');
}

export function fetchAdminOverview(): Promise<{
  players: number;
  matches: number;
  wellness_records: number;
  predictions: number;
  avg_predicted_rating: number;
  high_injury_risk_count: number;
}> {
  return request('/api/reports/admin/overview');
}

export async function uploadCsvFile(file: File): Promise<{ inserted: number; dataset: string; errors?: string[] }> {
  const lowerName = file.name.toLowerCase();
  let endpoint = '';

  if (lowerName.includes('player')) endpoint = '/api/ingestion/csv/players';
  else if (lowerName.includes('match')) endpoint = '/api/ingestion/csv/match-records';
  else if (lowerName.includes('wellness')) endpoint = '/api/ingestion/csv/wellness-records';
  else throw new Error('Filename must include player, match, or wellness.');

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let message = `Upload failed (${response.status})`;
    try {
      const payload = await response.json();
      if (payload?.detail) message = payload.detail;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return response.json();
}

export function trainModels(): Promise<{ trained_rows: number; features: string[]; models_saved: string[] }> {
  return request('/api/predictions/train', { method: 'POST' });
}

export function fetchManagerPlayers(): Promise<Player[]> {
  return request<Player[]>('/api/reports/manager/players');
}

export function fetchFanDashboard(): Promise<{
  comparisonPlayers: Player[];
  goalContributions: Array<{ player: string; predicted: number; actual: number; assists: number }>;
  teamForm: Array<{ week: string; rating: number; opponent: string }>;
}> {
  return request('/api/reports/fan/dashboard');
}
