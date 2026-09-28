import React from 'react';

export function StarburstIcon({ className = "w-6 h-6 text-fuchsia-500", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...props}>
      <path d="M12 0L14.59 7.41L22 6L16.41 11.59L24 12L16.41 12.41L22 18L14.59 16.59L12 24L9.41 16.59L2 18L7.59 12.41L0 12L7.59 11.59L2 6L9.41 7.41L12 0Z" />
    </svg>
  );
}

export function FlowerStarIcon({ className = "w-8 h-8 text-brand-400", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" className={className} {...props}>
      <path d="M50 0 C53 30 70 47 100 50 C70 53 53 70 50 100 C47 70 30 53 0 50 C30 47 47 30 50 0 Z" />
    </svg>
  );
}

export function DoubleStarIcon({ className = "w-5 h-5 text-amber-400", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...props}>
      <path d="M12 2l2.4 7.4h7.6l-6.2 4.5 2.4 7.4-6.2-4.5-6.2 4.5 2.4-7.4-6.2-4.5h7.6z" />
    </svg>
  );
}
