# OneTimePrint — Secure One-Time PDF Printing Platform

OneTimePrint is a cloud-first, production-ready web application that enables administrators to upload confidential PDF documents and generate high-entropy, single-use cryptographic access links. 

When a recipient opens the link, the document is securely streamed into a custom PDF viewer. As soon as the recipient initiates printing, the access token is atomically consumed on the server, permanently invalidating the link against re-use.

---

## 1. High-Level Architecture & Workflow

```
[Administrator] 
       │ (Uploads PDF + Configures Expiry)
       ▼
[Next.js Serverless API on Vercel]
  ├── Validates Magic Bytes (%PDF-) & File Size
  ├── Generates 256-bit Cryptographic Token (stored only as SHA-256 hash in Neon)
  └── Uploads Encrypted PDF Binary to Private Cloudflare R2 Bucket
       │
       ▼ (Generates One-Time Link: https://yourdomain.com/p/<raw_token>)
[Recipient]
       │ (Visits URL)
       ▼
[Serverless Token Gate (/p/<token>)]
  ├── Hashes Token & Checks Status == 'ACTIVE' and Not Expired
  └── Streams PDF Binary to PDF.js Canvas (No public R2 links exposed)
       │
       ▼ (Recipient clicks "Print Document")
[Atomic Print Transition (/api/document/<token>/print)]
  ├── Atomic SQL: UPDATE documents SET status='PRINTING' WHERE token_hash=? AND status='ACTIVE'
  ├── Transitions state to 'PRINTED' + records printed_at timestamp & audit logs
  └── Subsequent requests with this token are permanently rejected (HTTP 410 Gone)
```

---

## 2. Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js (App Router) + React | Fast, accessible, server-rendered and client-rendered UI |
| **Language** | TypeScript (Strict Mode) | Full-stack end-to-end type safety |
| **Styling** | Tailwind CSS | Industrial, high-contrast, minimalist design |
| **Database** | Neon Serverless PostgreSQL | Serverless relational database with connection pooling |
| **ORM & Migrations** | Drizzle ORM + Drizzle Kit | Type-safe queries, atomic mutations, and schema migrations |
| **Object Storage** | Cloudflare R2 | Private, S3-compatible, zero-egress-fee encrypted file storage |
| **PDF Rendering** | PDF.js (HTML5 Canvas Engine) | Custom client-side document canvas renderer |
| **Authentication** | Jose (Stateless JWT) + Scrypt | Secure admin sessions with HTTP-only cookies |
| **Validation** | Zod | Request payload, header, and parameter validation |
| **Icons** | Lucide React | Clean, scalable SVG icons |

---

## 3. Security Model & Key Protections

- **High-Entropy Access Tokens:** Tokens are generated using 32 random cryptographically secure bytes (`crypto.randomBytes(32)`), producing 64-character hexadecimal tokens with 256 bits of entropy.
- **One-Way Token Hashing:** The database never stores raw tokens. Only the one-way `SHA-256` hash is stored. Even with full database access, an attacker cannot reverse token hashes to create valid access URLs.
- **Atomic Race-Condition Lock:** Print authorization utilizes atomic SQL updates (`UPDATE documents SET status = 'PRINTING' WHERE token_hash = ? AND status = 'ACTIVE'`). If multiple tabs or automated requests fire simultaneously, exactly one succeeds.
- **Private Storage:** Cloudflare R2 buckets remain private. Raw storage URLs, bucket keys, and API credentials are never exposed to client-side code. Document streams pass through the authenticated serverless gateway (`/api/document/[token]/raw`).
- **File Integrity & Magic Bytes:** File extensions are not trusted. The upload handler validates the binary signature header (`%PDF-` / `0x25 0x50 0x44 0x46 0x2D`) and enforces file size limits.
- **Privacy-Preserving Audit Logging:** Client IP addresses are salted and hashed using HMAC-SHA-256 before being recorded in `audit_logs`.
- **Security Headers:** Strict HTTP headers including `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, and a restrictive `Content-Security-Policy`.

---

## 4. Environment Variables Reference

Copy `.env.example` to `.env.local` for local inspection or configure these directly in your Vercel Dashboard:

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Admin Authentication
AUTH_SECRET="your-32-character-random-secret-string"
NEXTAUTH_URL="https://yourdomain.com"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_DEFAULT_PASSWORD="YourStrongPassword123!"

# Cloudflare R2 Storage
R2_ACCOUNT_ID="your_cloudflare_account_id"
R2_ACCESS_KEY_ID="your_r2_access_key_id"
R2_SECRET_ACCESS_KEY="your_r2_secret_access_key"
R2_BUCKET_NAME="onetimeprint-vault"
R2_ENDPOINT="https://your_cloudflare_account_id.r2.cloudflarestorage.com"

# Limits & Policies
MAX_FILE_SIZE=26214400
TOKEN_EXPIRY_DEFAULT_HOURS=24
```

---

## 5. Cloud-First Setup Guide (Step-by-Step)

### Step 1: Create Neon PostgreSQL Database
1. Go to [Neon.tech](https://neon.tech) and create a free account.
2. Click **Create Project**, name it `onetimeprint`, and choose your preferred region.
3. On the project dashboard, copy the **Connection string** (select the **Pooled connection** checkbox).
4. Save this string for the `DATABASE_URL` environment variable.

### Step 2: Create Cloudflare R2 Storage Bucket
1. Log into your [Cloudflare Dashboard](https://dash.cloudflare.com) and navigate to **R2**.
2. Click **Create bucket**, name it `onetimeprint-vault`, and click **Create Bucket**. (Ensure the bucket is kept **Private**; do not enable public access).
3. On the R2 Overview page, copy your **Account ID** from the right sidebar.
4. Click **Manage R2 API Tokens** > **Create API Token**.
5. Select **Object Read & Write** permissions, set bucket scope to `onetimeprint-vault`, and create the token.
6. Copy the **Access Key ID** and **Secret Access Key**.

### Step 3: Deploy to Vercel via GitHub
1. Push this codebase to a private GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "feat: initial OneTimePrint platform"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/onetimeprint.git
   git push -u origin main
   ```
2. Open [Vercel](https://vercel.com) and click **Add New** > **Project**.
3. Import your `onetimeprint` GitHub repository.
4. Under **Environment Variables**, add all variables from the section above (`DATABASE_URL`, `AUTH_SECRET`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `ADMIN_EMAIL`, `ADMIN_DEFAULT_PASSWORD`).
5. Click **Deploy**.

### Step 4: Verify Database Bootstrap & Admin Account
1. Once deployed, navigate to `https://your-deployment.vercel.app/admin/login`.
2. The application automatically initializes the PostgreSQL schema (`users`, `documents`, `audit_logs`) and creates the default administrator user specified in your environment variables.
3. Log in with your `ADMIN_EMAIL` and `ADMIN_DEFAULT_PASSWORD`.
4. Visit the **Settings** tab in the admin console to verify that both Neon and Cloudflare R2 show healthy green status indicators.

---

## 6. End-to-End Verification Procedure

1. **Log in as Administrator:** Navigate to `/admin/login` and log in.
2. **Upload a PDF:** Navigate to `/admin/upload`, drag and drop a test PDF document, select an expiration policy (e.g., 24 hours), and click **Generate Secure One-Time Link**.
3. **Copy Link & QR Code:** Verify that the 64-character token URL is generated. Open the QR code modal to test QR generation and PNG download.
4. **Open Recipient Link:** In an incognito tab or separate browser, navigate to `/p/<TOKEN>`.
5. **Inspect Document Viewer:** Verify that the PDF renders onto the canvas. Test Zoom In, Zoom Out, and Page Navigation. Verify that right-click context menus and direct download links are not present.
6. **Initiate Print:** Click **Print Document**, read the confirmation notice, and click **Authorize & Print**.
7. **Verify Invalidation:**
   - The document view immediately transitions to "Document Print Initiated / Status: PRINTED".
   - Refresh the page or open the same URL in another browser tab: verify that the server returns HTTP 410 with the message "Document Already Printed".
8. **Verify Audit Trail:** Return to the Admin Console (`/admin`) and check the **Security Audit Trail** for `DOCUMENT_UPLOADED`, `DOCUMENT_VIEWED`, and `DOCUMENT_PRINTED` log entries.

---

## 7. Known Browser & OS Boundaries

- **Print Spooler:** The web application guarantees deterministic, single-use token consumption upon print authorization. However, physical printer output cannot be guaranteed by any browser application (e.g., paper jams or printer driver errors).
- **Display Capture:** Browser security controls prevent download buttons, public storage URLs, and casual text selection. They cannot prevent operating system screenshot utilities, display photography, or hardware HDMI capture cards.

---

## 8. License & Terms

Confidential single-use document printing infrastructure. For questions or policy customizations, review the included `/privacy` and `/terms` documentation.
