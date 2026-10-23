import { Component, computed, input, model, output, signal } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';

import { APP_ICONS } from '../../constants/icons';
import type { IconSelectorValue } from '../../types/icon-selector-value';
import type { AppIcon } from '../../types/icons';

@Component({
  selector: 'app-icon-selector',
  imports: [NgIcon, ButtonModule, DialogModule, InputTextModule, TranslatePipe],
  providers: [provideIcons(APP_ICONS)],
  templateUrl: './icon-selector.html',
})
export class IconSelector implements FormValueControl<IconSelectorValue> {
  readonly multiple = input(true);
  readonly value = model<IconSelectorValue>(null);
  readonly disabled = input<boolean>(false);
  readonly touch = output<void>();

  protected readonly showDialog = signal(false);

  searchTerm = signal('');
  draftIcons = signal<AppIcon[]>([]);

  icons = Object.keys(APP_ICONS) as AppIcon[];
  committedIcons = computed(() => this.normalizeIcons(this.value()));

  selectionIconLabel = computed(() =>
    this.committedIcons().map((icon) => ({ icon, label: this.iconLabel(icon) })),
  );

  filteredIcons = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    return this.icons.filter((icon) => this.iconLabel(icon).toLocaleLowerCase().includes(query));
  });

  iconLabel(icon: AppIcon): string {
    return icon
      .replace(/^lucide/, '')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .toLocaleLowerCase();
  }

  updateSearch(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.searchTerm.set(event.target.value);
    }
  }

  openDialog(): void {
    if (this.disabled()) return;
    this.draftIcons.set(this.normalizeIcons(this.value()));
    this.searchTerm.set('');
    this.showDialog.set(true);
  }

  /** Closes without saving; the draft is discarded and the field counts as touched. */
  closeDialog(): void {
    this.showDialog.set(false);
    this.touch.emit();
  }

  toggleIcon(icon: AppIcon): void {
    const selected = this.draftIcons();
    if (this.multiple()) {
      this.draftIcons.set(
        selected.includes(icon)
          ? selected.filter((selectedIcon) => selectedIcon !== icon)
          : [...selected, icon],
      );
      return;
    }

    this.draftIcons.set(selected.includes(icon) ? [] : [icon]);
  }

  saveSelectedIcons(): void {
    const selected = this.draftIcons();
    const value = this.multiple() ? selected : (selected[0] ?? null);
    this.value.set(value);
    this.closeDialog();
  }

  private normalizeIcons(value: AppIcon | AppIcon[] | null): AppIcon[] {
    if (value === null) return [];
    return Array.isArray(value) ? value : [value];
  }
}
