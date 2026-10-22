/// <reference path="./.sst/platform/config.d.ts" />

const STAGE_REGIONS: Partial<Record<string, string>> = {
  prod: 'us-east-1',
  dev: 'us-east-2',
};

export default $config({
  app(input) {
    return {
      name: 'formly',
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      protect: ['production'].includes(input?.stage),
      home: 'aws',
    };
  },
  async run() {
    const { createStorage } = await import('./infra/storage');
    const { createDynamo } = await import('./infra/dynamo');
    const { createFormlyApi } = await import('./infra/api');
    const { createCognito } = await import('./infra/cognito');
    const cognito = createCognito();
    const { uploads } = createStorage();

    const cognitoAuth = new sst.Linkable('FormlyCognito', {
      properties: {
        userPoolId: cognito.userPoolId,
        clientId: cognito.clientId,
      },
    });

    const dynamoDB = new sst.Linkable('DynamoDB', {
      properties: {
        region: STAGE_REGIONS[$app.stage] ?? 'us-east-2',
      },
    });

    const tables = createDynamo();
    const formlyApi = createFormlyApi(uploads, Object.values(tables), dynamoDB, cognitoAuth);

    const web = new sst.aws.StaticSite('FormlyWeb', {
      path: 'apps/frontend',
      environment: {
        NG_APP_API_URL: formlyApi.url,
        NG_APP_COGNITO_USER_POOL_ID: cognito.userPoolId,
        NG_APP_COGNITO_USER_POOL_CLIENT_ID: cognito.clientId,
        NG_APP_COGNITO_DOMAIN: cognito.domain ?? '',
        NG_APP_COGNITO_REDIRECT_SIGN_IN: cognito.redirectSignIn,
        NG_APP_COGNITO_REDIRECT_SIGN_OUT: cognito.redirectSignOut,
      },
      dev: {
        command: 'pnpm dev',
      },
      build: {
        command: 'pnpm build',
        output: 'dist',
      },
    });

    return {
      web: web.urn,
      formlyApi: formlyApi.url,
      userPool: cognito.userPoolId,
    };
  },
});
