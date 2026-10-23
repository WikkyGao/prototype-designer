# Axure CLI 模式验证报告

日期：2026-10-23
分支：`feat/axure-cli-mode`
需求：登录页（账号 / 密码 / 登录按钮 / 三态提示）
工具：zee-rp 0.2.0 + Axure RP 9 原生格式

## 1. 模式与边界

- 执行模式：`cli`（默认）
- 全程未启动 Axure，未发送 System Events / CGEvent，未写剪贴板，未切换前台焦点
- 原生打开 / 预览 / 保存重开：`not_run`，未冒充已完成

## 2. 执行链路

```bash
node adapters/axure/scripts/axure-preflight.mjs --mode cli

node scripts/proto.mjs check --spec design.rp1.json
node scripts/proto.mjs generate --spec design.rp1.json \
  --out-dir outputs --out-rp design.rp
node bin/axure.mjs rp-read design.rp --json
node scripts/version-lint.mjs design.rp --version 9

# 文件级修改验证
node scripts/set-widget-text.mjs design.rp design-edited.rp "登录" \
  txt-title-41bb2d8edee3 "欢迎登录（已改）"
```

生成前需设置 `AXURE_BLANK_TEMPLATE_RP9`；本次使用 zee-rp 自带
`templates/axure-rp9-blank.rp`。

## 3. 结果

| 检查 | 结果 |
|---|---|
| RP/1 check | `ok: true`，0 diagnostics |
| 离线编译 | `ok: true`，`structural_ok: true` |
| 产物 | `design.rp`，47 KB，文件头 `ac ef 09 00`（RP9） |
| 三零 | `danglingRefs=0`，`sentinelSlotsNonZero=0`，`problems=0` |
| 结构指标 | 文字重叠 / 裁切 / 缺字 / 溢出 / 框重叠 / 重名 均为 0 |
| 交互 | `declared=1`，`materialized=1`，OnClick 3 个动作 |
| 原生输入框 | 2 个 TextBox（账号、密码） |
| version-lint | 通过，无版本专属键违规；1 处同槽改名提示（0x6b） |
| 文件级修改 | `set-widget-text` 改标题成功，输出 `design-edited.rp`；rp-read 回读为新文案 |
| 审美门禁 | `aesthetic_ok: false`，仅 whitespace 84.81%（登录页内容天然稀疏） |

验收口径：`structural = passed`，`nativeOpen / preview / guiRoundtrip = not_run`。
`outputs/login@2x.png` 是 zee-rp 软件渲染预览，仅供查看，不等于 Axure 原生预览。

## 4. RP11 验证

```bash
export AXURE_BLANK_TEMPLATE_RP11=.../templates/axure-rp11-blank.rp
node scripts/create-blank-project.mjs rp11/blank.rp --version 11
node bin/axure.mjs rp-read rp11/blank.rp --json
node scripts/create-global-variable.mjs rp11/blank.rp rp11/with-var.rp demoToken --default-value "rp11-ok"
node scripts/version-lint.mjs rp11/with-var.rp --version 11
```

| 检查 | 结果 |
|---|---|
| 文件头 | `ac ef 0b 00`（RP11） |
| rp-read | `version=11`，1 页，0 元件，三零通过 |
| writer | `create-global-variable` 成功，回读 `demoToken=rp11-ok` |
| version-lint | 通过，无版本专属键违规 |

**限制**：RP/1 只能 `target: 9`，CLI 不能从零生成 RP11 整页。RP11 的 CLI 路径只覆盖空白工程 + writer / `clone-library-*`；整页内容要么逐个 writer 写，要么 GUI `axvg paste --version 11`，要么把 RP9 副本在 Axure 11 中另存升级。

## 5. 发现的问题

1. `proto.mjs generate` 目标 `.rp` 已存在时拒绝覆盖，且无 `--force`；重跑前需先删除旧产物。Skill 文档应写明。
2. RP/1 只能使用内置主题令牌，项目 `design.md` 中的自定义 token 不能注入原生 `.rp`；原生配色需映射到 `enterprise-light` 等内置主题，或在生成后修改。
3. 空白率告警对登录页这类稀疏布局是预期结果；不应为过门禁而强行堆内容。
4. RP/1 的 `input` 没有密码掩码能力；本次仅验证 TextBox 结构，密码掩码需在 Axure 中手动设置或后续扩展。
5. RP11 的 `create-blank-project` 默认模板路径是 `~/Library/Application Support/zee-axure/templates/`，不会自动使用 zee-rp 包内 `templates/`；必须显式 export `AXURE_BLANK_TEMPLATE_RP11`。

## 6. 文件

- `PRD.md`：需求
- `design.md`：设计规范（演示默认值）
- `design.rp1.json`：RP/1 源文件
- `design.rp`：生成的 Axure RP 9 文件
- `design-edited.rp`：验证 `set-widget-text` 文件级修改后的副本
- `outputs/`：编译产物、审计报告、软件渲染预览
- `rp11/blank.rp`、`rp11/with-var.rp`：RP11 空白工程与 writer 验证产物
