import type { createCognito } from './cognito';

type CognitoAuthProperties = Pick<ReturnType<typeof createCognito>, 'clientId' | 'userPoolId'>;

export function createFormlyApi(
  s3Storage: sst.aws.Bucket,
  tables: sst.aws.Dynamo[],
  awsRegion: sst.Linkable<{
    region: string;
  }>,
  cognitoAuth: sst.Linkable<CognitoAuthProperties>,
) {
  return new sst.aws.Function('formlyApi', {
    handler: './apps/backend/src/index.handler',
    link: [s3Storage, ...tables, awsRegion, cognitoAuth],
    timeout: '30 seconds',
    memory: '2048 MB',
    url: { cors: false },
  });
}
