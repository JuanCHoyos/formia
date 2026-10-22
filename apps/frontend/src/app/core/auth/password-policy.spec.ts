import { isCognitoPasswordValid } from './password-policy';

describe('isCognitoPasswordValid', () => {
  it('accepts a password that meets every rule', () => {
    expect(isCognitoPasswordValid('Abcdef1!')).toBe(true);
  });

  it.each([
    ['too short', 'Abc1!'],
    ['missing lowercase', 'ABCDEFG1!'],
    ['missing uppercase', 'abcdefg1!'],
    ['missing number', 'Abcdefgh!'],
    ['missing symbol', 'Abcdefg1'],
    ['contains whitespace', 'Abcd ef1!'],
    ['longer than 256 chars', `Aa1!${'a'.repeat(260)}`],
  ])('rejects a password that is %s', (_reason, password) => {
    expect(isCognitoPasswordValid(password)).toBe(false);
  });
});
