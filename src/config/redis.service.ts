import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(private configService: ConfigService) {
    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });
  }

  async onModuleInit() {
    this.client.on('error', (err) => {
      console.error('Redis Client Error', err);
    });

    this.client.on('connect', () => {
      console.log('Redis Client Connected');
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async set(key: string, value: string, expirationSeconds?: number): Promise<void> {
    if (expirationSeconds) {
      await this.client.setex(key, expirationSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async del(key: string): Promise<number> {
    return await this.client.del(key);
  }

  async ttl(key: string): Promise<number> {
    return await this.client.ttl(key);
  }

  async exists(key: string): Promise<number> {
    return await this.client.exists(key);
  }
}
