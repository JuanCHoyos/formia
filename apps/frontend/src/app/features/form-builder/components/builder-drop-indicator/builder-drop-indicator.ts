import { Component } from '@angular/core';

@Component({
  selector: 'app-builder-drop-indicator',
  host: { 'aria-hidden': 'true' },
  template: '',
  styles: `
    :host {
      position: relative;
      display: block;
      width: 100%;
      max-width: 37rem;
      height: 4px;
      margin: 2px auto;
      border-radius: 2px;
      background: var(--p-primary-color);
    }

    :host::before {
      content: '';
      position: absolute;
      top: -3px;
      left: -4px;
      width: 10px;
      height: 10px;
      border: 2px solid var(--p-primary-color);
      border-radius: 50%;
      background: var(--p-content-background);
    }

    :host-context([data-sorting-disabled='true']) {
      display: none;
    }
  `,
})
export class BuilderDropIndicator {}
