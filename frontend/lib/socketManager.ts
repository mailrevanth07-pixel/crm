import { io, Socket } from 'socket.io-client';

class SocketManager {
  private socket: Socket | null = null;
  private queue: Array<{
    event: string;
    data: any;
    resolve: (value: any) => void;
    reject: (error: any) => void;
    ts: number;
  }> = [];
  private connected = false;
  private connecting = false;
  private url: string;
  private options: any;

  constructor() {
    this.url = process.env.NEXT_PUBLIC_API_URL || 'https://crm-19gz.onrender.com';
    
    // Detect mobile platform for optimized configuration
    const isMobile = this.detectMobile();
    
    this.options = {
      // Start with polling for better mobile compatibility
      transports: isMobile ? ['polling', 'websocket'] : ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: isMobile ? 2000 : 1000, // Longer delay for mobile
      reconnectionDelayMax: isMobile ? 10000 : 5000, // Longer max delay for mobile
      randomizationFactor: 0.5,
      autoConnect: false, // control when we connect
      auth: () => ({ token: this.getAuthToken() }),
      timeout: isMobile ? 20000 : 15000, // Longer timeout for mobile
      withCredentials: true,
      // Mobile-specific options
      upgrade: true,
      rememberUpgrade: true,
      // Add mobile-specific ping/pong settings
      pingTimeout: isMobile ? 120000 : 60000, // 2 minutes for mobile, 1 minute for desktop
      pingInterval: isMobile ? 30000 : 25000, // 30 seconds for mobile, 25 seconds for desktop
    };

    // Bind handlers
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleOnline = this.handleOnline.bind(this);
    this.handleOffline = this.handleOffline.bind(this);

    // Listen to browser events
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  private detectMobile(): boolean {
    if (typeof window === 'undefined') return false;
    
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
  }

  private getAuthToken(): string | null {
    // return your auth token (cookie/localStorage) or null
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken') || null;
    }
    return null;
  }

  public init(): void {
    if (this.socket || this.connecting) {
      console.log('SocketManager: Already initializing or initialized');
      return;
    }
    
    const token = this.getAuthToken();
    if (!token) {
      console.error('SocketManager: No auth token available');
      return;
    }
    
    console.log('SocketManager: Initializing socket connection...', {
      url: this.url,
      hasToken: !!token,
      isMobile: this.detectMobile()
    });
    
    this.connecting = true;

    // Create socket with options - auth can be function for fresh token on reconnect
    this.socket = io(this.url, this.options);

    // Standard lifecycle events
    this.socket.on('connect', () => {
      this.connected = true;
      this.connecting = false;
      console.log('SocketManager: Socket connected', {
        socketId: this.socket?.id,
        transport: this.socket?.io?.engine?.transport?.name
      });

      // Re-auth after reconnect (if needed)
      const token = this.getAuthToken();
      if (token) {
        this.socket?.emit('client:auth', token);
      }

      // Flush queued emits
      this.flushQueue();
    });

    this.socket.on('connect_error', (err) => {
      console.error('SocketManager: connect_error', {
        message: err.message,
        description: err.description,
        context: err.context,
        type: err.type
      });
      this.connecting = false;
      // Keep trying: socket.io handles reconnection automatically
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('SocketManager: socket disconnected', reason);
      this.connected = false;
      // don't destroy socket - allow reconnects
    });

    this.socket.on('reconnect_attempt', (n) => {
      console.log('SocketManager: reconnect attempt', n);
      this.connecting = true;
    });

    this.socket.on('reconnect', (n) => {
      console.log('SocketManager: reconnected after', n, 'attempts');
      this.connected = true;
      this.connecting = false;
    });

    this.socket.on('reconnect_error', (err) => {
      console.warn('SocketManager: reconnect error', err.message);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('SocketManager: reconnect failed');
      this.connecting = false;
    });

    // Handle authentication errors
    this.socket.on('auth_error', (error) => {
      console.error('SocketManager: auth error', error);
      this.connected = false;
      this.connecting = false;
    });

    // Handle server errors
    this.socket.on('error', (error) => {
      console.error('SocketManager: socket error', error);
    });
  }

  // Add an event listener
  public on(event: string, cb: (...args: any[]) => void): void {
    if (!this.socket) this.init();
    this.socket?.on(event, cb);
  }

  // Remove an event listener
  public off(event: string, cb?: (...args: any[]) => void): void {
    this.socket?.off(event, cb);
  }

  // Emit safely (queued if not connected)
  public emit(event: string, data?: any): Promise<any> {
    if (this.connected && this.socket?.connected) {
      this.socket.emit(event, data);
      return Promise.resolve();
    }
    
    // queue with a timestamp
    return new Promise((resolve, reject) => {
      const item = { 
        event, 
        data, 
        resolve, 
        reject, 
        ts: Date.now() 
      };
      this.queue.push(item);
      
      // optional: timeout queue item (remove after 30s)
      setTimeout(() => {
        const index = this.queue.indexOf(item);
        if (index > -1) {
          this.queue.splice(index, 1);
          reject(new Error('Queue item timeout'));
        }
      }, 30000);
    });
  }

  private flushQueue(): void {
    console.log('SocketManager: Flushing queue', this.queue.length, 'items');
    
    while (this.queue.length > 0 && this.connected && this.socket?.connected) {
      const item = this.queue.shift();
      if (item) {
        try {
          this.socket?.emit(item.event, item.data, (ack: any) => {
            item.resolve(ack);
          });
        } catch (err) {
          item.reject(err);
        }
      }
    }
  }

  private handleVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      console.log('SocketManager: Page became visible, ensuring socket connected');
      // When tab becomes visible, ensure socket is connected
      if (!this.socket) {
        this.init();
      } else if (!this.socket.connected) {
        this.socket.connect();
      }
    } else {
      console.log('SocketManager: Page hidden');
      // For mobile devices, we might want to be more aggressive about reconnection
      // when the app comes back to foreground
      if (this.detectMobile()) {
        // On mobile, we can be more aggressive about reconnection
        setTimeout(() => {
          if (this.socket && !this.socket.connected) {
            console.log('SocketManager: Mobile - attempting reconnection after visibility change');
            this.socket.connect();
          }
        }, 1000);
      }
    }
  }

  private handleOnline(): void {
    console.log('SocketManager: Network online - ensuring socket connected');
    if (!this.socket) {
      this.init();
    } else if (!this.socket.connected) {
      this.socket.connect();
    }
    
    // For mobile, add a small delay to ensure network is stable
    if (this.detectMobile()) {
      setTimeout(() => {
        if (this.socket && !this.socket.connected) {
          console.log('SocketManager: Mobile - delayed reconnection after network online');
          this.socket.connect();
        }
      }, 2000);
    }
  }

  private handleOffline(): void {
    console.log('SocketManager: Network offline - marking disconnected');
    this.connected = false;
    
    // For mobile, we might want to clear the queue when offline
    if (this.detectMobile()) {
      console.log('SocketManager: Mobile - clearing queue due to offline status');
      this.queue = [];
    }
  }

  // Get connection status
  public isConnected(): boolean {
    return this.connected && this.socket?.connected === true;
  }

  // Get connection status details
  public getConnectionStatus(): {
    connected: boolean;
    connecting: boolean;
    socketId: string | null;
    transport: string | null;
    queueLength: number;
    isMobile: boolean;
    userAgent: string;
  } {
    return {
      connected: this.connected,
      connecting: this.connecting,
      socketId: this.socket?.id || null,
      transport: this.socket?.io?.engine?.transport?.name || null,
      queueLength: this.queue.length,
      isMobile: this.detectMobile(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'Server'
    };
  }

  // Force reconnection
  public reconnect(): void {
    console.log('SocketManager: Manual reconnection requested');
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connected = false;
    this.connecting = false;
    
    // Ensure we have a token before reconnecting
    const token = this.getAuthToken();
    if (!token) {
      console.error('SocketManager: Cannot reconnect - no auth token');
      return;
    }
    
    this.init();
  }

  // Force connection (for debugging)
  public forceConnect(): void {
    console.log('SocketManager: Force connection requested');
    if (this.socket && this.socket.connected) {
      console.log('SocketManager: Already connected');
      return;
    }
    
    if (!this.socket) {
      this.init();
    } else {
      this.socket.connect();
    }
  }

  // Call this to gracefully destroy event listeners
  public destroy(): void {
    console.log('SocketManager: Destroying socket manager');
    
    if (typeof window !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    
    if (this.socket) {
      this.socket.off();
      this.socket.close();
      this.socket = null;
    }
    
    this.connected = false;
    this.connecting = false;
    this.queue = [];
  }
}

// Export a singleton
const socketManager = new SocketManager();
export default socketManager;
