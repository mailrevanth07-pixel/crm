import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from '../contexts/AuthContext';
import ClientOnlyRealtimeProvider from '../components/ClientOnlyRealtimeProvider';
import { SocketProvider } from '../contexts/SocketContext';
import { MQTTProvider } from '../contexts/MQTTContext';
import { HybridRealtimeProvider } from '../contexts/HybridRealtimeContext';
import MobileNotificationHandler from '../components/MobileNotificationHandler';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <MQTTProvider>
        <ClientOnlyRealtimeProvider>
          <SocketProvider>
            <HybridRealtimeProvider>
              <MobileNotificationHandler>
                <Component {...pageProps} />
              </MobileNotificationHandler>
            </HybridRealtimeProvider>
          </SocketProvider>
        </ClientOnlyRealtimeProvider>
      </MQTTProvider>
    </AuthProvider>
  );
}
