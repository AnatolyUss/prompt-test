import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { PromptService } from './prompt.service';
import { PromptController } from './prompt.controller';

@Module({
  imports: [
    HttpModule.register({
      // In milliseconds; default is 0, meaning no timeout.
      timeout: +(process.env.HTTP_TIMEOUT as string),
    }),
  ],
  controllers: [PromptController],
  providers: [PromptService],
})
export class PromptModule {}
