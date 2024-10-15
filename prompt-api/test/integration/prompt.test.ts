import { Server } from 'node:http';

import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import PdfParse = require('pdf-parse'); // eslint-disable-line @typescript-eslint/no-require-imports

import {
  initNestApp,
  listenToTestExpressApp,
  teardown,
  consumeLatestMessage,
  arrange,
} from '../utils/common';
import { promptApiResponsePassed } from '../fixtures/prompt-api-response';
import { PromptService } from '../../src/api/prompt/prompt.service';
import { PromptController } from '../../src/api/prompt/prompt.controller';
import { CreatePromptResponseDto } from '../../src/api/prompt/dto/create-prompt-response.dto';
import { PromptResponseMappingDto } from '../../src/api/prompt/dto/prompt-response-mapping.dto';
import { RedisModule } from '../../src/lib/redis/redis.module';
import { SqsModule } from '../../src/lib/sqs/sqs.module';
import { SqsService } from '../../src/lib/sqs/sqs.service';
import { RedisService } from '../../src/lib/redis/redis.service';

describe('prompt resource tests', (): void => {
  const queue = process.env.LOCALSTACK_SQS_QUEUE_PROMPT_RESULTS_TO_STORE as string;
  let prompt: PdfParse.Result;
  let pdfFilePath: string;
  let nonPdfFilePath: string;
  let app: INestApplication;
  let testServer: Server;
  let promptService: PromptService;
  let sqsService: SqsService;
  let redisService: RedisService;

  beforeEach(async (): Promise<void> => {
    // Run a real, non mocked http server, in order to check entire http communication cycle.
    [app, testServer] = await Promise.all([initNestApp(), listenToTestExpressApp()]);
    const promptModuleRef: TestingModule = await Test.createTestingModule({
      controllers: [PromptController],
      providers: [PromptService, SqsService, RedisService],
      imports: [
        SqsModule,
        RedisModule,
        HttpModule.register({
          // In milliseconds; default is 0, meaning no timeout.
          timeout: +(process.env.HTTP_TIMEOUT as string),
        }),
      ],
    }).compile();

    promptService = promptModuleRef.get<PromptService>(PromptService);
    sqsService = promptModuleRef.get<SqsService>(SqsService);
    redisService = promptModuleRef.get<RedisService>(RedisService);
    await sqsService.createQueue(queue);
    ({ pdfFilePath, nonPdfFilePath, prompt } = await arrange());
  });

  afterEach(async (): Promise<void> => {
    await teardown(app, testServer);
  });

  it('should not inspect prompt due to short file name', async (): Promise<void> => {
    // Arrange and Act.
    const response = await request(app.getHttpServer())
      .post('/prompt')
      .attach(process.env.HTML_FILE_FIELD_NAME as string, pdfFilePath)
      .field('fileName', 'Ipdf');

    // Assert.
    expect(response.status).toBe(400);
    expect(response.body).toStrictEqual({
      message: ['"fileName" length cannot be less than 5'],
      error: 'Bad Request',
      statusCode: 400,
    });
  });

  it('should not inspect prompt due to presence of unexpected field', async (): Promise<void> => {
    // Arrange and Act.
    const response = await request(app.getHttpServer())
      .post('/prompt')
      .attach('file', pdfFilePath)
      .field('fileName', pdfFilePath);

    // Assert.
    expect(response.status).toBe(400);
    expect(response.body).toStrictEqual({
      message: 'Unexpected field',
      error: 'Bad Request',
      statusCode: 400,
    });
  });

  it('should not inspect non PDF file', async (): Promise<void> => {
    // Arrange and Act.
    const response = await request(app.getHttpServer())
      .post('/prompt')
      .attach(process.env.HTML_FILE_FIELD_NAME as string, nonPdfFilePath)
      .field('fileName', nonPdfFilePath);

    // Assert.
    expect(response.status).toBe(400);
    expect(response.body).toStrictEqual({
      message: 'Validation failed (expected type is application/pdf)',
      error: 'Bad Request',
      statusCode: 400,
    });
  });

  it('should successfully inspect prompt; no prompt-result mapping in Redis', async (): Promise<void> => {
    // Arrange and Act.
    const response = await request(app.getHttpServer())
      .post('/prompt')
      .attach(process.env.HTML_FILE_FIELD_NAME as string, pdfFilePath)
      .field('fileName', pdfFilePath);

    const promptHash: string = promptService.getPromptHash(prompt.text);
    const promptResponseFromRedis = await promptService.getPromptResponseFromRedis(promptHash);

    // Assert.
    expect(response.status).toBe(201);
    expect(response.body).toStrictEqual(promptApiResponsePassed);
    expect(promptResponseFromRedis === null).toBe(true);

    const msg = await consumeLatestMessage(queue);
    expect(msg).toStrictEqual(
      new PromptResponseMappingDto(promptHash, promptApiResponsePassed, pdfFilePath),
    );
  });

  it('should successfully inspect prompt; prompt-result mapping stored in Redis', async (): Promise<void> => {
    // Arrange.
    const promptHash: string = promptService.getPromptHash(prompt.text);
    const promptResponse = new CreatePromptResponseDto(promptApiResponsePassed);
    await redisService.set(promptHash, JSON.stringify(promptResponse));

    // Act.
    const response = await request(app.getHttpServer())
      .post('/prompt')
      .attach(process.env.HTML_FILE_FIELD_NAME as string, pdfFilePath)
      .field('fileName', pdfFilePath);

    const promptResponseFromRedis = await promptService.getPromptResponseFromRedis(promptHash);

    // Assert.
    expect(response.status).toBe(201);
    expect(response.body).toStrictEqual(promptApiResponsePassed);
    expect(promptResponseFromRedis).toStrictEqual(promptResponse);

    const msg = await consumeLatestMessage(queue);
    expect(msg === null).toBe(true);
  });
});
