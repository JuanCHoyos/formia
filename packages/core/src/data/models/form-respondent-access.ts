import { Entity, type FormattedItem, type ReadItemOptions } from 'dynamodb-toolbox/entity';
import { s } from 'dynamodb-toolbox/schema';
import { Table } from 'dynamodb-toolbox/table';
import { Resource } from 'sst';

import { documentClient } from '../client';
import { createModel } from '../create-model';
import { metadataSchema } from './metadata';

const formRespondentAccessResource = Resource as {
  FormRespondentAccess?: { name: string };
};

const schema = metadataSchema.and({
  formId: s.string().required(),
  email: s.string().required(),
});

export const table = new Table({
  documentClient,
  name: formRespondentAccessResource.FormRespondentAccess?.name ?? '',
  partitionKey: { name: 'id', type: 'string' },
  indexes: {
    byFormEmail: {
      type: 'global',
      partitionKey: { name: 'formId', type: 'string' },
      sortKey: { name: 'email', type: 'string' },
    },
    byEmail: {
      type: 'global',
      partitionKey: { name: 'email', type: 'string' },
      sortKey: { name: 'formId', type: 'string' },
    },
  },
});

export const formRespondentAccessEntity = new Entity({
  name: 'FormRespondentAccess',
  table,
  schema,
  timestamps: false,
});

export const FormRespondentAccessModel = createModel(table, formRespondentAccessEntity);

export type FormRespondentAccessTable = typeof table;

export type FormRespondentAccessEntity = typeof formRespondentAccessEntity;

export type FormRespondentAccess<
  OPTIONS extends ReadItemOptions<typeof formRespondentAccessEntity> = object,
> = FormattedItem<typeof formRespondentAccessEntity, OPTIONS>;
