import { treaty } from '@elysiajs/eden';

import { fetchAuthSession } from 'aws-amplify/auth';

import type { App } from '@formly/backend/api';

import { environment } from '@/environments/environment';

const apiUrl = new URL(environment.API_URL);
const apiPath = apiUrl.pathname.replace(/\/+$/, '');

const isApiRequest = (url: string): boolean => {
  const requestUrl = new URL(url, apiUrl);

  return (
    requestUrl.origin === apiUrl.origin &&
    (requestUrl.pathname === apiPath || requestUrl.pathname.startsWith(`${apiPath}/`))
  );
};

const authenticatedFetch: typeof fetch = async (input, init) => {
  const request = new Request(input, init);

  if (!isApiRequest(request.url)) {
    return fetch(request);
  }

  const session = await fetchAuthSession();
  const accessToken = session.tokens?.accessToken;
  const idToken = session.tokens?.idToken;

  if (!accessToken || !idToken) {
    throw new Error('An authenticated Cognito session is required.');
  }

  const headers = new Headers(request.headers);

  headers.set('Authorization', `Bearer ${accessToken.toString()}`);
  headers.set('x-id-token', idToken.toString());

  return fetch(new Request(request, { headers }));
};

export const apiClient = treaty<App>(apiUrl.origin, {
  fetcher: authenticatedFetch,
}).api.v1;
