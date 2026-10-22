import { TestBed } from '@angular/core/testing';

import { AuthHeader } from './auth-header';

describe('AuthHeader', () => {
  it('renders the eyebrow, title, description and icon', async () => {
    const fixture = TestBed.createComponent(AuthHeader);
    fixture.componentRef.setInput('eyebrow', 'Welcome');
    fixture.componentRef.setInput('title', 'Sign in');
    fixture.componentRef.setInput('description', 'Use your account');
    fixture.componentRef.setInput('icon', 'lucideLock');
    fixture.detectChanges();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    const [eyebrow, description] = Array.from(element.querySelectorAll('p'));
    expect(eyebrow?.textContent?.trim()).toBe('Welcome');
    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Sign in');
    expect(description?.textContent?.trim()).toBe('Use your account');
    expect(element.querySelector('ng-icon')).not.toBeNull();
  });
});
