import { bearer } from '@elysiajs/bearer';
import { Elysia } from 'elysia';

import { z } from 'zod';

import {
  buildGitHubAuthorizeUrl,
  exchangeCode,
  fetchGitHubClaims,
  getJwks,
  getOpenIdConfiguration,
  GitHubOidcError,
  isAllowedClient,
  signIdToken,
} from './github-oidc.service';

const AuthorizeQuerySchema = z.object({
  client_id: z.string(),
  redirect_uri: z.string(),
  state: z.string().optional(),
});

const TokenBodySchema = z.object({
  grant_type: z.literal('authorization_code'),
  code: z.string(),
  redirect_uri: z.string().optional(),
  client_id: z.string().optional(),
  client_secret: z.string().optional(),
});

/** The issuer is the bridge's own origin, so it always matches the URL Cognito is configured with. */
const issuerOf = (request: Request) => new URL(request.url).origin;

/** Client credentials may arrive as HTTP Basic auth or in the form body. */
const readClientCredentials = (
  authorization: string | undefined,
  body: z.infer<typeof TokenBodySchema>,
) => {
  if (authorization?.startsWith('Basic ')) {
    const decoded = Buffer.from(authorization.slice('Basic '.length), 'base64').toString('utf8');
    const separator = decoded.indexOf(':');

    return {
      clientId: decodeURIComponent(decoded.slice(0, separator)),
      clientSecret: decodeURIComponent(decoded.slice(separator + 1)),
    };
  }

  return { clientId: body.client_id, clientSecret: body.client_secret };
};

const oauthError = (error: string, description: string) => ({
  error,
  error_description: description,
});

/**
 * OpenID Connect bridge in front of GitHub's OAuth app flow. GitHub does not issue ID tokens, so
 * Cognito talks to these endpoints, which forward to GitHub and sign the ID token themselves.
 */
export const githubOidcRouter = new Elysia()
  .onError(({ error, status }) => {
    if (error instanceof GitHubOidcError) {
      return status(
        error.error === 'invalid_token' ? 401 : 400,
        oauthError(error.error, error.message),
      );
    }

    return undefined;
  })
  .get('/.well-known/openid-configuration', ({ request }) =>
    getOpenIdConfiguration(issuerOf(request)),
  )
  .get('/.well-known/jwks.json', () => getJwks())
  .get(
    '/authorize',
    ({ query, redirect, status }) => {
      if (!isAllowedClient(query.client_id)) {
        return status(400, oauthError('unauthorized_client', 'Unknown client'));
      }

      return redirect(
        buildGitHubAuthorizeUrl({
          clientId: query.client_id,
          redirectUri: query.redirect_uri,
          state: query.state,
        }),
      );
    },
    { query: AuthorizeQuerySchema },
  )
  .post(
    '/token',
    async ({ body, headers, request, status }) => {
      const { clientId, clientSecret } = readClientCredentials(headers.authorization, body);

      if (!clientId || !clientSecret || !isAllowedClient(clientId)) {
        return status(401, oauthError('invalid_client', 'Invalid client credentials'));
      }

      const accessToken = await exchangeCode({
        code: body.code,
        clientId,
        clientSecret,
        redirectUri: body.redirect_uri,
      });
      const claims = await fetchGitHubClaims(accessToken);

      return {
        access_token: accessToken,
        token_type: 'Bearer',
        id_token: signIdToken(claims, { issuer: issuerOf(request), audience: clientId }),
      };
    },
    { body: TokenBodySchema },
  )
  .use(bearer())
  .get('/userinfo', ({ bearer: accessToken, status }) => {
    if (!accessToken) {
      return status(401, oauthError('invalid_token', 'A bearer token is required'));
    }

    return fetchGitHubClaims(accessToken);
  });
