import { Amplify } from 'aws-amplify';
import { environment } from '@environments/environment';
import './amplify';

vi.mock('aws-amplify', () => ({ Amplify: { configure: vi.fn() } }));
vi.mock('aws-amplify/auth/enable-oauth-listener', () => ({}));

describe('Amplify config', () => {
  it('configures Cognito with email and OAuth code-flow login', () => {
    expect(Amplify.configure).toHaveBeenCalledOnce();
    expect(Amplify.configure).toHaveBeenCalledWith({
      Auth: {
        Cognito: {
          userPoolId: environment.cognito.userPoolId,
          userPoolClientId: environment.cognito.userPoolClientId,
          loginWith: {
            email: true,
            oauth: {
              domain: environment.cognito.domain,
              scopes: ['openid', 'email', 'profile'],
              redirectSignIn: [environment.cognito.redirectSignIn],
              redirectSignOut: [environment.cognito.redirectSignOut],
              responseType: 'code',
            },
          },
        },
      },
    });
  });
});
