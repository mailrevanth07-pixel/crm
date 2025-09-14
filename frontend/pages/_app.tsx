import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from '../contexts/AuthContext';
import ClientOnlyRealtimeProvider from '../components/ClientOnlyRealtimeProvider';
import { SocketProvider } from '../contexts/SocketContext';
import MobileNotificationHandler from '../components/MobileNotificationHandler';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <ClientOnlyRealtimeProvider>
        <SocketProvider>
          <MobileNotificationHandler>
            <Component {...pageProps} />
          </MobileNotificationHandler>
        </SocketProvider>
      </ClientOnlyRealtimeProvider>
    </AuthProvider>
  );
}
