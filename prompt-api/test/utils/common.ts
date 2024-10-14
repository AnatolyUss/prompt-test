import { Server } from 'node:http';
import * as path from 'node:path';
import * as fs from 'node:fs';

import 'dotenv/config';
import { INestApplication, Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Admin, Consumer, EachMessagePayload } from 'kafkajs';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import PdfParse = require('pdf-parse'); // eslint-disable-line @typescript-eslint/no-require-imports

import { AppModule, registerMiddlewares } from '../../src/app.module';
import { PromptResponseMappingDto } from '../../src/api/prompt/dto/prompt-response-mapping.dto';
import { CreatePromptResponseDto } from '../../src/api/prompt/dto/create-prompt-response.dto';
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

const getPdfFilePath = (): string =>
  path.join(__dirname, '..', '..', '..', '..', 'assets', 'NodeJS_Cheatsheet_Zero_To_Mastery.pdf');

type Arranged = { pdfFilePath: string; prompt: PdfParse.Result };

export const arrange = async (): Promise<Arranged> => {
  const pdfFilePath: string = getPdfFilePath();
  const pdfBuffer: Buffer = fs.readFileSync(pdfFilePath);
  const prompt: PdfParse.Result = await PdfParse(pdfBuffer);
  return { pdfFilePath, prompt };
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

export const createKafkaTopic = async (): Promise<void> => {
  const kafkaAdmin: Admin = await getKafkaAdmin();
  const topics = [
    {
      topic: process.env.KAFKA_TOPIC_PROMPT_RESULTS_TO_STORE as string,
      numPartitions: 1,
      replicationFactor: 1,
    },
  ];

  await kafkaAdmin.createTopics({ topics, waitForLeaders: true });
  console.log(`Topic "${process.env.KAFKA_TOPIC_PROMPT_RESULTS_TO_STORE}" created successfully`);

  await kafkaAdmin.disconnect();
  console.log(`Admin has disconnected from Kafka broker`);
};

export const consumeLatestMessage = async (
  topic: string,
  consumer: Consumer,
): Promise<PromptResponseMappingDto | null> => {
  // TODO: fix kafkajs; Crash: KafkaJSGroupCoordinatorNotFound: Failed to find group coordinator.
  return new Promise(async (resolve, reject) => {
    try {
      await consumer.subscribe({ topic, fromBeginning: true });
      await consumer.run({
        autoCommit: true,
        // autoCommitInterval: 5_000, // 5 seconds.
        // autoCommitThreshold: 1, // Consumer commits offset after resolving 1 message.
        // !!!Note, the EachMessageHandler is an async function as per kafkajs type declaration.
        // Hence, it is marked async below, even though no actual async operation take place.
        eachMessage: async ({ message }: EachMessagePayload): Promise<void> => {
          if (message.value) {
            const payload = JSON.parse(message.value.toString());
            const { promptHash, fileName, ...promptResponse } = payload;
            resolve(
              new PromptResponseMappingDto(
                promptHash,
                new CreatePromptResponseDto(promptResponse),
                fileName,
              ),
            );
            return;
          }

          reject('No record');
        },
      });
    } catch (error) {
      reject(error);
    }
  });
};
