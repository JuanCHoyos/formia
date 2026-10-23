import type { Provider } from '@angular/core';

import { provideFormlyCore } from '@ngx-formly/core';

import { fieldTypeConfigurations } from './config/config-types';
import { fieldWrapperConfigurations } from './config/config-wrappers';

export function provideAppFormly(): Provider {
  return provideFormlyCore({
    types: fieldTypeConfigurations,
    wrappers: fieldWrapperConfigurations,
  });
}
