import { ReactNode } from 'react';

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  glow?: 'green' | 'blue' | 'red' | 'none';
  padding?: boolean;
}

export default function BentoCard({ children, className = '', glow = 'none', padding = true }: BentoCardProps) {
  const glowMap: Record<string, string> = {
    green: 'shadow-[0_0_24px_rgba(16,185,129,0.15)] border-emerald-500/20',
    blue: 'shadow-[0_0_24px_rgba(59,130,246,0.15)] border-blue-500/20',
    red: 'shadow-[0_0_24px_rgba(239,68,68,0.15)] border-red-500/20',
    none: 'border-white/[0.07]',
  };

  return (
    <div
      className={`
        bg-white/[0.04] backdrop-blur-md border rounded-2xl
        ${glowMap[glow]}
        ${padding ? 'p-5' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
