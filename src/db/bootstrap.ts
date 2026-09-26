import { neon } from "@neondatabase/serverless";
import { hashPassword } from "@/lib/auth/password";

const BOOTSTRAP_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  file_name TEXT NOT NULL,
  storage_key TEXT NOT NULL UNIQUE,
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'application/pdf',
  page_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  printed_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  document_id TEXT REFERENCES documents(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  ip_hash TEXT,
  user_agent_summary TEXT,
  details TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS document_payloads (
  id TEXT PRIMARY KEY,
  storage_key TEXT NOT NULL UNIQUE,
  payload_base64 TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS documents_status_idx ON documents(status);
CREATE INDEX IF NOT EXISTS documents_created_at_idx ON documents(created_at);
CREATE INDEX IF NOT EXISTS documents_expires_at_idx ON documents(expires_at);
CREATE INDEX IF NOT EXISTS audit_logs_document_id_idx ON audit_logs(document_id);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON audit_logs(action);
CREATE INDEX IF NOT EXISTS audit_logs_timestamp_idx ON audit_logs(timestamp);
`;

let hasBootstrapped = false;

export async function bootstrapDatabase(): Promise<{ success: boolean; message: string }> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return { success: false, message: "DATABASE_URL is not defined." };
  }

  try {
    const sql = neon(connectionString);
    // Execute DDL statements
    if (typeof (sql as any).unsafe === "function") {
      await (sql as any).unsafe(BOOTSTRAP_SQL);
    } else {
      await (sql as any)([BOOTSTRAP_SQL]);
    }

    // Check if default admin exists or if ADMIN_EMAIL/ADMIN_PASSWORD are provided
    const adminEmail = process.env.ADMIN_EMAIL || "admin@onetimeprint.internal";
    const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || "ChangeMeSecurely123!";

    const existingUsers = await sql`SELECT id FROM users WHERE email = ${adminEmail} LIMIT 1`;
    if (existingUsers.length === 0) {
      const passwordHash = await hashPassword(defaultPassword);
      const adminId = "admin_" + Math.random().toString(36).substring(2, 10);
      await sql`
        INSERT INTO users (id, email, password_hash, name, role)
        VALUES (${adminId}, ${adminEmail}, ${passwordHash}, 'System Administrator', 'admin')
        ON CONFLICT (email) DO NOTHING
      `;
    }

    hasBootstrapped = true;
    return { success: true, message: "Database tables and initial indexes verified successfully." };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[Database Bootstrap Error]:", err);
    return { success: false, message: err?.message || "Failed to bootstrap database." };
  }
}

export async function ensureDatabaseReady() {
  if (hasBootstrapped) return;
  try {
    await bootstrapDatabase();
  } catch (e) {
    console.warn("Auto-bootstrap note:", e);
  }
}
