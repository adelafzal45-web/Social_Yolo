import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export const PROMPT_PRESETS = [
  {
    label: "🎉 Neon Nightclub Party",
    prompt: "Vibrant neon nightclub DJ party flyer with bold 3D typography, holographic glows, and confetti effects",
    category: "Club & Events"
  },
  {
    label: "🛍️ Weekend Flash Sale 50% Off",
    prompt: "Modern retail flash sale post with 50% discount badge, dynamic geometric layout, bold energetic colors",
    category: "Retail"
  },
  {
    label: "✨ Luxury Perfume Launch",
    prompt: "High-end luxury perfume showcase with golden hour lighting, floating silk petals, and elegant serif accents",
    category: "E-commerce"
  },
  {
    label: "🍔 Gourmet Burger Promo",
    prompt: "Mouth-watering gourmet craft burger promotional flyer with rustic chalkboard backdrop and fresh ingredient splashes",
    category: "Food & Drink"
  },
  {
    label: "💪 Fitness Bootcamp Challenge",
    prompt: "High-intensity athletic gym bootcamp poster with dramatic smoke lighting and bold typography",
    category: "Fitness"
  },
  {
    label: "⛪ Sunday Worship & Conference",
    prompt: "Inspiring church worship night conference poster with warm radiant golden stage lights and clean modern typography",
    category: "Church & Events"
  }
];
