import { elysiaLambda } from '@formly/core/lambda';

import { githubOidcRouter } from './github-oidc.router';

/** Lambda for the GitHub OIDC bridge, deployed apart from the API (see `infra/github-oidc.ts`). */
export const handler = elysiaLambda(githubOidcRouter);
