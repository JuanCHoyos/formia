/**
 * GitHub only speaks OAuth 2.0, while Cognito needs an OpenID Connect provider. This Lambda is the
 * OIDC bridge between them; its function URL is the issuer Cognito is configured with.
 */
export const createGitHubOidc = () => {
  const clientId = new sst.Secret('GITHUB_CLIENT_ID');
  const privateKey = new sst.Secret('GITHUB_OIDC_PRIVATE_KEY');

  const bridge = new sst.aws.Function('GitHubOidc', {
    handler: './apps/github-oidc/src/index.handler',
    link: [clientId, privateKey],
    timeout: '10 seconds',
    url: { cors: false },
  });

  return {
    clientId,
    issuer: bridge.url.apply((url) => url.replace(/\/$/, '')),
  };
};
