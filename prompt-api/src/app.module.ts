import 'dotenv/config';
import helmet from 'helmet';
import { Module, INestApplication, ValidationPipe } from '@nestjs/common';

import { RedisModule } from './lib/redis/redis.module';
import { SqsModule } from './lib/sqs/sqs.module';
import { HealthcheckModule } from './api/healthcheck/healthcheck.module';
import { PromptModule } from './api/prompt/prompt.module';

@Module({
  imports: [RedisModule, SqsModule, HealthcheckModule, PromptModule],
})
export class AppModule {}

export const registerMiddlewares = (app: INestApplication): void => {
  // Protect the app from some well-known web vulnerabilities by setting HTTP headers appropriately.
  // Generally, Helmet is just a collection of smaller middleware functions,
  // that set security-related HTTP headers.
  app.use(helmet());

  // Payloads coming in over the network are plain JavaScript objects.
  // The ValidationPipe can automatically transform payloads to be objects,
  // typed according to their DTO classes.
  // To enable auto-transformation, set "transform" to true.
  // If "whitelist" set to true,
  // validator will strip validated object of any properties, that do not have any decorators.
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
};
