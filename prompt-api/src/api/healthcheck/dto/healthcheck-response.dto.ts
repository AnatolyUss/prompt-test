import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class HealthcheckResponseDto {
  @ApiProperty({
    required: true,
    description: 'HTTP response status code',
  })
  @Expose()
  statusCode: number;

  constructor(partial: Partial<HealthcheckResponseDto>) {
    Object.assign(this, partial);
  }
}
