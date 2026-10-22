import { Resource } from 'sst';

import { createHash, createPrivateKey, createPublicKey, type KeyObject, sign } from 'node:crypto';

import { z } from 'zod';

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_SCOPES = 'read:user user:email';
const ID_TOKEN_TTL_SECONDS = 300;

const GitHubTokenResponseSchema = z.union([
  z.object({ access_token: z.string() }),
  z.object({ error: z.string(), error_description: z.string().optional() }),
]);

const GitHubUserSchema = z.object({
  id: z.number(),
  login: z.string(),
  name: z.string().nullable(),
  avatar_url: z.string(),
});

const GitHubEmailsSchema = z.array(
  z.object({ email: z.string(), primary: z.boolean(), verified: z.boolean() }),
);

export type GitHubClaims = {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  preferred_username: string;
  picture: string;
};

export class GitHubOidcError extends Error {
  constructor(
    readonly error: 'access_denied' | 'invalid_client' | 'invalid_grant' | 'invalid_token',
    message: string,
  ) {
    super(message);
  }
}

type SigningKey = { privateKey: KeyObject; publicJwk: JsonWebKey; kid: string };

let signingKey: SigningKey | undefined;

/** The RSA key that signs the ID tokens, stored base64-encoded (PEM) in an SST secret. */
const getSigningKey = (): SigningKey => {
  if (!signingKey) {
    const pem = Buffer.from(Resource.GITHUB_OIDC_PRIVATE_KEY.value, 'base64').toString('utf8');
    const privateKey = createPrivateKey(pem);
    const publicKey = createPublicKey(privateKey);
    const kid = createHash('sha256')
      .update(publicKey.export({ type: 'spki', format: 'der' }))
      .digest('base64url');

    signingKey = { privateKey, publicJwk: publicKey.export({ format: 'jwk' }), kid };
  }

  return signingKey;
};

/** Only the GitHub OAuth app registered for Formly may use this bridge. */
export const isAllowedClient = (clientId: string) => clientId === Resource.GITHUB_CLIENT_ID.value;

export const getOpenIdConfiguration = (issuer: string) => ({
  issuer,
  authorization_endpoint: `${issuer}/authorize`,
  token_endpoint: `${issuer}/token`,
  userinfo_endpoint: `${issuer}/userinfo`,
  jwks_uri: `${issuer}/.well-known/jwks.json`,
  response_types_supported: ['code'],
  subject_types_supported: ['public'],
  id_token_signing_alg_values_supported: ['RS256'],
  scopes_supported: ['openid', 'email', 'profile'],
  token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
  claims_supported: ['sub', 'email', 'email_verified', 'name', 'preferred_username', 'picture'],
});

export const getJwks = () => {
  const { publicJwk, kid } = getSigningKey();

  return { keys: [{ ...publicJwk, kid, alg: 'RS256', use: 'sig' }] };
};

export const buildGitHubAuthorizeUrl = (params: {
  clientId: string;
  redirectUri: string;
  state?: string;
}) => {
  const url = new URL(GITHUB_AUTHORIZE_URL);
  url.searchParams.set('client_id', params.clientId);
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('scope', GITHUB_SCOPES);
  if (params.state) url.searchParams.set('state', params.state);

  return url.toString();
};

export const exchangeCode = async (params: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri?: string;
}) => {
  const response = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: params.clientId,
      client_secret: params.clientSecret,
      code: params.code,
      redirect_uri: params.redirectUri,
    }),
  });
  const result = GitHubTokenResponseSchema.parse(await response.json());

  if ('error' in result) {
    const error =
      result.error === 'incorrect_client_credentials' ? 'invalid_client' : 'invalid_grant';
    throw new GitHubOidcError(error, result.error_description ?? result.error);
  }

  return result.access_token;
};

const fetchGitHub = async (path: string, accessToken: string) => {
  const response = await fetch(`${GITHUB_API_URL}${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'formly-github-oidc',
    },
  });

  if (response.status === 401) {
    throw new GitHubOidcError('invalid_token', 'The GitHub access token is invalid');
  }
  if (!response.ok) {
    throw new Error(`GitHub API ${path} responded with ${response.status}`);
  }

  return response.json();
};

export const fetchGitHubClaims = async (accessToken: string): Promise<GitHubClaims> => {
  const [user, emails] = await Promise.all([
    fetchGitHub('/user', accessToken).then((body) => GitHubUserSchema.parse(body)),
    fetchGitHub('/user/emails', accessToken).then((body) => GitHubEmailsSchema.parse(body)),
  ]);
  const email = emails.find((entry) => entry.primary && entry.verified);

  if (!email) {
    throw new GitHubOidcError('access_denied', 'The GitHub account has no verified primary email');
  }

  return {
    sub: String(user.id),
    email: email.email,
    email_verified: true,
    name: user.name ?? user.login,
    preferred_username: user.login,
    picture: user.avatar_url,
  };
};

const encodeSegment = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

export const signIdToken = (claims: GitHubClaims, params: { issuer: string; audience: string }) => {
  const { privateKey, kid } = getSigningKey();
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = encodeSegment({ alg: 'RS256', typ: 'JWT', kid });
  const payload = encodeSegment({
    ...claims,
    iss: params.issuer,
    aud: params.audience,
    iat: issuedAt,
    exp: issuedAt + ID_TOKEN_TTL_SECONDS,
  });
  const signature = sign('sha256', Buffer.from(`${header}.${payload}`), privateKey);

  return `${header}.${payload}.${signature.toString('base64url')}`;
};
