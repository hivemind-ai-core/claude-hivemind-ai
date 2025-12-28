---
description: Question-driven interactive specification creation and amendment workflow with Mermaid diagrams
---

# /create-spec Command

Create or amend specifications interactively through clarifying questions, generating relevant Mermaid diagrams automatically.

## What This Command Does

1. **Detects mode** - Create new spec OR amend existing spec
2. **Gathers requirements** - Question-driven discovery through dialogue
3. **Generates spec document** - Creates/updates structured markdown specification
4. **Creates diagrams** - Generates relevant Mermaid diagrams (ER, sequence, journey, state)
5. **Converts to images** - Uses mmdc to create SVG files
6. **Updates index** - Maintains spec/index.md

## Modes

### Create Mode (New Spec)

Triggered when spec file doesn't exist or user explicitly requests new spec:

```
/create-spec user-authentication
```

### Amend Mode (Update Existing)

Triggered when spec file already exists:

```
/create-spec user-authentication
→ Detects spec/user-authentication.md exists
→ Enters amendment mode
```

**Amendment Principles:**
- Preserve existing file names (avoid breaking references)
- Preserve existing requirement IDs (REQ-XXX numbers)
- Add new requirements with next available ID
- Update existing requirements in place
- Keep diagram file names stable
- Track changes made for review

## Process

### 1. Detect Mode

Check if spec exists:

```typescript
const specPath = `spec/${slugify(featureName)}.md`
const exists = await fileExists(specPath)

if (exists) {
  // AMEND MODE: Load existing spec, ask what to change
} else {
  // CREATE MODE: Start fresh with discovery questions
}
```

### 2. Question-Driven Discovery

**CREATE MODE - Full Discovery:**

**Round 1: Core Functionality**
- What should this feature do?
- Who are the users (roles)?
- What are the main workflows?
- What problem does it solve?

**Round 2: Details**
- What data needs to be stored?
- What external services are involved?
- What are the constraints (performance, security)?
- What integrations are required?

**Round 3: Edge Cases**
- What errors can occur?
- How should failures be handled?
- What are the limits/quotas?
- What happens in offline/degraded mode?

**AMEND MODE - Targeted Questions:**

- What would you like to change or add?
- Which requirements need updating?
- Are there new edge cases to consider?
- Should any requirements be removed or marked deprecated?

### 3. Generate/Update Spec Document

**CREATE MODE:**

Create `spec/{feature-name}.md`:

```markdown
# Feature: User Authentication

## Overview
[Summary from discovery questions]

## User Stories
- As a user, I want to register so that I can access the application
- As a user, I want to login so that I can use my account
- As a user, I want to logout so that my session is ended

## Requirements

### REQ-001: User Registration
- **Priority**: High
- **Description**: Users can create an account with email and password
- **Acceptance Criteria**:
  - [ ] Email must be valid format
  - [ ] Password must be at least 8 characters
  - [ ] User receives confirmation email

### REQ-002: User Login
- **Priority**: High
- **Description**: Users can authenticate with existing credentials
- **Acceptance Criteria**:
  - [ ] Valid credentials return JWT token
  - [ ] Invalid credentials return 401 error
  - [ ] Failed attempts are rate-limited

### REQ-003: Session Management
- **Priority**: Medium
- **Description**: Sessions expire and can be refreshed
- **Acceptance Criteria**:
  - [ ] Sessions expire after 24 hours
  - [ ] Refresh token extends session
  - [ ] Logout invalidates session

## Data Model

![Data Model](./diagrams/auth-data-model.svg)

## User Flow

![User Flow](./diagrams/auth-user-flow.svg)

## API Design

![API Sequence](./diagrams/auth-api-sequence.svg)
```

**AMEND MODE:**

Read existing spec, apply changes:

```typescript
// Load existing spec
const existingSpec = await readFile(specPath)

// Parse structure
const { requirements, diagrams, metadata } = parseSpec(existingSpec)

// Find next requirement ID
const nextId = Math.max(...requirements.map(r => r.id)) + 1

// Apply amendments:
// - Add new requirements with nextId, nextId+1, etc.
// - Update existing requirements by ID
// - Preserve requirement IDs that aren't changed
// - Keep file name stable

// Write updated spec
await writeFile(specPath, updatedSpec)
```

**Stable References:**
- Never rename spec file (spec/user-authentication.md stays same)
- Never renumber existing REQ-XXX IDs
- New requirements get next available ID
- Diagram file names remain stable

### 4. Generate Diagrams

Based on spec content, use `diagram-generator` agent:

| Spec Content | Diagram Type | File Name (Stable) |
|--------------|--------------|-------------------|
| Data requirements | ER diagram | `spec/diagrams/{slug}-data-model.mmd` |
| User workflows | User journey | `spec/diagrams/{slug}-user-flow.mmd` |
| API interactions | Sequence | `spec/diagrams/{slug}-api-sequence.mmd` |
| State transitions | State | `spec/diagrams/{slug}-states.mmd` |

**On Amendment:**
- Update existing diagrams if underlying requirements changed
- Add new diagrams if new aspects introduced
- Keep file names stable (don't rename)

### 5. Convert to Images

Use `diagram-to-image` agent:

```bash
for f in spec/diagrams/{slug}-*.mmd; do
    npx @mermaid-js/mermaid-cli mmdc -i "$f" -o "${f%.mmd}.svg" -t default
done
```

### 6. Update Index

Add/update entry in `spec/index.md`:

```markdown
user-authentication.md -- User login, registration, and session management -- auth, login, security
```

## Output

### Create Mode

```
Creating specification for: user-authentication

Q: What should users be able to do with authentication?
A: Register, login, logout, reset password

Q: What user data needs to be stored?
A: Email, password hash, name, created date

Q: Are there different user roles?
A: Yes, admin and regular users

Q: What security requirements exist?
A: Passwords hashed, JWT tokens, session expiry

Generating specification...
✓ Created spec/user-authentication.md
  - 8 requirements defined (REQ-001 to REQ-008)

Generating diagrams...
✓ spec/diagrams/user-authentication-data-model.mmd (ER)
✓ spec/diagrams/user-authentication-user-flow.mmd (journey)
✓ spec/diagrams/user-authentication-api-sequence.mmd (sequence)

Converting to images...
✓ spec/diagrams/user-authentication-data-model.svg
✓ spec/diagrams/user-authentication-user-flow.svg
✓ spec/diagrams/user-authentication-api-sequence.svg

Updated spec/index.md

✓ Specification created!

Next: Run /update-roadmap to generate work items
```

### Amend Mode

```
Amending specification: user-authentication

Loading existing spec...
✓ Found 8 existing requirements (REQ-001 to REQ-008)
✓ Found 3 existing diagrams

Q: What would you like to change or add?
A: Add two-factor authentication support

Q: What methods should be supported?
A: TOTP (authenticator app) and SMS

Q: Is 2FA required or optional?
A: Optional, user can enable in settings

Updating specification...
✓ Added REQ-009: 2FA Setup
✓ Added REQ-010: 2FA Verification
✓ Updated REQ-002: Login (added 2FA check)
  - Preserved all existing requirement IDs
  - File name unchanged: spec/user-authentication.md

Updating diagrams...
✓ Updated user-authentication-user-flow.mmd (added 2FA step)
✓ Updated user-authentication-api-sequence.mmd (added 2FA flow)
  - Diagram file names preserved

Converting to images...
✓ spec/diagrams/user-authentication-user-flow.svg
✓ spec/diagrams/user-authentication-api-sequence.svg

✓ Specification amended!

Changes made:
- Added: REQ-009 (2FA Setup), REQ-010 (2FA Verification)
- Modified: REQ-002 (Login - added 2FA check)
- Diagrams updated: user-flow, api-sequence

Next: Run /update-roadmap to update work items
```

## Question Templates

### For User-Facing Features
1. Who will use this feature?
2. What problem does it solve?
3. What are the main actions?
4. What information needs to be displayed?
5. What are the success criteria?

### For API Features
1. What endpoints are needed?
2. What data is input/output?
3. Who can access this?
4. What are the error cases?
5. What are the performance requirements?

### For Data Features
1. What entities are involved?
2. How do they relate?
3. What fields are required?
4. What constraints exist?
5. How will data be accessed?

### For Amendment
1. What needs to change?
2. Why is this change needed?
3. Does this affect existing requirements?
4. Are there new edge cases?
5. Should anything be deprecated?

## Directory Structure

```
spec/
├── README.md                           # How to write specs
├── index.md                            # Spec index
├── user-authentication.md              # Feature spec
├── order-management.md                 # Another feature spec
├── diagrams/                           # Spec diagrams
│   ├── user-authentication-data-model.mmd
│   ├── user-authentication-data-model.svg
│   ├── user-authentication-user-flow.mmd
│   ├── user-authentication-user-flow.svg
│   ├── user-authentication-api-sequence.mmd
│   ├── user-authentication-api-sequence.svg
│   └── ...
└── ...
```

## Reference Preservation Rules

When amending specs:

1. **File Names** - Never rename spec files
   - `spec/user-auth.md` stays `spec/user-auth.md`
   - References from roadmap, todos, architecture remain valid

2. **Requirement IDs** - Never renumber
   - REQ-001 through REQ-008 keep their numbers
   - New requirements get REQ-009, REQ-010, etc.
   - If requirement removed, mark deprecated (don't delete ID)

3. **Diagram Names** - Keep stable
   - `{slug}-data-model.mmd` stays same
   - Update content, not file name

4. **Change Tracking** - Record what changed
   - List added requirements
   - List modified requirements
   - List updated diagrams

## When to Use

- At project start (create initial specs)
- When adding new features (create new spec)
- When requirements change (amend existing spec)
- When scope expands (add requirements to existing spec)
- Before major releases (review and update specs)

## Integration

- Specs feed into `/update-roadmap` for work item generation
- Specs are referenced during `/work` research phase
- Architecture docs reference spec requirements
