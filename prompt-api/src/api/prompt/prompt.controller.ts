import { ApiResponse, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { Controller, Post, Body } from '@nestjs/common';

import { PromptService } from './prompt.service';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { CreatePromptResponseDto } from './dto/create-prompt-response.dto';

@Controller('prompt')
export class PromptController {
  constructor(private readonly promptService: PromptService) {}

  @Post()
  @ApiExtraModels(CreatePromptResponseDto)
  @ApiResponse({
    status: 201,
    schema: {
      $ref: getSchemaPath(CreatePromptResponseDto),
    },
  })
  async create(@Body() dto: CreatePromptDto): Promise<CreatePromptResponseDto> {
    // !!!Note, the ValidationPipe automatically transform payloads to be objects,
    // typed according to their DTO classes.
    // Meaning, that input validation is performed automatically, "under the hood".
    // Hence, no need to add any validation logic neither at the service nor at the controller.
    return await this.promptService.inspectPrompt(dto);
  }
}
