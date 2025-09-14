import { createClient, RedisClientType } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';

export class RedisService {
  private static instance: RedisService;
  private client?: RedisClientType;
  private subscriber?: RedisClientType;
  private publisher?: RedisClientType;
  private isConnected: boolean = false;

  private constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    // Only create Redis clients if REDIS_URL is provided
    if (process.env.REDIS_URL) {
      this.client = createClient({ url: redisUrl });
      this.subscriber = createClient({ url: redisUrl });
      this.publisher = createClient({ url: redisUrl });
      this.setupEventHandlers();
    } else {
      console.warn('⚠️  REDIS_URL not provided, Redis features will be disabled');
    }
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  private setupEventHandlers(): void {
    if (this.client) {
      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        this.isConnected = false;
      });
    }

    if (this.subscriber) {
      this.subscriber.on('error', (err) => {
        console.error('Redis Subscriber Error:', err);
      });
    }

    if (this.publisher) {
      this.publisher.on('error', (err) => {
        console.error('Redis Publisher Error:', err);
      });
    }
  }

  public async connect(): Promise<void> {
    if (!this.client || !this.subscriber || !this.publisher) {
      console.warn('⚠️  Redis clients not initialized, skipping connection');
      return;
    }
    
    try {
      await Promise.all([
        this.client.connect(),
        this.subscriber.connect(),
        this.publisher.connect()
      ]);
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.client || !this.subscriber || !this.publisher) {
      return;
    }
    
    try {
      await Promise.all([
        this.client.disconnect(),
        this.subscriber.disconnect(),
        this.publisher.disconnect()
      ]);
    } catch (error) {
      console.error('Failed to disconnect from Redis:', error);
    }
  }

  public getClient(): RedisClientType | null {
    return this.client || null;
  }

  public getSubscriber(): RedisClientType | null {
    return this.subscriber || null;
  }

  public getPublisher(): RedisClientType | null {
    return this.publisher || null;
  }

  public getSocketIOAdapter() {
    if (!this.subscriber || !this.publisher) {
      return null;
    }
    return createAdapter(this.subscriber, this.publisher);
  }

  public isRedisConnected(): boolean {
    return this.isConnected;
  }

  // Cache operations
  public async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.client) {
      console.warn('⚠️  Redis not available, skipping SET operation');
      return;
    }
    
    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await this.client.setEx(key, ttl, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
    } catch (error) {
      console.error('Redis SET error:', error);
      throw error;
    }
  }

  public async get<T>(key: string): Promise<T | null> {
    if (!this.client) {
      console.warn('⚠️  Redis not available, returning null for GET operation');
      return null;
    }
    
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  public async del(key: string): Promise<void> {
    if (!this.client) {
      console.warn('⚠️  Redis not available, skipping DEL operation');
      return;
    }
    
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Redis DEL error:', error);
      throw error;
    }
  }

  public async exists(key: string): Promise<boolean> {
    if (!this.client) {
      console.warn('⚠️  Redis not available, returning false for EXISTS operation');
      return false;
    }
    
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  }

  // Pub/Sub operations
  public async publish(channel: string, message: any): Promise<void> {
    if (!this.publisher) {
      console.warn('⚠️  Redis not available, skipping PUBLISH operation');
      return;
    }
    
    try {
      const serializedMessage = JSON.stringify(message);
      await this.publisher.publish(channel, serializedMessage);
    } catch (error) {
      console.error('Redis PUBLISH error:', error);
      throw error;
    }
  }

  public async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    if (!this.subscriber) {
      console.warn('⚠️  Redis not available, skipping SUBSCRIBE operation');
      return;
    }
    
    try {
      await this.subscriber.subscribe(channel, (message) => {
        try {
          const parsedMessage = JSON.parse(message);
          callback(parsedMessage);
        } catch (error) {
          console.error('Error parsing Redis message:', error);
        }
      });
    } catch (error) {
      console.error('Redis SUBSCRIBE error:', error);
      throw error;
    }
  }

  public async unsubscribe(channel: string): Promise<void> {
    if (!this.subscriber) {
      console.warn('⚠️  Redis not available, skipping UNSUBSCRIBE operation');
      return;
    }
    
    try {
      await this.subscriber.unsubscribe(channel);
    } catch (error) {
      console.error('Redis UNSUBSCRIBE error:', error);
      throw error;
    }
  }

  // Hash operations for collaborative features
  public async hset(key: string, field: string, value: any): Promise<void> {
    if (!this.client) {
      console.warn('⚠️  Redis not available, skipping HSET operation');
      return;
    }
    
    try {
      const serializedValue = JSON.stringify(value);
      await this.client.hSet(key, field, serializedValue);
    } catch (error) {
      console.error('Redis HSET error:', error);
      throw error;
    }
  }

  public async hget<T>(key: string, field: string): Promise<T | null> {
    if (!this.client) {
      console.warn('⚠️  Redis not available, returning null for HGET operation');
      return null;
    }
    
    try {
      const value = await this.client.hGet(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis HGET error:', error);
      return null;
    }
  }

  public async hgetall<T>(key: string): Promise<Record<string, T>> {
    if (!this.client) {
      console.warn('⚠️  Redis not available, returning empty object for HGETALL operation');
      return {};
    }
    
    try {
      const hash = await this.client.hGetAll(key);
      const result: Record<string, T> = {};
      for (const [field, value] of Object.entries(hash)) {
        result[field] = JSON.parse(value);
      }
      return result;
    } catch (error) {
      console.error('Redis HGETALL error:', error);
      return {};
    }
  }

  public async hdel(key: string, field: string): Promise<void> {
    if (!this.client) {
      console.warn('⚠️  Redis not available, skipping HDEL operation');
      return;
    }
    
    try {
      await this.client.hDel(key, field);
    } catch (error) {
      console.error('Redis HDEL error:', error);
      throw error;
    }
  }

  // List operations for activity streams
  public async lpush(key: string, value: any): Promise<void> {
    if (!this.client) {
      console.warn('⚠️  Redis not available, skipping LPUSH operation');
      return;
    }
    
    try {
      const serializedValue = JSON.stringify(value);
      await this.client.lPush(key, serializedValue);
    } catch (error) {
      console.error('Redis LPUSH error:', error);
      throw error;
    }
  }

  public async rpop<T>(key: string): Promise<T | null> {
    if (!this.client) {
      console.warn('⚠️  Redis not available, returning null for RPOP operation');
      return null;
    }
    
    try {
      const value = await this.client.rPop(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis RPOP error:', error);
      return null;
    }
  }

  public async lrange<T>(key: string, start: number, stop: number): Promise<T[]> {
    if (!this.client) {
      console.warn('⚠️  Redis not available, returning empty array for LRANGE operation');
      return [];
    }
    
    try {
      const values = await this.client.lRange(key, start, stop);
      return values.map(value => JSON.parse(value));
    } catch (error) {
      console.error('Redis LRANGE error:', error);
      return [];
    }
  }
}

export const redisService = RedisService.getInstance();
