import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';

import { catchError, throwError } from 'rxjs';

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const message =
        typeof error.error?.message === 'string'
          ? error.error.message
          : 'An unexpected error occurred';

      return throwError(() => ({
        status: error.status,
        message,
      }));
    }),
  );
};
