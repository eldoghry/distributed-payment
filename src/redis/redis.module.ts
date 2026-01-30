import { Module, Global } from '@nestjs/common';
import Redis from 'ioredis';
import { DistributedLockService } from './distributed-lock.service';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        return new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT!) || 6379,
        });
      },
    },
    DistributedLockService,
  ],
  exports: ['REDIS_CLIENT', DistributedLockService],
})
export class RedisModule {}
