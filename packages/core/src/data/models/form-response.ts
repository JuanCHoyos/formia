import { Entity, type FormattedItem, type ReadItemOptions } from 'dynamodb-toolbox/entity';
import { s } from 'dynamodb-toolbox/schema';
import { Table } from 'dynamodb-toolbox/table';
import { Resource } from 'sst';

import { documentClient } from '../client';
import { createModel } from '../create-model';
import { metadataSchema } from './metadata';

const formResponseResource = Resource as { FormResponse?: { name: string } };

const schema = metadataSchema.and({
  formId: s.string().required(),
  /** Exact FormVersion the respondent answered. */
  formVersionId: s.string().required(),
  respondentUserId: s.string().optional(),
  answer: s.record(s.string(), s.any()).required(),
  createdAt: s.number().required(),
});

export const table = new Table({
  documentClient,
  name: formResponseResource.FormResponse?.name ?? '',
  partitionKey: { name: 'id', type: 'string' },
  indexes: {
    byFormCreatedAt: {
      type: 'global',
      partitionKey: { name: 'formId', type: 'string' },
      sortKey: { name: 'createdAt', type: 'number' },
    },
    byRespondentUser: {
      type: 'global',
      partitionKey: { name: 'respondentUserId', type: 'string' },
      sortKey: { name: 'createdAt', type: 'number' },
    },
  },
});

export const formResponseEntity = new Entity({
  name: 'FormResponse',
  table,
  schema,
  timestamps: false,
});

export const FormResponseModel = createModel(table, formResponseEntity);

export type FormResponseTable = typeof table;

export type FormResponseEntity = typeof formResponseEntity;

export type FormResponse<OPTIONS extends ReadItemOptions<typeof formResponseEntity> = object> =
  FormattedItem<typeof formResponseEntity, OPTIONS>;
