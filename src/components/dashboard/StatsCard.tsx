import React from 'react';
import { cn } from '@/lib/utils';

import { motion } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  className?: string;
  delay?: number;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  iconBg = 'bg-primary/10',
  iconColor = 'text-primary',
  className,
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        'bg-card rounded-card p-6 card-hover border-none flex items-center gap-5',
        className
      )}
    >
      <div className={cn(
        'w-12 h-12 rounded-full flex items-center justify-center shrink-0',
        iconBg,
        iconColor
      )}>
        {icon}
      </div>
      <div className="flex flex-col">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">{title}</p>
        <p className="text-2xl font-black text-foreground tabular-nums tracking-tight">{value}</p>
      </div>
    </motion.div>
  );
};
