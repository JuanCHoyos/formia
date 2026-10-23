import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { provideTranslateService } from '@ngx-translate/core';

import { Dialog } from 'primeng/dialog';

import { query, typeInto } from '@/testing/dom';

import { APP_ICONS } from '../../constants/icons';
import { IconSelector } from './icon-selector';

describe('IconSelector', () => {
  let fixture: ComponentFixture<IconSelector>;
  let component: IconSelector;
  let touches: number;

  const render = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };
  const trigger = async () => query<HTMLButtonElement>(await render(), 'button');

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    fixture = TestBed.createComponent(IconSelector);
    component = fixture.componentInstance;
    touches = 0;
    component.touch.subscribe(() => touches++);
  });

  it('turns icon names into readable labels', () => {
    expect(component.iconLabel('lucideCircleCheck')).toBe('circle check');
    expect(component.iconLabel('lucideCheckCircle2')).toBe('check circle2');
  });

  it('offers every registered icon', () => {
    expect(component.icons).toEqual(Object.keys(APP_ICONS));
  });

  it('asks to pick icons, or one icon in single mode, while nothing is selected', async () => {
    expect((await trigger()).textContent).toContain('formBuilder.iconSelector.selectIcons');

    fixture.componentRef.setInput('multiple', false);
    expect((await trigger()).textContent).toContain('formBuilder.iconSelector.selectIcon');
  });

  it('shows the selected icons with their labels', async () => {
    component.value.set(['lucideStar', 'lucideSun']);

    const button = await trigger();

    expect(button.textContent).toContain('star');
    expect(button.textContent).toContain('sun');
    expect(component.selectionIconLabel()).toEqual([
      { icon: 'lucideStar', label: 'star' },
      { icon: 'lucideSun', label: 'sun' },
    ]);
  });

  it('accepts a single icon as value', () => {
    component.value.set('lucideStar');

    expect(component.committedIcons()).toEqual(['lucideStar']);
  });

  it('opens the dialog with a draft of the current value and a clean search', async () => {
    component.value.set(['lucideStar']);
    component.searchTerm.set('old');

    (await trigger()).click();
    const element = await render();

    expect(component['showDialog']()).toBe(true);
    expect(component.draftIcons()).toEqual(['lucideStar']);
    expect(component.searchTerm()).toBe('');
    expect(
      element.ownerDocument.querySelector(
        '[aria-label="formBuilder.iconSelector.searchAriaLabel"]',
      ),
    ).not.toBeNull();
  });

  it('does not open while disabled', async () => {
    fixture.componentRef.setInput('disabled', true);

    expect((await trigger()).disabled).toBe(true);
    component.openDialog();
    expect(component['showDialog']()).toBe(false);
  });

  it('filters the icons by the search term', async () => {
    component.openDialog();
    const element = await render();
    const search = query<HTMLInputElement>(element.ownerDocument.body, 'input[type="search"]');

    typeInto(search, ' Circle Check ');

    expect(component.filteredIcons()).toEqual(['lucideCircleCheck']);
  });

  it('shows an empty state when no icon matches', async () => {
    component.openDialog();
    component.searchTerm.set('no icon has this name');
    const element = await render();

    expect(component.filteredIcons()).toEqual([]);
    expect(element.ownerDocument.body.textContent).toContain('formBuilder.iconSelector.noIcons');
  });

  it('ignores search events that do not come from an input element', () => {
    component.updateSearch(new Event('input'));

    expect(component.searchTerm()).toBe('');
  });

  it('toggles icons in the draft and saves them as a list in multiple mode', () => {
    component.openDialog();
    component.toggleIcon('lucideStar');
    component.toggleIcon('lucideSun');
    component.toggleIcon('lucideStar');

    component.saveSelectedIcons();

    expect(component.value()).toEqual(['lucideSun']);
    expect(component['showDialog']()).toBe(false);
  });

  it('keeps one icon in the draft and saves it as a single value in single mode', () => {
    fixture.componentRef.setInput('multiple', false);
    component.openDialog();

    component.toggleIcon('lucideStar');
    component.toggleIcon('lucideSun');
    expect(component.draftIcons()).toEqual(['lucideSun']);

    component.saveSelectedIcons();
    expect(component.value()).toBe('lucideSun');
  });

  it('saves null when the only icon is deselected in single mode', () => {
    fixture.componentRef.setInput('multiple', false);
    component.value.set('lucideStar');
    component.openDialog();

    component.toggleIcon('lucideStar');
    component.saveSelectedIcons();

    expect(component.value()).toBeNull();
  });

  it('closes without saving when cancelled', () => {
    component.value.set(['lucideStar']);
    component.openDialog();
    component.toggleIcon('lucideSun');

    component.closeDialog();

    expect(component.value()).toEqual(['lucideStar']);
    expect(component['showDialog']()).toBe(false);
  });
  it('toggles, cancels and saves from the dialog buttons', async () => {
    component.openDialog();
    await render();
    const body = document.body;
    const iconButton = () =>
      query<HTMLButtonElement>(
        body,
        'button[aria-label="formBuilder.iconSelector.selectNamedIcon"][title="star"]',
      );
    const buttonWithText = (text: string) =>
      Array.from(body.querySelectorAll('button')).find((button) =>
        button.textContent?.includes(text),
      );

    iconButton().click();
    await render();
    expect(iconButton().getAttribute('aria-pressed')).toBe('true');

    buttonWithText('common.actions.accept')?.click();
    expect(component.value()).toEqual(['lucideStar']);

    component.openDialog();
    await render();
    iconButton().click();
    buttonWithText('common.actions.cancel')?.click();
    expect(component.value()).toEqual(['lucideStar']);
    expect(component['showDialog']()).toBe(false);
  });
  it('marks the field as touched when the dialog closes, not when it opens', () => {
    component.openDialog();
    expect(touches).toBe(0);

    component.saveSelectedIcons();
    expect(touches).toBe(1);
  });

  it('discards the draft when the dialog is closed with the X or Escape', async () => {
    component.value.set(['lucideStar']);
    component.openDialog();
    await render();
    component.toggleIcon('lucideSun');

    const dialog: Dialog = fixture.debugElement.query(By.directive(Dialog)).componentInstance;
    dialog.close(new Event('click'));
    await render();

    expect(component['showDialog']()).toBe(false);
    expect(component.value()).toEqual(['lucideStar']);
    expect(touches).toBe(1);

    component.openDialog();
    expect(component.draftIcons()).toEqual(['lucideStar']);
    expect(component['showDialog']()).toBe(true);
  });
});
