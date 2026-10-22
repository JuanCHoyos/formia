const tableName = (base: string) => `${$app.name}-${base}-${$app.stage}`;

export function createDynamo() {
  const userTable = new sst.aws.Dynamo('User', {
    fields: {
      id: 'string',
      email: 'string',
      cognitoSub: 'string',
    },
    primaryIndex: { hashKey: 'id' },
    globalIndexes: {
      byEmail: { hashKey: 'email' },
      byCognitoSub: { hashKey: 'cognitoSub' },
    },
    transform: {
      table: (args) => {
        args.name = tableName('User');
      },
    },
  });

  const formTable = new sst.aws.Dynamo('Form', {
    fields: {
      id: 'string',
      ownerId: 'string',
      createdAt: 'number',
    },
    primaryIndex: { hashKey: 'id' },
    globalIndexes: {
      byOwner: { hashKey: 'ownerId', rangeKey: 'createdAt' },
    },
    transform: {
      table: (args) => {
        args.name = tableName('Form');
      },
    },
  });

  const formVersionTable = new sst.aws.Dynamo('FormVersion', {
    fields: {
      id: 'string',
      formId: 'string',
      version: 'number',
    },
    primaryIndex: { hashKey: 'id' },
    globalIndexes: {
      byForm: { hashKey: 'formId', rangeKey: 'version' },
    },
    transform: {
      table: (args) => {
        args.name = tableName('FormVersion');
      },
    },
  });

  const formResponseTable = new sst.aws.Dynamo('FormResponse', {
    fields: {
      id: 'string',
      formId: 'string',
      respondentUserId: 'string',
      createdAt: 'number',
    },
    primaryIndex: { hashKey: 'id' },
    globalIndexes: {
      byFormCreatedAt: {
        hashKey: 'formId',
        rangeKey: 'createdAt',
      },
      byRespondentUser: {
        hashKey: 'respondentUserId',
        rangeKey: 'createdAt',
      },
    },
    transform: {
      table: (args) => {
        args.name = tableName('FormResponse');
      },
    },
  });

  const projectAssetTable = new sst.aws.Dynamo('ProjectAsset', {
    fields: {
      id: 'string',
      formId: 'string',
      ownerId: 'string',
    },
    primaryIndex: { hashKey: 'id' },
    globalIndexes: {
      byForm: { hashKey: 'formId', rangeKey: 'id' },
      byOwner: { hashKey: 'ownerId', rangeKey: 'id' },
    },
    transform: {
      table: (args) => {
        args.name = tableName('ProjectAsset');
      },
    },
  });

  const formRespondentAccessTable = new sst.aws.Dynamo('FormRespondentAccess', {
    fields: {
      id: 'string',
      formId: 'string',
      email: 'string',
    },
    primaryIndex: { hashKey: 'id' },
    globalIndexes: {
      byFormEmail: { hashKey: 'formId', rangeKey: 'email' },
      byEmail: { hashKey: 'email', rangeKey: 'formId' },
    },
    transform: {
      table: (args) => {
        args.name = tableName('FormRespondentAccess');
      },
    },
  });

  return {
    userTable,
    formTable,
    formVersionTable,
    formResponseTable,
    projectAssetTable,
    formRespondentAccessTable,
  };
}
