import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDefined, IsString, MinLength, MaxLength } from 'class-validator';

export class CreatePromptDto {
  @ApiProperty({
    required: true,
    description: 'Prompt is a text to inspect',
  })
  @Expose()
  @IsDefined({ message: '"prompt" is missing' })
  @IsString({ message: '"prompt" must be a string' })
  @MinLength(1, { message: '"prompt" cannot be empty' })
  @MaxLength(8_000_000, { message: '"prompt" maximum length, as per ChatGPT, is 2M tokens, which is roughly 2M * 4 characters' })
  prompt: string;
}
