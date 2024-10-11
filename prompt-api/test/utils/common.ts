import { Server } from 'node:http';

import 'dotenv/config';
import { INestApplication, Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Admin, Consumer, EachMessagePayload } from 'kafkajs';
import * as express from 'express';
import * as bodyParser from 'body-parser';

import { AppModule, registerMiddlewares } from '../../src/app.module';
import { PromptResponseMappingDto } from '../../src/api/prompt/dto/prompt-response-mapping.dto';
import { getKafkaAdmin, disconnectKafkaClient } from '../../src/lib/kafka/kafka.module';
import { getRedisClient, disconnectRedisClient } from '../../src/lib/redis/redis.module';
import { promptApiResponsePassed } from '../fixtures/prompt-api-response';

export const initNestApp = async (): Promise<INestApplication> => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  registerMiddlewares(app);

  await app.init();
  return app;
};

export const listenToTestExpressApp = async (): Promise<Server> => {
  const app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  app.post(
    process.env.PROMPT_API_PROTECT as string,
    (request: express.Request, response: express.Response): void => {
      response.status(201).json(promptApiResponsePassed);
    },
  );

  const port = +(process.env.PROMPT_API_PORT as string);
  return app.listen(port, (): void => Logger.log(`Express app is listening on port: ${port}`));
};

export const teardown = async (app: INestApplication, testServer?: Server): Promise<void> => {
  // Purge data sources.
  const kafkaAdmin: Admin = await getKafkaAdmin();
  const topics: string[] = await kafkaAdmin.listTopics();
  const redisClient: any = await getRedisClient();
  await Promise.all([redisClient.flushAll(), kafkaAdmin.deleteTopics({ topics })]);

  // Disconnect data sources.
  const disconnectionPromises: Promise<void>[] = [
    disconnectRedisClient(redisClient),
    disconnectKafkaClient(kafkaAdmin),
    app.close(),
  ];

  if (testServer) {
    disconnectionPromises.push(
      new Promise(resolve => {
        testServer.close(() => resolve());
      }),
    );
  }

  await Promise.all(disconnectionPromises);
};

export const consumeLatestMessage = async (
  topic: string,
  consumer: Consumer,
): Promise<PromptResponseMappingDto | null> => {
  let result: PromptResponseMappingDto | null = null;
  await consumer.subscribe({ topic, fromBeginning: true });
  await consumer.run({
    // !!!Note, the EachMessageHandler is an async function as per kafkajs type declaration.
    // Hence, it is marked async below, even though no actual async operation take place.
    // TODO: fix kafkajs;
    // 1. There is no leader for this topic-partition as we are in the middle of a leadership election.
    // 2. The group coordinator is not available.
    eachMessage: async ({ message }: EachMessagePayload): Promise<void> => {
      if (message.value) {
        const payload = JSON.parse(message.value.toString());
        result = new PromptResponseMappingDto(payload.hash, payload.promptResponse);
      }
    },
  });

  return result;
};
