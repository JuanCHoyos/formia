import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextRich } from './text-rich';

describe('TextRich', () => {
  let fixture: ComponentFixture<TextRich>;

  const render = (html: string | null) => {
    fixture.componentRef.setInput('html', html);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).querySelector('.text-editor-content');
  };

  beforeEach(() => {
    fixture = TestBed.createComponent(TextRich);
  });

  it('renders the editor html with its formats, colors and alignment', () => {
    const content = render(
      '<p class="te-align-center"><strong>Bold</strong> <span class="te-color-teal">brand</span></p>',
    );

    expect(content?.innerHTML).toBe(
      '<p class="te-align-center"><strong>Bold</strong> <span class="te-color-teal">brand</span></p>',
    );
    expect(content?.getAttribute('contenteditable')).toBeNull();
  });

  it('strips anything outside the editor allowlist', () => {
    const content = render(
      '<p onclick="x()">Hi<script>alert(1)</script><a href="javascript:x()">!</a></p>',
    );

    expect(content?.innerHTML).toBe('<p>Hi!</p>');
  });

  it('renders nothing for empty values', () => {
    expect(render(null)?.innerHTML).toBe('');
  });
});
