'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarsRatingProps {
  initialRating?: number | null;
  onRate?: (rating: number) => Promise<void> | void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function StarsRating({
  initialRating = 0,
  onRate,
  readOnly = false,
  size = 'md',
  showLabel = false,
}: StarsRatingProps) {
  const [rating, setRating] = useState<number>(initialRating || 0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const starSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleRate = async (val: number) => {
    if (readOnly || isSubmitting) return;
    setRating(val);
    if (onRate) {
      setIsSubmitting(true);
      try {
        await onRate(val);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const activeValue = hoverRating || rating;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= activeValue;
          return (
            <button
              key={star}
              type="button"
              disabled={readOnly || isSubmitting}
              onClick={() => handleRate(star)}
              onMouseEnter={() => !readOnly && setHoverRating(star)}
              onMouseLeave={() => !readOnly && setHoverRating(0)}
              className={`p-1 rounded-md transition-all duration-150 ${
                readOnly
                  ? 'cursor-default'
                  : 'cursor-pointer hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-400'
              }`}
              title={readOnly ? `${rating} stars` : `Rate ${star} star${star > 1 ? 's' : ''}`}
            >
              <Star
                className={`${starSizes[size]} transition-colors duration-150 ${
                  isFilled
                    ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                    : 'fill-slate-100 text-slate-300'
                }`}
              />
            </button>
          );
        })}
      </div>
      {showLabel && (
        <span className="text-xs font-semibold text-slate-600 ml-1">
          {rating ? `${rating}/5` : 'Unrated'}
        </span>
      )}
      {isSubmitting && (
        <span className="text-xs text-brand-600 animate-pulse ml-1">Saving...</span>
      )}
    </div>
  );
}
