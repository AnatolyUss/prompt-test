import 'dotenv/config';
import { Module, Global, Logger } from '@nestjs/common';
import { createClient } from 'redis';

import { RedisService } from './redis.service';

export type RedisOptions = { url: string };

export const getRedisOptions = (): RedisOptions => {
  return {
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  };
};

export const getRedisClient = async (): Promise<any> => {
  try {
    const options = getRedisOptions();
    const client = createClient(options).on('error', err =>
      Logger.error(`Redis client error: ${JSON.stringify(err)}`),
    );

    await client.connect();
    Logger.log('Redis client connection established successfully');
    return client;
  } catch (error) {
    Logger.fatal(`Redis client connection error: ${JSON.stringify(error)}`);
    throw error;
  }
};

export const disconnectRedisClient = async (client: any): Promise<void> => {
  await client.disconnect();
};

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_OPTIONS',
      useValue: getRedisOptions(),
    },
    {
      inject: ['REDIS_OPTIONS'],
      provide: 'REDIS_CLIENT',
      useFactory: getRedisClient,
    },
    RedisService,
  ],
  exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule {}
