import type { HttpInterceptorFn } from '@angular/common/http';
import { fetchAuthSession } from 'aws-amplify/auth';
import { from, switchMap, throwError } from 'rxjs';
import { environment } from '@environments/environment';

const apiUrl = new URL(environment.API_URL);
const apiPath = apiUrl.pathname.replace(/\/+$/, '');

function isApiRequest(url: string): boolean {
  const requestUrl = new URL(url, apiUrl);

  return (
    requestUrl.origin === apiUrl.origin &&
    (requestUrl.pathname === apiPath || requestUrl.pathname.startsWith(`${apiPath}/`))
  );
}

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (!isApiRequest(request.url)) {
    return next(request);
  }

  return from(fetchAuthSession()).pipe(
    switchMap((session) => {
      const accessToken = session.tokens?.accessToken;
      const idToken = session.tokens?.idToken;
      if (!accessToken || !idToken) {
        return throwError(() => new Error('An authenticated Cognito session with access and ID tokens is required.'));
      }

      request = request.clone({
        setHeaders: { 'x-id-token': idToken.toString() },
      });
      return next(
        request.clone({
          setHeaders: { Authorization: `Bearer ${accessToken.toString()}` },
        }),
      );
    }),
  );
};
