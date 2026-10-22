import { getCognitoErrorNotification } from './cognito-error-notifications';

const TITLE = 'auth.cognitoErrors.title';
const detail = (key: string) => ({ summaryKey: TITLE, detailKey: `auth.cognitoErrors.${key}` });

describe('getCognitoErrorNotification', () => {
  it('falls back to the generic notification for unknown or non-object errors', () => {
    expect(getCognitoErrorNotification(undefined)).toEqual(detail('generic'));
    expect(getCognitoErrorNotification('boom')).toEqual(detail('generic'));
    expect(getCognitoErrorNotification({ name: 'SomethingElse' })).toEqual(detail('generic'));
  });

  it.each([
    ['UsernameExistsException', 'emailAlreadyRegistered'],
    ['CodeMismatchException', 'codeMismatch'],
    ['ExpiredCodeException', 'expiredCode'],
    ['InvalidPasswordException', 'invalidPassword'],
    ['UserNotConfirmedException', 'userNotConfirmed'],
    ['TooManyRequestsException', 'tooManyRequests'],
    ['LimitExceededException', 'tooManyRequests'],
  ])('maps %s to %s', (name, key) => {
    expect(getCognitoErrorNotification({ name })).toEqual(detail(key));
  });

  it('reads the error code from name, code or __type', () => {
    expect(getCognitoErrorNotification({ code: 'CodeMismatchException' })).toEqual(detail('codeMismatch'));
    expect(getCognitoErrorNotification({ __type: 'com.amazon#ExpiredCodeException' })).toEqual(detail('expiredCode'));
  });

  it('prefers a known code over an unknown one', () => {
    expect(getCognitoErrorNotification({ name: 'Error', code: 'CodeMismatchException' })).toEqual(
      detail('codeMismatch'),
    );
  });

  it('matches message phrases case-insensitively', () => {
    const error = { name: 'NotAuthorizedException', message: 'Password attempts exceeded' };

    expect(getCognitoErrorNotification(error)).toEqual(detail('passwordAttemptsExceeded'));
  });

  it('uses the default notification when no message phrase matches', () => {
    const error = { name: 'NotAuthorizedException', message: 'something else' };

    expect(getCognitoErrorNotification(error)).toEqual(detail('invalidCredentials'));
  });

  describe('contexts', () => {
    it('uses the passwordRecovery rule for NotAuthorizedException', () => {
      const error = { name: 'NotAuthorizedException', message: 'nope' };

      expect(getCognitoErrorNotification(error, 'passwordRecovery')).toEqual(detail('passwordRecoveryFailed'));
    });

    it('uses the passwordRecovery rule for UserNotFoundException', () => {
      const error = { name: 'UserNotFoundException' };

      expect(getCognitoErrorNotification(error, 'passwordRecovery')).toEqual(detail('passwordRecoveryFailed'));
      expect(getCognitoErrorNotification(error)).toEqual(detail('invalidCredentials'));
    });

    it('matches context message phrases before the context default', () => {
      const error = {
        name: 'NotAuthorizedException',
        message: 'User cannot be confirmed. Current status is CONFIRMED',
      };

      expect(getCognitoErrorNotification(error, 'signUpConfirmation')).toEqual(detail('alreadyConfirmed'));
    });

    it('falls back to the base rule when the code has no rule for that context', () => {
      expect(getCognitoErrorNotification({ name: 'CodeMismatchException' }, 'passwordRecovery')).toEqual(
        detail('codeMismatch'),
      );
    });
  });
});
