# Backend flows

Call-flow diagrams for `asd-server` (NestJS + Prisma + PostgreSQL). Mirrors
the live code in `asd-server/src`. All routes except `@Public()` require a JWT
(`Authorization: Bearer <token>`); session-scoped reads require membership and
writes require `owner`/`editor`.

## High-level module map

```mermaid
flowchart TB
    subgraph Clients["Clients"]
        Web["asd-web · React"]
        iOS["asd-ios · SwiftUI"]
    end

    subgraph Server["asd-server · NestJS"]
        subgraph Global["Global infrastructure"]
            GW["JwtAuthGuard<br/>(global APP_GUARD)"]
            JWT["JwtModule<br/>(global)"]
            PRM["PrismaModule<br/>(global)<br/>PrismaService + SessionAccessService"]
            RTM["RealtimeModule<br/>(global)<br/>RealtimeGateway + RealtimeService"]
        end

        subgraph API["Feature modules"]
            AUTH["AuthModule"]
            AGENTS["AgentsModule"]
            SESSIONS["SessionsModule"]
            MESSAGES["MessagesModule"]
            APPROVALS["ApprovalsModule"]
            ARTIFACTS["ArtifactsModule"]
            JOBS["JobsModule"]
            SETTINGS["SettingsModule"]
        end

        subgraph Core["Domain services"]
            ENG["EngineModule<br/>EngineService"]
            LLM["LLMModule<br/>LLMService + providers"]
            KMS["KmsService"]
            COG["CognitoService"]
        end
    end

    DB[("PostgreSQL<br/>(RDS)")]
    AWSKMS["AWS KMS"]
    AWSCOG["AWS Cognito"]

    Web --> GW
    iOS --> GW
    Web -->|"ws /ws"| RTM
    iOS -->|"ws /ws"| RTM

    GW --> API
    JWT -.->|"verifies tokens"| GW

    AUTH --> COG
    SESSIONS -->|"SessionAccessService"| PRM
    MESSAGES -->|"SessionAccessService"| PRM
    MESSAGES --> ENG
    APPROVALS -->|"SessionAccessService"| PRM
    ARTIFACTS -->|"SessionAccessService"| PRM

    ENG --> LLM
    ENG -->|"publish events"| RTM
    LLM --> SETTINGS
    SETTINGS --> KMS
    KMS --> AWSKMS
    COG --> AWSCOG

    AUTH --> PRM
    AGENTS --> PRM
    SESSIONS --> PRM
    MESSAGES --> PRM
    APPROVALS --> PRM
    ARTIFACTS --> PRM
    JOBS --> PRM
    SETTINGS --> PRM

    PRM --> DB
```

## 1. Sign up

```mermaid
sequenceDiagram
    participant C as Client
    participant AC as AuthController
    participant AS as AuthService
    participant CG as CognitoService
    participant J as JwtService
    participant DB as PostgreSQL

    C->>AC: POST /auth/signup {email, password}
    AC->>AS: signup(email, password)
    AS->>CG: signUp(email, password)
    CG-->>AWS: SignUp + AdminConfirmSignUp + verify email
    AS->>DB: user.findUnique({email})
    alt user missing
        AS->>DB: user.create({email, name})
    end
    AS->>J: signAsync({sub: user.id, email})
    J-->>AS: token
    AS-->>AC: {token, user}
    AC-->>C: 201 {token, user}
```

## 2. Login

```mermaid
sequenceDiagram
    participant C as Client
    participant AC as AuthController
    participant AS as AuthService
    participant CG as CognitoService
    participant J as JwtService
    participant DB as PostgreSQL

    C->>AC: POST /auth/login {email, password}
    AC->>AS: login(email, password)
    AS->>CG: verifyPassword(email, password)
    CG-->>AWS: InitiateAuth (USER_PASSWORD_AUTH)
    CG-->>AS: ok / throws
    AS->>DB: user.findUnique({email})
    AS->>J: signAsync({sub, email})
    J-->>AS: token
    AS-->>AC: {token, user}
    AC-->>C: {token, user}
```

## 3. Logout (client-side only)

```mermaid
sequenceDiagram
    participant C as Client
    participant S as localStorage / state

    Note over C: No server endpoint exists — the JWT is stateless.
    C->>S: tokenStore.set(null)
    S-->>C: token removed
    C->>C: setNeedsAuth(true) / reload
    Note over C: WS socket closed, polls stop. Server does nothing.
```

## 4. Send a message (full engine turn)

```mermaid
sequenceDiagram
    participant C as Client
    participant G as JwtAuthGuard
    participant MC as MessagesController
    participant MS as MessagesService
    participant SA as SessionAccessService
    participant DB as PostgreSQL
    participant E as EngineService
    participant L as LLMService
    participant K as KmsService
    participant R as RealtimeService

    C->>G: POST /sessions/:id/messages (Bearer JWT)
    G->>G: verify JWT → req.user
    G->>MC: send(sessionId, body, user.sub)
    MC->>MS: send(sessionId, userId, body)

    MS->>SA: requireEditor(sessionId, userId)
    SA->>DB: sessionMember.findUnique
    alt not member
        SA-->>MS: 404 Session not found
        MS-->>C: 404
    else viewer
        SA-->>MS: 403 Forbidden
        MS-->>C: 403
    else owner/editor
        SA-->>MS: ok
        MS->>DB: message.create (role: user, complete)
        MS->>DB: message.create (role: agent, streaming)
        MS-->>C: 201 agent message (streaming)
        MS->>E: run(session, agentMsg, body, userId) [fire & forget]

        E->>L: enabled(userId)
        L->>K: decrypt(apiKey)
        K-->>AWS: KMS Decrypt
        alt LLM configured
            E->>L: complete(messages, {json:true})
            L-->>E: JSON reply
        else no key
            E->>E: deterministic script()
        end

        loop each chunk (45ms)
            E->>R: publish message.delta
            R-->>C: message.delta (streamed)
        end
        E->>DB: traceEntry.create (per sub-agent)
        opt script has artifact
            E->>DB: artifact.create
        end
        opt script has approval
            E->>DB: approval.create
        end
        E->>DB: message.update (complete, body)
        E->>R: publish message.done
        R-->>C: message.done
        opt approval created
            E->>R: publish approval.created
            R-->>C: approval.created
        end
    end
```

## 5. List / get sessions

```mermaid
sequenceDiagram
    participant C as Client
    participant G as JwtAuthGuard
    participant SC as SessionsController
    participant SS as SessionsService
    participant SA as SessionAccessService
    participant DB as PostgreSQL

    C->>G: GET /sessions (Bearer JWT)
    G->>SC: list(user.sub)
    SC->>SS: list(userId)
    SS->>DB: session.findMany({archived:false, members:{some:{userId}}})
    DB-->>SS: only my sessions
    SS-->>C: Session[]

    C->>G: GET /sessions/:id
    G->>SC: get(id, user.sub)
    SC->>SS: get(id, userId)
    SS->>SA: requireMember(id, userId)
    SA->>DB: sessionMember.findUnique
    alt not member
        SA-->>SS: 404 Session not found
        SS-->>C: 404
    else member
        SS->>DB: session.findUnique (incl. members)
        SS-->>C: 200 Session
    end
```

## 6. Decide an approval

```mermaid
sequenceDiagram
    participant C as Client
    participant G as JwtAuthGuard
    participant AC as ApprovalsController
    participant AS as ApprovalsService
    participant SA as SessionAccessService
    participant DB as PostgreSQL
    participant R as RealtimeService

    C->>G: POST /approvals/:id/decide {action}
    G->>AC: decide(id, action, user.sub)
    AC->>AS: decide(id, action, userId)
    AS->>DB: approval.findUnique({id})
    alt missing
        AS-->>C: 404
    end
    AS->>SA: requireEditor(approval.sessionId, userId)
    alt not member / viewer
        SA-->>C: 404 / 403
    end
    alt already decided
        AS-->>C: 400 Already decided
    end
    AS->>DB: approval.update({status, decidedBy, decidedAt})
    AS->>R: publish approval.updated
    R-->>C: approval.updated
    AS-->>C: 200 Approval
```

## 7. Create an artifact

```mermaid
sequenceDiagram
    participant C as Client
    participant G as JwtAuthGuard
    participant AC as ArtifactsController
    participant AS as ArtifactsService
    participant SA as SessionAccessService
    participant DB as PostgreSQL

    C->>G: POST /sessions/:id/artifacts {kind, name, content}
    G->>AC: create(sessionId, dto, user.sub)
    AC->>AS: create(sessionId, input, authorId)
    AS->>SA: requireEditor(sessionId, authorId)
    alt not member / viewer
        SA-->>C: 404 / 403
    end
    AS->>DB: artifact.create({content: JSON.stringify})
    DB-->>AS: artifact
    AS-->>C: 201 Artifact
```

## 8. Realtime connect + subscribe

```mermaid
sequenceDiagram
    participant C as Client
    participant G as RealtimeGateway
    participant J as JwtService
    participant R as RealtimeService
    participant SA as SessionAccessService
    participant DB as PostgreSQL

    C->>G: ws://host/ws?token=<JWT>
    G->>J: verify(token)
    alt invalid / missing token
        G-->>C: close(1008 Unauthorized)
    end
    G->>R: register(socket, sub)
    R->>DB: memberSessionIds(sub) [background]
    C->>G: {type:"subscribe", data:{scope:"session", id}}
    G->>R: subscribe(socket, "session", id)
    R->>SA: role(id, userId)
    alt not member
        R-->>R: silently ignore
    else member
        R->>R: add to subs + sessions set
    end
    Note over R: later: publish(event) only delivered if member
```
