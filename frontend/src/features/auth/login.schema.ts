import { z } from "zod";

/* mirrors LoginDto; any other mistake is a 401 "Invalid credentials" from the API */
const PASSWORD_MAX = 72;

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your email")
    .refine((value) => z.email().safeParse(value).success, "Enter a valid email address"),
  password: z.string().min(1, "Enter your password").max(PASSWORD_MAX, `At most ${PASSWORD_MAX} characters`),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
