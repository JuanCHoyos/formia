import type { createCognito } from './cognito';

type CognitoAuthProperties = Pick<ReturnType<typeof createCognito>, 'userPoolId' | 'clientId'>;

export function createFormlyApi(
  s3Storage: sst.aws.Bucket,
  tables: sst.aws.Dynamo[],
  dynamoDB: sst.Linkable<{
    region: string;
  }>,
  cognitoAuth: sst.Linkable<CognitoAuthProperties>,
) {
  return new sst.aws.Function('formlyApi', {
    handler: './apps/backend/src/index.handler',
    link: [s3Storage, ...tables, dynamoDB, cognitoAuth],
    timeout: '30 seconds',
    memory: '2048 MB',
    url: { cors: false },
  });
}
