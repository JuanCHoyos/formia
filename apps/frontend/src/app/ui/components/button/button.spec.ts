import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ButtonVariant } from 'primeng/button';

import { query } from '@/testing/dom';

import type { IconPosition } from '../../types/icon-position';
import type { AppIcon } from '../../types/icons';
import { Button } from './button';

@Component({
  imports: [Button],
  template: `
    <app-button
      [type]="type()"
      [icon]="icon()"
      [iconOnly]="iconOnly()"
      [iconPosition]="iconPosition()"
      [loading]="loading()"
      [disabled]="disabled()"
      [variant]="variant()"
      [fill]="fill()"
      [customClass]="customClass()"
      [ariaLabel]="ariaLabel()"
      [preventEventBubbling]="preventEventBubbling()"
      (pressed)="pressedEvents.push($event)"
    >
      Save
    </app-button>
  `,
})
class Host {
  readonly type = signal<'button' | 'submit'>('button');
  readonly icon = signal<AppIcon | undefined>(undefined);
  readonly iconOnly = signal(false);
  readonly iconPosition = signal<IconPosition>('left');
  readonly loading = signal(false);
  readonly disabled = signal(false);
  readonly variant = signal<ButtonVariant | undefined>(undefined);
  readonly fill = signal(false);
  readonly customClass = signal<string | undefined>(undefined);
  readonly ariaLabel = signal<string | undefined>(undefined);
  readonly preventEventBubbling = signal(false);
  readonly pressedEvents: MouseEvent[] = [];
}

describe('Button', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let parentClicks: number;

  const render = () => {
    fixture.detectChanges();
    return query<HTMLButtonElement>(fixture.nativeElement, 'button');
  };

  beforeEach(() => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    parentClicks = 0;
    (fixture.nativeElement as HTMLElement).addEventListener('click', () => parentClicks++);
  });

  it('renders the projected label as a plain button by default', () => {
    const button = render();

    expect(button.type).toBe('button');
    expect(button.textContent).toContain('Save');
    expect(button.disabled).toBe(false);
    expect(button.querySelector('ng-icon')).toBeNull();
  });

  it('emits pressed and lets the click bubble', () => {
    render().click();

    expect(host.pressedEvents).toHaveLength(1);
    expect(parentClicks).toBe(1);
  });

  it('stops the click from bubbling when asked', () => {
    host.preventEventBubbling.set(true);

    render().click();

    expect(host.pressedEvents).toHaveLength(1);
    expect(parentClicks).toBe(0);
  });

  it('renders as a submit button with a custom class and accessible name', () => {
    host.type.set('submit');
    host.customClass.set('w-full');
    host.ariaLabel.set('Save form');

    const button = render();

    expect(button.type).toBe('submit');
    expect(button.classList).toContain('w-full');
    expect(button.getAttribute('aria-label')).toBe('Save form');
  });

  it('shows the icon before the label, or after it when positioned right', () => {
    host.icon.set('lucidePlus');
    expect(query(render(), 'ng-icon').classList).not.toContain('order-2');

    host.iconPosition.set('right');
    expect(query(render(), 'ng-icon').classList).toContain('order-2');
  });

  it('hides the label for icon-only buttons', () => {
    host.icon.set('lucidePlus');
    host.iconOnly.set(true);

    const button = render();

    expect(button.querySelector('ng-icon')).not.toBeNull();
    expect(button.textContent).not.toContain('Save');
  });

  it('shows a spinner instead of the icon and blocks clicks while loading', () => {
    host.icon.set('lucidePlus');
    host.loading.set(true);
    host.iconPosition.set('right');

    const button = render();

    expect(button.disabled).toBe(true);
    expect(button.querySelector('ng-icon')).toBeNull();
    expect(query(button, 'svg[data-p-icon="spinner"]').classList).toContain('order-2');
  });

  it('is disabled when the disabled input is set', () => {
    host.disabled.set(true);

    expect(render().disabled).toBe(true);
  });

  it('fills the background only for text buttons', () => {
    host.fill.set(true);
    expect(render().classList).not.toContain('p-button-fill');

    host.variant.set('text');
    expect(render().classList).toContain('p-button-fill');
  });
});
