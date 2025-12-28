# Mermaid Syntax Reference

Comprehensive syntax guide for creating Mermaid diagrams.

## Flowchart

System architecture, processes, and decision trees.

### Basic Syntax

```mermaid
graph TB
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E
```

### Direction

| Keyword | Direction |
|---------|-----------|
| `TB` / `TD` | Top to bottom |
| `BT` | Bottom to top |
| `LR` | Left to right |
| `RL` | Right to left |

### Node Shapes

```mermaid
graph LR
    A[Rectangle] --> B(Rounded)
    B --> C([Stadium])
    C --> D[[Subroutine]]
    D --> E[(Database)]
    E --> F((Circle))
    F --> G{Diamond}
    G --> H{{Hexagon}}
    H --> I[/Parallelogram/]
    I --> J[\Parallelogram Alt\]
```

| Syntax | Shape | Use For |
|--------|-------|---------|
| `[text]` | Rectangle | Standard nodes, services |
| `(text)` | Rounded | Functions, methods |
| `([text])` | Stadium | Start/end points |
| `[[text]]` | Subroutine | External calls |
| `[(text)]` | Cylinder/Database | Data stores |
| `((text))` | Circle | Events, triggers |
| `{text}` | Diamond | Decisions |
| `{{text}}` | Hexagon | Preparation steps |

### Edge Types

```mermaid
graph LR
    A --> B
    B --- C
    C -.-> D
    D ==> E
    E --text--> F
    F -.text.-> G
    G ==text==> H
```

| Syntax | Type |
|--------|------|
| `-->` | Arrow |
| `---` | Line (no arrow) |
| `-.->` | Dotted arrow |
| `==>` | Thick arrow |
| `--text-->` | Arrow with label |

### Subgraphs

```mermaid
graph TB
    subgraph Frontend
        A[React App]
        B[API Client]
    end

    subgraph Backend
        C[API Gateway]
        D[Auth Service]
        E[Data Service]
    end

    subgraph Storage
        F[(PostgreSQL)]
        G[(Redis)]
    end

    A --> B
    B --> C
    C --> D
    C --> E
    D --> F
    E --> F
    E --> G
```

### Styling

```mermaid
graph LR
    A[Node A]:::primary --> B[Node B]:::secondary
    B --> C[Node C]:::success

    classDef primary fill:#4a90d9,stroke:#2a5a8f,color:#fff
    classDef secondary fill:#f5f5f5,stroke:#666
    classDef success fill:#52c41a,stroke:#389e0d,color:#fff
```

---

## Sequence Diagram

API calls, service interactions, and message flows.

### Basic Syntax

```mermaid
sequenceDiagram
    participant C as Client
    participant A as API
    participant D as Database

    C->>A: POST /login
    A->>D: Query user
    D-->>A: User data
    A-->>C: JWT token
```

### Message Types

| Syntax | Type | Use For |
|--------|------|---------|
| `->` | Solid line | Synchronous message |
| `-->` | Dashed line | Return/response |
| `->>` | Solid arrow | Request with response expected |
| `-->>` | Dashed arrow | Response |
| `-x` | Solid cross | Async (no response) |
| `--x` | Dashed cross | Async response |
| `-)` | Solid open arrow | Async message |
| `--)` | Dashed open arrow | Async response |

### Activation

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server

    C->>+S: Request
    Note right of S: Processing...
    S-->>-C: Response
```

### Loops and Alternatives

```mermaid
sequenceDiagram
    participant C as Client
    participant A as Auth
    participant D as DB

    C->>A: Login request

    alt Valid credentials
        A->>D: Query user
        D-->>A: User found
        A-->>C: JWT token
    else Invalid credentials
        A-->>C: 401 Unauthorized
    end

    loop Every 5 minutes
        C->>A: Refresh token
        A-->>C: New token
    end

    opt User has 2FA
        A->>C: Request 2FA code
        C->>A: 2FA code
    end
```

### Notes

```mermaid
sequenceDiagram
    participant A as Service A
    participant B as Service B

    Note left of A: Initiates flow
    A->>B: Request
    Note right of B: Processes request
    Note over A,B: This spans both
    B-->>A: Response
```

---

## Class Diagram

Object models, interfaces, and type hierarchies.

### Basic Syntax

```mermaid
classDiagram
    class User {
        +string id
        +string email
        -string passwordHash
        +login(password) bool
        +logout() void
    }

    class Post {
        +string id
        +string title
        +string content
        +Date createdAt
        +publish() void
    }

    User "1" --> "*" Post : creates
```

### Visibility Modifiers

| Symbol | Visibility |
|--------|------------|
| `+` | Public |
| `-` | Private |
| `#` | Protected |
| `~` | Package/Internal |

### Relationships

```mermaid
classDiagram
    classA <|-- classB : Inheritance
    classC *-- classD : Composition
    classE o-- classF : Aggregation
    classG --> classH : Association
    classI -- classJ : Link
    classK ..> classL : Dependency
    classM ..|> classN : Realization
```

| Syntax | Relationship |
|--------|--------------|
| `<\|--` | Inheritance (extends) |
| `*--` | Composition (owns) |
| `o--` | Aggregation (has) |
| `-->` | Association |
| `..>` | Dependency |
| `..\|>` | Realization (implements) |

### Cardinality

```mermaid
classDiagram
    User "1" --> "*" Post : writes
    Post "1" --> "0..*" Comment : has
    User "1" --> "1" Profile : owns
```

| Notation | Meaning |
|----------|---------|
| `1` | Exactly one |
| `0..1` | Zero or one |
| `*` | Many |
| `0..*` | Zero or more |
| `1..*` | One or more |
| `n..m` | Range |

### Annotations

```mermaid
classDiagram
    class IRepository {
        <<interface>>
        +find(id) Entity
        +save(entity) void
    }

    class UserService {
        <<service>>
        -repository IRepository
        +getUser(id) User
    }

    class UserStatus {
        <<enumeration>>
        ACTIVE
        INACTIVE
        SUSPENDED
    }
```

---

## State Diagram

Lifecycles, status transitions, and finite state machines.

### Basic Syntax

```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Review : submit
    Review --> Published : approve
    Review --> Draft : reject
    Published --> Archived : archive
    Archived --> [*]
```

### Composite States

```mermaid
stateDiagram-v2
    [*] --> Active

    state Active {
        [*] --> Idle
        Idle --> Processing : start
        Processing --> Complete : finish
        Complete --> Idle : reset
    }

    Active --> Suspended : suspend
    Suspended --> Active : resume
    Active --> [*] : terminate
```

### Fork and Join

```mermaid
stateDiagram-v2
    [*] --> Start
    Start --> fork_state

    state fork_state <<fork>>
    fork_state --> Task1
    fork_state --> Task2
    fork_state --> Task3

    Task1 --> join_state
    Task2 --> join_state
    Task3 --> join_state

    state join_state <<join>>
    join_state --> End
    End --> [*]
```

### Choice (Conditional)

```mermaid
stateDiagram-v2
    [*] --> Checking
    Checking --> choice

    state choice <<choice>>
    choice --> Approved : if valid
    choice --> Rejected : if invalid

    Approved --> [*]
    Rejected --> [*]
```

### Notes

```mermaid
stateDiagram-v2
    [*] --> Active
    Active --> Inactive

    note right of Active
        User is currently
        logged in and active
    end note

    note left of Inactive
        Session expired or
        user logged out
    end note
```

---

## Entity Relationship Diagram

Database schema and entity relationships.

### Basic Syntax

```mermaid
erDiagram
    USERS ||--o{ POSTS : creates
    USERS ||--o{ COMMENTS : writes
    POSTS ||--o{ COMMENTS : has
    POSTS }o--|| CATEGORIES : belongs_to
```

### Cardinality Notation

| Left | Right | Meaning |
|------|-------|---------|
| `\|\|` | `\|\|` | Exactly one to exactly one |
| `\|\|` | `o{` | One to zero or more |
| `\|\|` | `\|{` | One to one or more |
| `o\|` | `o{` | Zero or one to zero or more |
| `}o` | `o{` | Zero or more to zero or more |

### Relationship Types

| Syntax | Type |
|--------|------|
| `--` | Identifying (solid line) |
| `..` | Non-identifying (dashed line) |

### Attributes

```mermaid
erDiagram
    USERS {
        uuid id PK
        string email UK "unique email"
        string password_hash
        string name
        timestamp created_at
        timestamp updated_at
    }

    POSTS {
        uuid id PK
        uuid author_id FK
        string title
        text content
        enum status "draft, published, archived"
        timestamp published_at
    }

    USERS ||--o{ POSTS : creates
```

### Attribute Types

| Marker | Meaning |
|--------|---------|
| `PK` | Primary Key |
| `FK` | Foreign Key |
| `UK` | Unique Key |

---

## User Journey

User experience flows with satisfaction scores.

### Basic Syntax

```mermaid
journey
    title User Registration Journey
    section Discovery
        Visit landing page: 5: User
        Read features: 4: User
        Click signup: 5: User
    section Registration
        Fill form: 3: User
        Verify email: 2: User
        Complete profile: 4: User
    section Onboarding
        Take tour: 5: User
        Create first project: 4: User
        Invite team: 3: User
```

### Satisfaction Scores

| Score | Meaning |
|-------|---------|
| 1 | Very unhappy |
| 2 | Unhappy |
| 3 | Neutral |
| 4 | Happy |
| 5 | Very happy |

---

## Mindmap

Concept breakdown and brainstorming.

### Basic Syntax

```mermaid
mindmap
    root((Project))
        Frontend
            React
            TypeScript
            Mantine UI
        Backend
            Hono
            Drizzle ORM
            PostgreSQL
        Infrastructure
            Docker
            GitHub Actions
            Vercel
```

---

## Styling Best Practices

### Theme Selection

```mermaid
%%{init: {'theme': 'default'}}%%
graph LR
    A --> B
```

Available themes: `default`, `dark`, `forest`, `neutral`

### Custom Colors

Use semantic colors consistently:
- **Primary**: `#4a90d9` - Main components
- **Success**: `#52c41a` - Completed, valid
- **Warning**: `#faad14` - Caution, pending
- **Error**: `#f5222d` - Failed, invalid
- **Neutral**: `#666666` - Secondary elements

### Accessibility

1. Ensure sufficient color contrast (WCAG 2.1 AA)
2. Don't rely solely on color to convey meaning
3. Include text labels on all significant elements
4. Keep diagrams simple and focused

## Common Patterns

### API Flow Pattern

```mermaid
sequenceDiagram
    participant C as Client
    participant G as Gateway
    participant S as Service
    participant D as Database

    C->>G: Request
    G->>G: Validate/Auth
    G->>S: Forward
    S->>D: Query
    D-->>S: Result
    S-->>G: Response
    G-->>C: Response
```

### Microservices Pattern

```mermaid
graph TB
    subgraph External
        Client[Client App]
    end

    subgraph API Gateway
        Gateway[Kong/Nginx]
    end

    subgraph Services
        Auth[Auth Service]
        Users[User Service]
        Orders[Order Service]
    end

    subgraph Data
        AuthDB[(Auth DB)]
        UserDB[(User DB)]
        OrderDB[(Order DB)]
        Cache[(Redis)]
    end

    Client --> Gateway
    Gateway --> Auth
    Gateway --> Users
    Gateway --> Orders
    Auth --> AuthDB
    Users --> UserDB
    Users --> Cache
    Orders --> OrderDB
    Orders --> Cache
```

### CRUD State Pattern

```mermaid
stateDiagram-v2
    [*] --> Empty

    Empty --> Creating : create
    Creating --> Saved : save
    Creating --> Empty : cancel

    Saved --> Editing : edit
    Editing --> Saved : save
    Editing --> Saved : cancel

    Saved --> Deleting : delete
    Deleting --> [*] : confirm
    Deleting --> Saved : cancel
```
