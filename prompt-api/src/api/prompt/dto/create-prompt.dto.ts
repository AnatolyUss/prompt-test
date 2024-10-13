import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDefined, IsString, MinLength, MaxLength } from 'class-validator';

export class CreatePromptDto {
  @ApiProperty({
    required: true,
    description: 'Prompt file name',
  })
  @Expose()
  @IsDefined({ message: '"fileName" is missing' })
  @IsString({ message: '"fileName" must be a string' })
  @MinLength(5, { message: '"fileName" length cannot be less than 5' })
  @MaxLength(1_000, { message: '"fileName" length cannot be more than 1000' })
  fileName: string;
}
