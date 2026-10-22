import { TestBed } from '@angular/core/testing';

import type { UserProfile } from '@formly/core/schemas/user';

import { UserStore } from './user-store';

const profile = (fullName: string): UserProfile => ({
  fullName,
  email: 'ada@example.com',
  roles: ['FORM_CREATOR'],
});

describe('UserStore', () => {
  let store: UserStore;

  beforeEach(() => {
    store = TestBed.inject(UserStore);
  });

  it('starts without a user', () => {
    expect(store.user()).toBeNull();
    expect(store.initials()).toBe('');
  });

  it('stores the user and derives initials', () => {
    const user = profile('Ada Lovelace');

    store.set(user);

    expect(store.user()).toEqual(user);
    expect(store.initials()).toBe('AL');
  });

  it('uses at most two initials, uppercased and ignoring extra whitespace', () => {
    store.set(profile('  ada   byron  lovelace '));

    expect(store.initials()).toBe('AB');
  });

  it('handles single-word names', () => {
    store.set(profile('Ada'));

    expect(store.initials()).toBe('A');
  });

  it('clears the user', () => {
    store.set(profile('Ada Lovelace'));

    store.clear();

    expect(store.user()).toBeNull();
    expect(store.initials()).toBe('');
  });
});
