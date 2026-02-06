# Story Platform - Skills Workflow Audit

**Generated**: 2025-10-20
**Purpose**: Identify highest-ROI Claude Code skills based on current development workflow

---

## 🎯 Current Workflow Analysis

### Development Environment
- **Architecture**: 3-service (story-backend, web, file-server submodule)
- **Backend**: FastAPI + Python 3.11, port 8888, Uvicorn with --reload
- **Frontend**: Next.js 15.5 + React 19, port 5050, Turbopack
- **Database**: Neon PostgreSQL (cloud-hosted)
- **Auth**: Clerk (JWT flow: Clerk → story-backend → file-server)
- **File Storage**: Cloudflare Worker (read-only submodule)
- **AI Services**: fal.ai for image generation
- **Platform**: Windows (cmd.exe, .bat scripts)

### Identified Pain Points

#### 🔴 HIGH FRICTION (Daily Impact)
1. **Multi-Service Orchestration**
   - Manual startup via `start-dev.bat`
   - Port conflict resolution (manual netstat/taskkill)
   - No health checks to verify services are ready
   - No unified logging/status dashboard

2. **Environment Variable Sprawl**
   - 20+ env vars in story-backend
   - 10+ env vars in web
   - Different formats (.env vs .env.local)
   - No validation that required vars are set
   - Secrets exposed in .env.local (should use .env.local.example)

3. **Auth Flow Debugging**
   - Complex JWT flow (Clerk → backend → file-server)
   - No tool to decode/validate JWTs
   - Hard to verify scope enforcement
   - No way to test service-to-service auth in isolation

4. **Database Operations**
   - Alembic migrations (manual)
   - No automated RLS policy testing
   - No tenant isolation verification
   - No quick way to seed test data

5. **Testing Fragmentation**
   - Backend tests: pytest (in story-backend/)
   - Frontend tests: Playwright (in web/)
   - No integration test suite across services
   - No MCP tool testing framework (Phase 4 will need this)

#### 🟡 MEDIUM FRICTION (Weekly Impact)
6. **File Server Integration**
   - Read-only submodule (can't modify)
   - Manual testing of UFR system
   - No automated upload/commit flow testing
   - Hard to verify signed URL generation

7. **Documentation Sprawl**
   - 40+ .md files in root directory
   - No index or search capability
   - Hard to find relevant implementation notes
   - Docs may be out of sync with code

8. **Build & Deployment**
   - No CI/CD pipeline documented
   - No deployment scripts
   - No rollback procedures
   - No health check endpoints tested

#### 🟢 LOW FRICTION (Occasional Impact)
9. **Dependency Management**
   - Python: requirements.txt (manual pip install)
   - Node: package.json (manual npm install)
   - No automated dependency updates
   - No security scanning

10. **Code Quality**
    - No automated linting/formatting in workflow
    - No pre-commit hooks
    - No TypeScript strict mode checks
    - No Python type checking (mypy)

---

## 🏆 Highest ROI Skills (Prioritized)

### Tier 1: Critical Path Enablers (Build These First)

#### ⭐⭐⭐⭐⭐ **`story-dev-env`** - Development Environment Orchestrator
**Pain Point Addressed**: #1 Multi-Service Orchestration
**Estimated Time Saved**: 10-15 min/day (startup + debugging)
**Impact**: Every development session

**Capabilities**:
- One-command health check: `Are all services running correctly?`
- Smart startup: Check dependencies → start services → verify readiness
- Unified status dashboard (console TUI or web page)
- Port conflict auto-resolution
- Log aggregation from both services
- Environment variable validation before startup

**Files to Include**:
```
.claude/skills/story-dev-env/
├── skill.md                    # Main instructions
├── scripts/
│   ├── health-check.py         # Check all services
│   ├── smart-start.bat         # Improved start-dev.bat
│   ├── validate-env.py         # Verify env vars
│   └── unified-logs.py         # Aggregate logs
└── templates/
    └── .env.local.example      # Safe env template
```

**When Claude Loads This**: Anytime user mentions "start", "running", "server", "port", "environment"

---

#### ⭐⭐⭐⭐⭐ **`jwt-debugger`** - Auth Flow Debugger
**Pain Point Addressed**: #3 Auth Flow Debugging
**Estimated Time Saved**: 20-30 min/incident (auth bugs are frequent)
**Impact**: Critical for file-server integration

**Capabilities**:
- Decode JWT tokens (Clerk session → service tokens)
- Validate JWT signatures against Clerk/backend public keys
- Check scope enforcement
- Test Clerk → backend → file-server auth chain
- Generate test tokens for different roles (owner, editor, viewer, agent)
- Verify RLS policies match JWT claims

**Files to Include**:
```
.claude/skills/jwt-debugger/
├── skill.md
├── scripts/
│   ├── decode-jwt.py           # Decode and pretty-print JWTs
│   ├── validate-jwt.py         # Verify signatures
│   ├── test-auth-chain.py      # E2E auth flow test
│   └── generate-test-token.py  # Mint test service tokens
└── docs/
    └── auth-flow-diagram.md    # Visual reference
```

**When Claude Loads This**: Mentions of "jwt", "auth", "401", "403", "clerk", "token", "unauthorized"

---

#### ⭐⭐⭐⭐ **`db-toolkit`** - Database Operations Toolkit
**Pain Point Addressed**: #4 Database Operations
**Estimated Time Saved**: 15-20 min/migration
**Impact**: Phase 0 (Foundation) and ongoing

**Capabilities**:
- Alembic migration helpers (create, apply, rollback)
- RLS policy testing (verify tenant isolation)
- Test data seeding (projects, stories, characters)
- Database reset for testing
- Connection health checks
- Query performance profiling

**Files to Include**:
```
.claude/skills/db-toolkit/
├── skill.md
├── scripts/
│   ├── migration-helper.py     # Alembic workflow
│   ├── test-rls.py             # RLS isolation tests
│   ├── seed-data.py            # Populate test data
│   ├── reset-db.py             # Clean slate for testing
│   └── query-profile.py        # Performance analysis
└── templates/
    ├── migration-template.py   # Alembic skeleton
    └── test-data.json          # Sample fixtures
```

**When Claude Loads This**: "database", "migration", "alembic", "rls", "postgres", "seed", "fixture"

---

### Tier 2: Workflow Accelerators (Build After Tier 1)

#### ⭐⭐⭐⭐ **`file-server-tester`** - File Server Integration Testing
**Pain Point Addressed**: #6 File Server Integration
**Estimated Time Saved**: 15-20 min/test cycle
**Impact**: Critical for asset management features

**Capabilities**:
- Test UFR system (ufr:project_id:type:service_id)
- Simulate upload → commit workflow
- Verify signed URL generation
- Test R2/Images/Stream routing
- Validate file-server WebSocket connections
- Mock file-server responses for frontend testing

**Files to Include**:
```
.claude/skills/file-server-tester/
├── skill.md
├── scripts/
│   ├── test-ufr.py             # UFR format validation
│   ├── test-upload-flow.py     # Full upload cycle
│   ├── test-signed-urls.py     # URL generation
│   └── mock-server.py          # Local file-server mock
└── fixtures/
    ├── test-image.jpg          # Sample assets
    ├── test-video.mp4
    └── test-document.pdf
```

**When Claude Loads This**: "file-server", "upload", "ufr", "r2", "cloudflare", "asset", "signed url"

---

#### ⭐⭐⭐ **`test-runner`** - Unified Test Runner
**Pain Point Addressed**: #5 Testing Fragmentation
**Estimated Time Saved**: 10 min/test run
**Impact**: Ensures quality across services

**Capabilities**:
- Run backend tests (pytest)
- Run frontend tests (Playwright)
- Run integration tests (cross-service)
- Run MCP tool tests (Phase 4+)
- Coverage reporting (combined)
- Test result diffing (show what changed)

**Files to Include**:
```
.claude/skills/test-runner/
├── skill.md
├── scripts/
│   ├── run-all-tests.py        # Orchestrate all test suites
│   ├── backend-tests.bat       # pytest wrapper
│   ├── frontend-tests.bat      # Playwright wrapper
│   ├── integration-tests.py    # Cross-service tests
│   └── coverage-report.py      # Combined coverage
└── config/
    ├── pytest.ini              # Backend test config
    └── playwright.config.ts    # Frontend test config
```

**When Claude Loads This**: "test", "pytest", "playwright", "coverage", "e2e", "integration"

---

#### ⭐⭐⭐ **`doc-index`** - Documentation Navigator
**Pain Point Addressed**: #7 Documentation Sprawl
**Estimated Time Saved**: 5-10 min/search
**Impact**: Helps onboarding and context switching

**Capabilities**:
- Generate searchable index of all .md files
- Categorize docs (architecture, implementation, sessions, fixes)
- Extract key decisions from docs
- Find relevant docs for current task
- Suggest outdated docs to archive/update

**Files to Include**:
```
.claude/skills/doc-index/
├── skill.md
├── scripts/
│   ├── generate-index.py       # Build doc index
│   ├── search-docs.py          # Full-text search
│   ├── categorize-docs.py      # Auto-categorize
│   └── suggest-cleanup.py      # Find stale docs
└── templates/
    └── index-template.md       # Index format
```

**When Claude Loads This**: "documentation", "docs", "md file", "where is", "find info about"

---

### Tier 3: Quality & Polish (Build During Later Phases)

#### ⭐⭐ **`mcp-tool-validator`** - MCP Tool Testing Framework
**Pain Point Addressed**: #5 Testing (specific to Phase 4)
**Estimated Time Saved**: 30 min/tool
**Impact**: Phase 4+ (MCP Server implementation)

**Capabilities**:
- Validate MCP tool JSON schemas
- Test tool safety features (human confirmation, explain_only)
- Verify scope enforcement for tools
- Test MCP server HTTP transport
- Mock tool responses for frontend testing
- Load testing (rate limits)

**When Claude Loads This**: "mcp", "tool", "model context protocol", "ai assistant"

---

#### ⭐⭐ **`publish-tester`** - Publishing Workflow Tester
**Pain Point Addressed**: #8 Build & Deployment (Phase 6)
**Estimated Time Saved**: 20 min/publish test
**Impact**: Phase 6 (Publishing Workflow)

**Capabilities**:
- Test snapshot creation
- Validate build artifacts
- Test atomic promotion
- Test rollback procedures
- Verify public URLs
- Check broken links in published content

**When Claude Loads This**: "publish", "snapshot", "promote", "rollback", "deployment"

---

#### ⭐ **`code-quality`** - Code Quality Enforcer
**Pain Point Addressed**: #10 Code Quality
**Estimated Time Saved**: 5 min/commit
**Impact**: Long-term code maintainability

**Capabilities**:
- Run linters (ruff for Python, ESLint for TypeScript)
- Format code (black for Python, Prettier for TypeScript)
- Type check (mypy for Python, tsc for TypeScript)
- Pre-commit hook setup
- Security scanning (Snyk, Dependabot)

**When Claude Loads This**: "lint", "format", "type check", "code quality", "pre-commit"

---

## 📊 ROI Summary

| Skill                 | Time Saved/Week | Setup Effort | Priority | Phase Needed |
|-----------------------|-----------------|--------------|----------|--------------|
| story-dev-env         | 60-90 min       | 4 hours      | P0       | All          |
| jwt-debugger          | 40-60 min       | 3 hours      | P0       | Phase 2+     |
| db-toolkit            | 30-45 min       | 3 hours      | P0       | Phase 0+     |
| file-server-tester    | 30-45 min       | 4 hours      | P1       | Phase 2+     |
| test-runner           | 20-30 min       | 2 hours      | P1       | All          |
| doc-index             | 15-25 min       | 2 hours      | P1       | All          |
| mcp-tool-validator    | 60 min          | 5 hours      | P2       | Phase 4+     |
| publish-tester        | 40 min          | 4 hours      | P2       | Phase 6      |
| code-quality          | 10-15 min       | 2 hours      | P2       | All          |

**Total Time Saved per Week (Tier 1+2)**: 3-4 hours
**Total Setup Effort (Tier 1+2)**: 22 hours (one-time investment)
**Payback Period**: ~6 weeks

---

## 🎯 Recommended Build Order

### Phase 0 (Foundation) - Weeks 1-2
1. **db-toolkit** - Needed immediately for schema design
2. **story-dev-env** - Quality of life for all development

### Phase 1-2 (Core API + Assets) - Weeks 3-7
3. **jwt-debugger** - Critical for auth integration
4. **file-server-tester** - Needed for asset workflows
5. **test-runner** - Ensure quality as codebase grows

### Phase 3-4 (Frontend + MCP) - Weeks 8-12
6. **doc-index** - Help manage growing documentation
7. **mcp-tool-validator** - Essential for MCP server

### Phase 5-7 (AI + Publishing + Collab) - Weeks 13-16
8. **publish-tester** - Validate publishing workflow
9. **code-quality** - Polish before production

---

## 📋 Implementation Checklist

For each skill, ensure:
- [ ] Create `.claude/skills/<skill-name>/` directory
- [ ] Write `skill.md` with clear instructions
- [ ] Add executable scripts (Python/Bash/Batch)
- [ ] Include example usage
- [ ] Test skill loads automatically when relevant
- [ ] Document in project README
- [ ] Share with team via git

---

## 🔗 Next Steps

1. Review this audit with the team
2. Prioritize skills based on current phase
3. See `SKILLS_STRUCTURE_DESIGN.md` for detailed skill templates
4. Start with **story-dev-env** (highest immediate ROI)
5. Build skills incrementally (one per week)

---

**Last Updated**: 2025-10-20
**Status**: Ready for Review ✅
