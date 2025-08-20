// Dashboard V2 Chart Components

import React from 'react';

// Dots chart component
export function Dots({ series = [1,2,3,2,4,6,5,8,7,9,3,2] }: { series?: number[] }) {
  const max = Math.max(...series);
  
  return (
    <div className="grid h-40 w-full grid-cols-12 items-end gap-2">
      {series.map((v, i) => (
        <div key={i} className="flex h-full w-full items-end justify-center gap-1">
          {Array.from({ length: max }).map((_, j) => (
            <span 
              key={j} 
              className={`mb-1 block h-2.5 w-2.5 rounded-full transition-colors ${
                j < v ? 'bg-white' : 'bg-white/20'
              }`} 
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Bars chart component  
export function Bars({ series = [2,5,9,7,4,2] }: { series?: number[] }) {
  const max = Math.max(...series);
  
  return (
    <div className="flex h-40 w-full items-end gap-3">
      {series.map((v, i) => (
        <div key={i} className="flex w-full items-end">
          <div 
            className="w-full rounded-md bg-white transition-all duration-300" 
            style={{ height: `${(v/max)*100}%` }} 
          />
        </div>
      ))}
    </div>
  );
}

// Row stat component for country stats
export function RowStat({ label, value }: { label: string; value: string }) {
  const percentage = Math.min(100, parseFloat(value) / 400 * 100);
  
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-3">
      <div className="h-2 w-full rounded-full bg-white/10">
        <div 
          className="h-2 rounded-full bg-white/70 transition-all duration-300" 
          style={{ width: `${percentage}%` }} 
        />
      </div>
      <div className="text-foreground font-medium">{value}</div>
      <div className="col-span-2 -mt-5 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}