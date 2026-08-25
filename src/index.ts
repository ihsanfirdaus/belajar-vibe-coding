import { Elysia } from "elysia";
import { usersRoute } from "./routes/users-route";

const port = Number(process.env.PORT) || 3000;

const app = new Elysia()
  .get("/", () => ({
    status: "ok",
    message: "Welcome to Elysia + Drizzle + MySQL API",
    timestamp: new Date().toISOString(),
  }))
  .get("/health", () => ({
    status: "healthy",
    uptime: process.uptime(),
  }))
  .use(usersRoute)
  .listen(port);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;

