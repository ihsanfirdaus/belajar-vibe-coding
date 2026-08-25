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

  describe("GET /api/users/current", () => {
    it("should fail with 401 if Authorization header is missing", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
        })
      );

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ error: "Unauthorized" });
    });

    it("should fail with 401 if Authorization header is invalid format", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: {
            Authorization: "Basic 123456",
          },
        })
      );

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ error: "Unauthorized" });
    });

    it("should fail with 401 if token is not found in database", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: {
            Authorization: "Bearer non-existent-token",
          },
        })
      );

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ error: "Unauthorized" });
    });

    it("should succeed with 200 and return current user data when token is valid", async () => {
      // 1. Login to obtain token
      const loginRes = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: testEmail,
            password: testPassword,
          }),
        })
      );
      const { data: token } = (await loginRes.json()) as { data: string };

      // 2. Call GET /api/users/current
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      expect(response.status).toBe(200);
      const json = (await response.json()) as {
        data: { id: number; name: string; email: string; created_at: string };
      };
      expect(json.data).toBeDefined();
      expect(json.data.name).toBe("Test User");
      expect(json.data.email).toBe(testEmail);
      expect(json.data.id).toBeDefined();
      expect(json.data.created_at).toBeDefined();
    });
  });

  describe("DELETE /api/users/logout", () => {
    it("should fail with 401 if Authorization header is missing", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
        })
      );

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ error: "Unauthorized" });
    });

    it("should fail with 401 if Authorization header is invalid format", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
          headers: {
            Authorization: "Basic 123456",
          },
        })
      );

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ error: "Unauthorized" });
    });

    it("should fail with 401 if token is not found in database", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
          headers: {
            Authorization: "Bearer non-existent-token",
          },
        })
      );

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ error: "Unauthorized" });
    });

    it("should succeed with 200 and delete session from database when token is valid", async () => {
      // 1. Login to obtain token
      const loginRes = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: testEmail,
            password: testPassword,
          }),
        })
      );
      const { data: token } = (await loginRes.json()) as { data: string };

      // Verify session exists
      const initialSessions = await db
        .select()
        .from(sessions)
        .where(eq(sessions.token, token));
      expect(initialSessions.length).toBe(1);

      // 2. Call DELETE /api/users/logout
      const response = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual({ data: "OK" });

      // 3. Verify session was deleted from database
      const remainingSessions = await db
        .select()
        .from(sessions)
        .where(eq(sessions.token, token));
      expect(remainingSessions.length).toBe(0);

      // 4. Verify that calling GET /api/users/current with that token now returns 401
      const checkCurrentRes = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );
      expect(checkCurrentRes.status).toBe(401);
    });
  });
});


