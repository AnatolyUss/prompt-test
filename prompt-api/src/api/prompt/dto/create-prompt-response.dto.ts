export class CreatePromptResponseDto {
  constructor(promptResponse: Record<string, any>) {
    // I barely understand how the actual response looks like, since no docs reference provided.
    // Hence, for a sake of simplicity, the response is returned as-is, Record<string, any>.
    Object.assign(this, promptResponse);
  }
}
