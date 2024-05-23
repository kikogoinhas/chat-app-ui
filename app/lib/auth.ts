import { NextResponse } from "next/server";

const keycloak = {
  clientId: "chat-app-ui",
  clientSecret: "NWZvdmOjSVvD5RH1VjsFewv2JCQMeR8d",
  accessTokenUri:
    "http://localhost:8080/realms/chat-app/protocol/openid-connect/token",
  authorizationUri:
    "http://localhost:8080/realms/chat-app/protocol/openid-connect/auth",
  tokenInstrospectionUri:
    "http://localhost:8080/realms/chat-app/protocol/openid-connect/token/introspect",
  redirectUri: "http://localhost:3000/api/auth/redirect",
  scopes: ["openid", "email"],
};

export type TokenEndpointResponse = {
  access_token: string;
  refresh_token: string;
  id_token: string;
  expires_in: number;
  refresh_expires_in: number;
  scope?: string;
  token_type: string;
};

export type AuthSuccessResult<A> = {
  success: true;
  body: A;
};

export type AuthErrorResult<E> = {
  success: false;
  status: number;
  error: E;
};

export type AuthResult<A, E> = AuthSuccessResult<A> | AuthErrorResult<E>;

export async function startAuthFlow(currentUri: string) {
  const stateArr = btoa(currentUri);

  const nonceArr = Buffer.from(
    crypto.getRandomValues(new Int8Array(8)),
  ).toString("base64url");

  const params = {
    client_id: keycloak.clientId,
    redirect_uri: keycloak.redirectUri,
    scope: keycloak.scopes.join(" "),
    response_type: "code",
    response_mode: "query",
    state: stateArr,
    nonce: nonceArr,
  };

  const urlEncodedSearchParams = new URLSearchParams(params).toString();

  return NextResponse.redirect(
    `${keycloak.authorizationUri}?${urlEncodedSearchParams}`,
  );
}

export async function getAuthorizationToken(
  code: string,
): Promise<AuthResult<TokenEndpointResponse, Error>> {
  const params = {
    grant_type: "authorization_code",
    client_id: keycloak.clientId,
    client_secret: keycloak.clientSecret,
    redirect_uri: keycloak.redirectUri,
    code,
  };

  const urlEncodedSearchParams = new URLSearchParams(params).toString();

  const request = new Request(keycloak.accessTokenUri, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: urlEncodedSearchParams,
  });

  try {
    const response = await fetch(request);
    if (response.status !== 200) {
      const error = new Error(
        `Authorization token response returns status ${response.status}`,
        { cause: await response.text() },
      );

      return {
        success: false,
        status: response.status,
        error,
      };
    }
    return {
      success: true,
      body: await response.json(),
    };
  } catch (err) {
    const error = new Error(`Unknown error occurred calling auth provider`, {
      cause: err,
    });

    return {
      success: false,
      status: -1,
      error,
    };
  }
}

export async function getAuthorizationTokenFromRefreshToken(
  token: string,
): Promise<AuthResult<TokenEndpointResponse, Error>> {
  const params = {
    grant_type: "refresh_token",
    client_id: keycloak.clientId,
    client_secret: keycloak.clientSecret,
    refresh_token: token,
  };

  const urlEncodedSearchParams = new URLSearchParams(params).toString();

  const request = new Request(keycloak.accessTokenUri, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: urlEncodedSearchParams,
  });

  try {
    const response = await fetch(request);
    if (response.status !== 200) {
      const error = new Error(
        `Authorization token response returns status ${response.status}`,
        { cause: await response.text() },
      );

      return {
        success: false,
        status: response.status,
        error,
      };
    }
    return {
      success: true,
      body: await response.json(),
    };
  } catch (err) {
    const error = new Error(`Unknown error occurred calling auth provider`, {
      cause: err,
    });

    return {
      success: false,
      status: -1,
      error,
    };
  }
}
