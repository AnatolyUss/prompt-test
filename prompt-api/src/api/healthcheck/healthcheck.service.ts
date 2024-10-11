import { Injectable, Inject, Logger } from '@nestjs/common';

import { Probe } from './type/probe.enum';

@Injectable()
export class HealthcheckService {
  constructor(@Inject('REDIS_CLIENT') readonly redisDataSource: any) {}

  async isAliveAndReady(id: Probe): Promise<boolean> {
    if (id === Probe.LIVENESS) {
      return true;
    }

    const [promptApi, redis, kafka] = await Promise.allSettled([
      this.isPromptApiConnected(),
      this.isRedisConnected(),
      this.isKafkaConnected(),
    ]);

    return (
      promptApi.status === 'fulfilled' &&
      redis.status === 'fulfilled' &&
      kafka.status === 'fulfilled'
    );
  }

  isPromptApiConnected(): boolean {
    // In order to determine service's readiness, the PROMPT_API must be pinged to ensure its availability.
    // Here, for a sake of simplicity, just return true.
    return true;
  }

  isKafkaConnected(): boolean {
    // As described at https://github.com/tulios/kafkajs/issues/1296, kafkajs does not introduce any
    // reliable method, serving as a healthcheck.
    // Hence, returning true.
    return true;
  }

  async isRedisConnected(): Promise<boolean> {
    try {
      await this.redisDataSource.ping();
      return true;
    } catch (error) {
      Logger.error(`${this.isRedisConnected.name} error: ${JSON.stringify(error)}`);
      throw error;
    }
  }
}
