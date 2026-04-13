# Story 6.4: Security Review

Status: done

## Story

As a developer,
I want the application's server and client code reviewed for common security vulnerabilities,
So that any issues are identified and remediated before delivery.

## Context & Analysis

### Scope

| Area | What to Check |
|---|---|
| **Input validation** | `POST /api/todos` body — `text` field has `minLength: 1`, `maxLength: 500`, `additionalProperties: false` (Fastify JSON schema). Verify this is enforced and no bypass exists. |
| **SQL injection** | `server/src/` uses `better-sqlite3` prepared statements (parameterized). Verify no raw string interpolation in any query. |
| **XSS** | React auto-escapes all interpolated values. Confirm no use of `dangerouslySetInnerHTML`. |
| **HTTP security headers** | `client/nginx.conf` currently sets no security headers. Add the standard set. |
| **Dependency vulnerabilities** | `npm audit` at the monorepo root to surface known CVEs in direct/transitive deps. |
| **Secrets in env vars** | Confirm no secrets are hardcoded; `.env` files are in `.gitignore`. |
| **CORS** | Fastify by default opens no CORS. Confirm no `@fastify/cors` misconfiguration. |
| **Body size limit** | Confirm Fastify's default 1MB body limit (or explicit config) is in place. |

### What Already Looks Good

- Fastify JSON schema on `POST /api/todos` rejects `additionalProperties` and enforces `maxLength: 500`
- `better-sqlite3` prepared statements are used for all DB operations (seen in `server/src/`)
- React's JSX escaping prevents XSS from any todo text rendered in the UI
- No auth layer → no session management risks
- Docker containers run as non-root users

### Known Gap: Nginx Security Headers

`client/nginx.conf` currently has no `add_header` directives. The following headers should be added to the `server {}` block:

| Header | Value | Purpose |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing |
| `X-Frame-Options` | `SAMEORIGIN` | Prevents clickjacking |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits referrer information |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'` | Restricts resource loading |

Note: `X-XSS-Protection` is deprecated in modern browsers and should **not** be added.

---

## Acceptance Criteria

1. **Given** a review of `server/src/routes/todos.ts` and all DB query files, **When** all SQL queries are inspected, **Then** every query uses parameterized statements (no string interpolation); this is confirmed and documented in dev notes.

2. **Given** a review of all `client/src/**` files, **When** searching for `dangerouslySetInnerHTML`, **Then** zero occurrences are found; this is confirmed and documented.

3. **Given** `client/nginx.conf`, **When** the security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Content-Security-Policy`) are added to the `server {}` block, **Then** a request to `http://localhost` (Docker stack) includes all four headers in the response.

4. **Given** `npm audit` run at the monorepo root, **When** the output is reviewed, **Then** any vulnerability with severity **high** or **critical** is triaged: either patched (via `npm update` or direct dep bump) or documented with a justification for deferral.

5. **Given** a review of `.gitignore` and all tracked files, **When** searching for hardcoded credentials, API keys, or secrets, **Then** none are found in tracked files; this is confirmed in dev notes.

---

## Tasks / Subtasks

### Task 1: AI code review — server input validation & SQL (AC: 1)

Review `server/src/routes/todos.ts` and `server/src/db.ts`:

- Confirm Fastify JSON schema is applied to `POST /api/todos` and `PATCH /api/todos/:id`
- Confirm `DELETE /api/todos/:id` validates `:id` as integer (params schema)
- Confirm every `better-sqlite3` call uses `.prepare()` + bound parameters, never string interpolation
- Document findings in dev notes

### Task 2: AI code review — client XSS surface (AC: 2)

```bash
grep -r "dangerouslySetInnerHTML" client/src/
```

Expected output: no matches. If any are found, review whether the content is user-supplied and apply sanitization.

Also confirm that todo `text` is only rendered via JSX interpolation (`{todo.text}`), never via `innerHTML`.

### Task 3: Add Nginx security headers (AC: 3)

Edit `client/nginx.conf` — add inside the `server {}` block, before the `location` blocks:

```nginx
# Security headers
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';" always;
```

After editing, rebuild and verify headers are present:

```bash
npm run docker:up:build
curl -I http://localhost | grep -E "x-content|x-frame|referrer|content-security"
```

### Task 4: Run npm audit (AC: 4)

```bash
npm audit
```

Review output. For any **high** or **critical** severity vulnerability:
1. Check if a patched version is available: `npm audit fix`
2. If a breaking change is required, evaluate manually and document in dev notes
3. If deferral is necessary (e.g. no fix available), record the CVE, severity, affected path, and rationale

### Task 5: Check for hardcoded secrets (AC: 5)

```bash
grep -r "password\|secret\|api_key\|apikey\|token" --include="*.ts" --include="*.js" --include="*.env*" \
  server/src/ client/src/ | grep -v ".test." | grep -v node_modules
```

Confirm any matches are non-sensitive (e.g. `accessToken` in a type definition, not an actual credential). Verify `.env` files are listed in `.gitignore`.

### Task 6: Save report to docs/ (AC: all)

Once all findings are recorded in the Dev Notes section below, save the completed section as a standalone report:

```bash
# Copy the Dev Notes section into docs/security-review-report.md
```

The file `docs/security-review-report.md` should contain the SQL review table, XSS review, headers verification, npm audit results, and secrets scan outcome.

---

## Dev Notes — Security Findings

*(To be filled in during review)*

### SQL Injection Review

| File | Query location | Method | Parameterized? |
|---|---|---|---|
| `server/src/db/database.ts` | `selectAll` | `.prepare()` / `.all()` | N/A (no user params) |
| `server/src/db/database.ts` | `insertOne` — `INSERT INTO todos (text) VALUES (?)` | `.prepare()` / `.get(text)` | ✅ Yes |
| `server/src/db/database.ts` | `updateCompleted` — `UPDATE todos SET completed = ? WHERE id = ?` | `.prepare()` / `.get(val, id)` | ✅ Yes |
| `server/src/db/database.ts` | `deleteOne` — `DELETE FROM todos WHERE id = ?` | `.prepare()` / `.run(id)` | ✅ Yes |
| `server/src/routes/todos.ts` | Uses pre-built `app.statements.*` only | Bound param calls | ✅ Yes |

No string interpolation in any query. No SQL injection risk.

### XSS Review

| Finding | File | Verdict |
|---|---|---|
| `dangerouslySetInnerHTML` occurrences | `client/src/**` | ✅ Zero occurrences |
| `innerHTML` assignments | `client/src/**` | ✅ Zero occurrences |
| Todo text render method | `TodoItem.tsx` | JSX `{todo.text}` only — React auto-escapes |

### Nginx Headers Verification

Added to `client/nginx.conf` before `location` blocks. Verified with `curl -sI http://localhost` after Docker rebuild.

| Header | Present in response? | Value |
|---|---|---|
| `X-Content-Type-Options` | ✅ Yes | `nosniff` |
| `X-Frame-Options` | ✅ Yes | `SAMEORIGIN` |
| `Referrer-Policy` | ✅ Yes | `strict-origin-when-cross-origin` |
| `Content-Security-Policy` | ✅ Yes | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';` |

### npm audit Results

`npm audit` at monorepo root — `found 0 vulnerabilities`.

| Severity | Count | Action taken |
|---|---|---|
| Critical | 0 | — |
| High | 0 | — |
| Moderate | 0 | — |
| Low | 0 | — |

### Hardcoded Secrets Scan

Grep across `server/src/` and `client/src/` for `password|secret|api_key|apikey|accessToken|bearer` (excl. test files, node_modules).

| Result | Notes |
|---|---|
| Matches found | ✅ None |
| `.env` in `.gitignore` | ✅ Yes — both `.env` and `server/.env` listed |
