import { NestFactory } from '@nestjs/core';
import { BatchModule } from './batch.module';

async function bootstrap() {
  const app = await NestFactory.create(BatchModule);
  await app.listen(process.env.port ?? 3008); // not matching with video server localhost , still 3000. http://localhost:3008/
  console.log('localhost:', process.env.PORT_BATCH);
}
bootstrap().catch((error) => {
  console.error('Bootstrap failed:', error);
  process.exit(1);
});
