/**
 * Mobile-Optimized Real-time Service
 * Uses polling instead of WebSockets for maximum mobile compatibility
 */

interface RealtimeConfig {
  apiUrl: string;
  token: string;
  pollInterval: number;
  retryAttempts: number;
  retryDelay: number;
}

interface RealtimeCallbacks {
  onNotification?: (data: any) => void;
  onActivity?: (data: any) => void;
  onPresence?: (data: any) => void;
  onError?: (error: any) => void;
  onStatusChange?: (status: 'connected' | 'disconnected' | 'error') => void;
}

class RealtimeService {
  private config: RealtimeConfig;
  private callbacks: RealtimeCallbacks = {};
  private pollInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private retryCount = 0;
  private lastPollTime = 0;
  private abortController: AbortController | null = null;

  constructor(config: RealtimeConfig) {
    this.config = config;
  }

  public setCallbacks(callbacks: RealtimeCallbacks) {
    this.callbacks = callbacks;
  }

  public start() {
    if (typeof window === 'undefined') {
      console.log('RealtimeService: Not in browser environment, skipping start');
      return;
    }

    if (this.isRunning) {
      console.log('RealtimeService: Already running');
      return;
    }

    console.log('RealtimeService: Starting polling service');
    this.isRunning = true;
    this.retryCount = 0;
    this.callbacks.onStatusChange?.('connected');
    this.startPolling();
  }

  public stop() {
    console.log('RealtimeService: Stopping polling service');
    this.isRunning = false;
    
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    this.callbacks.onStatusChange?.('disconnected');
  }

  private startPolling() {
    if (!this.isRunning) return;

    this.pollInterval = setInterval(() => {
      this.pollForUpdates();
    }, this.config.pollInterval);
  }

  private async pollForUpdates() {
    if (!this.isRunning) return;

    try {
      // Create new abort controller for this request
      this.abortController = new AbortController();
      
      const response = await fetch(`${this.config.apiUrl}/api/realtime/poll`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        signal: this.abortController.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.handlePollResponse(data);
      this.retryCount = 0; // Reset retry count on success

    } catch (error: any) {
      console.error('RealtimeService: Polling error', error);
      this.handlePollError(error);
    }
  }

  private handlePollResponse(data: any) {
    this.lastPollTime = Date.now();

    // Handle different types of real-time data
    if (data.notifications && data.notifications.length > 0) {
      data.notifications.forEach((notification: any) => {
        this.callbacks.onNotification?.(notification);
      });
    }

    if (data.activities && data.activities.length > 0) {
      data.activities.forEach((activity: any) => {
        this.callbacks.onActivity?.(activity);
      });
    }

    if (data.presence) {
      this.callbacks.onPresence?.(data.presence);
    }
  }

  private handlePollError(error: any) {
    this.retryCount++;
    
    if (this.retryCount >= this.config.retryAttempts) {
      console.error('RealtimeService: Max retries reached, stopping');
      this.callbacks.onError?.(error);
      this.callbacks.onStatusChange?.('error');
      this.stop();
      return;
    }

    // Exponential backoff
    const delay = this.config.retryDelay * Math.pow(2, this.retryCount - 1);
    console.log(`RealtimeService: Retrying in ${delay}ms (attempt ${this.retryCount})`);
    
    setTimeout(() => {
      if (this.isRunning) {
        this.pollForUpdates();
      }
    }, delay);
  }

  public getStatus() {
    return {
      isRunning: this.isRunning,
      retryCount: this.retryCount,
      lastPollTime: this.lastPollTime,
      timeSinceLastPoll: this.lastPollTime ? Date.now() - this.lastPollTime : null
    };
  }
}

export default RealtimeService;
