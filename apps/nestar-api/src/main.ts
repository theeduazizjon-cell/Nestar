import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT_API ?? 3007); // on the video it was still 3000 but my server didn't work 
}
bootstrap();
