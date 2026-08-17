import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './libs/types/interceptor/Logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule); // AppModule is an argument here
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new LoggingInterceptor());
  await app.listen(process.env.PORT_API ?? 3007); // on the video it was still 3000 but my server didn't work  http://localhost:3007/
}
bootstrap();
