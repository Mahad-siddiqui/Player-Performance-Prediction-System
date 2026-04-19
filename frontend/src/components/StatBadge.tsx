import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
type TrendType = 'up' | 'down' | 'neutral';

interface StatBadgeProps {
  label: string;
  value?: string | number;
  variant?: BadgeVariant;
  trend?: TrendType;
  size?: 'sm' | 'md' | 'lg';
  pill?: boolean;
}

const variantMap: Record<BadgeVariant, string> = {
  success: 'bg-neon-green/10 text-neon-green border border-neon-green/20',
  warning: 'bg-neon-orange/10 text-neon-orange border border-neon-orange/20',
  danger: 'bg-neon-red/10 text-neon-red border border-neon-red/20',
  info: 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20',
  neutral: 'bg-white/5 text-gray-300 border border-white/10',
};

const sizeMap: Record<string, string> = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
};

const TrendIcon = ({ trend }: { trend?: TrendType }) => {
  if (!trend || trend === 'neutral') return <Minus size={10} />;
  if (trend === 'up') return <TrendingUp size={10} />;
  return <TrendingDown size={10} />;
};

export default function StatBadge({
  label,
  value,
  variant = 'neutral',
  trend,
  size = 'md',
  pill = true,
}: StatBadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 font-semibold tracking-wide
        ${variantMap[variant]}
        ${sizeMap[size]}
        ${pill ? 'rounded-full' : 'rounded-md'}
        transition-all duration-200
      `}
    >
      {trend && <TrendIcon trend={trend} />}
      {value !== undefined && <span className="font-bold">{value}</span>}
      <span className="opacity-80">{label}</span>
    </span>
  );
}
