import { eq } from "drizzle-orm";
import { db } from "../db";
import { sessions, users } from "../db/schema";

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginUserInput {
  email: string;
  password: string;
}

export class UserRegistrationError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = "UserRegistrationError";
  }
}

export class UserLoginError extends Error {
  constructor(message: string = "Email atau password salah", public statusCode: number = 400) {
    super(message);
    this.name = "UserLoginError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = "Unauthorized", public statusCode: number = 401) {
    super(message);
    this.name = "UnauthorizedError";
  }
}

async function findSessionByToken(token: string) {
  if (!token) {
    throw new UnauthorizedError("Unauthorized", 401);
  }

  const foundSessions = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1);

  const [session] = foundSessions;

  if (!session) {
    throw new UnauthorizedError("Unauthorized", 401);
  }

  return session;
}

export async function registerUser({ name, email, password }: RegisterUserInput) {
  // 1. Pengecekan Email
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new UserRegistrationError("Email sudah terdaftar", 400);
  }

  // 2. Hashing Password dengan bcrypt
  const hashedPassword = await Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 10,
  });

  // 3. Penyimpanan
  await db.insert(users).values({
    name,
    email,
    password: hashedPassword,
  });

  return { success: true };
}

export async function loginUser({ email, password }: LoginUserInput) {
  // 1. Pengecekan Email
  const foundUsers = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const [user] = foundUsers;

  if (!user) {
    throw new UserLoginError("Email atau password salah", 400);
  }

  // 2. Verifikasi Password
  const isPasswordValid = await Bun.password.verify(password, user.password);
  if (!isPasswordValid) {
    throw new UserLoginError("Email atau password salah", 400);
  }

  // 3. Generate Token UUID
  const token = crypto.randomUUID();

  // 4. Simpan Session ke Database
  await db.insert(sessions).values({
    token,
    userId: user.id,
  });

  return { token };
}

export async function getCurrentUser(token: string) {
  const session = await findSessionByToken(token);

  // Ambil data User yang berelasi
  const foundUsers = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  const [user] = foundUsers;

  if (!user) {
    throw new UnauthorizedError("Unauthorized", 401);
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    created_at: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
  };
}

export async function logoutUser(token: string) {
  if (!token) {
    throw new UnauthorizedError("Unauthorized", 401);
  }

  // Langsung hapus session, cek affectedRows
  const result = await db.delete(sessions).where(eq(sessions.token, token));

  if (result[0].affectedRows === 0) {
    throw new UnauthorizedError("Unauthorized", 401);
  }

  return "OK";
}
