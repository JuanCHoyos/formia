import { CdkDrag, CdkDropList, type CdkDragDrop, type CdkDragStart } from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { provideTranslateService } from '@ngx-translate/core';

import type { Mock } from 'vitest';

import { query, typeInto } from '@/testing/dom';

import type { TreeDragData, TreeItem, TreeSortableItem } from '../../types/tree';
import { TreeSelector } from './tree-selector';
import { TREE_ROOT_DROP_LIST_ID, TREE_ROOT_PARENT_ID } from './tree-selector.constants';

type TreeDrop = CdkDragDrop<string, string, TreeDragData>;

const field = (id: string, label = id): TreeItem<string> => ({
  id,
  label,
  icon: 'lucideType',
  type: 'Field',
  items: [],
  value: id,
});

const container = (id: string, items: TreeItem<string>[]): TreeItem<string> => ({
  id,
  label: id,
  icon: 'lucideFolder',
  type: 'Group',
  items,
  value: id,
});

/** Two pages: `p1` holds a field and a group with two fields, `p2` is empty. */
const buildItems = (): TreeItem<string>[] => [
  container('p1', [
    field('name', 'Name'),
    container('g1', [field('email', 'Émail'), field('phone', 'Phone')]),
  ]),
  container('p2', []),
];

const drag = (data: TreeDragData) => ({ data }) as CdkDrag<TreeDragData>;
const page = (id = 'p1') => drag({ id, isPrincipal: true, isContainer: true });
const group = (id = 'g1') => drag({ id, isPrincipal: false, isContainer: true });
const leaf = (id = 'name') => drag({ id, isPrincipal: false, isContainer: false });

describe('TreeSelector', () => {
  let fixture: ComponentFixture<TreeSelector<string>>;
  let tree: TreeSelector<string>;
  let moves: TreeSortableItem<string>[];
  let scrollIntoView: Mock<Element['scrollIntoView']>;

  const render = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };
  const node = (element: HTMLElement, id: string) => query(element, `[data-tree-item-id="${id}"]`);
  const row = (element: HTMLElement, id: string) => query(node(element, id), '[tabindex="0"]');
  const toggleButton = (element: HTMLElement, id: string) =>
    query<HTMLButtonElement>(row(element, id), 'button');
  const dropList = (selector: string) =>
    fixture.debugElement.query(By.css(selector)).injector.get(CdkDropList<string>);
  const dropEvent = (event: {
    from: CdkDropList<string>;
    to: CdkDropList<string>;
    previousIndex: number;
    currentIndex: number;
    data: TreeDragData;
  }) =>
    ({
      previousContainer: event.from,
      container: event.to,
      previousIndex: event.previousIndex,
      currentIndex: event.currentIndex,
      item: { data: event.data },
    }) as unknown as TreeDrop;

  beforeEach(() => {
    scrollIntoView = vi.fn<Element['scrollIntoView']>();
    Element.prototype.scrollIntoView = scrollIntoView;
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    fixture = TestBed.createComponent(TreeSelector<string>);
    tree = fixture.componentInstance;
    fixture.componentRef.setInput('items', buildItems());
    moves = [];
    tree.sortedItems.subscribe((move) => moves.push(move));
  });

  describe('rendering', () => {
    it('renders every item expanded, indented by depth, inside a height-limited list', async () => {
      fixture.componentRef.setInput('maxContentHeight', '20rem');
      const element = await render();

      expect(query(element, `#${TREE_ROOT_DROP_LIST_ID}`).style.maxHeight).toBe('20rem');
      expect(row(element, 'p1').style.paddingLeft).toBe('8px');
      expect(row(element, 'g1').style.paddingLeft).toBe('40px');
      expect(row(element, 'email').style.paddingLeft).toBe('72px');
      expect(toggleButton(element, 'g1').getAttribute('aria-expanded')).toBe('true');
      expect(element.textContent).toContain('Phone');
    });

    it('shows an empty state when there are no items', async () => {
      fixture.componentRef.setInput('items', []);

      expect((await render()).textContent).toContain('formBuilder.sidebar.noComponents');
    });

    it('hides the search box unless search is enabled', async () => {
      expect((await render()).querySelector('input[type="search"]')).toBeNull();

      fixture.componentRef.setInput('search', true);
      expect((await render()).querySelector('input[type="search"]')).not.toBeNull();
    });

    it('connects the root list with the list of every container', () => {
      expect(tree.dropListIds()).toEqual([
        TREE_ROOT_DROP_LIST_ID,
        'tree-list-p1',
        'tree-list-g1',
        'tree-list-p2',
      ]);
    });
  });

  describe('expand and collapse', () => {
    it('collapses and expands a container without touching the items it received', async () => {
      const items = buildItems();
      fixture.componentRef.setInput('items', items);
      let element = await render();

      toggleButton(element, 'g1').click();
      element = await render();

      expect(toggleButton(element, 'g1').getAttribute('aria-expanded')).toBe('false');
      expect(toggleButton(element, 'g1').getAttribute('aria-label')).toBe('common.actions.expand');
      expect(element.querySelector('[data-tree-item-id="email"]')).toBeNull();
      expect(items).toEqual(buildItems());
      expect(tree.selectedItem()).toBeNull();

      toggleButton(element, 'g1').click();
      element = await render();
      expect(element.querySelector('[data-tree-item-id="email"]')).not.toBeNull();
    });

    it('turns a collapsed container into a drop zone that only reacts to the pointer while dragging', async () => {
      tree.toggle('g1');
      const element = await render();
      const zone = query(row(element, 'g1'), '.cdk-drop-list');

      expect(zone.id).toBe('tree-list-g1');
      expect(zone.classList).toContain('pointer-events-none');

      tree.dragStarted();
      await render();
      expect(zone.classList).not.toContain('pointer-events-none');
      tree.dragEnded();
    });
  });

  describe('search', () => {
    beforeEach(() => fixture.componentRef.setInput('search', true));

    it('returns the items as they are while the search is empty', () => {
      const items = buildItems();
      fixture.componentRef.setInput('items', items);

      expect(tree.filteredItems()).toBe(items);
    });

    it('keeps the containers that hold a match, ignoring accents and case', async () => {
      const element = await render();

      typeInto(query<HTMLInputElement>(element, 'input[type="search"]'), ' EMAIL ');
      await render();

      expect(tree.filteredItems()).toEqual([
        expect.objectContaining({
          id: 'p1',
          items: [
            expect.objectContaining({
              id: 'g1',
              items: [expect.objectContaining({ id: 'email' })],
            }),
          ],
        }),
      ]);
    });

    it('matches items by type and shows collapsed containers while searching', () => {
      tree.toggle('g1');
      tree.searchTerm.set('field');

      expect(tree.isExpanded('g1')).toBe(true);
      expect(tree.filteredItems().map((item) => item.id)).toEqual(['p1']);
    });

    it('disables dragging while a search filter is applied', async () => {
      fixture.componentRef.setInput('sort', true);
      expect(tree.sortable()).toBe(true);

      tree.searchTerm.set('name');
      const element = await render();

      expect(tree.sortable()).toBe(false);
      expect(query(element, `#${TREE_ROOT_DROP_LIST_ID}`).classList).toContain(
        'cdk-drop-list-disabled',
      );
    });
  });

  describe('drop rules', () => {
    const list = (id: string) => {
      const element = document.createElement('div');
      element.classList.add('cdk-drop-list');
      return { id, element: { nativeElement: element } } as unknown as CdkDropList<string>;
    };

    it.each([
      ['a page', 'the root list', page(), null, true],
      ['a page', 'a page', page(), 0, false],
      ['a group', 'the root list', group(), null, false],
      ['a group', 'a page', group(), 0, true],
      ['a group', 'another group', group(), 1, false],
      ['a field', 'the root list', leaf(), null, false],
      ['a field', 'a page', leaf(), 0, true],
      ['a field', 'a group', leaf(), 1, true],
    ])('%s dropped on %s → %s', (_item, _target, dragged, ownerDepth, allowed) => {
      expect(tree.canEnter(dragged, list('target'), ownerDepth)).toBe(allowed);
    });

    it('lets only the innermost list under the pointer receive the item', () => {
      const outer = list('tree-list-p1');
      const inner = list('tree-list-g1');
      outer.element.nativeElement.append(inner.element.nativeElement);
      const target = document.createElement('span');
      inner.element.nativeElement.append(target);
      Object.defineProperty(document, 'elementFromPoint', {
        value: vi.fn(() => target),
        configurable: true,
      });

      tree.dragStarted();
      expect(tree.canEnter(leaf(), outer, 0)).toBe(true);

      document.dispatchEvent(new MouseEvent('pointermove', { clientX: 10, clientY: 20 }));
      expect(tree.canEnter(leaf(), outer, 0)).toBe(false);
      expect(tree.canEnter(leaf(), inner, 1)).toBe(true);
      expect(document.elementFromPoint).toHaveBeenCalledWith(10, 20);

      tree.dragEnded();
      expect(tree.canEnter(leaf(), outer, 0)).toBe(true);
    });

    it('wires the rules into every list of the tree', async () => {
      await render();
      const root = dropList(`#${TREE_ROOT_DROP_LIST_ID}`);
      const g1 = dropList('#tree-list-g1');

      expect(root.enterPredicate(page(), root)).toBe(true);
      expect(root.enterPredicate(leaf(), root)).toBe(false);
      expect(g1.enterPredicate(leaf(), g1)).toBe(true);
      expect(g1.enterPredicate(group('g2'), g1)).toBe(false);
    });

    it('stops tracking the pointer when destroyed in the middle of a drag', () => {
      const removeEventListener = vi.spyOn(document, 'removeEventListener');
      tree.dragStarted();

      fixture.destroy();

      expect(removeEventListener).toHaveBeenCalledWith('pointermove', expect.any(Function), true);
    });
  });

  describe('moves', () => {
    beforeEach(() => fixture.componentRef.setInput('sort', true));

    it('reports page reorders from the root list', async () => {
      await render();
      const root = dropList(`#${TREE_ROOT_DROP_LIST_ID}`);

      root.dropped.emit(
        dropEvent({ from: root, to: root, previousIndex: 0, currentIndex: 1, data: page().data }),
      );

      expect(moves).toEqual([
        {
          from: TREE_ROOT_PARENT_ID,
          to: TREE_ROOT_PARENT_ID,
          itemId: 'p1',
          oldIndex: 0,
          newIndex: 1,
          isPrincipal: true,
        },
      ]);
    });

    it('reports moves inside a container and to another container, even at the same index', async () => {
      await render();
      const p1 = dropList('#tree-list-p1');
      const g1 = dropList('#tree-list-g1');

      p1.dropped.emit(
        dropEvent({ from: p1, to: p1, previousIndex: 0, currentIndex: 1, data: leaf().data }),
      );
      g1.dropped.emit(
        dropEvent({ from: p1, to: g1, previousIndex: 0, currentIndex: 0, data: leaf().data }),
      );

      expect(moves).toEqual([
        { from: 'p1', to: 'p1', itemId: 'name', oldIndex: 0, newIndex: 1, isPrincipal: false },
        { from: 'p1', to: 'g1', itemId: 'name', oldIndex: 0, newIndex: 0, isPrincipal: false },
      ]);
    });

    it('ignores drops that leave the item where it was or carry invalid data', async () => {
      await render();
      const p1 = dropList('#tree-list-p1');

      p1.dropped.emit(
        dropEvent({ from: p1, to: p1, previousIndex: 1, currentIndex: 1, data: leaf().data }),
      );
      p1.dropped.emit(
        dropEvent({
          from: p1,
          to: p1,
          previousIndex: 0,
          currentIndex: 1,
          data: { isPrincipal: false, isContainer: false } as TreeDragData,
        }),
      );

      expect(moves).toEqual([]);
    });

    it('appends the item to a collapsed container and opens it', async () => {
      tree.toggle('g1');
      await render();
      const p1 = dropList('#tree-list-p1');
      const collapsed = dropList('#tree-list-g1');

      collapsed.dropped.emit(
        dropEvent({
          from: p1,
          to: collapsed,
          previousIndex: 0,
          currentIndex: 0,
          data: leaf().data,
        }),
      );
      const element = await render();

      expect(moves).toEqual([
        { from: 'p1', to: 'g1', itemId: 'name', oldIndex: 0, newIndex: 2, isPrincipal: false },
      ]);
      expect(toggleButton(element, 'g1').getAttribute('aria-expanded')).toBe('true');
    });

    it('shows a drop zone in empty containers only while sorting is possible', async () => {
      let element = await render();
      expect(node(element, 'p2').textContent).toContain('common.actions.dragPlaceholder');

      fixture.componentRef.setInput('sort', false);
      element = await render();
      expect(node(element, 'p2').textContent).not.toContain('common.actions.dragPlaceholder');
    });

    it('tracks the drag from the items themselves', async () => {
      await render();
      const item = fixture.debugElement
        .query(By.css('[data-tree-item-id="name"]'))
        .injector.get(CdkDrag);

      item.started.emit({} as CdkDragStart);
      expect(tree.dragging()).toBe(true);

      item.ended.emit({} as Parameters<typeof item.ended.emit>[0]);
      expect(tree.dragging()).toBe(false);
    });
  });

  describe('selection', () => {
    it('selects an item on click or Enter and marks it as current', async () => {
      let element = await render();

      row(element, 'name').click();
      element = await render();
      expect(tree.selectedItem()).toBe('name');
      expect(row(element, 'name').getAttribute('aria-current')).toBe('true');

      row(element, 'email').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      expect(tree.selectedItem()).toBe('email');
    });

    it('ignores Enter presses coming from the toggle button', async () => {
      const element = await render();

      toggleButton(element, 'g1').dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
      );

      expect(tree.selectedItem()).toBeNull();
    });

    it('does not select pages when principal items are disabled', async () => {
      fixture.componentRef.setInput('isPrincipalItemDisabled', true);
      const element = await render();

      row(element, 'p1').click();
      expect(tree.selectedItem()).toBeNull();

      row(element, 'g1').click();
      expect(tree.selectedItem()).toBe('g1');
    });

    it('reveals an item selected from outside: opens its containers and scrolls to it', async () => {
      tree.toggle('p1');
      tree.toggle('g1');
      await render();

      tree.selectedItem.set('phone');
      const element = await render();

      expect(tree.isExpanded('p1')).toBe(true);
      expect(tree.isExpanded('g1')).toBe(true);
      expect(row(element, 'phone').getAttribute('aria-current')).toBe('true');
      expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
      expect(scrollIntoView.mock.contexts.at(-1)).toBe(node(element, 'phone'));
    });

    it('ignores outside selections that are not in the tree', async () => {
      await render();

      tree.selectedItem.set('missing');
      await render();

      expect(scrollIntoView).not.toHaveBeenCalled();
    });
  });
});
