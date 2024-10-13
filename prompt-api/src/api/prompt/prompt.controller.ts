import { Express } from 'express';
import { ApiBody, ApiConsumes, ApiResponse, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { Body, Controller, Post, UseInterceptors, UploadedFile } from '@nestjs/common';

import { PromptService } from './prompt.service';
import { CreatePromptResponseDto } from './dto/create-prompt-response.dto';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { getFileInterceptor, getParseFilePipeBuilder } from './util/prompt-utls';

@Controller('prompt')
export class PromptController {
  constructor(readonly promptService: PromptService) {}

  @Post()
  @UseInterceptors(getFileInterceptor())
  @ApiExtraModels(CreatePromptResponseDto)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fileName: {
          type: 'string',
        },
        [process.env.HTML_FILE_FIELD_NAME as string]: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    schema: {
      $ref: getSchemaPath(CreatePromptResponseDto),
    },
  })
  async create(
    @Body() dto: CreatePromptDto,
    @UploadedFile(getParseFilePipeBuilder()) file: Express.Multer.File,
  ): Promise<CreatePromptResponseDto> {
    // Note, post payload is validated via registered global pipes.
    // For the reference, have a look at "app.module.ts".
    return await this.promptService.inspectPrompt(dto, file);
  }
}
