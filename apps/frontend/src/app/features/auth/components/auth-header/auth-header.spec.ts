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

    expect(element.querySelector('h3')?.textContent).toBe('Welcome');
    expect(element.querySelector('h2')?.textContent).toBe('Sign in');
    expect(element.querySelector('p')?.textContent).toBe('Use your account');
    expect(element.querySelector('ng-icon')).not.toBeNull();
  });
});
