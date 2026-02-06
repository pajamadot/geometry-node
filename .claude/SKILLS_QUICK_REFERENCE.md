# Skills Quick Reference

**TL;DR**: Skills are auto-loaded toolkits that extend Claude Code with project-specific expertise.

---

## 🎯 Your Top 3 Skills to Build First

| Skill | Why | Time Saved | Build Time |
|-------|-----|------------|------------|
| **story-dev-env** | One-command startup, health checks, status dashboard | 60-90 min/week | 4 hours |
| **jwt-debugger** | Debug Clerk→backend→file-server auth flow | 40-60 min/week | 3 hours |
| **db-toolkit** | Alembic migrations, RLS testing, test data seeding | 30-45 min/week | 3 hours |

**Total Setup**: 10 hours
**Weekly ROI**: 2-3 hours saved
**Payback**: ~4 weeks

---

## 📂 Where to Put Skills

```
.claude/skills/<skill-name>/
├── skill.md          ← Claude reads this to know when/how to use the skill
└── scripts/          ← Executable Python/Bash/Batch scripts
```

---

## 🚀 How to Use Skills

### You Don't Need to Do Anything!

Just talk naturally:
- ✅ "Start the development environment" → Loads `story-dev-env`
- ✅ "Decode this JWT token" → Loads `jwt-debugger`
- ✅ "Run the database migrations" → Loads `db-toolkit`

Claude automatically:
1. Scans available skills
2. Matches your request to trigger keywords
3. Loads relevant skill(s)
4. Uses the scripts/tools provided

---

## 📋 Skill Building Template

### Minimal skill.md
```markdown
# <Skill Name>

## Trigger Keywords
keyword1, keyword2, keyword3

## Context
What this skill helps with

## Capabilities
What Claude can do when this skill loads

### 1. Feature Name
How to use it (commands, examples)
```

### Example Script Structure
```python
#!/usr/bin/env python3
"""
Script description
Usage: python script.py [args]
"""
import sys

def main():
    # Your logic here
    print("Result")
    return 0

if __name__ == "__main__":
    sys.exit(main())
```

---

## 🔥 Quick Wins

### Build `story-dev-env` in 1 Hour (MVP)

1. **Create structure**:
```bash
mkdir -p .claude/skills/story-dev-env/scripts
```

2. **Create skill.md** (copy from SKILLS_STRUCTURE_DESIGN.md)

3. **Create health-check.py** (copy from SKILLS_STRUCTURE_DESIGN.md)

4. **Test it**:
```bash
python .claude/skills/story-dev-env/scripts/health-check.py
```

5. **Try it with Claude**:
> "Check if all services are healthy"

✅ Done! You now have your first skill.

---

## 📊 Complete Skills Roadmap

### Phase 0 (Weeks 1-2) - Foundation
- [x] `db-toolkit` - Database operations
- [x] `story-dev-env` - Development environment

### Phase 1-2 (Weeks 3-7) - Core API
- [x] `jwt-debugger` - Auth debugging
- [x] `file-server-tester` - File operations
- [x] `test-runner` - Unified testing

### Phase 3-4 (Weeks 8-12) - Frontend + MCP
- [x] `doc-index` - Documentation management
- [x] `mcp-tool-validator` - MCP testing

### Phase 5-7 (Weeks 13-16) - Publishing + Collab
- [x] `publish-tester` - Publishing workflow
- [x] `code-quality` - Linting & formatting

---

## 🎓 Learning Resources

- **Full Audit**: `.claude/SKILLS_WORKFLOW_AUDIT.md`
- **Detailed Designs**: `.claude/SKILLS_STRUCTURE_DESIGN.md`
- **Claude Docs**: https://docs.claude.com/claude-code/skills
- **Skills Marketplace**: https://github.com/anthropics/skills

---

## 💡 Pro Tips

1. **Start Small**: Build one script at a time. Test it manually before adding to skill.

2. **Use Python**: Cross-platform, easy to read, integrates with your backend.

3. **Clear Trigger Words**: Use obvious keywords so Claude loads the right skill.

4. **Test Auto-Loading**: Make sure Claude loads your skill when you use trigger words.

5. **Version Control**: Commit skills to git so your team benefits too.

6. **Iterate**: Your first version doesn't need to be perfect. Improve based on usage.

---

## 🤔 FAQ

**Q: Do I need to tell Claude to use a skill?**
A: No! Claude automatically detects relevant skills based on your message.

**Q: Can multiple skills load at once?**
A: Yes! Skills are composable and can work together.

**Q: What if I want to use a skill that isn't loading?**
A: Use trigger keywords from the skill's skill.md file.

**Q: Do skills slow down Claude?**
A: No. Skills load "only minimal information needed" on-demand.

**Q: Can I share skills with my team?**
A: Yes! Skills in `.claude/skills/` are meant to be committed to git.

---

**Start Here**: Build `story-dev-env` today (1 hour MVP, 4 hours full version)

**Next Steps**: See `.claude/SKILLS_WORKFLOW_AUDIT.md` for prioritization
