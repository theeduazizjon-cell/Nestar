import { Injectable } from '@nestjs/common';

@Injectable()
export class BatchService {
  getHello(): string {
    return 'Hello to Nestar BATCH server!';
  }

  public async bacthRollback(): Promise<void> {}

  public async batchProperties(): Promise<void> {}

  public async batchAgents(): Promise<void> {}
}
