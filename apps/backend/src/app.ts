import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { node } from "@elysiajs/node";
import { helmet } from "elysia-helmet";
import { routers } from "./routers";

export const app = new Elysia({ adapter: node(), prefix: "/api/v1" })
  .use(
    cors({
      origin: "http://localhost:4200",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-id-token"],
    }),
  )
  .use(helmet())
  .use(routers);

export type App = typeof app;
