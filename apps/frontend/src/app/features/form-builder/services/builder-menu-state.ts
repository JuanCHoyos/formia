import { inject, Service, signal } from '@angular/core';
import { FormBuilderStore } from './form-builder-store';

@Service()
export class BuilderMenuState {
  private readonly formBuilderStore = inject(FormBuilderStore);
  readonly isLeftMenuOpen = signal(true);
  readonly isRightMenuOpen = signal(false);

  toggleLeftMenu(): void {
    this.isLeftMenuOpen.update((isOpen) => !isOpen);
  }

  openLeftMenu(): void {
    this.isLeftMenuOpen.set(true);
  }

  toggleRightMenu(): void {
    if (this.isRightMenuOpen()) {
      this.isRightMenuOpen.set(false);
      return;
    }

    this.openRightMenu();
  }

  openRightMenu(): void {
    if (this.formBuilderStore.selectedField()) {
      this.isRightMenuOpen.set(true);
    }
  }
}
