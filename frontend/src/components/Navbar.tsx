import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Shield, Users, BarChart2, LogOut,
  ChevronDown, Zap, Menu, X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ROLE_CONFIG = {
  admin: {
    label: 'System Admin',
    color: 'text-neon-cyan',
    border: 'border-neon-cyan/30',
    bg: 'bg-neon-cyan/10',
    icon: Shield,
    path: '/admin',
  },
  manager: {
    label: 'Team Manager',
    color: 'text-neon-green',
    border: 'border-neon-green/30',
    bg: 'bg-neon-green/10',
    icon: Users,
    path: '/manager',
  },
  fan: {
    label: 'Fan',
    color: 'text-neon-orange',
    border: 'border-neon-orange/30',
    bg: 'bg-neon-orange/10',
    icon: BarChart2,
    path: '/fan',
  },
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!user) return null;

  const config = ROLE_CONFIG[user.role];
  const Icon = config.icon;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 h-16 border-b border-white/[0.06] bg-dark-900/80 backdrop-blur-xl">
      <div className="h-full max-w-[1800px] mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-green/30 to-neon-cyan/30 border border-neon-green/30 flex items-center justify-center">
              <Activity size={16} className="text-neon-green" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white tracking-wide">SoccerIQ</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-neon-green/20 text-neon-green font-bold tracking-wider">ML</span>
              </div>
              <div className="text-[10px] text-gray-500 leading-none">Prediction System</div>
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-1.5 text-gray-400 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
            <span>System Online</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap size={12} className="text-neon-yellow" />
            <span className="text-xs text-gray-400">v2.4.1</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`
              hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg
              ${config.bg} border ${config.border} cursor-pointer
              hover:opacity-90 transition-opacity relative
            `}
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">
              {user.avatar}
            </div>
            <div>
              <div className={`text-xs font-semibold ${config.color}`}>{user.name}</div>
              <div className="flex items-center gap-1">
                <Icon size={10} className={config.color} />
                <span className="text-[10px] text-gray-500">{config.label}</span>
              </div>
            </div>
            <ChevronDown size={14} className="text-gray-500" />

            {dropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-40 rounded-xl border border-white/10 bg-dark-700/95 backdrop-blur-xl overflow-hidden shadow-xl z-50">
                <div className="p-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-neon-red hover:bg-neon-red/10 rounded-lg transition-all text-left"
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-white/[0.06] bg-dark-800/95 backdrop-blur-xl p-4 space-y-3">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${config.bg} border ${config.border}`}>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-white">
              {user.avatar}
            </div>
            <div>
              <div className={`text-sm font-semibold ${config.color}`}>{user.name}</div>
              <div className="text-xs text-gray-500">{config.label}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neon-red border border-neon-red/20 bg-neon-red/10 rounded-lg hover:bg-neon-red/20 transition-all"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      )}
    </nav>
  );
}
