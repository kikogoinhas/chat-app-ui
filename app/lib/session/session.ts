import "server-only";
import { Redis } from "ioredis";

export type SessionToken = {
  access_token: string;
  refresh_token: string;
  id_token: string;
  expires_in: number;
  refresh_expires_in: number;
};

export type UpdateSessionArgs = SessionToken;

export interface ISessionHandler {
  isOpen(): boolean;
  getSession(id: string): Promise<SessionToken | null>;
  setSession(id: string, token: SessionToken): Promise<void>;
  deleteSession(id: string): Promise<boolean>;
}

class SessionHandler implements ISessionHandler {
  public constructor(private readonly redis: Redis) {}

  public isOpen(): boolean {
    return this.redis.status === "connect";
  }

  public async getSession(id: string): Promise<SessionToken | null> {
    const value = await this.redis.get(id);

    if (!value) {
      return null;
    }

    const session = base64Decode(value) as SessionToken;
    return session;
  }

  public async setSession(id: string, token: SessionToken): Promise<void> {
    await this.redis.set(
      id,
      base64Encode(token),
      "EX",
      token.expires_in + token.refresh_expires_in,
    );
  }

  public async deleteSession(id: string): Promise<boolean> {
    const result = await this.redis.del(id);
    return result > 0;
  }
}

function base64Encode<T>(session: T) {
  return btoa(JSON.stringify(session));
}

function base64Decode(value: string) {
  return JSON.parse(atob(value));
}

export type RedisConfig = {
  url: string;
};

const redis = new Redis({
  host: process.env.REDIS_HOSTNAME ?? "localhost",
  port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
  lazyConnect: true,
});

let sessionHandler: ISessionHandler;

export async function getSessionHandler(): Promise<ISessionHandler> {
  if (sessionHandler) {
    return sessionHandler;
  }

  if (redis.status !== "connect") {
    await redis.connect();
  }

  sessionHandler = new SessionHandler(redis);
  return sessionHandler;
}
