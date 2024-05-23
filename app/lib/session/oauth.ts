import "server-only";
import {
  TokenEndpointResponse,
  getAuthorizationTokenFromRefreshToken,
} from "../auth";
import { ISessionHandler, SessionToken, getSessionHandler } from "./session";

import * as jose from "jose";

interface JWKSetResolver {
  resolve: ReturnType<typeof jose.createRemoteJWKSet>;
}

export type ValidTokenResult<A> = {
  isValid: true;
  payload: A;
};

export type InvalidTokenResult = {
  isValid: false;
  error: Error;
};

export type ValidateTokenResult<A> = ValidTokenResult<A> | InvalidTokenResult;

export type OAuthSession = {
  id: string;
  value: SessionToken;
};

class OAuthSessionHandler {
  public constructor(
    private readonly sessionHandler: ISessionHandler,
    private readonly jwkSetResolver: JWKSetResolver,
  ) {}

  public async getSession(id: string): Promise<OAuthSession | null> {
    const session = await this.sessionHandler.getSession(id);
    if (!session) {
      return null;
    }

    return {
      id,
      value: session,
    };
  }

  public async createSession(
    session: TokenEndpointResponse,
  ): Promise<OAuthSession> {
    const id = crypto.randomUUID();
    await this.sessionHandler.setSession(id, session);

    return {
      id,
      value: session,
    };
  }

  public async validateSession(
    session: OAuthSession,
  ): Promise<ValidateTokenResult<OAuthSession>> {
    const { id, value } = session;

    const result = await this.validateToken(value.access_token);

    if (result.isValid) {
      return {
        isValid: true,
        payload: session,
      };
    }

    const refreshTokenResponse = await getAuthorizationTokenFromRefreshToken(
      value.refresh_token,
    );

    if (refreshTokenResponse.success) {
      await this.sessionHandler.setSession(id, refreshTokenResponse.body);
      console.log("Refreshed auth session with refresh_token");
      return {
        isValid: true,
        payload: {
          id,
          value: refreshTokenResponse.body,
        },
      };
    }

    console.error(refreshTokenResponse.error);
    return {
      isValid: false,
      error: refreshTokenResponse.error,
    };
  }

  private async validateToken(
    token: string,
  ): Promise<ValidateTokenResult<string>> {
    try {
      await jose.jwtVerify(token, this.jwkSetResolver.resolve);

      return {
        isValid: true,
        payload: token,
      };
    } catch (error: any) {
      if (error instanceof Error) {
        return {
          isValid: false,
          error: error,
        };
      }

      return {
        isValid: false,
        error: new Error("Unknown error occurred"),
      };
    }
  }
}

let instance: OAuthSessionHandler;

export async function getOAuthSessionHandler() {
  if (instance) {
    return instance;
  }

  const jwkSetUrl =
    process.env.JWKSetUrl ??
    "http://localhost:8080/realms/chat-app/protocol/openid-connect/certs";

  const sessionHandler = await getSessionHandler();

  instance = new OAuthSessionHandler(sessionHandler, {
    resolve: jose.createRemoteJWKSet(new URL(jwkSetUrl)),
  });

  return instance;
}
