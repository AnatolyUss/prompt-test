import { Injectable, Logger } from '@nestjs/common';

import { Probe } from './type/probe.enum';
import { SqsService } from '../../lib/sqs/sqs.service';
import { RedisService } from '../../lib/redis/redis.service';

@Injectable()
export class HealthcheckService {
  constructor(
    readonly redisService: RedisService,
    readonly sqsService: SqsService,
  ) {}

  async isAliveAndReady(id: Probe): Promise<boolean> {
    if (id === Probe.LIVENESS) {
      return true;
    }

    const [promptApi, redis, sqs] = await Promise.allSettled([
      this.isPromptApiConnected(),
      this.isRedisConnected(),
      this.isSqsConnected(),
    ]);

    return (
      promptApi.status === 'fulfilled' && redis.status === 'fulfilled' && sqs.status === 'fulfilled'
    );
  }

  isPromptApiConnected(): boolean {
    // In order to determine service's readiness, the PROMPT_API must be pinged to ensure its availability.
    // Here, for a sake of simplicity, just return true.
    return true;
  }

  async isSqsConnected(): Promise<boolean> {
    try {
      const queues: string[] = await this.sqsService.listQueues();
      return queues.length !== 0;
    } catch (error) {
      Logger.error(`${this.isSqsConnected.name} error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async isRedisConnected(): Promise<boolean> {
    try {
      return await this.redisService.isRedisConnected();
    } catch (error) {
      Logger.error(`${this.isRedisConnected.name} error: ${JSON.stringify(error)}`);
      throw error;
    }
  }
}
