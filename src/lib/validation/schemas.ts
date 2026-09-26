import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please provide a valid administrative email address."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
});

export const expirationOptionSchema = z.enum([
  "never",
  "1hour",
  "24hours",
  "7days",
  "custom",
]);

export const documentUploadFormSchema = z.object({
  expirationOption: expirationOptionSchema.default("24hours"),
  customExpiresAt: z.string().datetime().optional().nullable(),
});

export const revokeDocumentSchema = z.object({
  documentId: z.string().min(1, "Document ID is required"),
});

export const tokenParamSchema = z.string().regex(/^[a-fA-F0-9]{32,128}$/, {
  message: "Invalid token format.",
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ExpirationOption = z.infer<typeof expirationOptionSchema>;
