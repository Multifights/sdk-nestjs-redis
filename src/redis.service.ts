import { Inject, Injectable, Logger } from '@nestjs/common';
import { REDIS_CLIENT_TOKEN } from './entities/common.constants';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject(REDIS_CLIENT_TOKEN) private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const data = await this.redis.get(key);

      if (data) return JSON.parse(data);
    } catch (error) {
      this.logger.error(
        'RedisCache - An error occurred while trying to get from redis cache.',
        {
          cacheKey: key,
          error: error?.toString(),
        }
      );
    }
    return undefined;
  }

  async set<T>(
    key: string,
    value: T,
    ttl: number | null = null,
    cacheNullable: boolean = true
  ): Promise<'OK' | undefined> {
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
        this.logger.error(
          'RedisCache - An error occurred while trying to set in redis cache.',
          {
            cacheKey: key,
            error: error?.toString(),
          }
        );
      }
    }
    return undefined;
  }

  async delete(key: string): Promise<number> {
    try {
      return await this.redis.del(key);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          'RedisCache - An error occurred while trying to delete from redis cache.',
          {
            cacheKey: key,
            error: error?.toString(),
          }
        );
      }
    }
    return 0;
  }

  async deleteMany(keys: string[]): Promise<number> {
    try {
      return await this.redis.del(keys);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          'An error occurred while trying to delete multiple keys from redis cache.',
          {
            error: error?.toString(),
          }
        );
      }
    }
    return 0;
  }

  async getOrSet<T>(
    key: string,
    value: T,
    ttl: number,
    cacheNullable: boolean = true
  ): Promise<T> {
    const cachedData = await this.get<T>(key);
    if (cachedData !== undefined) {
      return cachedData;
    }

    await this.set<T>(key, value, ttl, cacheNullable);
    return value;
  }

  async scan(pattern: string): Promise<string[]> {
    const found: string[] = [];
    let cursor = '0';
    do {
      const reply = await this.redis.scan(cursor, 'MATCH', pattern);

      cursor = reply[0];
      found.push(...reply[1]);
    } while (cursor !== '0');

    return found;
  }

  async hget<T>(hash: string, field: string): Promise<T | undefined> {
    try {
      const data = await this.redis.hget(hash, field);

      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          'An error occurred while trying to hget from redis.',
          {
            hash,
            field,
            exception: error?.toString(),
          }
        );
      }
    }
    return;
  }

  async hmget<T>(hash: string, fields: string[]): Promise<(T | null)[]> {
    try {
      const results = await this.redis.hmget(hash, ...fields);

      if (results.length > 0) {
        return results.map((value) => {
          if (value !== null) return JSON.parse(value);
          else return null;
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          'An error occurred while trying to hget from redis.',
          {
            hash,
            fields,
            exception: error?.toString(),
          }
        );
      }
    }
    return [];
  }

  async hgetall<T>(hash: string): Promise<Record<string, T> | undefined> {
    try {
      const data = await this.redis.hgetall(hash);
      if (!data) return;

      const response: Record<string, T> = {};
      for (const key of Object.keys(data)) {
        response[key] = JSON.parse(data[key]);
      }

      return response;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          'An error occurred while trying to hgetall from redis.',
          {
            hash,
            exception: error?.toString(),
          }
        );
      }
    }
    return;
  }

  async hset<T>(
    hash: string,
    field: string,
    value: T,
    cacheNullable: boolean = true
  ): Promise<number> {
    try {
      if (!cacheNullable && value == null) {
        return 0;
      }
      return await this.redis.hset(hash, field, JSON.stringify(value));
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('An error occurred while trying to hset in redis.', {
          hash,
          field,
          value,
          exception: error?.toString(),
        });
      }
      throw error;
    }
  }

  async hmset(hash: string, values: string[]): Promise<'OK' | undefined> {
    try {
      return await this.redis.hmset(hash, ...values);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('An error occurred while trying to hset in redis.', {
          hash,
          values,
          exception: error?.toString(),
        });
      }
      throw error;
    }
  }

  async hdel(hash: string, fields: string[]): Promise<number> {
    try {
      return await this.redis.hdel(hash, ...fields);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('An error occurred while trying to hdel in redis.', {
          hash,
          fields,
          exception: error?.toString(),
        });
      }
      throw error;
    }
  }

  async expire(key: string, ttl: number): Promise<number> {
    return await this.redis.expire(key, ttl);
  }

  async ttl(key: string): Promise<number> {
    return await this.redis.ttl(key);
  }
}
