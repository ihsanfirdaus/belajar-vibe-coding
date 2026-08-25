import { Elysia, t } from "elysia";
import { registerUser, UserRegistrationError } from "../services/users-service";

export const usersRoute = new Elysia({ prefix: "/api/users" }).post(
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
);
