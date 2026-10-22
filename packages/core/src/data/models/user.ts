import { Entity, type FormattedItem, type ReadItemOptions } from 'dynamodb-toolbox/entity';
import { s } from 'dynamodb-toolbox/schema';
import { Table } from 'dynamodb-toolbox/table';
import { Resource } from 'sst';

import { documentClient } from '../client';
import { createModel } from '../create-model';
import { dateSchema, metadataSchema } from './metadata';

const userResource = Resource as { User?: { name: string } };

const schema = metadataSchema.and({
  fullName: s.string().required(),
  email: s.string().required(),
  cognitoSub: s.string().required(),
  termsAccepted: s.boolean(),
  termsAcceptedAt: dateSchema.required(),
  roles: s.list(s.string().enum('FORM_CREATOR', 'FORM_RESPONDENT')).required(),
  authProvider: s.string().enum('SYSTEM', 'Google', 'Facebook', 'Apple'),
});

export const table = new Table({
  documentClient,
  name: userResource.User?.name ?? '',
  partitionKey: { name: 'id', type: 'string' },
  indexes: {
    byEmail: {
      type: 'global',
      partitionKey: { name: 'email', type: 'string' },
    },
    byCognitoSub: {
      type: 'global',
      partitionKey: { name: 'cognitoSub', type: 'string' },
    },
  },
});

export const userEntity = new Entity({
  name: 'User',
  table,
  schema,
  timestamps: false,
});

export const UserModel = createModel(table, userEntity);

export type UserTable = typeof table;

export type UserEntity = typeof userEntity;

export type User<OPTIONS extends ReadItemOptions<typeof userEntity> = object> = FormattedItem<
  typeof userEntity,
  OPTIONS
>;
