# prototype-designer · 项目全局规则

> 本文件对所有在本仓库工作的 Agent 生效（Claude Code / Codex / ZCode / Cursor / Gemini 等均读取根目录 `AGENTS.md` 或 `CLAUDE.md`）。

## 发布链路：git 提交后默认执行完整发布

在本仓库**只要产生 git commit，默认视为一次发布**：提交后必须依次完成下面 4 步，不得止步于本地 commit。

**唯一例外**：commit message 含 `[no-release]` 标记，或用户明确说「只提交不发布」。

### 0. 前置检查

- 版本号以 `package.json` / `_meta.json` / `SKILL.md` 三处为准，必须一致，不一致先改齐再提交
- 本次提交含功能 / 修复变更 → 先按语义 bump 版本（patch / minor / major）再提交
- 纯文档 / 规则 / 示例变更可不 bump 版本

### 1. 推送所有远端

```bash
git push origin main && git push gitee main
```

### 2. 发布 skillhub.cn

- 若版本号与线上 `latest` 相同 → **跳过发布**（平台不允许同版本重发，需要重发先 bump 版本）
- 否则打包并发布。**平台仅接受文本类文件**，`.pen` / `.png` / `.gitignore` / `.DS_Store` 等会被 400 拒绝，必须排除：

```bash
VER=$(python3 -c "import json;print(json.load(open('package.json'))['version'])")
rm -f prototype-designer-*.zip
zip -rq prototype-designer-$VER.zip . -x ".git/*" ".gitignore" ".DS_Store" "*/.DS_Store" ".claude/*" ".workbuddy/*" "*.pen" "*.png" "*.zip"
skillhub publish prototype-designer-$VER.zip --version $VER --changelog "<本次变更摘要>" --json
```

- 发布返回 JSON 中 `tags.latest` 必须已指向新版本；`reviewStatus: pending` 属正常（审核异步）

### 3. 更新所有本地 Agent（按 `~/Documents/skills/本地已安装Agent清单.md`）

实体副本共 4 份，rsync 镜像（其余约 22 个 agent 均为软链，自动跟随，无需处理）：

```bash
for t in ~/.agents/skills/prototype-designer ~/.cc-switch/skills/prototype-designer ~/.agnes/skills/prototype-designer ~/.workbuddy/skills/prototype-designer; do
  rsync -a --delete --exclude '.git/' --exclude '.DS_Store' --exclude '.claude/' --exclude '.workbuddy/' --exclude '*.zip' ./ "$t/"
done
```

同步后全量验证 26 个 agent 目录版本一致：

```bash
for d in ~/.dsh/skills ~/.agents/skills ~/.cc-switch/skills ~/.claude/skills ~/.codex/skills ~/.gemini/skills ~/.gemini/antigravity/skills ~/.config/opencode/skills ~/.cursor/skills ~/.copilot/skills ~/.qoder/skills ~/.qoder-cn/skills ~/.qoderwork/skills ~/.codeartsdoer/skills ~/.minimax/skills ~/.mavis/skills ~/.pencil/skills ~/.reasonix/skills ~/.workbuddy/skills ~/.workbuddy-ai/skills ~/.codebuddy/skills ~/.kiro/skills ~/.zcode/skills ~/.pi/agent/skills ~/.atomcode/skills ~/.agnes/skills; do
  p="$d/prototype-designer"
  [ -e "$p" ] && python3 -c "import json;v=json.load(open('$p/package.json'))['version'];assert v=='$VER',v" && echo "OK $p" || echo "FAIL $p"
done
```

- 有 `FAIL` / `MISS` 必须修复后重验，不得带病交付
- rsync 提示的 `deleting` 列表先人工确认（应为源仓库已删除的遗留文件），再实跑

### 4. 更新清单文档

在 `~/Documents/skills/本地已安装Agent清单.md` 的「prototype-designer 分发记录」小节更新：版本、提交号、远端推送状态、skillhub 发布状态、日期；实体副本与软链 agent 名单有变化时同步修正。
