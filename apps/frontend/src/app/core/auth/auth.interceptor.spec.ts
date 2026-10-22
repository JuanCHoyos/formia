import { HttpRequest, type HttpEvent, type HttpHandlerFn } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { fetchAuthSession } from 'aws-amplify/auth';
import { lastValueFrom, of, type Observable } from 'rxjs';
import { authInterceptor } from './auth.interceptor';

vi.mock('aws-amplify/auth', () => ({ fetchAuthSession: vi.fn() }));

const token = (value: string) => ({ toString: () => value });

describe('authInterceptor', () => {
  const next = vi.fn<HttpHandlerFn>();

  const intercept = (url: string): Observable<HttpEvent<unknown>> =>
    TestBed.runInInjectionContext(() => authInterceptor(new HttpRequest('GET', url), next));

  beforeEach(() => {
    vi.mocked(fetchAuthSession).mockReset();
    next.mockReset().mockReturnValue(of());
  });

  it('does not touch requests to other origins', () => {
    const request = new HttpRequest('GET', 'https://other.example.com/api/v1/forms');
    TestBed.runInInjectionContext(() => authInterceptor(request, next));

    expect(next).toHaveBeenCalledWith(request);
    expect(fetchAuthSession).not.toHaveBeenCalled();
  });

  it('does not touch requests outside the API path', () => {
    intercept('http://localhost:3000/assets/logo.png').subscribe();

    expect(fetchAuthSession).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledOnce();
  });

  it('adds both Cognito tokens to API requests', async () => {
    vi.mocked(fetchAuthSession).mockResolvedValue({
      tokens: { accessToken: token('access'), idToken: token('id') },
    } as never);

    await lastValueFrom(intercept('http://localhost:3000/api/v1/forms'), { defaultValue: null });

    const forwarded = next.mock.calls[0][0];
    expect(forwarded.headers.get('Authorization')).toBe('Bearer access');
    expect(forwarded.headers.get('x-id-token')).toBe('id');
  });

  it.each([
    ['no tokens', {}],
    ['only an access token', { tokens: { accessToken: token('access') } }],
    ['only an ID token', { tokens: { idToken: token('id') } }],
  ])('errors without calling next when the session has %s', async (_case, session) => {
    vi.mocked(fetchAuthSession).mockResolvedValue(session as never);

    await expect(
      lastValueFrom(intercept('http://localhost:3000/api/v1/forms'), { defaultValue: null }),
    ).rejects.toThrow('An authenticated Cognito session');
    expect(next).not.toHaveBeenCalled();
  });
});
