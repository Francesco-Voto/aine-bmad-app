# Security Review Report

**Date:** 2026-04-13  
**Scope:** Todo app — server API, client UI, Nginx, dependency audit, secrets scan  
**Result:** No vulnerabilities found. One gap remediated (Nginx security headers).

---

## SQL Injection Review

All database interactions use `better-sqlite3` prepared statements with bound parameters. No raw string interpolation exists anywhere in the query layer.

| File | Query | Method | Parameterized? |
|---|---|---|---|
| `server/src/db/database.ts` | `SELECT * FROM todos …` | `.prepare()` / `.all()` | N/A (no params) |
| `server/src/db/database.ts` | `INSERT INTO todos (text) VALUES (?) RETURNING *` | `.prepare()` / `.get(text)` | ✅ Yes |
| `server/src/db/database.ts` | `UPDATE todos SET completed = ? WHERE id = ? RETURNING *` | `.prepare()` / `.get(val, id)` | ✅ Yes |
| `server/src/db/database.ts` | `DELETE FROM todos WHERE id = ?` | `.prepare()` / `.run(id)` | ✅ Yes |
| `server/src/routes/todos.ts` | Uses pre-prepared `app.statements.*` | Bound params only | ✅ Yes |

**Verdict:** No SQL injection risk.

---

## Input Validation Review

| Route | Validation |
|---|---|
| `POST /api/todos` | JSON schema: `text` required, `string`, `minLength: 1`, `maxLength: 500`, `additionalProperties: false`. Extra: whitespace-only trimmed and rejected with 400. |
| `PATCH /api/todos/:id` | Params schema: `id` as `integer`. Body schema: `completed` required, `boolean`, `additionalProperties: false`. |
| `DELETE /api/todos/:id` | Params schema: `id` as `integer`. |

**Verdict:** All routes have appropriate Fastify JSON schema validation. No bypass path found. Body size uses Fastify's default 1 MB cap (no `@fastify/multipart` or custom increase).

---

## XSS Review

| Finding | File | Verdict |
|---|---|---|
| `dangerouslySetInnerHTML` occurrences | `client/src/**` | ✅ Zero occurrences |
| `innerHTML` assignments | `client/src/**` | ✅ Zero occurrences |
| Todo text render method | `client/src/components/TodoItem.tsx` | JSX interpolation `{todo.text}` only — React auto-escapes |

**Verdict:** No XSS risk in client.

---

## CORS Review

`server/src/app.ts` does not register `@fastify/cors` or any CORS plugin. Fastify's default behaviour sends no CORS headers — cross-origin requests are blocked by the browser. The app is served entirely through the Nginx reverse proxy on port 80, so no CORS configuration is needed.

**Verdict:** No CORS misconfiguration.

---

## Nginx Security Headers

Headers were absent before this review. Added to `client/nginx.conf` inside the `server {}` block (before all `location` directives):

```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';" always;
```

Verified with `curl -sI http://localhost` after Docker rebuild:

| Header | Present | Value |
|---|---|---|
| `X-Content-Type-Options` | ✅ Yes | `nosniff` |
| `X-Frame-Options` | ✅ Yes | `SAMEORIGIN` |
| `Referrer-Policy` | ✅ Yes | `strict-origin-when-cross-origin` |
| `Content-Security-Policy` | ✅ Yes | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';` |

Note: `X-XSS-Protection` intentionally omitted — deprecated in modern browsers and can introduce issues in IE11.

---

## npm Audit Results

```
found 0 vulnerabilities
```

| Severity | Count | Action |
|---|---|---|
| Critical | 0 | — |
| High | 0 | — |
| Moderate | 0 | — |
| Low | 0 | — |

**Verdict:** No known CVEs in any direct or transitive dependency.

---

## Hardcoded Secrets Scan

Grep pattern: `password|secret|api_key|apikey|accessToken|bearer` across `server/src/` and `client/src/` (excluding test files, node_modules).

| Result | Notes |
|---|---|
| Matches found | ✅ None |
| `.env` in `.gitignore` | ✅ Yes — both `.env` and `server/.env` listed |

**Verdict:** No credentials or secrets in tracked source files.

---

## Summary

| Area | Status | Notes |
|---|---|---|
| SQL injection | ✅ Pass | All queries parameterized |
| Input validation | ✅ Pass | Schema on all mutating routes |
| XSS | ✅ Pass | React JSX only, no innerHTML |
| CORS | ✅ Pass | No plugin registered; browser blocks cross-origin |
| Nginx security headers | ✅ Remediated | Added 4 headers, verified in response |
| npm audit | ✅ Pass | 0 vulnerabilities |
| Hardcoded secrets | ✅ Pass | None found; .env gitignored |
