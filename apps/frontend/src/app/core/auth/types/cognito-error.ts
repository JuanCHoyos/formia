export interface CognitoErrorNotification {
  summaryKey: string;
  detailKey: string;
}

export type CognitoErrorContext = 'passwordRecovery' | 'signUpConfirmation';

export interface CognitoErrorContextRule {
  defaultNotification: CognitoErrorNotification;
  messages?: Readonly<Record<string, CognitoErrorNotification>>;
}

export interface CognitoErrorRule extends CognitoErrorContextRule {
  contexts?: Partial<Record<CognitoErrorContext, CognitoErrorContextRule>>;
}
