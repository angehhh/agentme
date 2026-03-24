import React from 'react';

interface BtnProps {
  label: string;
  onClick: () => void;
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Btn = ({ label, onClick, variant = 'solid', size = 'md', icon }: BtnProps) => {
  const base = "inline-flex items-center gap-[9px] rounded-lg font-sans font-semibold cursor-pointer transition-all duration-150";
  const padding = size === 'lg' ? "px-[38px] py-[15px] text-[15px]" : "px-6 py-[11px] text-[14px]";
  
  const variants = {
    solid: "bg-ink text-white hover:opacity-85 border-none",
    outline: "bg-transparent text-ink border-[1.5px] border-solid border-ink-10 hover:border-ink",
    ghost: "bg-transparent text-ink-60 hover:text-ink border-none",
  };

  return (
    <button className={`${base} ${padding} ${variants[variant]}`} onClick={onClick}>
      {label}
      {icon}
    </button>
  );
};
