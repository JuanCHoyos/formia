import { app } from "./app";
import { elysiaLambda } from "./lambda-wrapper";

app.listen(3000);

export { app };
export type { App } from "./app";
export const handler = elysiaLambda(app);
