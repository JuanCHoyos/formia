import type { TextRange } from './selection';

export interface EditorSnapshot {
  readonly html: string;
  readonly selection: TextRange | null;
}

/** Undo/redo stacks of editor snapshots. Native undo cannot be used once the DOM is edited by script. */
export class EditorHistory {
  private undoStack: EditorSnapshot[] = [];
  private redoStack: EditorSnapshot[] = [];

  constructor(private readonly limit: number) {}

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /** Stores the state before a change. Recording a change discards anything that could be redone. */
  record(snapshot: EditorSnapshot): void {
    if (this.undoStack.at(-1)?.html === snapshot.html) {
      return;
    }
    this.undoStack.push(snapshot);
    if (this.undoStack.length > this.limit) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  undo(current: EditorSnapshot): EditorSnapshot | null {
    const previous = this.undoStack.pop();
    if (!previous) {
      return null;
    }
    this.redoStack.push(current);
    return previous;
  }

  redo(current: EditorSnapshot): EditorSnapshot | null {
    const next = this.redoStack.pop();
    if (!next) {
      return null;
    }
    this.undoStack.push(current);
    return next;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
