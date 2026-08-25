import { describe, expect, it } from "bun:test";
import { Elysia } from "elysia";
import { usersRoute } from "../src/routes/users-route";
import { db } from "../src/db";
import { sessions, users } from "../src/db/schema";
import { eq } from "drizzle-orm";

const app = new Elysia().use(usersRoute);

describe("User Login & Registration API", () => {
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = "rahasia123";

  it("POST /api/users should register a new user", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test User",
          email: testEmail,
          password: testPassword,
        }),
      })
    );

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json).toEqual({ data: "OK" });
  });

  it("POST /api/users/login with wrong email should fail", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "nonexistent@example.com",
          password: testPassword,
        }),
      })
    );

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toEqual({ error: "Email atau password salah" });
  });

  it("POST /api/users/login with wrong password should fail", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: "wrongpassword",
        }),
      })
    );

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toEqual({ error: "Email atau password salah" });
  });

  it("POST /api/users/login with correct credentials should succeed and return token", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      })
    );

    expect(response.status).toBe(200);
    const json = (await response.json()) as { data: string };
    expect(json.data).toBeDefined();
    expect(typeof json.data).toBe("string");

    // Verify session stored in database
    const savedSessions = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, json.data));
    expect(savedSessions.length).toBe(1);
  });
});
