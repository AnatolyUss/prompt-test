import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { initNestApp } from '../utils/common';

describe('healthcheck resource tests', (): void => {
  let app: INestApplication;

  beforeEach(async (): Promise<void> => {
    app = await initNestApp();
  });

  afterEach(async (): Promise<void> => {
    await app.close();
  });

  it('should return code 200 by calling GET /healthcheck/liveness', async (): Promise<void> => {
    // Arrange and Act.
    const response = await request(app.getHttpServer()).get('/healthcheck/liveness');

    // Assert.
    expect(response.status).toBe(200);
    expect(response.body.statusCode).toBe(200);
  });

  it('should return code 200 by calling GET /healthcheck/readiness', async (): Promise<void> => {
    // Arrange and Act.
    const response = await request(app.getHttpServer()).get('/healthcheck/readiness');

    // Assert.
    expect(response.status).toBe(200);
    expect(response.body.statusCode).toBe(200);
  });

  it('should return code 400 by calling GET /healthcheck/liveness2', async (): Promise<void> => {
    // Arrange and Act.
    const response = await request(app.getHttpServer()).get('/healthcheck/liveness2');

    // Assert.
    expect(response.status).toBe(400);
    expect(response.body.statusCode).toBe(400);
  });

  it('should return code 400 by calling GET /healthcheck/readiness2', async (): Promise<void> => {
    // Arrange and Act.
    const response = await request(app.getHttpServer()).get('/healthcheck/readiness2');

    // Assert.
    expect(response.status).toBe(400);
    expect(response.body.statusCode).toBe(400);
  });
});
