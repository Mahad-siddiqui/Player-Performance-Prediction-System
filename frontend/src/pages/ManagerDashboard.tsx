import { useState, useMemo, useEffect } from 'react';
import {
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, CartesianGrid, XAxis, YAxis,
  Tooltip, Legend,
} from 'recharts';
import {
  Users, AlertTriangle, Star, TrendingUp, Heart, Activity,
  ChevronUp, ChevronDown, ChevronsUpDown, Calendar, Filter,
  Award, Zap, BarChart2,
} from 'lucide-react';
import BentoCard from '../components/BentoCard';
import GlassModal from '../components/GlassModal';
import StatBadge from '../components/StatBadge';
import { MOCK_PLAYERS, FATIGUE_DISTANCE_DATA, PLAYER_RADAR_DATA, Player } from '../data/mockData';
import { fetchManagerPlayers } from '../services/api';

const TEAMS = ['FC United', 'City FC', 'Rovers FC'];
const DATES = ['Apr 22, 2026', 'Apr 29, 2026', 'May 6, 2026'];

type SortKey = 'name' | 'position' | 'fitnessScore' | 'predictedRating' | 'health' | 'injuryRisk';
type SortDir = 'asc' | 'desc';

const healthColor: Record<string, string> = {
  Fit: 'success',
  Doubtful: 'warning',
  Injured: 'danger',
};

const riskColor: Record<string, string> = {
  Low: 'success',
  Medium: 'warning',
  High: 'danger',
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-700/95 border border-white/10 rounded-xl p-3 shadow-xl backdrop-blur-xl">
      <p className="text-xs text-gray-400 mb-2 font-semibold">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-400">{p.name}:</span>
          <span className="text-white font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const RadarTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }> }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-700/95 border border-white/10 rounded-xl p-3 shadow-xl backdrop-blur-xl">
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-400">{p.name}:</span>
          <span className="text-white font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

function PlayerModal({ player, onClose }: { player: Player; onClose: () => void }) {
  const radar = PLAYER_RADAR_DATA(player.id);
  return (
    <GlassModal isOpen onClose={onClose} title={`${player.name} — Player Report`} size="xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="space-y-4">
          <div className="flex flex-col items-center p-6 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-neon-green/20 to-neon-cyan/20 border-2 border-neon-green/30 flex items-center justify-center text-2xl font-black text-neon-green mb-3">
              {player.number}
            </div>
            <h3 className="text-lg font-bold text-white">{player.name}</h3>
            <p className="text-gray-400 text-sm">{player.position} · {player.nationality}</p>
            <p className="text-gray-600 text-xs mt-1">Age {player.age}</p>
            <div className="mt-3 flex gap-2">
              <StatBadge label={player.health} variant={healthColor[player.health] as 'success' | 'warning' | 'danger'} />
              <StatBadge label={`${player.injuryRisk} Risk`} variant={riskColor[player.injuryRisk] as 'success' | 'warning' | 'danger'} />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] space-y-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Wellness Metrics</div>
            {[
              { label: 'Fitness', value: player.fitnessScore, max: 100, color: 'bg-neon-green' },
              { label: 'Fatigue', value: player.fatigueLevel, max: 100, color: 'bg-neon-red', inverted: true },
              { label: 'Sleep Quality', value: player.sleepQuality, max: 100, color: 'bg-neon-cyan' },
              { label: 'Hydration', value: player.hydration, max: 100, color: 'bg-neon-cyan' },
            ].map(({ label, value, color, inverted }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">{label}</span>
                  <span className={inverted && value > 50 ? 'text-neon-red' : 'text-gray-300'}>
                    {value}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5">
                  <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Season Stats</div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Goals', value: player.goals, color: 'text-neon-green' },
                { label: 'Assists', value: player.assists, color: 'text-neon-cyan' },
                { label: 'Pass %', value: `${player.passAccuracy}%`, color: 'text-neon-green' },
                { label: 'Tackles', value: player.tackles, color: 'text-neon-orange' },
                { label: 'Dribbles', value: player.dribbles, color: 'text-neon-cyan' },
                { label: 'Shots', value: player.shots, color: 'text-neon-red' },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center p-2 rounded-lg bg-white/[0.03]">
                  <div className={`text-2xl font-black ${color}`}>{value}</div>
                  <div className="text-gray-600 text-[10px] mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Physical</div>
            <div className="space-y-2">
              {[
                { label: 'Heart Rate', value: `${player.heartRate} bpm`, icon: Heart },
                { label: 'Distance/Match', value: `${player.distanceCovered} km`, icon: Activity },
                { label: 'Max Speed', value: `${player.speed} km/h`, icon: Zap },
                { label: 'Training Load', value: `${player.weeklyTrainingLoad}%`, icon: TrendingUp },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Icon size={12} className="text-neon-cyan" />
                    {label}
                  </div>
                  <span className="text-white font-semibold font-mono text-xs">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] h-full">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Predicted Stats Radar</div>
              <div className="flex items-center gap-3 text-[10px]">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-0.5 bg-neon-green rounded" />
                  <span className="text-gray-500">Player</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-0.5 bg-neon-cyan/50 rounded" />
                  <span className="text-gray-500">League Avg</span>
                </div>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radar}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="stat" tick={{ fill: 'rgba(226,232,240,0.6)', fontSize: 10 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Player" dataKey="value" stroke="#00ff87" fill="#00ff87" fillOpacity={0.15} strokeWidth={2} />
                  <Radar name="League Avg" dataKey="league" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="4 4" />
                  <Tooltip content={<RadarTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center justify-between p-3 rounded-lg bg-neon-green/5 border border-neon-green/20">
              <div className="text-xs text-gray-400">ML Predicted Rating</div>
              <div className="text-2xl font-black text-neon-green">{player.predictedRating}</div>
            </div>
          </div>
        </div>
      </div>
    </GlassModal>
  );
}

export default function ManagerDashboard() {
  const [players, setPlayers] = useState<Player[]>(MOCK_PLAYERS);
  const [selectedTeam, setSelectedTeam] = useState(TEAMS[0]);
  const [selectedDate, setSelectedDate] = useState(DATES[0]);
  const [selectedPlayer, setSelectedPlayer] = useState(MOCK_PLAYERS[5].id);
  const [modalPlayer, setModalPlayer] = useState<Player | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('predictedRating');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    const run = async () => {
      try {
        const apiPlayers = await fetchManagerPlayers();
        if (apiPlayers.length) {
          setPlayers(apiPlayers);
          if (!apiPlayers.find((p) => p.id === selectedPlayer)) {
            setSelectedPlayer(apiPlayers[0].id);
          }
        }
      } catch {
        // Keep fallback mock data when backend is unavailable.
      }
    };

    run();
  }, []);

  const injuredPlayers = players.filter(p => p.health === 'Injured');
  const doubtfulPlayers = players.filter(p => p.health === 'Doubtful');
  const fitPlayers = players.filter(p => p.health === 'Fit');
  const squadReadiness = players.length ? Math.round((fitPlayers.length / players.length) * 100) : 0;
  const topPerformers = [...players].sort((a, b) => b.predictedRating - a.predictedRating).slice(0, 3);

  const selectedPlayerData = players.find((p) => p.id === selectedPlayer);
  const radarData = selectedPlayerData
    ? [
        { stat: 'Speed', value: selectedPlayerData.speed, league: 75 },
        { stat: 'Passing', value: selectedPlayerData.passAccuracy, league: 82 },
        { stat: 'Fitness', value: selectedPlayerData.fitnessScore, league: 78 },
        { stat: 'Stamina', value: 100 - selectedPlayerData.fatigueLevel, league: 70 },
        { stat: 'Dribble', value: Math.min(selectedPlayerData.dribbles * 1.5, 100), league: 60 },
        { stat: 'Tackles', value: Math.min(selectedPlayerData.tackles, 100), league: 50 },
      ]
    : PLAYER_RADAR_DATA(selectedPlayer);

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      const av = a[sortKey as keyof Player];
      const bv = b[sortKey as keyof Player];
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      return 0;
    });
  }, [players, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ChevronsUpDown size={12} className="text-gray-600" />;
    return sortDir === 'asc' ? <ChevronUp size={12} className="text-neon-green" /> : <ChevronDown size={12} className="text-neon-green" />;
  };

  return (
    <div className="min-h-screen bg-mesh pt-16 px-4 pb-4 md:px-6 md:pb-6">
      <div className="max-w-[1600px] mx-auto space-y-5">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users size={18} className="text-neon-green" />
              <h1 className="text-2xl font-bold text-white">Team Analytics</h1>
            </div>
            <p className="text-gray-500 text-sm">ML-powered squad insights & match preparation</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
              <Users size={14} className="text-neon-green" />
              <select
                value={selectedTeam}
                onChange={e => setSelectedTeam(e.target.value)}
                className="bg-transparent text-sm text-white outline-none pr-4 cursor-pointer"
              >
                {TEAMS.map(t => <option key={t} value={t} className="bg-dark-700">{t}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
              <Calendar size={14} className="text-neon-cyan" />
              <select
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="bg-transparent text-sm text-white outline-none pr-4 cursor-pointer"
              >
                {DATES.map(d => <option key={d} value={d} className="bg-dark-700">{d}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <BentoCard neonColor="green">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-neon-green" />
                <span className="text-sm font-semibold text-white">Squad Readiness</span>
              </div>
              <StatBadge
                label={squadReadiness >= 80 ? 'Good' : squadReadiness >= 60 ? 'Fair' : 'Low'}
                variant={squadReadiness >= 80 ? 'success' : squadReadiness >= 60 ? 'warning' : 'danger'}
              />
            </div>
            <div className="flex items-end gap-4 mb-4">
              <div className="text-6xl font-black text-neon-green">{squadReadiness}<span className="text-2xl">%</span></div>
              <div className="text-xs text-gray-500 mb-2">{fitPlayers.length}/{players.length} fit</div>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden mb-3">
              <div
                className="h-full rounded-full bg-gradient-to-r from-neon-green to-neon-cyan transition-all duration-700"
                style={{ width: `${squadReadiness}%` }}
              />
            </div>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1 text-neon-green"><div className="w-1.5 h-1.5 rounded-full bg-neon-green" />{fitPlayers.length} Fit</span>
              <span className="flex items-center gap-1 text-neon-orange"><div className="w-1.5 h-1.5 rounded-full bg-neon-orange" />{doubtfulPlayers.length} Doubtful</span>
              <span className="flex items-center gap-1 text-neon-red"><div className="w-1.5 h-1.5 rounded-full bg-neon-red" />{injuredPlayers.length} Injured</span>
            </div>
          </BentoCard>

          <BentoCard neonColor="red">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={16} className="text-neon-red" />
              <span className="text-sm font-semibold text-white">Injury Alerts</span>
              <StatBadge label={`${injuredPlayers.length + doubtfulPlayers.length}`} variant="danger" size="sm" />
            </div>
            <div className="space-y-2">
              {[...injuredPlayers, ...doubtfulPlayers].map(p => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer hover:bg-white/[0.03] transition-all ${
                    p.health === 'Injured' ? 'border-neon-red/20 bg-neon-red/5' : 'border-neon-orange/20 bg-neon-orange/5'
                  }`}
                  onClick={() => setModalPlayer(p)}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      p.health === 'Injured' ? 'bg-neon-red/20 text-neon-red' : 'bg-neon-orange/20 text-neon-orange'
                    }`}>
                      {p.number}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{p.name}</div>
                      <div className="text-xs text-gray-500">{p.position}</div>
                    </div>
                  </div>
                  <StatBadge label={p.health} variant={healthColor[p.health] as 'success' | 'warning' | 'danger'} size="sm" />
                </div>
              ))}
            </div>
          </BentoCard>

          <BentoCard neonColor="cyan">
            <div className="flex items-center gap-2 mb-4">
              <Star size={16} className="text-neon-yellow" />
              <span className="text-sm font-semibold text-white">Top Predicted Performers</span>
            </div>
            <div className="space-y-3">
              {topPerformers.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] cursor-pointer hover:border-neon-green/20 hover:bg-neon-green/[0.03] transition-all"
                  onClick={() => setModalPlayer(p)}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                    i === 0 ? 'bg-neon-yellow/20 text-neon-yellow' :
                    i === 1 ? 'bg-gray-400/20 text-gray-400' :
                    'bg-amber-600/20 text-amber-600'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{p.name}</div>
                    <div className="text-xs text-gray-500">{p.position} · {p.nationality}</div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-neon-green font-black text-lg">{p.predictedRating}</div>
                    <div className="text-gray-600 text-[10px]">ML Rating</div>
                  </div>
                  {i === 0 && <Award size={14} className="text-neon-yellow" />}
                </div>
              ))}
            </div>
          </BentoCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <BentoCard neonColor="green">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <BarChart2 size={16} className="text-neon-green" />
                  <span className="text-base font-bold text-white">Fatigue & Distance Trends</span>
                </div>
                <p className="text-gray-500 text-xs">Last 5 matches — team average</p>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-neon-red rounded" />
                  <span className="text-gray-400">Fatigue</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-neon-cyan rounded" />
                  <span className="text-gray-400">HR (bpm/10)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-neon-green rounded" />
                  <span className="text-gray-400">Distance (km)</span>
                </div>
              </div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={FATIGUE_DISTANCE_DATA} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="match" tick={{ fill: 'rgba(226,232,240,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(226,232,240,0.5)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="fatigue" stroke="#ff3d71" strokeWidth={2.5} dot={{ r: 4, fill: '#ff3d71', strokeWidth: 0 }} activeDot={{ r: 6 }} name="Fatigue" />
                  <Line type="monotone" dataKey="hr" stroke="#00d4ff" strokeWidth={2.5} dot={{ r: 4, fill: '#00d4ff', strokeWidth: 0 }} activeDot={{ r: 6 }} name="HR (bpm/10)" />
                  <Line type="monotone" dataKey="distance" stroke="#00ff87" strokeWidth={2.5} dot={{ r: 4, fill: '#00ff87', strokeWidth: 0 }} activeDot={{ r: 6 }} name="Distance (km)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </BentoCard>

          <BentoCard neonColor="cyan">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <TrendingUp size={16} className="text-neon-cyan" />
                  <span className="text-base font-bold text-white">Player Stats Radar</span>
                </div>
                <p className="text-gray-500 text-xs">Predicted vs league average</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                <Filter size={12} className="text-neon-cyan" />
                <select
                  value={selectedPlayer}
                  onChange={e => setSelectedPlayer(e.target.value)}
                  className="bg-transparent text-sm text-white outline-none pr-4 cursor-pointer"
                >
                  {players.map(p => (
                    <option key={p.id} value={p.id} className="bg-dark-700">{p.name} ({p.position})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.06)" />
                  <PolarAngleAxis dataKey="stat" tick={{ fill: 'rgba(226,232,240,0.6)', fontSize: 10 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Predicted" dataKey="value" stroke="#00ff87" fill="#00ff87" fillOpacity={0.18} strokeWidth={2} />
                  <Radar name="League Avg" dataKey="league" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.06} strokeWidth={1.5} strokeDasharray="4 4" />
                  <Tooltip content={<RadarTooltip />} />
                  <Legend iconType="line" iconSize={12} wrapperStyle={{ fontSize: '11px', color: 'rgba(226,232,240,0.6)' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </BentoCard>
        </div>

        <BentoCard neonColor="green" className="overflow-hidden">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-neon-green" />
              <h2 className="text-base font-bold text-white">Squad Roster</h2>
              <StatBadge label={`${players.length} players`} variant="neutral" size="sm" />
            </div>
            <div className="text-xs text-gray-500">Click a player to view detailed report</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {[
                    { key: 'name', label: 'Player' },
                    { key: 'position', label: 'Pos' },
                    { key: 'fitnessScore', label: 'Fitness' },
                    { key: 'predictedRating', label: 'ML Rating' },
                    { key: 'health', label: 'Status' },
                    { key: 'injuryRisk', label: 'Risk' },
                  ].map(({ key, label }) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key as SortKey)}
                      className="text-left pb-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-300 transition-colors select-none"
                    >
                      <div className="flex items-center gap-1">
                        {label}
                        <SortIcon k={key as SortKey} />
                      </div>
                    </th>
                  ))}
                  <th className="pb-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Report</th>
                </tr>
              </thead>
              <tbody>
                {sortedPlayers.map((player) => (
                  <tr
                    key={player.id}
                    onClick={() => setModalPlayer(player)}
                    className="border-b border-white/[0.03] hover:bg-white/[0.03] cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-green/10 to-neon-cyan/10 border border-white/10 flex items-center justify-center text-xs font-bold text-gray-300">
                          {player.number}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">{player.name}</div>
                          <div className="text-xs text-gray-600">{player.nationality}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-xs font-mono text-neon-cyan">{player.position}</span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-white/5">
                          <div
                            className={`h-full rounded-full transition-all ${
                              player.fitnessScore >= 85 ? 'bg-neon-green' :
                              player.fitnessScore >= 70 ? 'bg-neon-orange' : 'bg-neon-red'
                            }`}
                            style={{ width: `${player.fitnessScore}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-gray-300">{player.fitnessScore}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`text-base font-black ${
                        player.predictedRating >= 8 ? 'text-neon-green' :
                        player.predictedRating >= 7 ? 'text-neon-cyan' : 'text-gray-400'
                      }`}>
                        {player.predictedRating}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <StatBadge label={player.health} variant={healthColor[player.health] as 'success' | 'warning' | 'danger'} size="sm" />
                    </td>
                    <td className="py-3 px-2">
                      <StatBadge label={player.injuryRisk} variant={riskColor[player.injuryRisk] as 'success' | 'warning' | 'danger'} size="sm" />
                    </td>
                    <td className="py-3 px-2 text-right">
                      <button className="text-xs text-gray-500 group-hover:text-neon-green transition-colors px-2 py-1 rounded border border-transparent group-hover:border-neon-green/20">
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BentoCard>
      </div>

      {modalPlayer && (
        <PlayerModal player={modalPlayer} onClose={() => setModalPlayer(null)} />
      )}
    </div>
  );
}
