import {
  CognitoIdentityProviderClient,
  GetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';

const cognito = new CognitoIdentityProviderClient({});

export function getAuthenticatedUser(accessToken: string) {
  return cognito.send(new GetUserCommand({ AccessToken: accessToken }));
}
