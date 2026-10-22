window.PD_ANNOTATIONS = [
  {
    id: "a2",
    anchor: "tr",
    page: "登录",
    target: "[data-annot='login-aside']",
    dx: -18,
    dy: 10,
    type: "feature",
    title: "品牌叙述",
    body: "左栏只讲三件事：只保留今天、完成有回响、数据留在本机。窄屏时折叠成品牌横条。"
  },
  {
    id: "a1",
    anchor: "tr",
    page: "登录",
    target: "[data-annot='login-submit']",
    dx: 14,
    dy: 10,
    type: "interact",
    title: "登录提交",
    body: "校验邮箱与密码；按钮进入 0.7s loading 后切到今日清单。错误留在表单内，不清空已填内容。"
  },
  {
    id: "a3",
    anchor: "tr",
    page: "登录",
    target: "[data-annot='login-demo']",
    dx: 14,
    dy: 10,
    type: "feature",
    title: "演示账号",
    body: "一键填入 demo@glowlist.app / glowlist2026，但不直接登录，方便评审检查表单默认态。"
  },
  {
    id: "a4",
    anchor: "tr",
    page: "今日清单",
    target: "[data-annot='today-create']",
    dx: 14,
    dy: 10,
    type: "interact",
    title: "新建任务",
    body: "打开模态框；标题必填，标签与优先级可选。提交后插入列表顶部，并 Toast 提示。"
  },
  {
    id: "a6",
    anchor: "inside-tr",
    page: "今日清单",
    target: "[data-annot='today-stats']",
    dx: -18,
    dy: 10,
    type: "field",
    title: "今日概览",
    body: "完成数、专注时长、连续天数来自本地数据。空数据时显示 0，不伪造进度。"
  },
  {
    id: "a5",
    anchor: "tr",
    page: "今日清单",
    target: "[data-annot='today-filter']",
    dx: 14,
    dy: 12,
    type: "interact",
    title: "筛选",
    body: "全部 / 进行中 / 已完成即时过滤；只改变可见列表，不改统计数字。"
  },
  {
    id: "a7",
    anchor: "mr",
    page: "今日清单",
    target: ".task-list .task:first-child",
    dx: 12,
    dy: 0,
    type: "interact",
    title: "任务行",
    body: "勾选完成会更新进度与筛选结果；点击标题打开详情抽屉；删除必须二次确认。"
  },
  {
    id: "a8",
    anchor: "tr",
    page: "归档",
    target: "[data-annot='archive-list']",
    dx: 14,
    dy: 34,
    type: "feature",
    title: "按日归档",
    body: "按完成日期倒序分组，让用户看到“做过什么”，而不是把归档变成第二个待办列表。"
  },
  {
    id: "a9",
    anchor: "ml",
    page: "归档",
    target: ".restore",
    dx: -10,
    dy: 0,
    type: "interact",
    title: "恢复到今日",
    body: "把归档任务移回今日清单，状态回到未完成，归档分组与空状态即时更新。"
  },
  {
    id: "a10",
    anchor: "inside-tr",
    page: "归档",
    target: "#archiveEmpty",
    dx: -24,
    dy: 18,
    type: "warning",
    title: "空状态",
    body: "没有归档时展示空状态与返回入口；不要留一张空表，也不要用空白假装有数据。"
  }
];
