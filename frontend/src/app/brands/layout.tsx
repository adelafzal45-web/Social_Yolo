'use client';

import React from 'react';
import DashboardLayout from '../dashboard/layout';

export default function BrandsLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
