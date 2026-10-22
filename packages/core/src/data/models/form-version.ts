import { Entity, type FormattedItem, type ReadItemOptions } from 'dynamodb-toolbox/entity';
import { s } from 'dynamodb-toolbox/schema';
import { Table } from 'dynamodb-toolbox/table';
import { Resource } from 'sst';

import { documentClient } from '../client';
import { createModel } from '../create-model';
import { metadataSchema } from './metadata';

const formVersionResource = Resource as { FormVersion?: { name: string } };

const schema = metadataSchema.and({
  formId: s.string().required(),
  version: s.number().required(),
  status: s.string().enum('draft', 'published').required(),
  title: s.string().required(),
  isPublic: s.boolean().default(false),
  allowMultipleSubmissions: s.boolean().default(false),
  maxSubmissionsPerUser: s.number().default(1),
  schema: s.record(s.string(), s.any()).required(),
  createdAt: s.number().required(),
  publishedAt: s.number().optional(),
});

export const table = new Table({
  documentClient,
  name: formVersionResource.FormVersion?.name ?? '',
  partitionKey: { name: 'id', type: 'string' },
  indexes: {
    byForm: {
      type: 'global',
      partitionKey: { name: 'formId', type: 'string' },
      sortKey: { name: 'version', type: 'number' },
    },
  },
});

export const formVersionEntity = new Entity({
  name: 'FormVersion',
  table,
  schema,
  timestamps: false,
});

export const FormVersionModel = createModel(table, formVersionEntity);

export { $set as replaceValue } from 'dynamodb-toolbox/entity/actions/update';

export type FormVersionTable = typeof table;

export type FormVersionEntity = typeof formVersionEntity;

export type FormVersion<OPTIONS extends ReadItemOptions<typeof formVersionEntity> = object> =
  FormattedItem<typeof formVersionEntity, OPTIONS>;
