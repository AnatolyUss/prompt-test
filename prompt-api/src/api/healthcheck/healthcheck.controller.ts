import {
  Controller,
  Get,
  Param,
  InternalServerErrorException,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ApiResponse, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';

import { HealthcheckService } from './healthcheck.service';
import { HealthcheckResponseDto } from './dto/healthcheck-response.dto';
import { HealthcheckQueryDto } from './dto/healthcheck-query.dto';

@Controller('healthcheck')
export class HealthcheckController {
  constructor(private readonly healthcheckService: HealthcheckService) {}

  @Get(':id')
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiExtraModels(HealthcheckResponseDto)
  @ApiResponse({
    status: 200,
    schema: {
      $ref: getSchemaPath(HealthcheckResponseDto),
    },
  })
  async findOne(@Param() params: HealthcheckQueryDto): Promise<HealthcheckResponseDto> {
    const isAliveAndReady = await this.healthcheckService.isAliveAndReady(params.id);

    if (isAliveAndReady) {
      return new HealthcheckResponseDto({ statusCode: 200 });
    }

    throw new InternalServerErrorException();
  }
}
