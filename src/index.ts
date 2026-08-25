import { Elysia, t } from "elysia";
import { db } from "./db";
import { users } from "./db/schema";

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
  .group("/users", (app) =>
    app
      .get("/", async () => {
        try {
          const allUsers = await db.select().from(users);
          return {
            success: true,
            data: allUsers,
          };
        } catch (error: any) {
          return {
            success: false,
            message: error?.message || "Failed to fetch users",
          };
        }
      })
      .post(
        "/",
        async ({ body, set }) => {
          try {
            await db.insert(users).values({
              name: body.name,
              email: body.email,
            });

            set.status = 201;
            return {
              success: true,
              message: "User created successfully",
            };
          } catch (error: any) {
            set.status = 500;
            return {
              success: false,
              message: error?.message || "Failed to create user",
            };
          }
        },
        {
          body: t.Object({
            name: t.String(),
            email: t.String({ format: "email" }),
          }),
        }
      )
  )
  .listen(port);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
