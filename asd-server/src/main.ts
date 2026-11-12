import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.useWebSocketAdapter(new WsAdapter(app));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  // CORS_ORIGIN is a comma-separated allowlist, or "*" (default) to reflect
  // any request origin. Leave unset to preserve the previous behaviour.
  const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN === '*'
      ? true
      : process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
    : true;
  app.enableCors({ origin: corsOrigin, credentials: true });

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`asd-server listening on http://localhost:${port} — REST /api/v1, WS /ws`);
}

void bootstrap();
