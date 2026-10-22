import type { createGitHubOidc } from './github-oidc';

/** Personal Microsoft accounts (the `consumers` tenant); Cognito needs this fixed issuer. */
const MICROSOFT_CONSUMERS_ISSUER =
  'https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0';

export const createCognito = (region: string, githubOidc: ReturnType<typeof createGitHubOidc>) => {
  const googleClientId = new sst.Secret('GOOGLE_CLIENT_ID');
  const googleClientSecret = new sst.Secret('GOOGLE_CLIENT_SECRET');
  const microsoftClientId = new sst.Secret('MICROSOFT_CLIENT_ID');
  const microsoftClientSecret = new sst.Secret('MICROSOFT_CLIENT_SECRET');
  const githubClientSecret = new sst.Secret('GITHUB_CLIENT_SECRET');
  const callbackUrl = process.env['COGNITO_CALLBACK_URL'] ?? 'http://localhost:4200/auth/callback';
  const logoutUrl = process.env['COGNITO_LOGOUT_URL'] ?? 'http://localhost:4200/';
  const domainPrefix = `formly-${$app.stage}`;

  const userPool = new sst.aws.CognitoUserPool('FormlyUserPool', {
    usernames: ['email'],
    domain: {
      prefix: domainPrefix,
    },
  });

  const googleProvider = userPool.addIdentityProvider('Google', {
    type: 'google',
    details: {
      authorize_scopes: 'openid email profile',
      client_id: googleClientId.value,
      client_secret: googleClientSecret.value,
    },
    attributes: {
      email: 'email',
      name: 'name',
      username: 'sub',
    },
  });

  const microsoftProvider = userPool.addIdentityProvider('Microsoft', {
    type: 'oidc',
    details: {
      authorize_scopes: 'openid email profile',
      client_id: microsoftClientId.value,
      client_secret: microsoftClientSecret.value,
      attributes_request_method: 'GET',
      oidc_issuer: MICROSOFT_CONSUMERS_ISSUER,
    },
    attributes: {
      email: 'email',
      name: 'name',
      username: 'sub',
    },
  });

  const githubProvider = userPool.addIdentityProvider('GitHub', {
    type: 'oidc',
    details: {
      authorize_scopes: 'openid email profile',
      client_id: githubOidc.clientId.value,
      client_secret: githubClientSecret.value,
      attributes_request_method: 'GET',
      oidc_issuer: githubOidc.issuer,
      authorize_url: $interpolate`${githubOidc.issuer}/authorize`,
      token_url: $interpolate`${githubOidc.issuer}/token`,
      attributes_url: $interpolate`${githubOidc.issuer}/userinfo`,
      jwks_uri: $interpolate`${githubOidc.issuer}/.well-known/jwks.json`,
    },
    attributes: {
      email: 'email',
      name: 'name',
      username: 'sub',
    },
  });

  const userPoolClient = userPool.addClient('Web', {
    providers: [
      'COGNITO',
      googleProvider.providerName,
      microsoftProvider.providerName,
      githubProvider.providerName,
    ],
    callbackUrls: [callbackUrl],
    transform: {
      client: (args) => {
        args.logoutUrls = [logoutUrl];
      },
    },
  });

  return {
    userPoolClient,
    userPoolId: userPool.id,
    clientId: userPoolClient.id,
    domain: `${domainPrefix}.auth.${region}.amazoncognito.com`,
    redirectSignIn: callbackUrl,
    redirectSignOut: logoutUrl,
  };
};
