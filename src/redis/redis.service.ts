import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  constructor() {
    this.client = new Redis(process.env.REDIS_URL);
    this.client.on('error', (err) => {
      console.error('[RedisService] Redis error:', err);
    });
  }
  async onModuleInit() {
    // test connection
    try {
      await this.client.ping();
      console.log('Redis connection established.');
    } catch (error) {
      console.error('Error connecting to Redis:', error);
    }
  }
  async onModuleDestroy() {
    // close connection
    await this.client.quit();
    console.log('Reddis connection closed.');
  }

  // Expose Redis client for use in the application
  getClient(): Redis {
    return this.client;
  }
  // Wrapper for Redis `get`
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  // Wrapper for Redis `set`
  async set(
    key: string,
    value: string,
    mode?: string,
    duration?: number,
  ): Promise<string | null> {
    return this.client.set(key, value);
  }
}
