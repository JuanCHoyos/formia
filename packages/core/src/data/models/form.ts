import { Entity, type FormattedItem, type ReadItemOptions } from 'dynamodb-toolbox/entity';
import { s } from 'dynamodb-toolbox/schema';
import { Table } from 'dynamodb-toolbox/table';
import { Resource } from 'sst';

import { documentClient } from '../client';
import { createModel } from '../create-model';
import { metadataSchema } from './metadata';

const formResource = Resource as { Form?: { name: string } };

const schema = metadataSchema.and({
  ownerId: s.string().required(),
  createdAt: s.number().required(),
  publishedVersionId: s.string().optional(),
});

export const table = new Table({
  documentClient,
  name: formResource.Form?.name ?? '',
  partitionKey: { name: 'id', type: 'string' },
  indexes: {
    byOwner: {
      type: 'global',
      partitionKey: { name: 'ownerId', type: 'string' },
      sortKey: { name: 'createdAt', type: 'number' },
    },
  },
});

export const formEntity = new Entity({
  name: 'Form',
  table,
  schema,
  timestamps: false,
});

export const FormModel = createModel(table, formEntity);

export type FormTable = typeof table;

export type FormEntity = typeof formEntity;

export type Form<OPTIONS extends ReadItemOptions<typeof formEntity> = object> = FormattedItem<
  typeof formEntity,
  OPTIONS
>;
