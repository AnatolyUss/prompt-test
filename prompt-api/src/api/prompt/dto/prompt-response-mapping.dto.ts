import { CreatePromptResponseDto } from './create-prompt-response.dto';

export class PromptResponseMappingDto {
  constructor(promptHash: string, promptResponse: CreatePromptResponseDto, fileName: string) {
    Object.assign(this, Object.assign(structuredClone(promptResponse), { promptHash, fileName }));
  }
}
