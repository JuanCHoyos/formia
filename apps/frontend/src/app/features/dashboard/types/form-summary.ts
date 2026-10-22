import type { apiClient } from '@/app/core/api/api-client';

type FormsResponse = Awaited<ReturnType<typeof apiClient.forms.get>>;

export type FormSummary = NonNullable<FormsResponse['data']>['data'][number];

export type FormStatusFilter = 'all' | FormSummary['status'];
