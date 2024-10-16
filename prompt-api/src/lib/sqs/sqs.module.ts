import 'dotenv/config';
import { Module, Global } from '@nestjs/common';

import { SqsService } from './sqs.service';

@Global()
@Module({
  providers: [SqsService],
  exports: [SqsService],
})
export class SqsModule {}
