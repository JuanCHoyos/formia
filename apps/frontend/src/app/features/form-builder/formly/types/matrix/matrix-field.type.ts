import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { FieldType } from '@ngx-formly/core';
import { TranslatePipe } from '@ngx-translate/core';

import { CheckboxModule } from 'primeng/checkbox';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TableModule } from 'primeng/table';

import type { MatrixFieldTypeConfig } from '../../interfaces/field-types/matrix-field';

@Component({
  selector: 'formly-field-matrix',
  templateUrl: './matrix-field.type.html',
  imports: [ReactiveFormsModule, CheckboxModule, RadioButtonModule, TableModule, TranslatePipe],
})
export class MatrixFieldType extends FieldType<MatrixFieldTypeConfig> implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  readonly radioControls = new Map<string, FormControl<string | null>>();
  readonly checkboxControls = new Map<string, Map<string, FormControl<boolean>>>();

  ngOnInit(): void {
    const responses = this.getMatrixValue(this.formControl.value);

    for (const question of this.props.questions) {
      const selectedAnswers = this.getResponseArray(responses[question.value]);
      responses[question.value] =
        this.props.selectionMode === 'single' ? selectedAnswers.slice(0, 1) : selectedAnswers;
    }
    this.formControl.setValue(responses);

    for (const question of this.props.questions) {
      if (this.props.selectionMode === 'single') {
        const control = new FormControl<string | null>(responses[question.value][0] ?? null);
        this.radioControls.set(question.value, control);
        control.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((selection) => {
          this.writeResponses(question.value, selection === null ? [] : [selection]);
        });
      } else {
        const controls = new Map<string, FormControl<boolean>>();
        for (const answer of this.props.answers) {
          const control = new FormControl(responses[question.value].includes(answer.value), {
            nonNullable: true,
          });
          controls.set(answer.value, control);
          control.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
            this.writeResponses(
              question.value,
              [...controls.entries()]
                .filter(([, answerControl]) => answerControl.value)
                .map(([answerValue]) => answerValue),
            );
          });
        }
        this.checkboxControls.set(question.value, controls);
      }
    }

    this.formControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      const currentResponses = this.getMatrixValue(value);
      for (const question of this.props.questions) {
        const selectedAnswers = this.getResponseArray(currentResponses[question.value]);
        if (this.props.selectionMode === 'single') {
          this.radioControls
            .get(question.value)
            ?.setValue(selectedAnswers[0] ?? null, { emitEvent: false });
        } else {
          for (const answer of this.props.answers) {
            this.checkboxControls
              .get(question.value)
              ?.get(answer.value)
              ?.setValue(selectedAnswers.includes(answer.value), { emitEvent: false });
          }
        }
      }
    });
  }

  radioControlFor(questionValue: string): FormControl<string | null> {
    return this.radioControls.get(questionValue)!;
  }

  checkboxControlFor(questionValue: string, answerValue: string): FormControl<boolean> {
    return this.checkboxControls.get(questionValue)!.get(answerValue)!;
  }

  private writeResponses(questionValue: string, responses: string[]): void {
    this.formControl.setValue({
      ...this.getMatrixValue(this.formControl.value),
      [questionValue]: responses,
    });
  }

  private getMatrixValue(value: unknown): Record<string, string[]> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return {};
    }

    const responses: Record<string, string[]> = {};
    for (const [questionValue, selection] of Object.entries(value as Record<string, unknown>)) {
      responses[questionValue] = this.getResponseArray(selection);
    }
    return responses;
  }

  private getResponseArray(value: unknown): string[] {
    if (typeof value === 'string') {
      return [value];
    }

    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : [];
  }
}
