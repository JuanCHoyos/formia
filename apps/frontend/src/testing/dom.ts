/** Small DOM helpers shared by component specs. */

export function query<T extends Element = HTMLElement>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error(`No element matches "${selector}"`);
  }

  return element;
}

export function typeInto(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

export function submitForm(root: ParentNode, selector = 'form'): void {
  query<HTMLFormElement>(root, selector).dispatchEvent(new Event('submit', { cancelable: true }));
}

/** A promise that the test resolves by hand, to observe in-flight states. */
export function deferred<T = void>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => (resolve = done));

  return { promise, resolve };
}
