import React from 'react';

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
  rowSpan?: number;
  neonColor?: 'green' | 'cyan' | 'red' | 'orange' | 'none';
  onClick?: () => void;
  hoverable?: boolean;
  style?: React.CSSProperties;
}

const neonStyles: Record<string, string> = {
  green: 'hover:border-neon-green/30 hover:shadow-[0_0_20px_rgba(0,255,135,0.08)]',
  cyan: 'hover:border-neon-cyan/30 hover:shadow-[0_0_20px_rgba(0,212,255,0.08)]',
  red: 'hover:border-neon-red/30 hover:shadow-[0_0_20px_rgba(255,61,113,0.08)]',
  orange: 'hover:border-neon-orange/30 hover:shadow-[0_0_20px_rgba(255,140,0,0.08)]',
  none: '',
};

export default function BentoCard({
  children,
  className = '',
  neonColor = 'green',
  onClick,
  hoverable = false,
  style,
}: BentoCardProps) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={`
        glass-card p-5 relative overflow-hidden
        border border-white/[0.06]
        transition-all duration-300
        ${neonStyles[neonColor]}
        ${hoverable || onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
