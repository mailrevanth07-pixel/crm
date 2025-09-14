import React, { ReactNode } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import RealtimeProvider to avoid SSR issues
const RealtimeProvider = dynamic(
  () => import('@/contexts/RealtimeContext').then(mod => ({ default: mod.RealtimeProvider })),
  { ssr: false }
);

interface ClientOnlyRealtimeProviderProps {
  children: ReactNode;
}

export default function ClientOnlyRealtimeProvider({ children }: ClientOnlyRealtimeProviderProps) {
  return <RealtimeProvider>{children}</RealtimeProvider>;
}
