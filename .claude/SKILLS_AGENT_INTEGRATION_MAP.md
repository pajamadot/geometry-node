# Skills + Agents Integration Map

**How Skills and Agents Work Together in Story Platform Development**

---

## 🧠 Conceptual Model

### Agents vs. Skills

| Aspect | Agents (.claude/agents/) | Skills (.claude/skills/) |
|--------|-------------------------|--------------------------|
| **Purpose** | Deep, autonomous complex tasks | Lightweight, repeatable workflows |
| **Invocation** | Manual (via Task tool) | Automatic (keyword-triggered) |
| **Scope** | Multi-step investigations/implementations | Single-purpose utilities |
| **Duration** | Minutes to hours | Seconds to minutes |
| **Output** | Reports, code changes, recommendations | Script results, validations, data |
| **Examples** | Design database schema, build API endpoints | Check service health, decode JWT |

### How They Complement Each Other

```
┌─────────────────────────────────────────────────────────────┐
│                    USER REQUEST                             │
│        "Build the authentication system"                    │
└───────────────────┬─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│   AGENTS         │    │   SKILLS         │
│   (Strategic)    │    │   (Tactical)     │
├──────────────────┤    ├──────────────────┤
│                  │    │                  │
│ • Plan design    │───▶│ • Validate env   │
│ • Write code     │    │ • Check JWT      │
│ • Test logic     │    │ • Seed test data │
│ • Document       │    │ • Run health     │
│                  │◀───│   checks         │
│                  │    │                  │
└──────────────────┘    └──────────────────┘
        │                       │
        └───────────┬───────────┘
                    │
                    ▼
           ┌────────────────┐
           │  DELIVERABLE   │
           │  Working auth  │
           │  system        │
           └────────────────┘
```

---

## 🗺️ Phase-by-Phase Integration

### Phase 0: Foundation (Weeks 1-2)

#### Agent: `postgres-schema-architect`
**Task**: Design complete database schema with RLS

#### Skills Used:
1. **`story-dev-env`** ✓
   - When: Verify PostgreSQL connection before starting
   - How: Agent asks Claude "Are all services healthy?"
   - Output: Connection status, latency

2. **`db-toolkit`** ✓
   - When: Create migrations, test RLS policies
   - How: Agent generates schema → skill creates migration → skill tests RLS
   - Output: Migration files, test results

**Workflow**:
```
postgres-schema-architect starts
   ↓
story-dev-env: Check database connection ✓
   ↓
Agent: Design schema (tenant, project, story, etc.)
   ↓
db-toolkit: Generate migration files
   ↓
db-toolkit: Apply migrations
   ↓
db-toolkit: Test RLS policies for each table
   ↓
Agent: Review test results, adjust policies if needed
   ↓
db-toolkit: Seed test data (2 tenants, users, projects)
   ↓
Deliverable: Production-ready schema
```

---

### Phase 1: Core Story API (Weeks 3-5)

#### Agent: `fastAPI-backend-expert`
**Task**: Build Story CRUD endpoints

#### Skills Used:
1. **`story-dev-env`** ✓
   - When: Before starting development session
   - How: "Start the backend in dev mode"
   - Output: Backend running on port 8888, health verified

2. **`db-toolkit`** ✓
   - When: Need test data for API development
   - How: "Seed some test projects and stories"
   - Output: Test fixtures created

3. **`test-runner`** ✓
   - When: After implementing endpoints
   - How: "Run all backend tests"
   - Output: Test results, coverage report

**Workflow**:
```
fastAPI-backend-expert starts
   ↓
story-dev-env: Start backend server ✓
   ↓
Agent: Implement /v1/stories endpoints
   ↓
db-toolkit: Seed test stories for manual testing
   ↓
Agent: Test endpoints manually (curl/Postman)
   ↓
Agent: Write pytest tests
   ↓
test-runner: Run all backend tests ✓
   ↓
Deliverable: Story CRUD API with >80% test coverage
```

---

### Phase 2: Asset Integration (Weeks 6-7)

#### Agent: `fastAPI-backend-expert`
**Task**: Integrate with file-server, implement asset linking

#### Skills Used:
1. **`jwt-debugger`** ✓✓✓
   - When: Implementing service JWT minting
   - How: "Generate a test service token for file-server"
   - Output: JWT token for testing

2. **`file-server-tester`** ✓✓✓
   - When: Testing file upload flow
   - How: "Test the full upload workflow for this image"
   - Output: Upload success, UFR generated

3. **`story-dev-env`** ✓
   - When: Verify file-server connectivity
   - How: "Check file-server health"
   - Output: File-server reachable, latency

**Workflow**:
```
fastAPI-backend-expert starts
   ↓
jwt-debugger: Verify Clerk JWT claims ✓
   ↓
Agent: Implement service JWT minting endpoint
   ↓
jwt-debugger: Generate test service token ✓
   ↓
Agent: Implement file-server HTTP client
   ↓
file-server-tester: Test upload flow end-to-end ✓
   ↓
Agent: Implement asset linking (UFR → entities)
   ↓
file-server-tester: Test UFR validation ✓
   ↓
test-runner: Run integration tests ✓
   ↓
Deliverable: Working asset management system
```

---

### Phase 3: Frontend Story Editor (Weeks 8-10)

#### Agents: `shadcn-component-builder`, `clerk-auth-expert-nextjs`
**Task**: Build story editor UI with authentication

#### Skills Used:
1. **`story-dev-env`** ✓
   - When: Start full-stack development
   - How: "Start both backend and frontend"
   - Output: Both services running, health verified

2. **`jwt-debugger`** ✓
   - When: Debugging Clerk integration
   - How: "Decode this Clerk session token"
   - Output: JWT claims, expiration, validation status

3. **`test-runner`** ✓
   - When: Running E2E tests
   - How: "Run Playwright tests for the story editor"
   - Output: Test results, screenshots

4. **`doc-index`** ✓
   - When: Finding implementation notes
   - How: "Search docs for Clerk middleware implementation"
   - Output: Relevant markdown files

**Workflow**:
```
shadcn-component-builder + clerk-auth-expert-nextjs start
   ↓
story-dev-env: Start backend + frontend ✓
   ↓
clerk-auth-expert: Set up Clerk middleware
   ↓
jwt-debugger: Test JWT flow (Clerk → Next.js) ✓
   ↓
shadcn-component-builder: Build StoryEditor component
   ↓
Agent: Integrate with backend API (stories, chapters, scenes)
   ↓
test-runner: Run E2E tests (create story, edit scene) ✓
   ↓
doc-index: Generate updated documentation ✓
   ↓
Deliverable: Working story editor with auth
```

---

### Phase 4: MCP Server (Weeks 11-12)

#### Agent: `mcp-server-expert`
**Task**: Implement MCP tools for AI assistant

#### Skills Used:
1. **`mcp-tool-validator`** ✓✓✓
   - When: After implementing each MCP tool
   - How: "Validate the scene.edit_text tool schema"
   - Output: Schema validation, safety checks

2. **`jwt-debugger`** ✓
   - When: Implementing MCP auth
   - How: "Generate a test MCP service token with tool scopes"
   - Output: Token with scopes=["stories:edit"]

3. **`test-runner`** ✓
   - When: Testing MCP server
   - How: "Run MCP tool contract tests"
   - Output: All tools tested, safety features verified

**Workflow**:
```
mcp-server-expert starts
   ↓
Agent: Design MCP tool manifest (story.create, scene.edit_text, etc.)
   ↓
mcp-tool-validator: Validate tool schemas ✓
   ↓
Agent: Implement MCP server (Streamable HTTP)
   ↓
jwt-debugger: Implement token-based auth ✓
   ↓
Agent: Implement safety features (human confirmation, explain_only)
   ↓
mcp-tool-validator: Test safety features ✓
   ↓
Agent: Write MCP client for frontend
   ↓
test-runner: Run MCP integration tests ✓
   ↓
Deliverable: Production-ready MCP server
```

---

### Phase 5: AI Assistant UI (Weeks 13-14)

#### Agent: `shadcn-component-builder`
**Task**: Build AI assistant chat interface

#### Skills Used:
1. **`story-dev-env`** ✓
   - When: Development session
   - How: Auto-loads when starting work
   - Output: All services running

2. **`mcp-tool-validator`** ✓
   - When: Testing tool invocations
   - How: "Test the MCP tool invocation flow"
   - Output: Tool call results, confirmation dialogs

3. **`test-runner`** ✓
   - When: E2E testing
   - How: "Run AI assistant E2E tests"
   - Output: Chat flows tested, tool calls verified

**Workflow**:
```
shadcn-component-builder starts
   ↓
story-dev-env: Verify MCP server running ✓
   ↓
Agent: Build ChatKit widget
   ↓
Agent: Implement MCP client in frontend
   ↓
mcp-tool-validator: Test tool invocations ✓
   ↓
Agent: Build diff preview UI (for explain_only mode)
   ↓
Agent: Implement human confirmation dialogs
   ↓
test-runner: Run E2E tests (user asks AI to edit scene) ✓
   ↓
Deliverable: Working AI assistant
```

---

### Phase 6: Publishing Workflow (Week 15)

#### Agents: `fastAPI-backend-expert`, `shadcn-component-builder`
**Task**: Build publishing pipeline

#### Skills Used:
1. **`publish-tester`** ✓✓✓
   - When: Testing publish flow
   - How: "Test the full publish workflow for this story"
   - Output: Snapshot created, validation passed, promoted

2. **`file-server-tester`** ✓
   - When: Testing file-server publishing endpoints
   - How: "Test snapshot creation for these assets"
   - Output: Snapshot ID, public URLs

3. **`test-runner`** ✓
   - When: Integration testing
   - How: "Run publish integration tests"
   - Output: All publish scenarios tested

**Workflow**:
```
fastAPI-backend-expert + shadcn-component-builder start
   ↓
Agent: Design publishing state machine (draft → building → built → published)
   ↓
Agent: Implement validation rules (check assets, links)
   ↓
publish-tester: Test validation rules ✓
   ↓
Agent: Implement file-server snapshot coordination
   ↓
file-server-tester: Test snapshot creation ✓
   ↓
Agent: Implement atomic promotion
   ↓
publish-tester: Test promotion + rollback ✓
   ↓
Agent: Build publishing UI
   ↓
test-runner: Run E2E publish tests ✓
   ↓
Deliverable: One-click publishing with rollback
```

---

### Phase 7: Real-Time Collaboration (Week 16)

#### Agent: `fastAPI-backend-expert`
**Task**: Implement Yjs sync server

#### Skills Used:
1. **`story-dev-env`** ✓
   - When: Testing WebSocket connections
   - How: "Check WebSocket server health"
   - Output: WebSocket listening, connection count

2. **`test-runner`** ✓
   - When: Testing real-time sync
   - How: "Run Yjs sync tests (2 concurrent users)"
   - Output: Sync verified, no data loss

3. **`db-toolkit`** ✓
   - When: Testing snapshot strategy
   - How: "Verify Yjs doc snapshots to PostgreSQL"
   - Output: Snapshots created, revisions incremented

**Workflow**:
```
fastAPI-backend-expert starts
   ↓
Agent: Implement Yjs sync server (WebSocket)
   ↓
story-dev-env: Verify WebSocket server running ✓
   ↓
Agent: Implement awareness protocol (cursors, presence)
   ↓
Agent: Implement snapshot strategy (Yjs → PostgreSQL every 60s)
   ↓
db-toolkit: Verify snapshots saving correctly ✓
   ↓
test-runner: Run concurrent edit tests ✓
   ↓
Deliverable: Working real-time collaboration
```

---

## 🎯 Skills Usage Heatmap by Phase

| Skill | Phase 0 | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 | Phase 6 | Phase 7 |
|-------|---------|---------|---------|---------|---------|---------|---------|---------|
| story-dev-env | ✓✓ | ✓✓✓ | ✓✓✓ | ✓✓✓ | ✓✓✓ | ✓✓✓ | ✓✓ | ✓✓✓ |
| db-toolkit | ✓✓✓ | ✓✓ | ✓ | - | - | - | - | ✓ |
| jwt-debugger | - | - | ✓✓✓ | ✓✓ | ✓✓ | - | - | - |
| file-server-tester | - | - | ✓✓✓ | ✓ | - | - | ✓✓ | - |
| test-runner | - | ✓✓ | ✓✓ | ✓✓✓ | ✓✓✓ | ✓✓✓ | ✓✓ | ✓✓ |
| doc-index | - | - | - | ✓✓ | ✓ | ✓ | ✓ | ✓ |
| mcp-tool-validator | - | - | - | - | ✓✓✓ | ✓✓ | - | - |
| publish-tester | - | - | - | - | - | - | ✓✓✓ | - |
| code-quality | - | ✓ | ✓ | ✓ | ✓ | ✓ | ✓✓ | ✓✓ |

**Legend**: ✓ = Used occasionally, ✓✓ = Used frequently, ✓✓✓ = Critical for phase

---

## 💡 Key Insights

### 1. Universal Skills (Use Every Day)
- **story-dev-env** - Every development session
- **test-runner** - After implementing features

### 2. Phase-Specific Skills (Build When Needed)
- **jwt-debugger** - Phases 2-4 (auth integration)
- **mcp-tool-validator** - Phases 4-5 (MCP implementation)
- **publish-tester** - Phase 6 only (publishing workflow)

### 3. Skills Enable Agent Success
Agents rely on skills for:
- **Validation**: "Is what I built working?"
- **Testing**: "Did my changes break anything?"
- **Debugging**: "Why isn't this JWT working?"
- **Automation**: "Seed test data so I can develop faster"

### 4. Skills Reduce Context Switching
Without skills:
```
Claude: "I need to check if the backend is running"
User: Switches to terminal, runs netstat, checks ports, reports back
Claude: "Okay, now I can continue"
```

With skills:
```
Claude: "Checking backend health..." (auto-loads story-dev-env)
Claude: "Backend is running on port 8888. Proceeding with implementation."
```

---

## 🚀 Recommended Workflow

### Daily Development Session
```
1. User: "I'm working on [feature]"

2. Claude auto-loads: story-dev-env
   → Checks service health
   → Reports status

3. Claude invokes Agent (if needed): [specialized-agent]
   → Agent implements feature
   → Agent uses skills for validation/testing

4. Claude auto-loads: test-runner
   → Runs relevant tests
   → Reports results

5. Done!
```

### When Things Break
```
1. User: "Getting 401 errors"

2. Claude auto-loads: jwt-debugger
   → "Can you share the JWT token?"
   → User provides token
   → Claude decodes, identifies issue (e.g., expired, wrong aud)

3. Claude suggests fix

4. Claude auto-loads: story-dev-env
   → Restarts services with fix

5. Problem solved!
```

---

## 📚 Summary

**Skills = Agent Power-Ups**

- Agents do the **thinking** (design, implement, test)
- Skills do the **doing** (run scripts, validate, report)
- Together they create a **self-sufficient development environment**

**Your Action Item**: Build `story-dev-env` this week. See immediate productivity gains.

---

**Last Updated**: 2025-10-20
**Status**: Ready to Implement ✅
