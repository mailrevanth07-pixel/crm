import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from '../contexts/AuthContext';
import ClientOnlyRealtimeProvider from '../components/ClientOnlyRealtimeProvider';
import MobileNotificationHandler from '../components/MobileNotificationHandler';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <ClientOnlyRealtimeProvider>
        <MobileNotificationHandler>
          <Component {...pageProps} />
        </MobileNotificationHandler>
      </ClientOnlyRealtimeProvider>
    </AuthProvider>
  );
}
