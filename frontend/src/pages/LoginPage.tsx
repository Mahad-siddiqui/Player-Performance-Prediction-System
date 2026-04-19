import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { LogIn, ShieldCheck, Users, Sparkles } from 'lucide-react';
import BentoCard from '../components/ui/BentoCard';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../data/mockData';
import { UserRole } from '../types';
import { fetchUsers } from '../services/api';

function getHomePath(role: UserRole) {
  if (role === 'admin') return '/admin';
  if (role === 'manager') return '/manager';
  return '/fan';
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();

  const [email, setEmail] = useState('manager@soccerml.io');
  const [error, setError] = useState('');
  const [users, setUsers] = useState<User[]>([]);

  const roleHints = useMemo(() => ({
    admin: 'System Administrator',
    manager: 'Team Manager',
    fan: 'Fan',
  }), []);

  if (isAuthenticated && user) {
    return <Navigate to={getHomePath(user.role)} replace />;
  }

  useEffect(() => {
    const run = async () => {
      try {
        const apiUsers = await fetchUsers();
        setUsers(apiUsers);
      } catch {
        // Keep empty list when backend is unavailable.
      }
    };

    run();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const ok = await login(email.trim());
    if (!ok) {
      setError('User not found. Use one of the demo accounts below.');
      return;
    }

    const target = users.find((entry) => entry.email === email.trim());
    navigate(target ? getHomePath(target.role) : '/');
  };

  return (
    <div className="min-h-screen px-4 py-12 md:py-16 flex items-center justify-center">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-5 gap-6">
        <BentoCard className="lg:col-span-3 p-8 md:p-10" glow="green">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-emerald-300/90 mb-4">
            <Sparkles size={14} />
            Match Intelligence Platform
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
            Machine Learning Soccer Prediction Hub
          </h1>
          <p className="mt-4 text-sm md:text-base text-slate-300/90 max-w-2xl">
            Forecast player performance, monitor squad readiness, and generate role-based insights from match and wellness intelligence.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-8">
            {users.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => {
                  setEmail(entry.email);
                  setError('');
                }}
                className="text-left p-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] transition-colors"
              >
                <p className="text-xs text-slate-400">{roleHints[entry.role]}</p>
                <p className="text-sm text-white font-semibold mt-1">{entry.name}</p>
                <p className="text-xs text-slate-500 mt-1">{entry.email}</p>
              </button>
            ))}
          </div>
        </BentoCard>

        <BentoCard className="lg:col-span-2 p-6 md:p-7" glow="blue">
          <div className="flex items-center gap-2 text-blue-300 mb-6">
            <ShieldCheck size={16} />
            <span className="text-sm font-semibold">Secure Role Login</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-xs text-slate-400">Email</label>
            <input
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError('');
              }}
              placeholder="manager@soccerml.io"
              className="w-full rounded-xl border border-white/10 bg-[#0d1520]/80 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400/60"
            />

            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold bg-gradient-to-r from-emerald-500 to-cyan-400 text-black hover:opacity-90 transition-opacity"
            >
              <LogIn size={15} />
              Continue
            </button>
          </form>

          <div className="mt-5 text-xs text-slate-500 leading-relaxed">
            Demo roles are pre-seeded.
            <span className="inline-flex items-center gap-1 ml-1 text-slate-400">
              <Users size={12} />
              Admin, Manager, Fan.
            </span>
          </div>
        </BentoCard>
      </div>
    </div>
  );
}
