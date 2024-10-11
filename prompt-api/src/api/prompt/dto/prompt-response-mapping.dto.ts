export class PromptResponseMappingDto {
  hash: string;
  promptResponse: Record<string, any>;

  constructor(hash: string, promptResponse: Record<string, any>) {
    this.hash = hash;
    this.promptResponse = promptResponse;
  }
}
