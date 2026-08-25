import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export class UserRegistrationError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = "UserRegistrationError";
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
