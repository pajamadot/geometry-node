# Story Platform - Skills Structure Design

**Generated**: 2025-10-20
**Purpose**: Detailed skill templates mapped to implementation phases

---

## 📐 Skill Structure Principles

### Directory Structure Standard
```
.claude/skills/<skill-name>/
├── skill.md                    # Main skill instructions (REQUIRED)
├── scripts/                    # Executable scripts (Python/Bash/Batch)
├── templates/                  # Code/config templates
├── fixtures/                   # Test data/sample files
├── docs/                       # Skill-specific documentation
└── config/                     # Tool configuration
```

### skill.md Format
Every `skill.md` must include:
1. **Trigger Keywords** - When Claude should load this skill
2. **Context** - What this skill provides
3. **Capabilities** - What Claude can do with this skill
4. **Scripts Reference** - How to use included scripts
5. **Examples** - Common usage patterns

---

## 🎯 Tier 1 Skills - Detailed Designs

### 1. `story-dev-env` - Development Environment Orchestrator

**Priority**: P0 (Build First)
**Phase**: All phases
**Setup Time**: 4 hours

#### File Structure
```
.claude/skills/story-dev-env/
├── skill.md
├── scripts/
│   ├── health-check.py
│   ├── smart-start.bat
│   ├── smart-stop.bat
│   ├── validate-env.py
│   ├── show-status.py
│   └── unified-logs.py
├── templates/
│   ├── .env.backend.example
│   └── .env.web.example
└── config/
    └── service-ports.json
```

#### skill.md Template
```markdown
# Story Platform Development Environment

## Trigger Keywords
start, running, server, port, environment, health, status, dev, startup

## Context
This skill provides unified management of the Story Platform's three-service architecture:
- story-backend (FastAPI, port 8888)
- web (Next.js, port 5050)
- file-server (Cloudflare Worker, remote)

## Capabilities

### 1. Health Checks
Run comprehensive health check:
```bash
python .claude/skills/story-dev-env/scripts/health-check.py
```

Checks:
- PostgreSQL connection (Neon)
- Backend server (port 8888)
- Frontend server (port 5050)
- File-server connectivity (https://api.fileserver.pajamadot.com)
- Clerk auth endpoint
- Environment variables

Output format: JSON with status for each service

### 2. Smart Startup
Improved version of start-dev.bat:
```bash
.claude/skills/story-dev-env/scripts/smart-start.bat
```

Features:
- Pre-flight checks (Python, Node, PostgreSQL)
- Environment validation
- Auto-dependency installation if missing
- Port conflict resolution (auto-kill or suggest alternatives)
- Health verification after startup
- Colored console output

### 3. Environment Validation
Before any operation, validate env vars:
```bash
python .claude/skills/story-dev-env/scripts/validate-env.py --service backend
python .claude/skills/story-dev-env/scripts/validate-env.py --service web
```

Checks:
- Required vars are set
- Format validation (URLs, keys, ports)
- No placeholder values (e.g., "YOUR_KEY_HERE")
- Warning for exposed secrets

### 4. Unified Status Dashboard
Show all service status in one view:
```bash
python .claude/skills/story-dev-env/scripts/show-status.py
```

Output:
```
╔═══════════════════════════════════════════════════════════╗
║         Story Platform - Service Status                  ║
╠═══════════════════════════════════════════════════════════╣
║ Backend (8888)       ✓ Running    (PID: 12345)          ║
║ Frontend (5050)      ✓ Running    (PID: 12346)          ║
║ PostgreSQL (Neon)    ✓ Connected  (15ms latency)        ║
║ File Server (CF)     ✓ Reachable  (45ms latency)        ║
║ Clerk Auth           ✓ Valid      (token expires: 2h)   ║
╠═══════════════════════════════════════════════════════════╣
║ Environment: development                                 ║
║ Uptime: 2h 34m                                           ║
╚═══════════════════════════════════════════════════════════╝
```

### 5. Unified Logging
Stream logs from both services:
```bash
python .claude/skills/story-dev-env/scripts/unified-logs.py
```

Features:
- Tail both backend and frontend logs
- Color-coded by service
- Filter by log level (INFO, DEBUG, ERROR)
- Search/grep functionality

## Usage Examples

### Starting Development
User: "Start the development environment"
Claude:
1. Runs validate-env.py for both services
2. Runs smart-start.bat
3. Runs health-check.py after 5 seconds
4. Reports status

### Debugging Port Conflicts
User: "Frontend won't start, port issue"
Claude:
1. Checks which process owns port 5050
2. Offers to kill it or suggests alternative port
3. Updates .env.local if port changed

### Checking Service Health
User: "Is everything running correctly?"
Claude:
1. Runs show-status.py
2. Interprets results
3. Suggests fixes if any service is down
```

#### Key Script: health-check.py
```python
#!/usr/bin/env python3
"""
Story Platform - Health Check Script
Verifies all services are running and accessible
"""
import sys
import json
import subprocess
import socket
import os
from urllib.request import urlopen, Request
from urllib.error import URLError

def check_port(port, name):
    """Check if a port is listening"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('localhost', port))
    sock.close()
    return {
        "service": name,
        "port": port,
        "status": "running" if result == 0 else "stopped",
        "healthy": result == 0
    }

def check_http(url, name):
    """Check if an HTTP endpoint responds"""
    try:
        req = Request(url, headers={'User-Agent': 'HealthCheck/1.0'})
        with urlopen(req, timeout=5) as response:
            return {
                "service": name,
                "url": url,
                "status": "reachable",
                "status_code": response.status,
                "healthy": 200 <= response.status < 300
            }
    except URLError as e:
        return {
            "service": name,
            "url": url,
            "status": "unreachable",
            "error": str(e),
            "healthy": False
        }

def check_database():
    """Check PostgreSQL connection"""
    try:
        # Try to import asyncpg
        import asyncpg
        import asyncio

        async def test_conn():
            db_url = os.getenv('DATABASE_URL')
            if not db_url:
                return {"healthy": False, "error": "DATABASE_URL not set"}

            try:
                conn = await asyncpg.connect(db_url)
                await conn.close()
                return {"healthy": True, "status": "connected"}
            except Exception as e:
                return {"healthy": False, "error": str(e)}

        result = asyncio.run(test_conn())
        return {"service": "PostgreSQL (Neon)", **result}
    except ImportError:
        return {
            "service": "PostgreSQL (Neon)",
            "status": "skipped",
            "error": "asyncpg not installed",
            "healthy": None
        }

def main():
    results = {
        "timestamp": __import__('datetime').datetime.now().isoformat(),
        "checks": []
    }

    # Check backend
    results["checks"].append(check_port(8888, "Backend (FastAPI)"))
    results["checks"].append(check_http("http://localhost:8888/health", "Backend /health"))

    # Check frontend
    results["checks"].append(check_port(5050, "Frontend (Next.js)"))

    # Check file-server
    file_server_url = os.getenv('NEXT_PUBLIC_FILE_SERVER_URL', 'https://api.fileserver.pajamadot.com')
    results["checks"].append(check_http(f"{file_server_url}/health", "File Server"))

    # Check database
    results["checks"].append(check_database())

    # Overall health
    results["healthy"] = all(
        check.get("healthy", False) for check in results["checks"]
        if check.get("healthy") is not None
    )

    print(json.dumps(results, indent=2))
    return 0 if results["healthy"] else 1

if __name__ == "__main__":
    sys.exit(main())
```

---

### 2. `jwt-debugger` - Auth Flow Debugger

**Priority**: P0
**Phase**: Phase 2+
**Setup Time**: 3 hours

#### File Structure
```
.claude/skills/jwt-debugger/
├── skill.md
├── scripts/
│   ├── decode-jwt.py
│   ├── validate-jwt.py
│   ├── test-auth-chain.py
│   ├── generate-test-token.py
│   └── verify-scopes.py
└── docs/
    ├── auth-flow-diagram.md
    └── jwt-claims-reference.md
```

#### Key Script: decode-jwt.py
```python
#!/usr/bin/env python3
"""
JWT Decoder - Decode and inspect JWT tokens
Usage: python decode-jwt.py <token> [--verify]
"""
import sys
import json
import base64
from typing import Dict, Any

def decode_jwt_unsafe(token: str) -> Dict[str, Any]:
    """Decode JWT without verification (for inspection only)"""
    try:
        # Split token
        parts = token.split('.')
        if len(parts) != 3:
            return {"error": "Invalid JWT format (expected 3 parts)"}

        header_b64, payload_b64, signature_b64 = parts

        # Decode header and payload (add padding if needed)
        def b64_decode(s):
            padding = 4 - len(s) % 4
            if padding != 4:
                s += '=' * padding
            return base64.urlsafe_b64decode(s)

        header = json.loads(b64_decode(header_b64))
        payload = json.loads(b64_decode(payload_b64))

        return {
            "header": header,
            "payload": payload,
            "signature": signature_b64,
            "raw": {
                "header": header_b64,
                "payload": payload_b64
            }
        }
    except Exception as e:
        return {"error": f"Failed to decode: {str(e)}"}

def analyze_token(decoded: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze decoded token for common issues"""
    analysis = {
        "issues": [],
        "warnings": [],
        "info": []
    }

    payload = decoded.get("payload", {})

    # Check expiration
    if "exp" in payload:
        import time
        exp_time = payload["exp"]
        now = time.time()

        if exp_time < now:
            analysis["issues"].append(f"Token EXPIRED (expired {int(now - exp_time)}s ago)")
        else:
            ttl = int(exp_time - now)
            analysis["info"].append(f"Token valid for {ttl}s ({ttl // 60}m)")
    else:
        analysis["warnings"].append("No expiration time (exp) in token")

    # Check required claims
    required_claims = ["iss", "sub", "aud"]
    for claim in required_claims:
        if claim not in payload:
            analysis["warnings"].append(f"Missing recommended claim: {claim}")

    # Check for service-specific claims (Story Platform)
    if "tenant_id" in payload:
        analysis["info"].append(f"Service token for tenant: {payload['tenant_id']}")

    if "scopes" in payload:
        analysis["info"].append(f"Scopes: {', '.join(payload['scopes'])}")

    return analysis

def main():
    if len(sys.argv) < 2:
        print("Usage: python decode-jwt.py <token> [--verify]")
        return 1

    token = sys.argv[1]
    verify = "--verify" in sys.argv

    # Decode
    decoded = decode_jwt_unsafe(token)

    if "error" in decoded:
        print(json.dumps({"error": decoded["error"]}, indent=2))
        return 1

    # Analyze
    analysis = analyze_token(decoded)

    # Output
    result = {
        "decoded": decoded,
        "analysis": analysis
    }

    if verify:
        # TODO: Implement signature verification
        result["verified"] = "Not implemented yet"

    print(json.dumps(result, indent=2))
    return 0

if __name__ == "__main__":
    sys.exit(main())
```

---

### 3. `db-toolkit` - Database Operations Toolkit

**Priority**: P0
**Phase**: Phase 0+
**Setup Time**: 3 hours

#### File Structure
```
.claude/skills/db-toolkit/
├── skill.md
├── scripts/
│   ├── migration-helper.py
│   ├── test-rls.py
│   ├── seed-data.py
│   ├── reset-db.py
│   └── query-profile.py
├── templates/
│   ├── migration-template.py
│   └── rls-policy-template.sql
└── fixtures/
    └── test-data.json
```

#### skill.md Excerpt
```markdown
## Capabilities

### 1. Migration Helper
Streamline Alembic workflow:
```bash
# Create new migration
python .claude/skills/db-toolkit/scripts/migration-helper.py create "add_character_table"

# Apply migrations
python .claude/skills/db-toolkit/scripts/migration-helper.py upgrade

# Rollback last migration
python .claude/skills/db-toolkit/scripts/migration-helper.py downgrade -1

# Show migration status
python .claude/skills/db-toolkit/scripts/migration-helper.py status
```

### 2. RLS Testing
Verify tenant isolation:
```bash
# Test RLS policies for all tables
python .claude/skills/db-toolkit/scripts/test-rls.py --all

# Test specific table
python .claude/skills/db-toolkit/scripts/test-rls.py --table project

# Verbose output
python .claude/skills/db-toolkit/scripts/test-rls.py --all --verbose
```

Test scenarios:
- User can only see their tenant's data
- Cross-tenant queries return empty
- Service role can bypass RLS
- Different roles (owner/editor/viewer) have correct access

### 3. Seed Test Data
Populate database with realistic test data:
```bash
# Seed default test data
python .claude/skills/db-toolkit/scripts/seed-data.py

# Seed with custom fixture
python .claude/skills/db-toolkit/scripts/seed-data.py --fixture custom-data.json

# Seed specific entities
python .claude/skills/db-toolkit/scripts/seed-data.py --only projects,stories
```

Creates:
- 2 test tenants
- 4 test users (2 per tenant)
- 3 projects per tenant
- 5 stories per project
- 10 scenes per story
- 5 characters per story
```

#### Key Script: test-rls.py
```python
#!/usr/bin/env python3
"""
RLS Policy Tester - Verify tenant isolation
"""
import asyncio
import asyncpg
import os
import sys
from typing import List, Dict, Any

# Tables to test (all multi-tenant tables)
TABLES_TO_TEST = [
    "app_user",
    "project",
    "story",
    "chapter",
    "scene",
    "character",
    "asset"
]

async def test_rls_for_table(conn: asyncpg.Connection, table: str, tenant_a: str, tenant_b: str) -> Dict[str, Any]:
    """Test RLS policies for a table"""
    result = {
        "table": table,
        "tests": [],
        "passed": True
    }

    # Test 1: User from tenant A should see tenant A data
    await conn.execute(f"SET app.current_tenant_id = '{tenant_a}'")
    count_a = await conn.fetchval(f"SELECT COUNT(*) FROM {table}")

    result["tests"].append({
        "name": f"Tenant A sees own data",
        "passed": count_a > 0,
        "details": f"Found {count_a} rows for tenant A"
    })

    # Test 2: User from tenant A should NOT see tenant B data
    await conn.execute(f"SET app.current_tenant_id = '{tenant_b}'")
    count_b_as_a = await conn.fetchval(f"SELECT COUNT(*) FROM {table} WHERE tenant_id = '{tenant_a}'")

    test_passed = count_b_as_a == 0
    result["tests"].append({
        "name": f"Tenant B cannot see tenant A data",
        "passed": test_passed,
        "details": f"Found {count_b_as_a} rows (should be 0)"
    })

    if not test_passed:
        result["passed"] = False

    # Test 3: Service role can bypass RLS
    await conn.execute(f"SET ROLE service_role")
    count_all = await conn.fetchval(f"SELECT COUNT(*) FROM {table}")

    result["tests"].append({
        "name": f"Service role sees all data",
        "passed": count_all >= (count_a + count_b_as_a),
        "details": f"Found {count_all} total rows"
    })

    return result

async def main():
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("ERROR: DATABASE_URL not set")
        return 1

    # Connect to database
    conn = await asyncpg.connect(db_url)

    # Get two test tenants
    tenants = await conn.fetch("SELECT id FROM tenant LIMIT 2")
    if len(tenants) < 2:
        print("ERROR: Need at least 2 tenants for testing")
        await conn.close()
        return 1

    tenant_a = tenants[0]['id']
    tenant_b = tenants[1]['id']

    print(f"Testing RLS policies...")
    print(f"Tenant A: {tenant_a}")
    print(f"Tenant B: {tenant_b}")
    print()

    all_passed = True

    for table in TABLES_TO_TEST:
        print(f"Testing {table}...")
        result = await test_rls_for_table(conn, table, tenant_a, tenant_b)

        for test in result["tests"]:
            status = "✓" if test["passed"] else "✗"
            print(f"  {status} {test['name']}: {test['details']}")

        if not result["passed"]:
            all_passed = False

        print()

    await conn.close()

    if all_passed:
        print("✓ All RLS tests passed")
        return 0
    else:
        print("✗ Some RLS tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
```

---

## 🎯 Tier 2 Skills - Detailed Designs

### 4. `file-server-tester` - File Server Integration Testing

**Priority**: P1
**Phase**: Phase 2+
**Setup Time**: 4 hours

#### File Structure
```
.claude/skills/file-server-tester/
├── skill.md
├── scripts/
│   ├── test-ufr.py
│   ├── test-upload-flow.py
│   ├── test-signed-urls.py
│   └── mock-server.py
└── fixtures/
    ├── test-image.jpg
    ├── test-video.mp4
    └── test-document.pdf
```

#### Key Capabilities
```markdown
### 1. UFR Format Validation
```bash
python .claude/skills/file-server-tester/scripts/test-ufr.py "ufr:proj_123:image:cf_img_abc"
```

Validates:
- Format: `ufr:project_id:type:service_id`
- Type is one of: image, video, file
- Project ID is valid UUID
- Service ID matches type (cf_img_* for images, cf_stream_* for videos, r2_* for files)

### 2. Full Upload Flow Test
```bash
python .claude/skills/file-server-tester/scripts/test-upload-flow.py \
  --file fixtures/test-image.jpg \
  --project proj_123
```

Tests:
1. Request upload URL from file-server
2. Upload file to signed URL
3. Commit file
4. Verify UFR generated
5. Request signed download URL
6. Download and verify content matches

### 3. Mock File Server
For frontend development without file-server access:
```bash
python .claude/skills/file-server-tester/scripts/mock-server.py --port 9000
```

Provides:
- Mock /v2/session/files/upload-url endpoint
- Mock /v2/session/files/commit endpoint
- Mock /v2/session/files/:id/url endpoint
- Stores files in local ./mock-storage/
```

---

### 5. `test-runner` - Unified Test Runner

**Priority**: P1
**Phase**: All
**Setup Time**: 2 hours

#### File Structure
```
.claude/skills/test-runner/
├── skill.md
├── scripts/
│   ├── run-all-tests.py
│   ├── backend-tests.bat
│   ├── frontend-tests.bat
│   ├── integration-tests.py
│   └── coverage-report.py
└── config/
    ├── pytest.ini
    └── playwright.config.ts
```

#### Key Features
```markdown
### Unified Test Execution
```bash
# Run everything
python .claude/skills/test-runner/scripts/run-all-tests.py

# Run specific suite
python .claude/skills/test-runner/scripts/run-all-tests.py --suite backend
python .claude/skills/test-runner/scripts/run-all-tests.py --suite frontend
python .claude/skills/test-runner/scripts/run-all-tests.py --suite integration

# Watch mode
python .claude/skills/test-runner/scripts/run-all-tests.py --watch

# Coverage mode
python .claude/skills/test-runner/scripts/run-all-tests.py --coverage
```

### Combined Coverage Report
```bash
python .claude/skills/test-runner/scripts/coverage-report.py
```

Generates:
- Combined coverage from backend (pytest-cov) and frontend (Playwright)
- HTML report at ./coverage/index.html
- Terminal summary table
- Identifies files with < 80% coverage
```

---

### 6. `doc-index` - Documentation Navigator

**Priority**: P1
**Phase**: All
**Setup Time**: 2 hours

#### File Structure
```
.claude/skills/doc-index/
├── skill.md
├── scripts/
│   ├── generate-index.py
│   ├── search-docs.py
│   ├── categorize-docs.py
│   └── suggest-cleanup.py
└── templates/
    └── DOC_INDEX.md
```

#### Key Capabilities
```markdown
### Generate Index
```bash
python .claude/skills/doc-index/scripts/generate-index.py
```

Creates `DOC_INDEX.md` with:
- Category-organized list of all .md files
- Auto-extracted first heading from each file
- Last modified date
- Word count
- Cross-reference links

### Search Documentation
```bash
# Full-text search
python .claude/skills/doc-index/scripts/search-docs.py "JWT authentication"

# Search in specific category
python .claude/skills/doc-index/scripts/search-docs.py "database" --category architecture
```

### Auto-Categorization
```bash
python .claude/skills/doc-index/scripts/categorize-docs.py
```

Categories:
- Architecture (ARCHITECTURE_*, SPEC*, DESIGN*)
- Implementation (IMPLEMENTATION_*, PHASE*, COMPLETE*)
- Sessions (SESSION_SUMMARY*)
- Fixes (FIX*, DEBUGGING_*)
- Guides (GUIDE*, WORKFLOW*)
```

---

## 📊 Phase-to-Skill Mapping

### Phase 0: Foundation (Weeks 1-2)
**Build These Skills**:
1. ✅ `db-toolkit` - Needed immediately for Alembic migrations
2. ✅ `story-dev-env` - Quality of life improvement

**Agent**: postgres-schema-architect
**Deliverables**: Schema, migrations, RLS policies

---

### Phase 1-2: Core API + Assets (Weeks 3-7)
**Build These Skills**:
3. ✅ `jwt-debugger` - Essential for auth integration (Phase 2)
4. ✅ `file-server-tester` - Needed for asset workflows (Phase 2)
5. ✅ `test-runner` - Start building test discipline

**Agents**: fastAPI-backend-expert
**Deliverables**: Story CRUD, asset integration, JWT flow

---

### Phase 3-4: Frontend + MCP (Weeks 8-12)
**Build These Skills**:
6. ✅ `doc-index` - Documentation growing rapidly
7. ✅ `mcp-tool-validator` - Critical for Phase 4

**Agents**: shadcn-component-builder, clerk-auth-expert-nextjs, mcp-server-expert
**Deliverables**: Story editor UI, AI assistant, MCP tools

---

### Phase 5-7: AI + Publishing + Collab (Weeks 13-16)
**Build These Skills**:
8. ✅ `publish-tester` - Validate publishing workflow
9. ✅ `code-quality` - Pre-production polish

**Agents**: fastAPI-backend-expert, shadcn-component-builder
**Deliverables**: Publishing pipeline, real-time sync

---

## 🚀 Quick Start Guide

### Step 1: Create Skills Directory
```bash
mkdir -p .claude/skills
```

### Step 2: Build Your First Skill (story-dev-env)
```bash
# Create directory structure
mkdir -p .claude/skills/story-dev-env/{scripts,templates,config}

# Create skill.md (copy from this document)
# Create health-check.py (copy from this document)
# Create smart-start.bat (enhanced version of start-dev.bat)

# Test it
python .claude/skills/story-dev-env/scripts/health-check.py
```

### Step 3: Tell Claude About It
Add to your message:
> "I've created the story-dev-env skill. Can you check if all services are healthy?"

Claude will automatically load the skill and use the scripts!

### Step 4: Iterate
- Use the skill for a week
- Collect feedback
- Improve scripts
- Build next skill

---

## 📝 Skill Development Checklist

For each skill:
- [ ] Create directory structure
- [ ] Write skill.md with clear trigger keywords
- [ ] Implement core scripts (Python preferred for cross-platform)
- [ ] Add usage examples to skill.md
- [ ] Test scripts manually
- [ ] Test that Claude loads skill automatically
- [ ] Document in DOC_INDEX.md
- [ ] Commit to git
- [ ] Share with team

---

## 🔗 Resources

- [Claude Code Skills Documentation](https://docs.claude.com/claude-code/skills)
- [Skills Marketplace](https://github.com/anthropics/skills)
- [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk)

---

**Last Updated**: 2025-10-20
**Status**: Ready to Implement ✅
