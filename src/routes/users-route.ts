import { Elysia, t } from "elysia";
import {
  getCurrentUser,
  loginUser,
  registerUser,
  UnauthorizedError,
  UserLoginError,
  UserRegistrationError,
} from "../services/users-service";

export const usersRoute = new Elysia({ prefix: "/api/users" })
  .post(
    "/",
    async ({ body, set }) => {
      try {
        await registerUser(body);
        set.status = 201;
        return { data: "OK" };
      } catch (error: any) {
        if (error instanceof UserRegistrationError) {
          set.status = error.statusCode;
          return { error: error.message };
        }
        set.status = 500;
        return { error: error?.message || "Terjadi kesalahan internal pada server" };
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 1 }),
      }),
    }
  )
  .post(
    "/login",
    async ({ body, set }) => {
      try {
        const { token } = await loginUser(body);
        return { data: token };
      } catch (error: any) {
        if (error instanceof UserLoginError) {
          set.status = error.statusCode;
          return { error: error.message };
        }
        set.status = 500;
        return { error: error?.message || "Terjadi kesalahan internal pada server" };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 1 }),
      }),
    }
  )
  .get(
    "/current",
    async ({ headers, set }) => {
      try {
        const authHeader = headers["authorization"];
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          set.status = 401;
          return { error: "Unauthorized" };
        }

        const token = authHeader.substring(7).trim();
        if (!token) {
          set.status = 401;
          return { error: "Unauthorized" };
        }

        const user = await getCurrentUser(token);
        return { data: user };
      } catch (error: any) {
        if (error instanceof UnauthorizedError) {
          set.status = error.statusCode;
          return { error: error.message };
        }
        set.status = 500;
        return { error: error?.message || "Terjadi kesalahan internal pada server" };
      }
    }
  );


