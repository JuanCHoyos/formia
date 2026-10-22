import { createPublicKey, verify } from 'node:crypto';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { githubOidcRouter } from './github-oidc.router';

const { privateKeyBase64 } = await vi.hoisted(async () => {
  const { generateKeyPairSync } = await import('node:crypto');
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });

  return {
    privateKeyBase64: Buffer.from(privateKey.export({ type: 'pkcs8', format: 'pem' })).toString(
      'base64',
    ),
  };
});

vi.mock('sst', () => ({
  Resource: {
    GITHUB_CLIENT_ID: { value: 'formly-client' },
    GITHUB_OIDC_PRIVATE_KEY: { value: privateKeyBase64 },
  },
}));

const ISSUER = 'https://bridge.example.com';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const githubResponses = (overrides: { emails?: unknown; token?: unknown } = {}) =>
  vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
    const url = input.toString();

    if (url === 'https://github.com/login/oauth/access_token') {
      return json(overrides.token ?? { access_token: 'gh-token', token_type: 'bearer' });
    }
    if (url === 'https://api.github.com/user') {
      return json({ id: 42, login: 'ada', name: null, avatar_url: 'https://avatars/42' });
    }
    if (url === 'https://api.github.com/user/emails') {
      return json(
        overrides.emails ?? [
          { email: 'old@example.com', primary: false, verified: true },
          { email: 'ada@example.com', primary: true, verified: true },
        ],
      );
    }
    return json({ message: 'Not Found' }, 404);
  });

const tokenRequest = (body: Record<string, string>, headers: Record<string, string> = {}) =>
  githubOidcRouter.handle(
    new Request(`${ISSUER}/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers },
      body: new URLSearchParams(body),
    }),
  );

const decodeSegment = (segment: string) =>
  JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));

describe('githubOidcRouter', () => {
  let fetchMock: ReturnType<typeof githubResponses>;

  beforeEach(() => {
    fetchMock = githubResponses();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('publishes the discovery document for its own origin', async () => {
    const response = await githubOidcRouter.handle(
      new Request(`${ISSUER}/.well-known/openid-configuration`),
    );

    expect(await response.json()).toMatchObject({
      issuer: ISSUER,
      token_endpoint: `${ISSUER}/token`,
      jwks_uri: `${ISSUER}/.well-known/jwks.json`,
    });
  });

  it('redirects authorization requests to GitHub with GitHub scopes', async () => {
    const response = await githubOidcRouter.handle(
      new Request(
        `${ISSUER}/authorize?client_id=formly-client&redirect_uri=https%3A%2F%2Fcognito%2Fidpresponse&state=abc&scope=openid+email`,
      ),
    );
    const location = new URL(response.headers.get('location') ?? '');

    expect(response.status).toBe(302);
    expect(location.origin + location.pathname).toBe('https://github.com/login/oauth/authorize');
    expect(Object.fromEntries(location.searchParams)).toEqual({
      client_id: 'formly-client',
      redirect_uri: 'https://cognito/idpresponse',
      scope: 'read:user user:email',
      state: 'abc',
    });
  });

  it('rejects authorization requests from other clients', async () => {
    const response = await githubOidcRouter.handle(
      new Request(`${ISSUER}/authorize?client_id=someone-else&redirect_uri=https%3A%2F%2Fx`),
    );

    expect(response.status).toBe(400);
  });

  it('exchanges the code and returns an ID token signed with the published key', async () => {
    const response = await tokenRequest(
      { grant_type: 'authorization_code', code: 'the-code', redirect_uri: 'https://cognito' },
      { authorization: `Basic ${Buffer.from('formly-client:secret').toString('base64')}` },
    );
    const body = await response.json();
    const [header, payload, signature] = body.id_token.split('.');

    expect(response.status).toBe(200);
    expect(body.access_token).toBe('gh-token');
    expect(decodeSegment(payload)).toMatchObject({
      iss: ISSUER,
      aud: 'formly-client',
      sub: '42',
      email: 'ada@example.com',
      email_verified: true,
      name: 'ada',
    });

    const jwks = await (
      await githubOidcRouter.handle(new Request(`${ISSUER}/.well-known/jwks.json`))
    ).json();
    const [jwk] = jwks.keys;
    expect(decodeSegment(header).kid).toBe(jwk.kid);
    expect(
      verify(
        'sha256',
        Buffer.from(`${header}.${payload}`),
        createPublicKey({ key: jwk, format: 'jwk' }),
        Buffer.from(signature, 'base64url'),
      ),
    ).toBe(true);

    const [, tokenInit] = fetchMock.mock.calls[0] ?? [];
    expect(JSON.parse(String(tokenInit?.body))).toMatchObject({
      client_id: 'formly-client',
      client_secret: 'secret',
      code: 'the-code',
    });
  });

  it('accepts client credentials in the form body', async () => {
    const response = await tokenRequest({
      grant_type: 'authorization_code',
      code: 'the-code',
      client_id: 'formly-client',
      client_secret: 'secret',
    });

    expect(response.status).toBe(200);
  });

  it('rejects token requests from other clients without calling GitHub', async () => {
    const response = await tokenRequest({
      grant_type: 'authorization_code',
      code: 'the-code',
      client_id: 'someone-else',
      client_secret: 'secret',
    });

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports a rejected code as invalid_grant', async () => {
    vi.stubGlobal('fetch', githubResponses({ token: { error: 'bad_verification_code' } }));

    const response = await tokenRequest({
      grant_type: 'authorization_code',
      code: 'expired',
      client_id: 'formly-client',
      client_secret: 'secret',
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: 'invalid_grant' });
  });

  it('refuses accounts without a verified primary email', async () => {
    vi.stubGlobal(
      'fetch',
      githubResponses({ emails: [{ email: 'ada@example.com', primary: true, verified: false }] }),
    );

    const response = await tokenRequest({
      grant_type: 'authorization_code',
      code: 'the-code',
      client_id: 'formly-client',
      client_secret: 'secret',
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: 'access_denied' });
  });

  it('returns the GitHub claims from userinfo', async () => {
    const response = await githubOidcRouter.handle(
      new Request(`${ISSUER}/userinfo`, { headers: { authorization: 'Bearer gh-token' } }),
    );

    expect(await response.json()).toEqual({
      sub: '42',
      email: 'ada@example.com',
      email_verified: true,
      name: 'ada',
      preferred_username: 'ada',
      picture: 'https://avatars/42',
    });
  });

  it('requires a bearer token for userinfo', async () => {
    const response = await githubOidcRouter.handle(new Request(`${ISSUER}/userinfo`));

    expect(response.status).toBe(401);
  });
});
