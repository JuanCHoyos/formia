import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextRich } from './text-rich';

describe('TextRich', () => {
  let fixture: ComponentFixture<TextRich>;

  const render = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(() => {
    fixture = TestBed.createComponent(TextRich);
  });

  it('renders the given html as read-only content', async () => {
    fixture.componentRef.setInput('html', '<p>Read me</p>');
    const element = await render();
    const content = element.querySelector('.ProseMirror');

    expect(content?.textContent).toContain('Read me');
    expect(content?.getAttribute('contenteditable')).toBe('false');
  });
  it('does nothing when the editor is not rendered yet', () => {
    expect(() => fixture.componentInstance.ngAfterViewInit()).not.toThrow();
  });
});
