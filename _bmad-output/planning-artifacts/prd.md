---
stepsCompleted: [
    step-01-init,
    step-02-discovery,
    step-02b-vision,
    step-02c-executive-summary,
    step-03-success,
    step-04-journeys,
    step-05-domain,
    step-06-innovation,
    step-07-project-type,
    step-08-scoping,
    step-09-functional,
    step-10-nonfunctional,
    step-11-polish]
inputDocuments: [_bmad-output/project-context.md]
workflowType: 'prd'
classification:
  projectType: web_app
  domain: productivity
  complexity: low
  projectContext: greenfield
---

# Product Requirements Document - Todo App

**Author:** Francesco
**Date:** 9 April 2026

## Executive Summary

The Todo App is a minimal full-stack personal task management application. It enables individual users to create, view, complete, and delete tasks without accounts, onboarding, or setup. The product targets anyone who needs a reliable, lightweight tool to track personal work — accessible immediately in a browser on any device.

The core problem is friction: most task managers are over-engineered for personal use, burdening the user with configuration, authentication, and excess features before they can capture a single task. This product eliminates that gap entirely.

### What Makes This Special

Deliberate minimalism is the product's defining characteristic. The value proposition is not a feature list — it is the absence of unnecessary complexity. Users open the application and it works. Tasks persist across sessions. Completed items are visually distinct. The interface responds instantly. Nothing else is required.

This restraint is also a technical commitment: the architecture is designed to remain clean and extensible without accumulating accidental complexity, enabling future capabilities (multi-user support, authentication, priorities) to be added without rewriting the foundation.

## Project Classification

- **Project Type:** Web application — client-side SPA with REST API backend
- **Domain:** Productivity — personal task management
- **Complexity:** Low — no regulated domain, no novel technology, single-user scope
- **Project Context:** Greenfield — new product, no existing codebase

## Success Criteria

### User Success

- A new user lands on the application and adds their first task within 30 seconds, with no onboarding or instruction required
- A user can complete the full create → complete → delete cycle without confusion or guidance
- Completed tasks are visually distinguishable from active ones at a glance
- The interface works correctly across desktop and mobile screen sizes
- Empty, loading, and error states are handled gracefully — the user is never left in an undefined or broken UI state

### Business Success

- The application delivers a complete, releasable v1: all core task-management actions functional, stable, and polished
- The architecture does not prevent future addition of authentication, multi-user support, or task prioritization
- The codebase is understandable and deployable by a developer unfamiliar with the project

### Technical Success

- Tasks persist across full page refreshes and browser sessions via a real database backend
- API responses feel instantaneous under normal conditions (target: <200ms for CRUD operations)
- The application handles network loss gracefully: users are notified when the network is unavailable and no silent data loss occurs
- Failed save operations surface a clear error to the user without corrupting or losing existing data
- A non-responsive API does not leave the UI frozen — timeouts and loading states are handled explicitly

### Measurable Outcomes

- Zero silent failures: every error condition either recovers automatically or communicates clearly to the user
- Task data survives application restart, server restart, and full browser session close
- No layout breakage on screen widths from 375px (mobile) to 1440px (desktop)

## Product Scope

### MVP — Minimum Viable Product

The MVP delivers the complete core task-management experience. Every item listed is essential: without it, the product does not fulfil its purpose.

- Create a todo item with a text description
- View all todos in a single, persistent list (loaded from the database on open)
- Toggle a todo between complete and incomplete
- Visually distinguish completed todos from active ones
- Delete a todo
- Responsive layout for desktop and mobile (375px–1440px)
- Loading state on initial list fetch, empty state when no todos exist
- Error feedback on failed save (network loss, API timeout)
- Dockerfiles for frontend and backend (multi-stage builds, non-root users, health checks)
- Docker Compose orchestration for all services (frontend, backend, database)
- Health check endpoint on the backend
- Dev and test environment support via environment variables and Docker Compose profiles

### Growth Features (Post-MVP)

- User authentication and personal accounts
- Task filtering (all / active / completed)
- Task search
- Keyboard shortcuts and enhanced accessibility

### Vision (Future)

- Multi-user collaboration
- Task prioritization and deadlines
- Notifications and reminders
- Third-party integrations (calendar, Slack, etc.)

## User Journeys

### Journey 1: First-Time User — Adding Their First Task

**Meet Alex.** It's Monday morning. Alex has a pile of things to do and just wants to get them out of their head. They've tried Notion, Todoist, and a dozen other apps — all required accounts, onboarding modals, or tutorials before they could type a single word. Today they open the Todo App.

The page loads instantly. There's an input field and an empty list. Alex types "Call the dentist" and presses Enter. The task appears in the list immediately. Alex adds three more. The whole process takes under a minute. No account. No settings. No tutorial. Alex closes the tab and gets to work.

**Capabilities revealed:** zero-friction task creation, immediate feedback on add, empty state that guides without explanation, no auth barrier.

---

### Journey 2: Returning User — Working Through Their List

**Same Alex, two days later.** They reopen the app. Their tasks are still there — exactly as they left them. Alex scans the list: "Call the dentist" is done. They click the checkbox. The item visually shifts — struck through, greyed out — clearly done but still visible. Alex deletes the two tasks they no longer need. The list is now clean and current.

**Capabilities revealed:** persistence across sessions, completion toggle with visual distinction, delete action, list remains readable with mixed complete/incomplete items.

---

### Journey 3: User on Mobile — Adding a Task on the Go

**Alex is on the subway.** They suddenly remember something they need to do. They open the Todo App on their phone. The layout fits the screen — the input field is reachable, the task list readable, the checkboxes tappable. Alex adds the task with their thumb and closes the browser.

**Capabilities revealed:** responsive layout at mobile widths, touch-friendly interaction targets, no horizontal scroll or broken layout on small screens.

---

### Journey 4: User During Network Loss — Graceful Failure

**Alex clicks "Add todo" while their WiFi drops.** The request fails. Instead of a broken UI or silent disappearance of their input, a clear message appears: "Unable to save — check your connection." The input field still shows their text. Alex reconnects, tries again, and it works. Nothing was lost. Nothing was broken.

**Capabilities revealed:** network error detection, user-visible error messaging, no data loss on failed save, UI remains usable after failure, retry is possible without refreshing.

---

### Journey Requirements Summary

| Capability | Driven By |
|---|---|
| Task creation (text input + submit) | Journeys 1, 3 |
| Instant list update after add | Journey 1 |
| Empty state with clear affordance | Journey 1 |
| Persistent todo list loaded on open | Journey 2 |
| Session-persistent storage (real DB) | Journey 2 |
| Completion toggle + visual distinction | Journey 2 |
| Task deletion | Journey 2 |
| Responsive layout (375px–1440px) | Journey 3 |
| Network error notification | Journey 4 |
| No data loss on failed save | Journey 4 |
| Loading states on async operations | Journeys 1, 4 |

## Technical Context

The Todo App is a Single Page Application (SPA) served from a web server, communicating with a REST API backend. All UI state transitions happen client-side without full page reloads. No server-side rendering, multi-page architecture, or real-time sync is required.

- **Rendering model:** Client-side SPA — shell loads once, data fetched via standard HTTP
- **State management:** Local client state only; no cross-tab sync required
- **Routing:** Single-route application; no URL-based navigation in v1
- **Authentication:** None in v1
- **SEO:** Not required — personal tool, no public indexable pages
- **Browser support:** Last 2 major versions of Chrome, Firefox, Safari, Edge; no IE
- **Containerisation:** Frontend and backend independently containerized with Docker multi-stage builds; Docker Compose orchestrates all services for local development and deployment
- **Configuration:** All environment-specific values (ports, database URL, secrets) supplied via environment variables; `docker-compose up` is the single command to spin up the full environment

### Data & Privacy

- Todo items are personal data; task content must not be logged server-side beyond persistence requirements
- No analytics tracking of individual task content; no third-party data sharing
- Tasks persist indefinitely until explicitly deleted by the user; no automatic expiry in v1
- No multi-device sync in v1 — tasks are tied to the backend instance, not a user identity

## Functional Requirements

### Task Management

- FR1: User can create a new todo item by entering a text description and submitting
- FR2: User can view the complete list of all todo items
- FR3: User can mark a todo item as complete
- FR4: User can mark a completed todo item as incomplete (toggle)
- FR5: User can delete a todo item
- FR6: System persists all todo items in a database across sessions and page refreshes

### List Display & States

- FR7: System displays a loading indicator while the todo list is being fetched on page open
- FR8: System displays an empty state when no todo items exist
- FR9: System visually distinguishes completed todo items from active ones
- FR10: System displays the complete todo list in a consistent order

### Error Handling & Feedback

- FR11: System notifies the user when a create operation fails due to network unavailability
- FR12: System notifies the user when a delete or update operation fails due to network unavailability
- FR13: System preserves user input when a save operation fails, enabling retry without data loss
- FR14: System displays a clear error state when the API is unreachable or times out
- FR15: System recovers gracefully after a failed operation without requiring a page refresh

### Input Validation

- FR16: System rejects empty or whitespace-only todo text submissions
- FR17: System enforces a maximum character length on todo text input
- FR18: System validates all input server-side before persisting

### Responsiveness & Accessibility

- FR19: Application renders and functions correctly on screen widths from 375px to 1440px
- FR20: All core actions (add, complete, delete) are operable via keyboard
- FR21: All interactive elements have accessible labels and meet WCAG 2.1 AA contrast requirements

### API & Data

- FR22: System exposes an API endpoint to retrieve all todos
- FR23: System exposes an API endpoint to create a new todo
- FR24: System exposes an API endpoint to update a todo's completion status
- FR25: System exposes an API endpoint to delete a todo
- FR26: API returns appropriate error responses for invalid or malformed requests

### Deployment & Infrastructure

- FR27: Frontend is containerized via a Dockerfile with a multi-stage build and runs as a non-root user
- FR28: Backend is containerized via a Dockerfile with a multi-stage build and runs as a non-root user
- FR29: A `docker-compose.yml` orchestrates all containers (frontend, backend, database) with proper networking, volume mounts, and environment variable configuration
- FR30: Backend exposes a health check endpoint that returns the service's operational status
- FR31: Containers declare health checks so Docker can report and monitor container status
- FR32: Application logs are accessible via `docker-compose logs`
- FR33: Application supports dev and test environment configurations through environment variables and Docker Compose profiles

## Non-Functional Requirements

### Performance

- First Contentful Paint (FCP) < 1.2 seconds on standard broadband
- All API CRUD responses complete within < 200ms under normal single-user load
- UI responds to user interaction (loading indicator or optimistic update) within 100ms

### Security

- All API inputs validated server-side; empty, malformed, or oversized payloads rejected with appropriate HTTP error codes
- All database queries use parameterized statements or an ORM to prevent SQL injection
- Backend runs as a non-root user inside its container
- No task content or user input written to application logs
- No sensitive configuration values hardcoded; all supplied via environment variables

### Reliability

- Task data survives: application restart, container restart, database restart, and full browser session close
- No user-visible action results in silent data loss — every failure surfaces a clear error or is automatically recovered
- The UI remains usable after a failed operation; no action leaves the interface broken or frozen
- Health check endpoints accurately reflect the backend's ability to serve requests and reach the database

### Accessibility

- All interactive elements meet WCAG 2.1 AA contrast ratio requirements
- All core actions (add, complete, delete) fully operable via keyboard alone
- All form controls and buttons have descriptive ARIA labels
- Completed and active task states distinguishable by more than color alone (e.g. strikethrough, icon, or text indicator)

### Maintainability

- The codebase is structured so a developer unfamiliar with the project can understand each layer (frontend, API, data) independently
- Frontend components and backend route handlers have a clear single responsibility
- All environment-specific values (port, database URL, secrets) configurable via environment variables
- `docker-compose up` is the single command needed to spin up the full local environment

### Testing

See **Test Strategy** section below for full tooling, scenarios, and coverage requirements.

## Test Strategy

Testing is defined as part of story acceptance, not as a post-implementation afterthought. Each story must include test scenarios covering the three layers below before it is considered done.

### Test Layers

| Layer | Scope | Tooling |
|---|---|---|
| Unit | Pure functions, hooks, route handlers in isolation | Vitest (client), Jest (server) |
| Integration | API route + database interaction; React component + mock API | Supertest (server), React Testing Library (client) |
| E2E | Full user journeys through the running application | Playwright |

### Unit Test Scenarios

Stories must specify which units require coverage. Common scenarios:

- **Server route handlers:** valid input returns correct status and body; missing/invalid fields return 400 with a `message`; not-found IDs return 404; internal errors return 500
- **Validation schemas:** all required fields present → passes; empty `text` → fails; extra fields → stripped or rejected
- **React hooks / utilities:** data transformation, optimistic update rollback logic, error state transitions

### Integration Test Scenarios

- **GET /todos:** empty database returns `[]`; seeded database returns all items in correct order
- **POST /todos:** valid body persists a new todo and returns it with `id` and `createdAt`; empty `text` returns 400
- **PATCH /todos/:id:** existing id toggles `completed`; unknown id returns 404
- **DELETE /todos/:id:** existing id removes the record; unknown id returns 404
- **Frontend component integration:** todo list renders fetched items; add form submits and re-fetches; toggle and delete trigger the correct mutations; loading and error states render the appropriate UI

### E2E Test Scenarios

Each scenario maps to a user journey defined in this document:

| Scenario | Journey | Steps |
|---|---|---|
| Add and view a todo | Journey 1 | Open app → type text → submit → item appears in list |
| Empty state | Journey 1 | Fresh app with no todos → empty state message visible → not a blank screen |
| Toggle todo complete | Journey 2 | Click toggle on existing item → item shows completed state → click again → active state restored |
| Delete a todo | Journey 2 | Click delete on existing item → item removed from list |
| Persistence across reload | Journey 2 | Add item → hard reload → item still visible |
| Mobile layout | Journey 3 | Viewport 375 × 812 → all actions reachable, no horizontal scroll |
| Error state | Journey 4 | Intercept POST → return 500 → error message visible → list unchanged |

