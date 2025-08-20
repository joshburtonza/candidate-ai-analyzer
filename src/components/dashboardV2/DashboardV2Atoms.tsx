// Dashboard V2 Atomic Components - using semantic tokens from design system

import React from 'react';
import { cn } from '@/lib/utils';

// Container with responsive padding
export const Container = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>
    {children}
  </div>
);

// Card using semantic tokens
export const DashCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div
    className={cn(
      "rounded-3xl border p-5 shadow-lg backdrop-blur-sm",
      "bg-card border-border",
      className
    )}
  >
    {children}
  </div>
);

// Widget using black/dark design system colors
export const Widget = ({ 
  tone = "dark", 
  children, 
  className = "" 
}: { 
  tone?: 'accent' | 'dark'; 
  children: React.ReactNode; 
  className?: string; 
}) => {
  const bgClass = tone === 'accent' 
    ? 'bg-gradient-to-br from-white/10 to-white/5 text-white border border-white/10'
    : 'bg-gradient-to-br from-black/80 to-black/60 text-white border border-white/10';
    
  return (
    <div className={cn("rounded-3xl p-5", bgClass, className)}>
      {children}
    </div>
  );
};

// Button using design system variants
export const DashButton = ({ 
  variant = "ghost", 
  className = "", 
  children, 
  onClick, 
  type = "button",
  disabled = false
}: { 
  variant?: 'primary' | 'soft' | 'ghost'; 
  className?: string; 
  children: React.ReactNode; 
  onClick?: () => void; 
  type?: 'button' | 'submit';
  disabled?: boolean;
}) => {
  const baseClasses = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
    soft: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "bg-card text-card-foreground border border-border hover:bg-accent hover:text-accent-foreground"
  };

  return (
    <button 
      type={type} 
      onClick={onClick} 
      disabled={disabled}
      className={cn(baseClasses, variantClasses[variant], className)}
    >
      {children}
    </button>
  );
};

// Badge using semantic tokens
export const DashBadge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs border border-border bg-secondary text-secondary-foreground">
    {children}
  </span>
);

// Progress bar using design system colors
export const Progress = ({ value }: { value: number }) => {
  const clampedValue = Math.min(100, Math.max(0, value));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
      <div 
        className="h-full rounded-full bg-primary transition-all duration-300" 
        style={{ width: `${clampedValue}%` }} 
      />
    </div>
  );
};