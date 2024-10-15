import { Server } from 'node:http';
import * as path from 'node:path';
import * as fs from 'node:fs';

import 'dotenv/config';
import { INestApplication, Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import PdfParse = require('pdf-parse'); // eslint-disable-line @typescript-eslint/no-require-imports

import { AppModule, registerMiddlewares } from '../../src/app.module';
import { PromptResponseMappingDto } from '../../src/api/prompt/dto/prompt-response-mapping.dto';
import { CreatePromptResponseDto } from '../../src/api/prompt/dto/create-prompt-response.dto';
import { SqsService } from '../../src/lib/sqs/sqs.service';
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

const getTxtFilePath = (): string =>
  path.join(__dirname, '..', '..', '..', '..', 'assets', 'NodeJS_Cheatsheet_Zero_To_Mastery.txt');

type Arranged = { pdfFilePath: string; nonPdfFilePath: string; prompt: PdfParse.Result };

export const arrange = async (): Promise<Arranged> => {
  const pdfFilePath: string = getPdfFilePath();
  const nonPdfFilePath: string = getTxtFilePath();
  const pdfBuffer: Buffer = fs.readFileSync(pdfFilePath);
  const prompt: PdfParse.Result = await PdfParse(pdfBuffer);
  return { pdfFilePath, nonPdfFilePath, prompt };
};

export const teardown = async (app: INestApplication, testServer?: Server): Promise<void> => {
  // Purge data sources.
  const redisClient: any = await getRedisClient();
  await Promise.all([
    redisClient.flushAll(),
    new SqsService().deleteQueue(
      process.env.LOCALSTACK_SQS_QUEUE_PROMPT_RESULTS_TO_STORE as string,
    ),
  ]);

  // Disconnect data sources.
  const disconnectionPromises: Promise<void>[] = [disconnectRedisClient(redisClient), app.close()];

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
  queue: string,
): Promise<PromptResponseMappingDto | null> => {
  try {
    const latestMessage = await new SqsService().receiveMessage(queue);

    if (!latestMessage) {
      return null;
    }

    const payload = JSON.parse(latestMessage);
    const { promptHash, fileName, ...promptResponse } = payload;
    return new PromptResponseMappingDto(
      promptHash,
      new CreatePromptResponseDto(promptResponse),
      fileName,
    );
  } catch (error) {
    Logger.error(error);
    return null;
  }
};
