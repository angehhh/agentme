import React from 'react';

export const Label = ({ text }: { text: string }) => (
  <p className="text-[11px] font-bold tracking-[0.11em] text-ink-40 uppercase mb-5">
    {text}
  </p>
);

export const H2 = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`font-serif text-[clamp(38px,5vw,62px)] tracking-[-0.035em] text-ink leading-[1.06] ${className}`}>
    {children}
  </h2>
);
