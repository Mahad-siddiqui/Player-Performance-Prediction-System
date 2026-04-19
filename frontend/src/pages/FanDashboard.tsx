import { useState, useEffect } from 'react';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Clock, Flame, Star, TrendingUp, BarChart2, Users,
  Trophy, Target, Zap, Activity, ArrowRight, Swords,
} from 'lucide-react';
import BentoCard from '../components/BentoCard';
import StatBadge from '../components/StatBadge';
import { Player, Match, getCountdown } from '../data/mockData';
import { fetchFanDashboard } from '../services/api';

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

function CountdownBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-3xl md:text-4xl font-black text-white font-mono leading-none">{value}</div>
      <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">{label}</div>
    </div>
  );
}

function Separator() {
  return <div className="text-3xl md:text-4xl font-black text-neon-green animate-pulse">:</div>;
}

function PlayerCompareCard({ player, side }: { player: Player; side: 'left' | 'right' }) {
  const stats = [
    { label: 'Goals', value: player.goals, max: 20 },
    { label: 'Assists', value: player.assists, max: 15 },
    { label: 'Pass %', value: player.passAccuracy, max: 100 },
    { label: 'Speed', value: player.speed, max: 100 },
    { label: 'Dribbles', value: player.dribbles, max: 70 },
  ];

  return (
    <div className="space-y-4">
      <div className={`flex flex-col items-center p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] ${side === 'right' ? 'md:items-end' : ''}`}>
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-green/20 to-neon-cyan/20 border-2 border-neon-green/30 flex items-center justify-center text-2xl font-black text-neon-green mb-2">
          {player.number}
        </div>
        <div className="text-base font-bold text-white text-center">{player.name}</div>
        <div className="text-xs text-gray-400">{player.position} · {player.nationality}</div>
        <div className="mt-2 flex gap-2">
          <StatBadge label={player.position} variant="info" size="sm" />
          <StatBadge label={`${player.goals}G`} variant="success" size="sm" />
        </div>
      </div>
      <div className="space-y-2">
        {stats.map(({ label, value, max }) => (
          <div key={label} className={`flex items-center gap-3 ${side === 'right' ? 'flex-row-reverse' : ''}`}>
            <div className="flex-1">
              <div className={`h-2 rounded-full bg-white/5 overflow-hidden ${side === 'right' ? 'rotate-180' : ''}`}>
                <div
                  className="h-full rounded-full bg-gradient-to-r from-neon-green to-neon-cyan transition-all duration-700"
                  style={{ width: `${(value / max) * 100}%` }}
                />
              </div>
            </div>
            <div className={`text-xs font-mono font-bold text-white w-8 text-center`}>{value}</div>
            <div className="text-xs text-gray-500 w-12">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FanDashboard() {
  const [comparisonPlayers, setComparisonPlayers] = useState<Player[]>([]);
  const [goalContributionsData, setGoalContributionsData] = useState<Array<{ player: string; predicted: number; actual: number; assists: number }>>([]);
  const [teamFormData, setTeamFormData] = useState<Array<{ week: string; rating: number; opponent: string }>>([]);
  const [seasonCards, setSeasonCards] = useState<Array<{ label: string; stats: Array<{ l: string; v: string }> }>>([]);
  const [goalProbability, setGoalProbability] = useState(74);
  const [match, setMatch] = useState<Match | null>(null);
  const [standoutPlayer, setStandoutPlayer] = useState<Player | null>(null);
  const [countdown, setCountdown] = useState('');
  const [p1Id, setP1Id] = useState('');
  const [p2Id, setP2Id] = useState('');

  const player1 = comparisonPlayers.find(p => p.id === p1Id) || comparisonPlayers[0];
  const player2 = comparisonPlayers.find(p => p.id === p2Id) || comparisonPlayers[1] || comparisonPlayers[0];

  useEffect(() => {
    const run = async () => {
      try {
        const payload = await fetchFanDashboard();
        if (payload.comparisonPlayers.length >= 2) {
          setComparisonPlayers(payload.comparisonPlayers);
          setP1Id(payload.comparisonPlayers[0].id);
          setP2Id(payload.comparisonPlayers[1].id);
        }
        if (payload.goalContributions.length) setGoalContributionsData(payload.goalContributions);
        if (payload.teamForm.length) setTeamFormData(payload.teamForm);
        setMatch(payload.upcomingMatch);
        setStandoutPlayer(payload.standoutPlayer);
        setGoalProbability(payload.goalProbability);
        setSeasonCards(payload.seasonCards);
      } catch {
        // Keep current state when backend call fails.
      }
    };

    run();
  }, []);

  useEffect(() => {
    if (!match) return;
    const update = () => setCountdown(getCountdown(match.date, match.time));
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [match]);

  if (!match || !standoutPlayer || !comparisonPlayers.length) {
    return <div className="min-h-screen bg-mesh pt-16 px-4 pb-4 md:px-6 md:pb-6" />;
  }

  const countdownParts = countdown.split(' ');

  return (
    <div className="min-h-screen bg-mesh pt-16 px-4 pb-4 md:px-6 md:pb-6">
      <div className="max-w-[1600px] mx-auto space-y-5">

        <BentoCard neonColor="cyan" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-neon-green/5 to-neon-cyan/5 pointer-events-none" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-neon-green/10 border border-neon-green/20 flex items-center justify-center">
                <Clock size={20} className="text-neon-green" />
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-0.5">Next Match</div>
                <div className="text-lg font-bold text-white">{match.competition}</div>
                <div className="text-gray-400 text-sm">{match.venue} · {match.date} at {match.time}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 md:gap-8">
              <div className="text-right">
                <div className="text-lg font-bold text-white">{match.homeTeam}</div>
                <div className="text-xs text-gray-500">Home</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-2xl font-black text-neon-green">{match.predictedScore}</div>
                <div className="text-[10px] text-gray-500">ML Predicted</div>
              </div>
              <div className="text-left">
                <div className="text-lg font-bold text-white">{match.awayTeam}</div>
                <div className="text-xs text-gray-500">Away</div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Countdown</div>
              <div className="flex items-center gap-2">
                {countdownParts[0] && <CountdownBlock value={countdownParts[0]} label="days" />}
                <Separator />
                {countdownParts[1] && <CountdownBlock value={countdownParts[1]} label="hours" />}
                <Separator />
                {countdownParts[2] && <CountdownBlock value={countdownParts[2]} label="min" />}
              </div>
            </div>
          </div>

          <div className="relative mt-5 pt-5 border-t border-white/[0.06] flex flex-wrap gap-4">
            {[
              { label: 'Win Probability', value: `${match.winProbability}%`, color: 'text-neon-green', bg: 'bg-neon-green' },
              { label: 'Draw', value: `${match.drawProbability}%`, color: 'text-gray-300', bg: 'bg-gray-400' },
              { label: 'Loss', value: `${match.lossProbability}%`, color: 'text-neon-red', bg: 'bg-neon-red' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className="flex-1 min-w-[120px]">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-400">{label}</span>
                  <span className={`font-bold ${color}`}>{value}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5">
                  <div className={`h-full rounded-full ${bg} transition-all`} style={{ width: value }} />
                </div>
              </div>
            ))}
          </div>
        </BentoCard>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <BentoCard neonColor="green" className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-neon-green/5 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <Flame size={16} className="text-neon-orange" />
                <span className="text-sm font-semibold text-white">Match Predictor</span>
                <StatBadge label="Standout" variant="warning" size="sm" />
              </div>

              <div className="flex flex-col items-center p-5 rounded-xl bg-white/[0.03] border border-neon-green/20 mb-4">
                <div className="relative mb-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-neon-green/30 to-neon-cyan/20 border-2 border-neon-green/40 flex items-center justify-center text-3xl font-black text-neon-green">
                    {standoutPlayer.number}
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-neon-yellow border-2 border-dark-800 flex items-center justify-center">
                    <Star size={12} className="text-dark-800 fill-dark-800" />
                  </div>
                </div>
                <div className="text-xl font-black text-white text-center">{standoutPlayer.name}</div>
                <div className="text-gray-400 text-sm">{standoutPlayer.position} · {standoutPlayer.nationality}</div>
                <div className="mt-3 text-5xl font-black text-neon-green">{standoutPlayer.predictedRating}</div>
                <div className="text-gray-500 text-xs mt-0.5">ML Predicted Rating</div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Goals', value: standoutPlayer.goals, icon: Target },
                  { label: 'Assists', value: standoutPlayer.assists, icon: Zap },
                  { label: 'Shots', value: standoutPlayer.shots, icon: Activity },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="text-center p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <Icon size={14} className="text-neon-cyan mx-auto mb-1" />
                    <div className="text-lg font-black text-white">{value}</div>
                    <div className="text-[10px] text-gray-500">{label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between p-3 rounded-xl bg-neon-orange/5 border border-neon-orange/20">
                <div className="flex items-center gap-2">
                  <Flame size={14} className="text-neon-orange" />
                  <span className="text-xs text-gray-400">Goal probability vs Dynamo</span>
                </div>
                <div className="text-neon-orange font-black">{goalProbability}%</div>
              </div>
            </div>
          </BentoCard>

          <div className="lg:col-span-2 space-y-5">
            <BentoCard neonColor="green">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <BarChart2 size={16} className="text-neon-green" />
                    <span className="text-base font-bold text-white">Goal Contributions</span>
                  </div>
                  <p className="text-gray-500 text-xs">Actual vs ML-predicted — last 5 matches</p>
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-2 rounded bg-neon-green" /><span className="text-gray-400">Actual</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-2 rounded bg-neon-cyan/60" /><span className="text-gray-400">Predicted</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-2 rounded bg-neon-orange/60" /><span className="text-gray-400">Assists</span></div>
                </div>
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={goalContributionsData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="player" tick={{ fill: 'rgba(226,232,240,0.5)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(226,232,240,0.5)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="actual" name="Actual" fill="#00ff87" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="predicted" name="Predicted" fill="rgba(0,212,255,0.6)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="assists" name="Assists" fill="rgba(255,140,0,0.6)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </BentoCard>

            <BentoCard neonColor="cyan">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <TrendingUp size={16} className="text-neon-cyan" />
                    <span className="text-base font-bold text-white">Team Form</span>
                  </div>
                  <p className="text-gray-500 text-xs">Overall performance rating — last 6 matchweeks</p>
                </div>
                <StatBadge label="GW33 Predicted" variant="info" size="sm" />
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={teamFormData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                    <defs>
                      <linearGradient id="formGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="week" tick={{ fill: 'rgba(226,232,240,0.5)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[50, 100]} tick={{ fill: 'rgba(226,232,240,0.5)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="rating" name="Rating" stroke="#00d4ff" strokeWidth={2.5} fill="url(#formGradient)" dot={{ r: 4, fill: '#00d4ff', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </BentoCard>
          </div>
        </div>

        <BentoCard neonColor="cyan">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Swords size={18} className="text-neon-cyan" />
              <h2 className="text-lg font-bold text-white">Player Comparison</h2>
              <StatBadge label="Public Stats" variant="info" size="sm" />
            </div>
            <p className="text-xs text-gray-500">Select two players to compare their public performance stats</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-start">
            <div className="space-y-4">
              <select
                value={p1Id}
                onChange={e => setP1Id(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm outline-none pr-8 cursor-pointer focus:border-neon-green/30 transition-colors"
              >
                {comparisonPlayers.filter(p => p.id !== p2Id).map(p => (
                  <option key={p.id} value={p.id} className="bg-dark-700">{p.name} ({p.position})</option>
                ))}
              </select>
              {player1 && <PlayerCompareCard player={player1} side="left" />}
            </div>

            <div className="flex flex-col items-center justify-center self-center gap-3 py-4">
              <div className="w-10 h-10 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
                <ArrowRight size={16} className="text-neon-cyan" />
              </div>
              <div className="text-xs text-gray-600 uppercase tracking-widest">VS</div>
              <div className="w-10 h-10 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center rotate-180">
                <ArrowRight size={16} className="text-neon-cyan" />
              </div>
            </div>

            <div className="space-y-4">
              <select
                value={p2Id}
                onChange={e => setP2Id(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm outline-none pr-8 cursor-pointer focus:border-neon-green/30 transition-colors"
              >
                {comparisonPlayers.filter(p => p.id !== p1Id).map(p => (
                  <option key={p.id} value={p.id} className="bg-dark-700">{p.name} ({p.position})</option>
                ))}
              </select>
              {player2 && <PlayerCompareCard player={player2} side="right" />}
            </div>
          </div>

          {player1 && player2 && (
            <div className="mt-6 pt-5 border-t border-white/[0.06]">
              <div className="text-xs text-gray-500 text-center mb-4 uppercase tracking-wider">Head to Head Summary</div>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {[
                  { label: 'Goals', v1: player1.goals, v2: player2.goals },
                  { label: 'Assists', v1: player1.assists, v2: player2.assists },
                  { label: 'Pass %', v1: player1.passAccuracy, v2: player2.passAccuracy },
                  { label: 'Speed', v1: player1.speed, v2: player2.speed },
                  { label: 'Dribbles', v1: player1.dribbles, v2: player2.dribbles },
                ].map(({ label, v1, v2 }) => (
                  <div key={label} className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">{label}</div>
                    <div className="flex items-center justify-center gap-2">
                      <span className={`text-sm font-black ${v1 > v2 ? 'text-neon-green' : 'text-gray-400'}`}>{v1}</span>
                      <span className="text-gray-600">·</span>
                      <span className={`text-sm font-black ${v2 > v1 ? 'text-neon-green' : 'text-gray-400'}`}>{v2}</span>
                    </div>
                    <div className="text-[10px] text-gray-600 mt-1">
                      {v1 > v2 ? player1.name.split(' ')[0] : v2 > v1 ? player2.name.split(' ')[0] : 'Draw'} leads
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </BentoCard>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {seasonCards.map((card, idx) => {
            const iconMap = [Trophy, Target, Users];
            const colorMap = ['text-neon-yellow', 'text-neon-green', 'text-neon-cyan'];
            const Icon = iconMap[idx] || Trophy;
            const color = colorMap[idx] || 'text-neon-cyan';

            return (
            <BentoCard key={card.label} neonColor="green">
              <div className="flex items-center gap-2 mb-4">
                <Icon size={16} className={color} />
                <span className="text-sm font-semibold text-white">{card.label}</span>
              </div>
              <div className="flex items-center gap-4">
                {card.stats.map(({ l, v }) => (
                  <div key={l} className="flex-1 text-center">
                    <div className={`text-3xl font-black ${color}`}>{v}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{l}</div>
                  </div>
                ))}
              </div>
            </BentoCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}
