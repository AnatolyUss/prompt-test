export class CreatePromptResponseDto {
  constructor(promptResponse: Record<string, any>) {
    // For a sake of simplicity, the response is returned as-is, Record<string, any>.
    Object.assign(this, promptResponse);
  }
}
