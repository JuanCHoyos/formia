import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { Resource } from 'sst';
import { AuthProvider } from '../schemas/';

export const cognitoJwtVerifier = CognitoJwtVerifier.create({
  userPoolId: Resource.FormlyCognito.userPoolId,
  clientId: Resource.FormlyCognito.clientId,
  tokenUse: 'access',
});

export const idTokenVerifier = CognitoJwtVerifier.create({
  userPoolId: Resource.FormlyCognito.userPoolId,
  clientId: Resource.FormlyCognito.clientId,
  tokenUse: 'id',
});

export const verifyAccessTokenUser = (accessToken: string) => {
  return cognitoJwtVerifier.verify(accessToken);
};

export const verifyIdTokenUser = async (idToken: string) => {
  const payload = await idTokenVerifier.verify(idToken);

  return {
    sub: payload.sub as string,
    email: payload.email as string,
    name: payload.name as string,
    provider: (payload.identities?.[0]?.providerName as AuthProvider | undefined) ?? null,
  };
};
