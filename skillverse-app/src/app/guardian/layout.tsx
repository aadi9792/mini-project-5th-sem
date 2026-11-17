'use client';

import { GuardianTokenProvider } from '@/lib/guardian/GuardianTokenContext';
import { ReactNode } from 'react';

export default function GuardianLayout({ children }: { children: ReactNode }) {
  return (
    <GuardianTokenProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        {children}
      </div>
    </GuardianTokenProvider>
  );
}

