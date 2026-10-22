import type { Entity, KeyInputItem } from 'dynamodb-toolbox/entity';
import type { GetItemOptions } from 'dynamodb-toolbox/entity/actions/get';
import { EntityRepository } from 'dynamodb-toolbox/entity/actions/repository';
import type { Table } from 'dynamodb-toolbox/table';
import type { Query, QueryOptions, QueryResponse } from 'dynamodb-toolbox/table/actions/query';
import { TableRepository } from 'dynamodb-toolbox/table/actions/repository';

export function createModel<T extends Table, E extends Entity>(table: T, entity: E) {
  const entityRepository = entity.build(EntityRepository);
  const tableRepository = table.build(TableRepository);

  return {
    get: async <OPTIONS extends GetItemOptions<E> = GetItemOptions<E>>(
      key: KeyInputItem<E>,
      options?: OPTIONS,
    ) => (await entityRepository.get(key, options)).Item,

    put: async (...args: Parameters<typeof entityRepository.put>) =>
      (await entityRepository.put(...args)).ToolboxItem,

    update: async (...args: Parameters<typeof entityRepository.update>) =>
      (await entityRepository.update(...args)).ToolboxItem,

    delete: async (...args: Parameters<typeof entityRepository.delete>) => {
      await entityRepository.delete(...args);
    },

    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- `{}` is DynamoDB-Toolbox's "no options" default
    query: async <QUERY extends Query<T>, const OPTIONS extends QueryOptions<T, [E], QUERY> = {}>(
      query: QUERY,
      options?: OPTIONS,
    ): Promise<NonNullable<QueryResponse<T, QUERY, [E], OPTIONS>['Items']>> => {
      const { Items } = await tableRepository.entities(entity).query(query, options);

      return Items ?? ([] as NonNullable<QueryResponse<T, QUERY, [E], OPTIONS>['Items']>);
    },
    repository: entityRepository,
    tableRepository,
  };
}
