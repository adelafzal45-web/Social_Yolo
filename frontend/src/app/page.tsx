'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { StudioSpotlight } from '@/components/landing/StudioSpotlight';
import { TickerMarquee } from '@/components/landing/TickerMarquee';
import { WhatYouGet } from '@/components/landing/WhatYouGet';
import { TemplateShowcase } from '@/components/landing/TemplateShowcase';
import { WhyChooseUs } from '@/components/landing/WhyChooseUs';
import { CreatedBySection } from '@/components/landing/CreatedBySection';
import { AudienceSection } from '@/components/landing/AudienceSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { Testimonials } from '@/components/landing/Testimonials';
import { FaqSection } from '@/components/landing/FaqSection';
import { CtaBanner } from '@/components/landing/CtaBanner';
import { Footer } from '@/components/landing/Footer';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-brand-500 selection:text-white transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar />

      {/* Hero Section */}
      <Hero />

      {/* Creative Studio Spotlight */}
      <StudioSpotlight />

      {/* Infinite Golden Yellow Marquee */}
      <TickerMarquee />

      {/* 4 Pastel Cards Grid */}
      <WhatYouGet />

      {/* Bestseller Templates Grid */}
      <TemplateShowcase />

      {/* Why Choose Us (Royal Indigo Section) */}
      <WhyChooseUs />

      {/* Created for Creators & Brands */}
      <CreatedBySection />

      {/* Second Yellow Marquee (Reverse Flow) */}
      <TickerMarquee reverse />

      {/* Who This Is Perfect For & Mobile Mockups */}
      <AudienceSection />

      {/* Pricing Section (Featured Split Box) */}
      <PricingSection />

      {/* Testimonials (3 Cards with Gold Quotes) */}
      <Testimonials />

      {/* FAQ Accordion */}
      <FaqSection />

      {/* High-Impact CTA Banner */}
      <CtaBanner />

      {/* Footer */}
      <Footer />
    </main>
  );
}
