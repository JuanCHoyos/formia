import type { FieldTypeName } from '../../../formly/config/config-types';
import type { FIELD_TYPE_ICONS } from '../../../formly/config/field-type-icons';

export type FieldPaletteFieldItem = {
  [Type in FieldTypeName]: {
    type: Type;
    label: string;
    icon: (typeof FIELD_TYPE_ICONS)[Type];
    bgIcon: string;
    colorIcon: string;
    description?: string;
  };
}[FieldTypeName];

export type FieldPaletteGroup = {
  label: string;
  items: FieldPaletteFieldItem[];
};

export type FilteredFieldPaletteGroup = FieldPaletteGroup & {
  value: number;
};
