import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from '../contexts/AuthContext';
import { RealtimeProvider } from '../contexts/RealtimeContext';
import MobileNotificationHandler from '../components/MobileNotificationHandler';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <MobileNotificationHandler>
          <Component {...pageProps} />
        </MobileNotificationHandler>
      </RealtimeProvider>
    </AuthProvider>
  );
}
