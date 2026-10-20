import type { FieldWrapperName } from '../config/config-wrappers';
import z from 'zod';
import {
  AlertFieldTypeSchema,
  CheckboxFieldTypeSchema,
  DateFieldTypeSchema,
  DividerFieldTypeSchema,
  HeadingFieldTypeSchema,
  ImageFieldTypeSchema,
  MatrixFieldTypeSchema,
  MultiCheckboxFieldTypeSchema,
  ParagraphFieldTypeSchema,
  RadioFieldTypeSchema,
  RadioImageFieldTypeSchema,
  RatingFieldTypeSchema,
  SelectFieldTypeSchema,
  TextFieldTypeSchema,
  TextareaFieldTypeSchema,
} from './field-types';
import { ContainerFieldTypeSchema } from './field-types/container-field';


const LeafFieldSchema = z.union([
  AlertFieldTypeSchema,
  CheckboxFieldTypeSchema,
  DateFieldTypeSchema,
  DividerFieldTypeSchema,
  HeadingFieldTypeSchema,
  ImageFieldTypeSchema,
  MatrixFieldTypeSchema,
  MultiCheckboxFieldTypeSchema,
  RadioImageFieldTypeSchema,
  ParagraphFieldTypeSchema,
  RadioFieldTypeSchema,
  RatingFieldTypeSchema,
  SelectFieldTypeSchema,
  TextFieldTypeSchema,
  TextareaFieldTypeSchema,
]);

export const ContainerNodeSchema = z.object({
  id: z.string(),
  key: z.string(),
  type: z.literal('container-group'),
  props: ContainerFieldTypeSchema.shape.props,
  wrappers: ContainerFieldTypeSchema.shape.wrappers,
  get fieldGroup() {
    return z.array(z.union([LeafFieldSchema, ContainerNodeSchema]));
  },
});

export const AppFormlyFieldSchema = z.union([LeafFieldSchema, ContainerNodeSchema]);

export type AppFormlyFieldConfig = z.infer<typeof AppFormlyFieldSchema>;

export const FormPageContainerSchema = ContainerNodeSchema.pick({
  id: true,
  key: true,
  type: true,
  props: true,
  fieldGroup: true,
});

export type FormPageContainer = z.infer<typeof FormPageContainerSchema>;

export const FormFieldConfigurationSchema = z.object({
  key: z.string(),
  wrappers: z.tuple([
    z.enum(['form-steps', 'form-scroll', 'form-tabs'] satisfies FieldWrapperName[]),
  ]),
  fieldGroup: z.array(FormPageContainerSchema),
});

export type FormFieldConfiguration = z.infer<typeof FormFieldConfigurationSchema>;
