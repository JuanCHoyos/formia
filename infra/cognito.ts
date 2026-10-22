export const createCognito = () => {
  const googleClientId = new sst.Secret('GOOGLE_CLIENT_ID');
  const googleClientSecret = new sst.Secret('GOOGLE_CLIENT_SECRET');
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

  const userPoolClient = userPool.addClient('Web', {
    providers: ['COGNITO', googleProvider.providerName],
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
    domain: `${domainPrefix}.auth.us-east-2.amazoncognito.com`,
    redirectSignIn: callbackUrl,
    redirectSignOut: logoutUrl,
  };
};
