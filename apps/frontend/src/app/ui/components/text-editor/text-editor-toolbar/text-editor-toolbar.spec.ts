import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideTranslateService } from '@ngx-translate/core';

import type { TextEditorCommand, TextEditorTool } from '../../../types/text-editor';
import {
  DEFAULT_TEXT_EDITOR_TOOLS,
  EMPTY_TEXT_EDITOR_STATE,
  TEXT_EDITOR_TOOLBAR_ITEMS,
} from '../text-editor.constants';
import { fitToolbarItems, TextEditorToolbar } from './text-editor-toolbar';

describe('fitToolbarItems', () => {
  it('shows everything when there is room or the width is unknown', () => {
    expect(fitToolbarItems(TEXT_EDITOR_TOOLBAR_ITEMS, Number.POSITIVE_INFINITY).size).toBe(
      TEXT_EDITOR_TOOLBAR_ITEMS.length,
    );
  });

  it('keeps the highest priority items when space runs out', () => {
    const visible = fitToolbarItems(TEXT_EDITOR_TOOLBAR_ITEMS, 320);

    expect(visible.has('bold')).toBe(true);
    expect(visible.has('link')).toBe(true);
    expect(visible.has('clearFormatting')).toBe(false);
    expect(visible.size).toBeLessThan(TEXT_EDITOR_TOOLBAR_ITEMS.length);
  });
});

describe('TextEditorToolbar', () => {
  let fixture: ComponentFixture<TextEditorToolbar>;
  let commands: TextEditorCommand[];

  const render = (tools: readonly TextEditorTool[] = DEFAULT_TEXT_EDITOR_TOOLS) => {
    fixture.componentRef.setInput('tools', new Set(tools));
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  const button = (element: HTMLElement, id: string) => {
    const found = element.querySelector<HTMLButtonElement>(`[data-toolbar-item="${id}"]`);
    if (!found) {
      throw new Error(`Button ${id} not rendered`);
    }
    return found;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    fixture = TestBed.createComponent(TextEditorToolbar);
    fixture.componentRef.setInput('state', {
      ...EMPTY_TEXT_EDITOR_STATE,
      marks: new Set(['bold']),
      canUndo: true,
    });
    fixture.componentRef.setInput('controls', 'editor');
    commands = [];
    fixture.componentInstance.requested.subscribe((command) => commands.push(command));
  });

  it('emits commands and reflects the active marks', () => {
    const element = render();

    button(element, 'italic').click();
    button(element, 'undo').click();

    expect(commands).toEqual([{ type: 'mark', mark: 'italic' }, { type: 'undo' }]);
    expect(button(element, 'bold').getAttribute('aria-pressed')).toBe('true');
    expect(button(element, 'italic').getAttribute('aria-pressed')).toBe('false');
  });

  it('disables actions that are not available', () => {
    const element = render();

    expect(button(element, 'redo').disabled).toBe(true);
    expect(button(element, 'indent').disabled).toBe(true);
  });

  it('keeps a single tab stop and moves it with the arrow keys', () => {
    const element = render(['bold', 'italic', 'underline']);

    expect(button(element, 'bold').tabIndex).toBe(0);
    expect(button(element, 'italic').tabIndex).toBe(-1);

    button(element, 'bold').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    fixture.detectChanges();

    expect(button(element, 'italic').tabIndex).toBe(0);
    expect(document.activeElement).toBe(button(element, 'italic'));

    button(element, 'italic').dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(button(element, 'underline'));
  });

  it('marks popover buttons as expandable', () => {
    const element = render();

    expect(button(element, 'link').getAttribute('aria-haspopup')).toBe('dialog');
    expect(button(element, 'link').getAttribute('aria-expanded')).toBe('false');

    button(element, 'link').click();
    fixture.detectChanges();

    expect(button(element, 'link').getAttribute('aria-expanded')).toBe('true');
  });

  it('only renders the enabled tools', () => {
    const element = render(['bold']);

    expect(element.querySelectorAll('[data-toolbar-item]')).toHaveLength(1);
  });
});
