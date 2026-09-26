import { pgTable, text, timestamp, integer, index, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    role: text("role").notNull().default("admin"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("users_email_idx").on(table.email),
  ]
);

export const documents = pgTable(
  "documents",
  {
    id: text("id").primaryKey(),
    fileName: text("file_name").notNull(),
    storageKey: text("storage_key").notNull().unique(),
    tokenHash: text("token_hash").notNull().unique(),
    status: text("status", {
      enum: ["ACTIVE", "PRINTING", "PRINTED", "EXPIRED", "REVOKED", "DELETED"],
    })
      .notNull()
      .default("ACTIVE"),
    fileSize: integer("file_size").notNull(),
    mimeType: text("mime_type").notNull().default("application/pdf"),
    pageCount: integer("page_count").default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    printedAt: timestamp("printed_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  },
  (table) => [
    uniqueIndex("documents_token_hash_idx").on(table.tokenHash),
    uniqueIndex("documents_storage_key_idx").on(table.storageKey),
    index("documents_status_idx").on(table.status),
    index("documents_created_at_idx").on(table.createdAt),
    index("documents_expires_at_idx").on(table.expiresAt),
  ]
);

export const documentPayloads = pgTable(
  "document_payloads",
  {
    id: text("id").primaryKey(),
    storageKey: text("storage_key").notNull().unique(),
    payloadBase64: text("payload_base64").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("document_payloads_storage_key_idx").on(table.storageKey),
  ]
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    documentId: text("document_id").references(() => documents.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    ipHash: text("ip_hash"),
    userAgentSummary: text("user_agent_summary"),
    details: text("details"),
    timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("audit_logs_document_id_idx").on(table.documentId),
    index("audit_logs_action_idx").on(table.action),
    index("audit_logs_timestamp_idx").on(table.timestamp),
  ]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type DocumentRecord = typeof documents.$inferSelect;
export type NewDocumentRecord = typeof documents.$inferInsert;

export type DocumentPayload = typeof documentPayloads.$inferSelect;
export type NewDocumentPayload = typeof documentPayloads.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
