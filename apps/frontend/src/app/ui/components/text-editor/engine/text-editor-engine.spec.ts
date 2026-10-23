import type { TextEditorTool } from '../../../types/text-editor';
import { DEFAULT_TEXT_EDITOR_TOOLS } from '../text-editor.constants';
import { TextEditorEngine } from './text-editor-engine';

const ALL_TOOLS: ReadonlySet<TextEditorTool> = new Set([...DEFAULT_TEXT_EDITOR_TOOLS, 'heading']);

const setup = (html: string, tools: ReadonlySet<TextEditorTool> = ALL_TOOLS) => {
  const root = document.createElement('div');
  root.contentEditable = 'true';
  document.body.replaceChildren(root);
  const engine = new TextEditorEngine(root, () => tools);
  engine.setContent(html);
  return { root, engine };
};

const findText = (root: HTMLElement, value: string): Text => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node instanceof Text && node.data.includes(value)) {
      return node;
    }
  }
  throw new Error(`Text "${value}" not found`);
};

/** Selects `value` inside a single text node. */
const selectText = (root: HTMLElement, value: string): void => {
  const node = findText(root, value);
  const start = node.data.indexOf(value);
  const range = document.createRange();
  range.setStart(node, start);
  range.setEnd(node, start + value.length);
  document.getSelection()?.removeAllRanges();
  document.getSelection()?.addRange(range);
};

/** Places the caret right after `before` in the text node that contains it. */
const caretAfter = (root: HTMLElement, before: string): void => {
  const node = findText(root, before);
  const range = document.createRange();
  range.setStart(node, node.data.indexOf(before) + before.length);
  range.collapse(true);
  document.getSelection()?.removeAllRanges();
  document.getSelection()?.addRange(range);
};

const caretAtStart = (element: Element | null): void => {
  if (!element) {
    throw new Error('Element not found');
  }
  const range = document.createRange();
  range.setStart(element.firstChild ?? element, 0);
  range.collapse(true);
  document.getSelection()?.removeAllRanges();
  document.getSelection()?.addRange(range);
};

const beforeInput = (inputType: string, data: string | null = null): InputEvent => {
  return new InputEvent('beforeinput', { inputType, data, cancelable: true });
};

/** Mimics the browser inserting typed text at the caret, then the `input` event. */
const type = (engine: TextEditorEngine, value: string): void => {
  if (engine.handleBeforeInput(beforeInput('insertText', value))) {
    return;
  }
  const range = document.getSelection()?.getRangeAt(0);
  if (!range) {
    throw new Error('No selection');
  }
  const node = range.startContainer;
  if (node instanceof Text) {
    node.insertData(range.startOffset, value);
    range.setStart(node, range.startOffset + value.length);
  } else {
    const text = document.createTextNode(value);
    range.insertNode(text);
    range.setStart(text, value.length);
  }
  range.collapse(true);
  engine.handleInput(new InputEvent('input', { inputType: 'insertText', data: value }));
};

describe('TextEditorEngine', () => {
  describe('inline formats', () => {
    it('bolds the selected text only', () => {
      const { root, engine } = setup('<p>Hello world</p>');
      selectText(root, 'world');

      engine.execute({ type: 'mark', mark: 'bold' });

      expect(engine.getContent()).toBe('<p>Hello <strong>world</strong></p>');
      expect(engine.state().marks.has('bold')).toBe(true);
    });

    it('removes a mark when the whole selection already has it', () => {
      const { root, engine } = setup('<p>Hello <strong>world</strong></p>');
      selectText(root, 'wor');

      engine.execute({ type: 'mark', mark: 'bold' });

      expect(engine.getContent()).toBe('<p>Hello wor<strong>ld</strong></p>');
    });

    it('merges neighbouring equal formats', () => {
      const { root, engine } = setup('<p><em>ab</em>cd</p>');
      selectText(root, 'cd');

      engine.execute({ type: 'mark', mark: 'italic' });

      expect(engine.getContent()).toBe('<p><em>abcd</em></p>');
    });

    it('keeps superscript and subscript exclusive', () => {
      const { root, engine } = setup('<p><sup>x</sup></p>');
      selectText(root, 'x');

      engine.execute({ type: 'mark', mark: 'subscript' });

      expect(engine.getContent()).toBe('<p><sub>x</sub></p>');
    });

    it('applies the format chosen at a collapsed caret to the next typed text', () => {
      const { root, engine } = setup('<p>Hi</p>');
      caretAfter(root, 'Hi');

      engine.execute({ type: 'mark', mark: 'bold' });
      expect(engine.state().marks.has('bold')).toBe(true);
      type(engine, '!');

      expect(engine.getContent()).toBe('<p>Hi<strong>!</strong></p>');
    });

    it('replaces the text color and removes it with null', () => {
      const { root, engine } = setup('<p>Brand</p>');
      selectText(root, 'Brand');

      engine.execute({ type: 'textColor', color: 'teal' });
      expect(engine.getContent()).toBe('<p><span class="te-color-teal">Brand</span></p>');
      expect(engine.state().textColor).toBe('teal');

      selectText(root, 'Brand');
      engine.execute({ type: 'textColor', color: 'violet' });
      expect(engine.getContent()).toBe('<p><span class="te-color-violet">Brand</span></p>');

      selectText(root, 'Brand');
      engine.execute({ type: 'textColor', color: null });
      expect(engine.getContent()).toBe('<p>Brand</p>');
    });

    it('clears marks and colors but keeps links', () => {
      const { root, engine } = setup(
        '<p><a href="https://a.dev"><strong><span class="te-bg-blue">go</span></strong></a></p>',
      );
      selectText(root, 'go');

      engine.execute({ type: 'clearFormatting' });

      expect(engine.getContent()).toBe(
        '<p><a href="https://a.dev" rel="noopener noreferrer" target="_blank">go</a></p>',
      );
    });
  });

  describe('links', () => {
    it('links the selection and reports its href', () => {
      const { root, engine } = setup('<p>Visit docs</p>');
      selectText(root, 'docs');

      engine.execute({ type: 'link', href: 'https://angular.dev' });

      expect(engine.getContent()).toBe(
        '<p>Visit <a href="https://angular.dev" rel="noopener noreferrer" target="_blank">docs</a></p>',
      );
      caretAfter(root, 'do');
      expect(engine.state().link).toBe('https://angular.dev');
    });

    it('edits and removes the link at the caret', () => {
      const { root, engine } = setup('<p><a href="https://a.dev">site</a></p>');
      caretAfter(root, 'si');

      engine.execute({ type: 'link', href: 'https://b.dev' });
      expect(root.querySelector('a')?.getAttribute('href')).toBe('https://b.dev');

      caretAfter(root, 'si');
      engine.execute({ type: 'link', href: null });
      expect(engine.getContent()).toBe('<p>site</p>');
    });

    it('inserts the URL as a link when nothing is selected', () => {
      const { root, engine } = setup('<p>See </p>');
      caretAfter(root, 'See ');

      engine.execute({ type: 'link', href: 'mailto:hi@pliego.app' });

      expect(root.querySelector('a')?.textContent).toBe('hi@pliego.app');
    });

    it('inserts a link with the given text at the caret', () => {
      const { root, engine } = setup('<p>See </p>');
      caretAfter(root, 'See ');

      engine.execute({ type: 'link', href: 'https://pliego.app', text: 'our site' });

      expect(root.querySelector('a')?.textContent).toBe('our site');
      expect(root.querySelector('a')?.getAttribute('href')).toBe('https://pliego.app');
    });

    it('replaces the selected text when another text is given', () => {
      const { root, engine } = setup('<p>Go here now</p>');
      selectText(root, 'here');

      engine.execute({ type: 'link', href: 'https://pliego.app', text: 'docs' });

      expect(engine.getContent()).toBe(
        '<p>Go <a href="https://pliego.app" rel="noopener noreferrer" target="_blank">docs</a> now</p>',
      );
    });

    it('edits the text and URL of the link at the caret and reports its text', () => {
      const { root, engine } = setup('<p><a href="https://a.dev">old</a></p>');
      caretAfter(root, 'ol');
      expect(engine.state().linkText).toBe('old');

      engine.execute({ type: 'link', href: 'https://b.dev', text: 'new' });

      expect(root.querySelector('a')?.textContent).toBe('new');
      expect(root.querySelector('a')?.getAttribute('href')).toBe('https://b.dev');
    });

    it('turns a typed URL into a link after a space', () => {
      const { root, engine } = setup('<p>go https://pliego.app</p>');
      caretAfter(root, 'pliego.app');

      type(engine, ' ');

      expect(root.querySelector('a')?.getAttribute('href')).toBe('https://pliego.app');
      expect(root.querySelector('a')?.textContent).toBe('https://pliego.app');
    });
  });

  describe('blocks', () => {
    it('turns paragraphs into a list and back', () => {
      const { root, engine } = setup('<p>one</p><p>two</p>');
      const range = document.createRange();
      range.setStart(findText(root, 'one'), 0);
      range.setEnd(findText(root, 'two'), 3);
      document.getSelection()?.removeAllRanges();
      document.getSelection()?.addRange(range);

      engine.execute({ type: 'list', listType: 'bullet' });
      expect(engine.getContent()).toBe('<ul><li>one</li><li>two</li></ul>');
      expect(engine.state().listType).toBe('bullet');

      engine.execute({ type: 'list', listType: 'ordered' });
      expect(engine.getContent()).toBe('<ol><li>one</li><li>two</li></ol>');

      engine.execute({ type: 'list', listType: 'ordered' });
      expect(engine.getContent()).toBe('<p>one</p><p>two</p>');
    });

    it('lifts a middle item out of a list, splitting it', () => {
      const { root, engine } = setup('<ul><li>a</li><li>b</li><li>c</li></ul>');
      caretAfter(root, 'b');

      engine.execute({ type: 'list', listType: 'bullet' });

      expect(engine.getContent()).toBe('<ul><li>a</li></ul><p>b</p><ul><li>c</li></ul>');
    });

    it('indents and outdents list items with Tab', () => {
      const { root, engine } = setup('<ul><li>a</li><li>b</li></ul>');
      caretAfter(root, 'b');

      engine.handleKeydown(new KeyboardEvent('keydown', { key: 'Tab', cancelable: true }));
      expect(engine.getContent()).toBe('<ul><li>a<ul><li>b</li></ul></li></ul>');

      engine.handleKeydown(
        new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, cancelable: true }),
      );
      expect(engine.getContent()).toBe('<ul><li>a</li><li>b</li></ul>');
    });

    it('lets Tab move focus outside lists', () => {
      const { root, engine } = setup('<p>a</p>');
      caretAfter(root, 'a');
      const event = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });

      expect(engine.handleKeydown(event)).toBeNull();
      expect(event.defaultPrevented).toBe(false);
    });

    it('wraps and unwraps a blockquote', () => {
      const { root, engine } = setup('<p>quote</p>');
      caretAfter(root, 'quo');

      engine.execute({ type: 'blockquote' });
      expect(engine.getContent()).toBe('<blockquote><p>quote</p></blockquote>');
      expect(engine.state().blockquote).toBe(true);

      engine.execute({ type: 'blockquote' });
      expect(engine.getContent()).toBe('<p>quote</p>');
    });

    it('sets headings and alignment', () => {
      const { root, engine } = setup('<p>Title</p>');
      caretAfter(root, 'Ti');

      engine.execute({ type: 'blockType', blockType: 'heading2' });
      engine.execute({ type: 'align', alignment: 'center' });

      expect(engine.getContent()).toBe('<h2 class="te-align-center">Title</h2>');
      expect(engine.state()).toMatchObject({ blockType: 'heading2', alignment: 'center' });
    });

    it('inserts a horizontal rule followed by a paragraph', () => {
      const { root, engine } = setup('<p>above</p>');
      caretAfter(root, 'above');

      engine.execute({ type: 'horizontalRule' });
      type(engine, 'below');

      expect(engine.getContent()).toBe('<p>above</p><hr><p>below</p>');
    });
  });

  describe('typing', () => {
    it('splits the block on Enter and keeps the format of the tail', () => {
      const { root, engine } = setup('<p>ab<strong>cd</strong></p>');
      caretAfter(root, 'c');

      engine.handleBeforeInput(beforeInput('insertParagraph'));

      expect(engine.getContent()).toBe('<p>ab<strong>c</strong></p><p><strong>d</strong></p>');
    });

    it('starts a paragraph after a heading', () => {
      const { root, engine } = setup('<h1>Title</h1>');
      caretAfter(root, 'Title');

      engine.handleBeforeInput(beforeInput('insertParagraph'));
      type(engine, 'body');

      expect(engine.getContent()).toBe('<h1>Title</h1><p>body</p>');
    });

    it('leaves the list on Enter in an empty item', () => {
      const { root, engine } = setup('<ul><li>a</li></ul>');
      caretAfter(root, 'a');

      engine.handleBeforeInput(beforeInput('insertParagraph'));
      engine.handleBeforeInput(beforeInput('insertParagraph'));
      type(engine, 'after');

      expect(engine.getContent()).toBe('<ul><li>a</li></ul><p>after</p>');
    });

    it('lifts a list item on Backspace at its start', () => {
      const { root, engine } = setup('<ul><li>a</li></ul>');
      caretAtStart(root.querySelector('li'));

      const event = beforeInput('deleteContentBackward');
      engine.handleBeforeInput(event);

      expect(event.defaultPrevented).toBe(true);
      expect(engine.getContent()).toBe('<p>a</p>');
    });

    it('converts Markdown-like prefixes into blocks', () => {
      const { root, engine } = setup('<p>-</p>');
      caretAfter(root, '-');

      type(engine, ' ');
      type(engine, 'item');

      expect(engine.getContent()).toBe('<ul><li>item</li></ul>');
    });

    it('ignores heading prefixes when headings are disabled', () => {
      const tools = new Set(DEFAULT_TEXT_EDITOR_TOOLS);
      const { root, engine } = setup('<p>#</p>', tools);
      caretAfter(root, '#');

      type(engine, ' ');

      expect(root.querySelector('h1')).toBeNull();
    });

    it('formats **text** once it is closed and does not continue the format', () => {
      const { root, engine } = setup('<p>a **bold*</p>');
      caretAfter(root, 'bold*');

      type(engine, '*');
      type(engine, ' c');

      expect(engine.getContent()).toBe('<p>a <strong>bold</strong> c</p>');
    });
  });

  describe('history', () => {
    it('undoes and redoes commands', () => {
      const { root, engine } = setup('<p>text</p>');
      selectText(root, 'text');
      engine.execute({ type: 'mark', mark: 'bold' });
      expect(engine.state().canUndo).toBe(true);

      engine.execute({ type: 'undo' });
      expect(engine.getContent()).toBe('<p>text</p>');

      engine.execute({ type: 'redo' });
      expect(engine.getContent()).toBe('<p><strong>text</strong></p>');
    });

    it('starts empty after content is replaced', () => {
      const { root, engine } = setup('<p>text</p>');
      selectText(root, 'text');
      engine.execute({ type: 'mark', mark: 'bold' });

      engine.setContent('<p>other</p>');

      expect(engine.state().canUndo).toBe(false);
    });
  });

  describe('keyboard', () => {
    it('runs mark shortcuts and blocks native formatting for disabled tools', () => {
      const { root, engine } = setup('<p>text</p>', new Set(['italic']));
      selectText(root, 'text');

      const bold = new KeyboardEvent('keydown', { key: 'b', ctrlKey: true, cancelable: true });
      expect(engine.handleKeydown(bold)).toBeNull();
      expect(bold.defaultPrevented).toBe(true);

      const italic = new KeyboardEvent('keydown', { key: 'i', ctrlKey: true, cancelable: true });
      expect(engine.handleKeydown(italic)).toBe('changed');
      expect(engine.getContent()).toBe('<p><em>text</em></p>');
    });

    it('asks for the link popover on Ctrl+K', () => {
      const { root, engine } = setup('<p>text</p>');
      caretAfter(root, 'te');

      expect(
        engine.handleKeydown(
          new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, cancelable: true }),
        ),
      ).toBe('link');
    });
  });
});
