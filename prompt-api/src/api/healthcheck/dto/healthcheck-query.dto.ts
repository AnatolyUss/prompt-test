import { IsDefined, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { Probe } from '../type/probe.enum';

export class HealthcheckQueryDto {
  @ApiProperty({
    required: true,
    description: 'One of healthcheck methods: "liveness" or "readiness"',
  })
  @IsDefined({ message: '"id" is missing' })
  @IsEnum(Probe, { message: `"id" can only be one of following: ${Object.values(Probe)}` })
  id: Probe;
}
