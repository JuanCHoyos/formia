import { elysiaLambda } from '@formly/core/lambda';

import { app } from './app';

app.listen(3000);

export { app };
export type { App } from './app';
export const handler = elysiaLambda(app);
