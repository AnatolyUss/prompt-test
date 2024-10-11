import * as crypto from 'node:crypto';

import { Inject, Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Observable, catchError, firstValueFrom } from 'rxjs';
import { retry } from 'rxjs/operators';
import { Producer, Consumer } from 'kafkajs';

import { CreatePromptDto } from './dto/create-prompt.dto';
import { CreatePromptResponseDto } from './dto/create-prompt-response.dto';
import { PromptResponseMappingDto } from './dto/prompt-response-mapping.dto';

@Injectable()
export class PromptService {
  constructor(
    @Inject('KAFKA_PRODUCER') readonly kafkaProducer: Producer,
    @Inject('KAFKA_CONSUMER') readonly kafkaConsumer: Consumer, // Used during testing.
    @Inject('KAFKA_TOPIC') readonly kafkaTopic: string,
    @Inject('REDIS_CLIENT') readonly redisDataSource: any, // No TS declarations found.
    readonly httpService: HttpService,
  ) {}

  /**
   * TODO: add comment/docs to each method.
   */
  async inspectPrompt(dto: CreatePromptDto): Promise<CreatePromptResponseDto> {
    try {
      // !!!Note, the ValidationPipe automatically transform payloads to be objects,
      // typed according to their DTO classes.
      // Meaning, that input validation is performed automatically, "under the hood".
      // Hence, no need to add any validation logic neither at the service nor at the controller.
      const promptHash: string = this.getPromptHash(dto.prompt);
      const promptResponseFromRedis: CreatePromptResponseDto | null =
        await this.getPromptResponseFromRedis(promptHash);

      if (promptResponseFromRedis) {
        // Response for given prompt was found in Redis.
        // Return it right away.
        return promptResponseFromRedis;
      }

      const responseDto: CreatePromptResponseDto = await this.queryApiProtect(dto);

      // Notify "prompt-background" service to store a new prompt-result mapping.
      await this.kafkaProducer.connect();
      await this.kafkaProducer.send({
        topic: this.kafkaTopic,
        messages: [
          {
            // partition: 0,
            // key: `key-${Math.random() * (10 - 1) + 1}`,
            value: JSON.stringify(new PromptResponseMappingDto(promptHash, responseDto)),
          },
        ],
      });

      return responseDto;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      Logger.fatal(`${this.inspectPrompt.name} failed to validate prompt: ${dto.prompt}`);
      throw new InternalServerErrorException(); // Return status 500 to the client.
    }
  }

  getPromptHash(prompt: string): string {
    return crypto.createHash('sha256').update(prompt).digest('hex');
  }

  async getPromptResponseFromRedis(key: string): Promise<CreatePromptResponseDto | null> {
    const promptResponse = await this.redisDataSource.get(key);
    return promptResponse ? new CreatePromptResponseDto(JSON.parse(promptResponse)) : null;
  }

  async setPromptResponseInRedis(
    promptHash: string,
    promptResponse: CreatePromptResponseDto,
  ): Promise<void> {
    await this.redisDataSource.set(promptHash, JSON.stringify(promptResponse)); // Note, no TTL on purpose.
  }

  async queryApiProtect(dto: CreatePromptDto): Promise<CreatePromptResponseDto> {
    const config: AxiosRequestConfig = this.getAxiosRequestConfig(dto);

    const observableSource: Observable<AxiosResponse<Partial<CreatePromptResponseDto>>> =
      this.httpService.request<Partial<CreatePromptResponseDto>>(config).pipe(
        catchError((axiosError: AxiosError): never => {
          Logger.error(`Error at ${this.inspectPrompt.name}: ${JSON.stringify(axiosError)}`);
          throw new InternalServerErrorException();
        }),
        retry({ count: 3, delay: 100 }), // Max of 3 retries, with a delay of 100 milliseconds.
      );

    const { data } = await firstValueFrom(observableSource);
    return new CreatePromptResponseDto(data);
  }

  private getAxiosRequestConfig(dto: CreatePromptDto): AxiosRequestConfig {
    const method = process.env.PROMPT_API_PROTECT_METHOD;
    const baseUrl = process.env.PROMPT_API_BASE_URL;
    const port = process.env.PROMPT_API_PORT;
    const endpoint = process.env.PROMPT_API_PROTECT;
    const url = `${baseUrl}:${port}${endpoint}`;
    const headers = { 'Content-Type': 'application/json', 'APP-ID': process.env.PROMPT_APP_ID };
    return { url, method, headers, data: { prompt: dto.prompt } };
  }
}
