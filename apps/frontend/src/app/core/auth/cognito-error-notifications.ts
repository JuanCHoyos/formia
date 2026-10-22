import type {
  CognitoErrorContext,
  CognitoErrorNotification,
  CognitoErrorRule,
} from './types/cognito-error';
const DEFAULT_NOTIFICATION: CognitoErrorNotification = {
  summaryKey: 'auth.cognitoErrors.title',
  detailKey: 'auth.cognitoErrors.generic',
};

const createNotification = (detailKey: string): CognitoErrorNotification => ({
  summaryKey: 'auth.cognitoErrors.title',
  detailKey,
});

const COGNITO_ERROR_NOTIFICATIONS: Readonly<Record<string, CognitoErrorRule>> = {
  AliasExistsException: {
    defaultNotification: createNotification('auth.cognitoErrors.emailAlreadyRegistered'),
  },
  CodeDeliveryFailureException: {
    defaultNotification: createNotification('auth.cognitoErrors.codeDeliveryFailed'),
  },
  CodeMismatchException: {
    defaultNotification: createNotification('auth.cognitoErrors.codeMismatch'),
  },
  ExpiredCodeException: {
    defaultNotification: createNotification('auth.cognitoErrors.expiredCode'),
  },
  InvalidParameterException: {
    defaultNotification: createNotification('auth.cognitoErrors.invalidRequest'),
  },
  InvalidPasswordException: {
    defaultNotification: createNotification('auth.cognitoErrors.invalidPassword'),
  },
  LimitExceededException: {
    defaultNotification: createNotification('auth.cognitoErrors.tooManyRequests'),
  },
  NotAuthorizedException: {
    defaultNotification: createNotification('auth.cognitoErrors.invalidCredentials'),
    messages: {
      'incorrect username or password': createNotification('auth.cognitoErrors.invalidCredentials'),
      'password attempts exceeded': createNotification(
        'auth.cognitoErrors.passwordAttemptsExceeded',
      ),
    },
    contexts: {
      passwordRecovery: {
        defaultNotification: createNotification('auth.cognitoErrors.passwordRecoveryFailed'),
        messages: {
          'password attempts exceeded': createNotification(
            'auth.cognitoErrors.passwordAttemptsExceeded',
          ),
        },
      },
      signUpConfirmation: {
        defaultNotification: createNotification('auth.cognitoErrors.invalidCredentials'),
        messages: {
          'user cannot be confirmed. current status is confirmed': createNotification(
            'auth.cognitoErrors.alreadyConfirmed',
          ),
        },
      },
    },
  },
  PasswordResetRequiredException: {
    defaultNotification: createNotification('auth.cognitoErrors.passwordResetRequired'),
  },
  TooManyFailedAttemptsException: {
    defaultNotification: createNotification('auth.cognitoErrors.tooManyRequests'),
  },
  TooManyRequestsException: {
    defaultNotification: createNotification('auth.cognitoErrors.tooManyRequests'),
  },
  UserNotConfirmedException: {
    defaultNotification: createNotification('auth.cognitoErrors.userNotConfirmed'),
  },
  UserNotFoundException: {
    defaultNotification: createNotification('auth.cognitoErrors.invalidCredentials'),
    messages: {
      'username/client id combination not found': createNotification(
        'auth.cognitoErrors.invalidCredentials',
      ),
    },
    contexts: {
      passwordRecovery: {
        defaultNotification: createNotification('auth.cognitoErrors.passwordRecoveryFailed'),
        messages: {
          'username/client id combination not found': createNotification(
            'auth.cognitoErrors.passwordRecoveryFailed',
          ),
        },
      },
    },
  },
  UsernameExistsException: {
    defaultNotification: createNotification('auth.cognitoErrors.emailAlreadyRegistered'),
  },
};

const asErrorRecord = (error: unknown): Record<string, unknown> =>
  typeof error === 'object' && error !== null ? (error as Record<string, unknown>) : {};

const isString = (value: unknown): value is string => typeof value === 'string';

const getErrorCode = (error: unknown): string | undefined => {
  const record = asErrorRecord(error);
  const type = isString(record['__type']) ? record['__type'].split('#').pop() : undefined;
  const candidates = [record['name'], record['code'], type];
  const knownCode = candidates.find(
    (candidate): candidate is string =>
      isString(candidate) && Object.hasOwn(COGNITO_ERROR_NOTIFICATIONS, candidate),
  );

  return knownCode ?? candidates.find(isString);
};

const getMatchingNotification = (
  rules: Readonly<Record<string, CognitoErrorNotification>> | undefined,
  message: string,
): CognitoErrorNotification | undefined =>
  Object.entries(rules ?? {}).find(([phrase]) => message.includes(phrase))?.[1];

export const getCognitoErrorNotification = (
  error: unknown,
  context?: CognitoErrorContext,
): CognitoErrorNotification => {
  const record = asErrorRecord(error);
  const code = getErrorCode(error);
  const rule = code ? COGNITO_ERROR_NOTIFICATIONS[code] : undefined;
  const contextRule = context ? rule?.contexts?.[context] : undefined;
  const message = isString(record['message']) ? record['message'].toLowerCase() : '';

  return (
    getMatchingNotification(contextRule?.messages, message) ??
    contextRule?.defaultNotification ??
    getMatchingNotification(rule?.messages, message) ??
    rule?.defaultNotification ??
    DEFAULT_NOTIFICATION
  );
};
