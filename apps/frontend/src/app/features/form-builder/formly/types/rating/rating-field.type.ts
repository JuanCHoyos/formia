import { Component, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { FieldType } from '@ngx-formly/core';
import { TranslatePipe } from '@ngx-translate/core';

import { RatingModule } from 'primeng/rating';

import { Button } from '@/app/ui/components/button/button';

import type { RatingFieldTypeConfig } from '../../interfaces/field-types/rating-field';

@Component({
  selector: 'formly-field-rating',
  imports: [ReactiveFormsModule, Button, RatingModule, TranslatePipe],
  templateUrl: './rating-field.type.html',
})
export class RatingFieldType extends FieldType<RatingFieldTypeConfig> implements OnInit {
  stars = signal<number[]>([]);

  ngOnInit(): void {
    const stars = new Array(this.props.stars).fill(1).map((_, index: number) => index + 1);
    this.stars.set(stars);
  }

  setValue(star: number) {
    if (star === this.field.formControl.value) {
      this.field.formControl.setValue(null);
    } else {
      this.field.formControl.setValue(star);
    }
  }
}
