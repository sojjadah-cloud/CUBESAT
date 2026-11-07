import bcrypt from "bcryptjs";

// Same cost factor as src/lib/auth.ts (which imports next/headers and can't run outside Next).
export const hashPasswordForScript = (password: string) => bcrypt.hash(password, 12);
