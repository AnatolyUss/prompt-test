import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class RedisService {
  // Note, no TS declarations found for npm redis.
  constructor(@Inject('REDIS_CLIENT') readonly redisDataSource: any) {}

  async get(key: string): Promise<string | null> {
    const response = await this.redisDataSource.get(key);
    return response || null;
  }

  async set(key: string, value: string, ttlSec?: number): Promise<void> {
    if (ttlSec) {
      await this.redisDataSource.set(key, value, { EX: ttlSec });
      return;
    }

    await this.redisDataSource.set(key, value);
  }

  async isRedisConnected(): Promise<boolean> {
    await this.redisDataSource.ping();
    return true;
  }

  async flushAll(): Promise<void> {
    await this.redisDataSource.flushAll();
  }
}
