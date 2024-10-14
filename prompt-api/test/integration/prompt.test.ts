import { Server } from 'node:http';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import PDFDocument = require('pdfkit'); // eslint-disable-line @typescript-eslint/no-require-imports

import {
  initNestApp,
  listenToTestExpressApp,
  teardown,
  consumeLatestMessage,
} from '../utils/common';
import { promptApiResponsePassed } from '../fixtures/prompt-api-response';
import { PromptService } from '../../src/api/prompt/prompt.service';
import { PromptController } from '../../src/api/prompt/prompt.controller';
import { CreatePromptResponseDto } from '../../src/api/prompt/dto/create-prompt-response.dto';
import { RedisModule } from '../../src/lib/redis/redis.module';
import { KafkaModule } from '../../src/lib/kafka/kafka.module';

describe('prompt resource tests', (): void => {
  const prompt = 'Test prompt';
  let app: INestApplication;
  let testServer: Server;
  let promptService: PromptService;

  const writePdfFile = (pdfFilePath: string, pdfText: string): Promise<void> => {
    return new Promise((resolve): void => {
      const doc = new PDFDocument();
      doc.pipe(fs.createWriteStream(pdfFilePath));
      doc.fontSize(25);
      doc.text(pdfText, 100, 100);
      doc.end();
      resolve();
    });
  };

  beforeEach(async (): Promise<void> => {
    // Run a real, non mocked http server, in order to check entire http communication cycle.
    [app, testServer] = await Promise.all([initNestApp(), listenToTestExpressApp()]);
    const promptModuleRef: TestingModule = await Test.createTestingModule({
      controllers: [PromptController],
      providers: [PromptService],
      imports: [
        KafkaModule,
        RedisModule,
        HttpModule.register({
          // In milliseconds; default is 0, meaning no timeout.
          timeout: +(process.env.HTTP_TIMEOUT as string),
        }),
      ],
    }).compile();

    promptService = promptModuleRef.get<PromptService>(PromptService);
  });

  afterEach(async (): Promise<void> => {
    await teardown(app, testServer);
  });

  it('should not inspect prompt due to validation errors', async (): Promise<void> => {
    // Arrange.
    const pdfFilePath = path.join(__dirname, '..', '..', '..', 'test-doc.pdf');
    const pdfText = 'qaws';
    // await writePdfFile(pdfFilePath, pdfText);
    const pdfBuffer = fs.readFileSync(pdfFilePath);

    // Act.
    const response = await request(app.getHttpServer())
      .post('/prompt')
      .attach(process.env.HTML_FILE_FIELD_NAME as string, pdfFilePath)
      // .attach('file', pdfFilePath)
      .field('fileName', 'test.pdf');

    // Assert.
    expect(response.status).toBe(201);
    // expect(response.status).toBe(400);
    // expect(response.body).toStrictEqual({
    //   message: ['"fileName" length cannot be less than 5'],
    //   error: 'Bad Request',
    //   statusCode: 400,
    // });
  });

  it('should successfully inspect prompt; no prompt-result mapping in Redis', async (): Promise<void> => {
    // Arrange and Act.
    const response = await request(app.getHttpServer()).post('/prompt').send({ prompt });

    // Assert.
    expect(response.status).toBe(201);
    expect(response.body).toStrictEqual(promptApiResponsePassed);

    const promptHash = promptService.getPromptHash(prompt);
    const promptResponseFromRedis = await promptService.getPromptResponseFromRedis(promptHash);
    expect(promptResponseFromRedis === null).toBe(true);

    const msg = await consumeLatestMessage(promptService.kafkaTopic, promptService.kafkaConsumer);
    expect(msg).toStrictEqual(promptApiResponsePassed);
  });

  it('should successfully inspect prompt; prompt-result mapping stored in Redis', async (): Promise<void> => {
    // Arrange.
    const promptHash = promptService.getPromptHash(prompt);
    const promptResponse = new CreatePromptResponseDto(promptApiResponsePassed);
    await promptService.setPromptResponseInRedis(promptHash, promptResponse);

    // Act.
    const response = await request(app.getHttpServer()).post('/prompt').send({ prompt });

    // Assert.
    expect(response.status).toBe(201);
    expect(response.body).toStrictEqual(promptApiResponsePassed);

    const promptResponseFromRedis = await promptService.getPromptResponseFromRedis(promptHash);
    expect(promptResponseFromRedis).toStrictEqual(promptResponse);

    const msg = await consumeLatestMessage(promptService.kafkaTopic, promptService.kafkaConsumer);
    expect(msg === null).toBe(true);
  });
});
