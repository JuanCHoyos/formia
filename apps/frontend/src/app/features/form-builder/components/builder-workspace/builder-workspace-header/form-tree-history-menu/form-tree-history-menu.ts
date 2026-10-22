import { Button } from '@/app/ui/components/button/button';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { format, formatDistanceToNow } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { InputTextModule } from 'primeng/inputtext';
import { PopoverModule } from 'primeng/popover';
import { FormBuilderStore } from '../../../../services/form-builder-store';

@Component({
  selector: 'app-form-tree-history-menu',
  templateUrl: './form-tree-history-menu.html',
  imports: [Button, FormsModule, InputTextModule, PopoverModule, TranslatePipe],
})
export class FormTreeHistoryMenu {
  readonly formBuilderStore = inject(FormBuilderStore);
  private readonly translate = inject(TranslateService);
  readonly searchQuery = signal('');

  readonly visibleVersions = computed(() => {
    const language = this.translate.currentLang();
    const locale = language?.startsWith('es') ? es : enUS;
    const query = this.searchQuery()
      .trim()
      .toLocaleLowerCase(language || undefined);
    const now = Date.now();

    return [...this.formBuilderStore.formTreeHistory.versions()]
      .reverse()
      .map((version) => {
        const age = now - version.createdAt.getTime();
        const dateLabel =
          age < 7 * 24 * 60 * 60 * 1000
            ? formatDistanceToNow(version.createdAt, { addSuffix: true, locale })
            : format(version.createdAt, language?.startsWith('es') ? "d 'de' MMMM" : 'MMMM d', {
                locale,
              });
        const versionLabel = this.translate.instant('formBuilder.history.version', {
          number: version.number,
        }) as string;

        return {
          ...version,
          dateLabel,
          versionLabel,
          isCurrent: version.id === this.formBuilderStore.formTreeHistory.currentVersion()?.id,
        };
      })
      .filter(({ versionLabel, dateLabel }) =>
        `${versionLabel} ${dateLabel}`.toLocaleLowerCase(language || undefined).includes(query),
      );
  });
}
