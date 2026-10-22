#!/usr/bin/env node
import { existsSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const required = [
  'bin/axure.mjs',
  'bin/mcp.mjs',
  'scripts/proto.mjs',
  'scripts/trace.mjs',
  'references/capabilities.md'
];

const candidates = [
  process.env.ZEE_RP_HOME,
  resolve(process.cwd(), 'zee-rp'),
  resolve(process.cwd(), '..', 'zee-rp'),
  join(homedir(), 'zee-rp'),
  join(homedir(), 'Documents', 'zee-rp')
].filter(Boolean);

const found = candidates.find(path => existsSync(join(path, 'package.json')) && existsSync(join(path, 'bin', 'axure.mjs')));

const lines = [];
let failed = false;

function ok(message) { lines.push(`[ok]   ${message}`); }
function warn(message) { lines.push(`[warn] ${message}`); }
function fail(message) { failed = true; lines.push(`[fail] ${message}`); }

let zeeVersion = null;
if (found) {
  ok(`zee-rp: ${found}`);
  try {
    zeeVersion = JSON.parse(readFileSync(join(found, 'package.json'), 'utf8')).version;
    if (zeeVersion) ok(`zee-rp version: ${zeeVersion}`);
  } catch {}
  for (const file of required) {
    const path = join(found, file);
    if (existsSync(path)) ok(`required: ${file}`);
    else fail(`missing: ${path}`);
  }
} else {
  fail('未找到 zee-rp。设置 ZEE_RP_HOME 到仓库绝对路径，例如 export ZEE_RP_HOME=/absolute/path/to/zee-rp');
}

const nodeMajor = Number(process.versions.node.split('.')[0]);
if (nodeMajor >= 18) ok(`Node.js: ${process.version}`);
else fail(`Node.js ${process.version} 低于 18`);

const venvPython = found && join(found, '.venv', 'bin', 'python');
const pythonBin = venvPython && existsSync(venvPython) ? venvPython : 'python3';
const python = spawnSync(pythonBin, ['--version'], { encoding: 'utf8' });
if (python.status === 0) {
  const version = (python.stdout || python.stderr || '').trim();
  const match = version.match(/(\d+)\.(\d+)/);
  if (match && (Number(match[1]) > 3 || (Number(match[1]) === 3 && Number(match[2]) >= 10))) {
    ok(`${version}${venvPython && existsSync(venvPython) ? ' (zee-rp/.venv)' : ''}`);
  } else {
    warn(`${version} 低于 3.10，截图/原生生成可能失败`);
  }
} else {
  warn('未找到 python3。生成原生 .rp 与截图能力需要 Python 3.10+，并激活 zee-rp 的 venv');
}

function rpVersion(path) {
  try {
    const buf = readFileSync(path);
    if (buf.length < 4 || buf[0] !== 0xac || buf[1] !== 0xef) return null;
    return buf.readUInt16LE(2);
  } catch { return null; }
}

const localTemplate9 = found && join(found, 'templates', 'axure-rp9-blank.rp');
const localTemplate11 = found && join(found, 'templates', 'axure-rp11-blank.rp');

const templateRp9 = process.env.AXURE_BLANK_TEMPLATE_RP9 || (localTemplate9 && existsSync(localTemplate9) ? localTemplate9 : null);
if (templateRp9) {
  if (existsSync(templateRp9) && statSync(templateRp9).isFile()) {
    const v = rpVersion(templateRp9);
    if (v === 9) ok(`AXURE_BLANK_TEMPLATE_RP9: ${templateRp9}`);
    else fail(`AXURE_BLANK_TEMPLATE_RP9 是 RP${v ?? '未知'} 文件，目标必须是 RP9: ${templateRp9}`);
    if (!process.env.AXURE_BLANK_TEMPLATE_RP9) lines.push(`[info] 未显式设置，使用 zee-rp/templates 下的本地模板`);
  } else fail(`AXURE_BLANK_TEMPLATE_RP9 指向的文件不存在: ${templateRp9}`);
} else {
  warn('未设置 AXURE_BLANK_TEMPLATE_RP9（RP/1 原生生成需要 RP9 单页空白工程）');
}

const templateRp11 = process.env.AXURE_BLANK_TEMPLATE_RP11 || (localTemplate11 && existsSync(localTemplate11) ? localTemplate11 : null);
if (templateRp11) {
  if (existsSync(templateRp11) && statSync(templateRp11).isFile()) {
    const v = rpVersion(templateRp11);
    if (v === 11) ok(`AXURE_BLANK_TEMPLATE_RP11: ${templateRp11}`);
    else fail(`AXURE_BLANK_TEMPLATE_RP11 是 RP${v ?? '未知'} 文件，目标必须是 RP11: ${templateRp11}`);
    if (!process.env.AXURE_BLANK_TEMPLATE_RP11) lines.push(`[info] 未显式设置，使用 zee-rp/templates 下的本地模板`);
  } else fail(`AXURE_BLANK_TEMPLATE_RP11 指向的文件不存在: ${templateRp11}`);
} else {
  warn('未设置 AXURE_BLANK_TEMPLATE_RP11（原生 RP11 编辑/新建需要 RP11 单页空白工程）');
}

const template = process.env.AXURE_BLANK_TEMPLATE;
if (template) {
  if (existsSync(template) && statSync(template).isFile()) {
    const v = rpVersion(template);
    if (v) ok(`AXURE_BLANK_TEMPLATE: ${template} (RP${v})`);
    else warn(`AXURE_BLANK_TEMPLATE 不是可识别的 .rp: ${template}`);
  } else fail(`AXURE_BLANK_TEMPLATE 指向的文件不存在: ${template}`);
}

if (process.platform === 'darwin') {
  const apps = [
    '/Applications/Axure RP 9.app',
    '/Applications/Axure RP 11.app',
    join(homedir(), 'Applications', 'Axure RP 9.app'),
    join(homedir(), 'Applications', 'Axure RP 11.app')
  ];
  const installed = apps.filter(path => existsSync(path));
  if (installed.length) ok(`Axure: ${installed.join(', ')}`);
  else warn('未在常见路径发现 Axure。生成本身不需要 GUI，但预览与保存/重开验收需要本机 Axure');
  const has9 = installed.some(path => path.includes('Axure RP 9.app'));
  const has11 = installed.some(path => path.includes('Axure RP 11.app'));
  if (has9 && has11) {
    lines.push('[info] 检测到多版本 Axure：RP/1 generate 产出 RP9；Axure 11 验收请复制 .rp 后打开并确认升级；原生 RP11 用 AXURE_BLANK_TEMPLATE_RP11 + --version 11');
    lines.push('[info] 接管 GUI 前先告知用户：用哪个版本、打开哪个副本、会执行哪些点击/输入/保存/关闭动作');
  }
} else {
  warn(`当前平台是 ${process.platform}。zee-rp 的 GUI 证据主要来自 macOS + Axure RP 9/11 样本`);
}

if (found) {
  lines.push('');
  lines.push('MCP 配置片段：');
  lines.push(JSON.stringify({
    mcpServers: {
      'zee-rp': {
        command: 'node',
        args: [join(found, 'bin', 'mcp.mjs')],
        env: {
          AXURE_BLANK_TEMPLATE_RP9: templateRp9 || '/absolute/path/to/own-rp9-blank.rp',
          AXURE_BLANK_TEMPLATE_RP11: templateRp11 || '/absolute/path/to/own-rp11-blank.rp'
        }
      }
    }
  }, null, 2));
}

lines.push('');
lines.push(failed ? '结论：环境未就绪，先修复 [fail] 项。' : '结论：基础环境就绪；仍需在 Axure 中完成预览与保存/重开验收。');
console.log(lines.join('\n'));
process.exitCode = failed ? 1 : 0;
