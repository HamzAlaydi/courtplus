import { Global, Module } from '@nestjs/common';
import { DistributedLockService } from './distributed-lock.service';

/**
 * Global so any module can take a distributed lock without wiring an import.
 * RedisModule is already registered globally in AppModule.
 */
@Global()
@Module({
  providers: [DistributedLockService],
  exports: [DistributedLockService],
})
export class CommonModule {}
