import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const connectionUri = process.env.DATABASE_URL || "mysql://root:admin@localhost:3306/belajar_vibe_coding";

const poolConnection = mysql.createPool(connectionUri);

export const db = drizzle(poolConnection, { schema, mode: "default" });
export { schema };
