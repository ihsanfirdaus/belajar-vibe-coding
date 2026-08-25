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

