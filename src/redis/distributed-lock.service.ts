import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class DistributedLockService {
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  async acquire(key: string, ownerId: string, ttl: number = 5) {
    // SET key NX PX ttl → only set if not exists
    const attempt = await this.redisClient.set(key, ownerId, 'EX', ttl, 'NX');
    console.log(`Try to acquire key ${key} ... result: ${attempt}`);
    return attempt;
  }

  async release(key: string, ownerId: string) {
    const currentOwner = await this.getCurrentOwner(key);

    if (currentOwner && currentOwner === ownerId) {
      console.log(`Release cache key: ${key} for owner: ${ownerId}`);
      await this.redisClient.del(key);
      return true;
    }
  }

  async refresh(key: string, ownerId: string, ttl: number = 5000) {
    const currentOwner = await this.getCurrentOwner(key);
    if (currentOwner === ownerId) {
      // Extend TTL safely
      console.log(`Extend cache key: ${key} for owner: ${ownerId}`);
      await this.redisClient.pexpire(key, ttl);
      return true;
    }
    return false;
  }

  private async getCurrentOwner(key: string) {
    const currentOwner = (await this.redisClient.get(key)) ?? null;
    console.log('Current Owner on Cache', currentOwner);
    return currentOwner;
  }
}
