import { Entity, type FormattedItem, type ReadItemOptions } from 'dynamodb-toolbox/entity';
import { s } from 'dynamodb-toolbox/schema';
import { Table } from 'dynamodb-toolbox/table';
import { Resource } from 'sst';

import { documentClient } from '../client';
import { createModel } from '../create-model';
import { metadataSchema } from './metadata';

const projectAssetResource = Resource as { ProjectAsset?: { name: string } };

const schema = metadataSchema.and({
  formId: s.string().required(),
  ownerId: s.string().required(),
  key: s.string().required(),
  fileName: s.string().required(),
  contentType: s.string().required(),
});

export const table = new Table({
  documentClient,
  name: projectAssetResource.ProjectAsset?.name ?? '',
  partitionKey: { name: 'id', type: 'string' },
  indexes: {
    byForm: {
      type: 'global',
      partitionKey: { name: 'formId', type: 'string' },
      sortKey: { name: 'id', type: 'string' },
    },
    byOwner: {
      type: 'global',
      partitionKey: { name: 'ownerId', type: 'string' },
      sortKey: { name: 'id', type: 'string' },
    },
  },
});

export const projectAssetEntity = new Entity({
  name: 'ProjectAsset',
  table,
  schema,
  timestamps: false,
});

export const ProjectAssetModel = createModel(table, projectAssetEntity);

export type ProjectAssetTable = typeof table;

export type ProjectAssetEntity = typeof projectAssetEntity;

export type ProjectAsset<OPTIONS extends ReadItemOptions<typeof projectAssetEntity> = object> =
  FormattedItem<typeof projectAssetEntity, OPTIONS>;
