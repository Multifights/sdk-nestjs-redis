import { Inject, Injectable, Logger } from "@nestjs/common";
import { REDIS_CLIENT_TOKEN } from "./entities/common.constants";
import Redis from "ioredis";

@Injectable()
export class RedisService {
    private readonly logger = new Logger(RedisService.name);

    constructor(@Inject(REDIS_CLIENT_TOKEN) private readonly redis: Redis) {
    }

    async get<T>(key: string): Promise<T | undefined> {
        try {
            const data = await this.redis.get(key);

            if(data)
                return JSON.parse(data);
        } catch (error) {
            this.logger.error('RedisCache - An error occurred while trying to get from redis cache.', {
                cacheKey: key,
                error: error?.toString(),
            });
        }
        return undefined;
    }

    async set<T>(key: string, value: T, ttl: number | null = null, cacheNullable: boolean = true): Promise<"OK" | undefined> {
        if (value === undefined) {
            return;
        }
      
        if (!cacheNullable && value == null) {
            return;
        }
      
        if (typeof ttl === 'number' && ttl <= 0) {
            return;
        }

        try {
            if (!ttl) {
                return await this.redis.set(key, JSON.stringify(value));
            } else {
                return await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
            }
        } catch (error) {
            if (error instanceof Error) {
                this.logger.error('RedisCache - An error occurred while trying to set in redis cache.', {
                cacheKey: key,
                error: error?.toString(),
                });
            }
        }
        return undefined;
    }

    async delete(key: string): Promise<number> {
        try {
            return await this.redis.del(key);
        } catch (error) {
            if (error instanceof Error) {
                this.logger.error('RedisCache - An error occurred while trying to delete from redis cache.', {
                  cacheKey: key,
                  error: error?.toString(),
                });
              }
        }
        return 0;
    }

    async expire(key: string, ttl: number): Promise<number> {
        return await this.redis.expire(key, ttl);
    }
}
