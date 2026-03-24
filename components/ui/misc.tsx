import React from 'react';

export const Dot = ({ color = 'bg-brand-green' }: { color?: string }) => (
  <span className={`inline-block w-[7px] h-[7px] rounded-full shrink-0 animate-pulse-slow ${color}`} />
);

export const Divider = () => (
  <div className="border-t border-solid border-ink-10" />
);

export const Section = ({ id, bgClass, children, className = '', pt = 130, pb = 130 }: {
  id?: string;
  bgClass?: string;
  children: React.ReactNode;
  className?: string;
  pt?: number;
  pb?: number;
}) => (
  <section id={id} style={{ paddingTop: pt, paddingBottom: pb }} className={`px-6 ${bgClass || ''} ${className}`}>
    <div className="max-w-[1120px] mx-auto">
      {children}
    </div>
  </section>
);
