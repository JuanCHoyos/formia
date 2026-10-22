import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { AuthLayout } from './auth-layout';

describe('AuthLayout', () => {
  it('renders the brand panel and the router outlet', async () => {
    TestBed.configureTestingModule({
      imports: [AuthLayout],
      providers: [provideRouter([]), provideTranslateService()],
    });
    const fixture = TestBed.createComponent(AuthLayout);
    fixture.detectChanges();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('auth.layout.headline');
    expect(element.textContent).toContain('auth.layout.copyright');
    expect(element.querySelector('router-outlet')).not.toBeNull();
  });
});
