# OpenDesign 调研清单与启用门槛

> 适用对象：`adapters/opendesign/`
> 当前状态：`planned`，未验证，不提供命令。
> 目标：在把 `status` 改为 `ready` 之前，用可复核的证据回答下面的问题。

## 1. 先确认对象

“OpenDesign”可能指不同产品。开始调研前先锁定：

- 官方名称、官网/仓库与版本号
- 维护方与许可证
- 桌面端 / Web / CLI / API / MCP / SDK 中的哪一种或哪几种
- 目标平台与离线能力

找不到唯一官方来源时，保持 `planned`，不得把搜索结果中的同名项目当作本适配器目标。

## 2. 证据矩阵

每一行都必须有可复核的证据，不能只写“看起来支持”。

| 领域 | 必须回答的问题 | 最低证据 | 不通过时 |
|---|---|---|---|
| 原生格式 | 文件扩展名、容器格式、是否加密、是否可版本控制 | 官方文档 + 一个真实文件 | `nativeFormat` 保持 `TBD` |
| 访问方式 | 是否有 CLI / API / MCP / SDK；是否需要 GUI | 官方命令/接口文档 + 实际调用记录 | 不写命令 |
| 认证 | 账号、Token、OAuth、离线登录；凭据如何保存 | 官方说明 + 不含真实密钥的调用示例 | 不执行需要凭据的操作 |
| 创建 | 从零创建页面/画布的最小步骤 | 新文件 + 结构说明 | `create=false` |
| 读取 | 读取页面树、节点、样式、交互 | 读取输出样例 | `read=false` |
| 修改 | 改文案、颜色、布局、交互并另存 | 修改前后文件 + 差异说明 | `edit=false` |
| 组件 | 组件库、母版、实例、令牌的映射方式 | 组件样例 + 映射表 | 不声称支持组件复用 |
| 预览 | 是否有原生预览；是否需要发布/导出 | 预览截图或 URL + 页面名 | `preview` 不通过 |
| 往返 | 在原生工具中修改并保存后能否再次读取 | 保存/重开记录 | `gui-roundtrip` 不通过 |
| 导出 | 能否导出 HTML/图片/代码；限制是什么 | 实际导出文件 + 限制说明 | 不承诺 HTML |
| 平台/许可 | 支持的系统、许可证、分发限制 | 官方页面 + 版本 | 标注限制 |
| 稳定性 | 是否有已知破坏性变更、锁定版本要求 | 版本记录 | 记录风险 |

## 3. 验收门槛

`status=ready` 至少同时满足：

1. 有唯一官方来源与明确版本。
2. 完成一次「创建 → 读取 → 修改 → 另存 → 再次读取」闭环。
3. 至少一条页面级预览或原生打开证据；预览与结构校验分开记录。
4. `adapter.json` 的 `nativeFormat`、`requires`、`preflight`、`capabilities`、`acceptance` 与实际能力一致。
5. `SKILL.md` 只写已验证命令；未验证能力明确标为不支持。
6. `test-prompts.json` 覆盖创建、读取、修改、失败回退。

只完成文档调研、没有真实文件或调用记录时，`status` 最多保持 `planned` 或 `disabled`，不得改为 `ready`。

## 4. 调研记录模板

```md
### YYYY-MM-DD / 调研人

- 官方来源：
- 版本：
- 平台：
- 执行环境：
- 验证文件：
- 创建：
- 读取：
- 修改：
- 预览/打开：
- 往返：
- 失败项：
- 结论：planned / disabled / ready
```

记录中不得写入真实 Token、Cookie、账号密码或用户私密工程路径。

## 5. 启用后的改动清单

1. 更新 `adapter.json`：`status=ready`、`nativeFormat`、`requires`、`preflight`、`capabilities`、`acceptance`。
2. 更新 `adapters/opendesign/SKILL.md`：命令、流程、验收、回退、边界。
3. 如有脚本，放入 `adapters/opendesign/scripts/`；如有样例，放入 `adapters/opendesign/assets/`。
4. 补 `test-prompts.json`：创建、读取、修改、环境失败、OpenDesign 不可用。
5. 不修改 `requirement-analysis` 的 T8；T8 只决定「原生 / 仅 HTML」，具体工具仍由 `prototype-designer` 询问。
6. 回归 Pen / Axure / Figma / 仅 HTML 四条路径，确认没有静默换工具。
