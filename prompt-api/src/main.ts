import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { AppModule, registerMiddlewares } from './app.module';

const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create(AppModule);
  registerMiddlewares(app);

  const config = new DocumentBuilder()
    .setTitle('Prompt-API')
    .setVersion('0.1.0')
    .addTag('Prompt-API 0.1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document);

  await app.listen(+(process.env.HTTP_PORT as string));
};

(async (): Promise<void> => {
  await bootstrap();
})();
