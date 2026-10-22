(function () {
  "use strict";

  var STORE_KEY = "glowlist-demo-v1";
  var PRIO_LABEL = { high: "高", medium: "中", low: "低" };
  var state = { tasks: [], archive: [], filter: "all" };
  var confirmAction = null;
  var lastFocus = null;
  var toastTimer = null;

  function seed() {
    return {
      tasks: [
        { id: "t1", title: "整理本周读书笔记", tag: "阅读", priority: "high", done: false, time: "09:30", completedAt: null },
        { id: "t2", title: "回复设计评审邮件", tag: "工作", priority: "medium", done: true, time: "08:40", completedAt: "2026-10-22T08:52:00" },
        { id: "t3", title: "散步 20 分钟", tag: "健康", priority: "medium", done: true, time: "08:10", completedAt: "2026-10-22T08:31:00" },
        { id: "t4", title: "给下周的三个目标排优先级", tag: "工作", priority: "high", done: false, time: "10:30", completedAt: null },
        { id: "t5", title: "预约牙医复诊", tag: "生活", priority: "low", done: false, time: "14:00", completedAt: null },
        { id: "t6", title: "读完《设计中的设计》第三章", tag: "阅读", priority: "medium", done: true, time: "07:30", completedAt: "2026-10-22T07:48:00" }
      ],
      archive: [
        { id: "a1", title: "提交第 42 周周报", tag: "工作", priority: "medium", completedAt: "2026-10-21T18:20:00" },
        { id: "a2", title: "清理收件箱到零", tag: "工作", priority: "low", completedAt: "2026-10-21T17:05:00" },
        { id: "a3", title: "买一袋浅烘咖啡豆", tag: "生活", priority: "low", completedAt: "2026-10-20T16:40:00" },
        { id: "a4", title: "跑步 5 公里", tag: "健康", priority: "medium", completedAt: "2026-10-20T07:20:00" }
      ]
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return seed();
      var parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.tasks) || !Array.isArray(parsed.archive)) return seed();
      return parsed;
    } catch (error) {
      return seed();
    }
  }

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ tasks: state.tasks, archive: state.archive }));
    } catch (error) {}
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function todayISO() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function formatArchiveDate(iso) {
    var d = new Date(iso + "T12:00:00");
    if (isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "short" }).format(d);
  }

  function formatTime(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }

  function taskRow(task) {
    var prioClass = "prio-" + task.priority;
    return '<li class="task' + (task.done ? " is-done" : "") + '" data-id="' + esc(task.id) + '">' +
      '<button class="task-check" type="button" aria-label="' + (task.done ? "标记未完成" : "标记完成") + '" aria-pressed="' + (task.done ? "true" : "false") + '" data-context=\'{"trigger":"click","action":"toggle","description":"切换任务完成状态"}\'>' +
        '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5 6.4 12 13 4.5"/></svg>' +
      '</button>' +
      '<button class="task-main" type="button" data-context=\'{"trigger":"click","action":"open","target":"任务详情"}\'>' +
        '<span class="task-title">' + esc(task.title) + '</span>' +
        '<span class="task-meta"><span class="tag">' + esc(task.tag) + '</span><span class="task-time">' + esc(task.time) + '</span></span>' +
      '</button>' +
      '<span class="prio ' + prioClass + '">' + esc(PRIO_LABEL[task.priority] || "中") + '</span>' +
      '<button class="icon-btn task-del" type="button" aria-label="删除任务" data-context=\'{"trigger":"click","action":"delete","confirm":"确认删除这条任务？"}\'>' +
        '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 4h10M6 4V2.8h4V4m-6 0 .7 9h6.6l.7-9"/></svg>' +
      '</button>' +
    '</li>';
  }

  function renderToday() {
    var list = $("#taskList");
    if (!list) return;
    var total = state.tasks.length;
    var done = state.tasks.filter(function (t) { return t.done; }).length;
    var visible = state.tasks.filter(function (t) {
      if (state.filter === "open") return !t.done;
      if (state.filter === "done") return t.done;
      return true;
    });

    list.innerHTML = visible.map(taskRow).join("");
    list.hidden = visible.length === 0;
    var empty = $("#todayEmpty");
    if (empty) {
      empty.hidden = visible.length !== 0;
      var h3 = empty.querySelector("h3");
      var p = empty.querySelector("p");
      if (h3) h3.textContent = state.filter === "done" ? "还没有完成的任务" : state.filter === "open" ? "今天已经清空了" : "这里还没有任务";
      if (p) p.textContent = state.filter === "done" ? "完成一件后，它会出现在这里。" : state.filter === "open" ? "所有任务都完成了，去归档看看做过什么。" : "把今天最想完成的一件事写下来，先从一件开始。";
    }

    var visibleCount = $("#visibleCount");
    if (visibleCount) visibleCount.textContent = String(visible.length);
    var totalEl = $("#todayTotal");
    if (totalEl) totalEl.textContent = String(total);
    var doneEl = $("#todayDone");
    if (doneEl) doneEl.textContent = String(done);
    var leftEl = $("#todayLeft");
    if (leftEl) leftEl.textContent = String(total - done);
    var statDone = $("#statDone");
    if (statDone) statDone.textContent = String(done);

    $$(".filter").forEach(function (button) {
      button.setAttribute("aria-pressed", button.getAttribute("data-filter") === state.filter ? "true" : "false");
    });
  }

  function renderArchive() {
    var host = $("#archiveList");
    if (!host) return;
    var groups = {};
    state.archive.forEach(function (task) {
      var day = (task.completedAt || "").slice(0, 10) || "unknown";
      (groups[day] = groups[day] || []).push(task);
    });
    var days = Object.keys(groups).sort(function (a, b) { return b.localeCompare(a); });
    host.innerHTML = days.map(function (day) {
      var rows = groups[day].sort(function (a, b) { return (b.completedAt || "").localeCompare(a.completedAt || ""); }).map(function (task) {
        return '<div class="archive-row" data-id="' + esc(task.id) + '">' +
          '<span class="archive-title">' + esc(task.title) + '</span>' +
          '<span class="archive-meta"><span class="tag">' + esc(task.tag) + '</span><span>' + esc(formatTime(task.completedAt)) + '</span></span>' +
          '<button class="restore" type="button" data-restore="' + esc(task.id) + '" data-context=\'{"trigger":"click","action":"restore","target":"今日清单"}\'>恢复到今日</button>' +
        '</div>';
      }).join("");
      return '<div class="archive-group"><div class="archive-date">' + esc(formatArchiveDate(day)) + '</div>' + rows + '</div>';
    }).join("");
    var empty = $("#archiveEmpty");
    if (empty) empty.hidden = state.archive.length !== 0;
  }

  function render() {
    renderToday();
    renderArchive();
  }

  function showToast(message, kind) {
    var toast = $("#toast");
    var msg = $("#toastMsg");
    if (!toast || !msg) return;
    msg.textContent = message;
    toast.classList.toggle("is-bad", kind === "bad");
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.hidden = true; }, 2400);
  }

  function openModal(modal) {
    if (!modal) return;
    lastFocus = document.activeElement;
    modal.hidden = false;
    var focusable = modal.querySelector("input, select, textarea, button");
    if (focusable) setTimeout(function () { focusable.focus(); }, 30);
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.hidden = true;
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    lastFocus = null;
  }

  function closeAll() {
    $$(".modal-backdrop").forEach(function (modal) { modal.hidden = true; });
    closeDrawer();
  }

  function openTaskModal() {
    var modal = $("#taskModal");
    var input = $("#taskTitle");
    if (input) input.value = "";
    openModal(modal);
  }

  function openConfirm(options) {
    var modal = $("#confirmModal");
    if (!modal) return;
    $("#confirmTitle").textContent = options.title || "请确认";
    $("#confirmBody").textContent = options.body || "";
    var button = $("#confirmDelete");
    if (button) {
      button.textContent = options.label || "确认";
      button.className = "btn " + (options.danger === false ? "btn-primary" : "btn-danger");
    }
    confirmAction = options.onConfirm || null;
    openModal(modal);
  }

  function openDrawer(task) {
    var drawer = $("#taskDrawer");
    var backdrop = $("#drawerBackdrop");
    if (!drawer || !task) return;
    lastFocus = document.activeElement;
    $("#drawerTitle").textContent = task.title;
    $("#drawerMeta").innerHTML = '<span class="tag">' + esc(task.tag) + '</span><span class="prio prio-' + esc(task.priority) + '">' + esc(PRIO_LABEL[task.priority] || "中") + '</span><span class="task-time">' + esc(task.time || "已完成") + '</span>';
    drawer.hidden = false;
    drawer.setAttribute("aria-hidden", "false");
    if (backdrop) backdrop.hidden = false;
    var close = drawer.querySelector("[data-close-drawer]");
    if (close) setTimeout(function () { close.focus(); }, 30);
  }

  function closeDrawer() {
    var drawer = $("#taskDrawer");
    var backdrop = $("#drawerBackdrop");
    if (drawer) {
      drawer.hidden = true;
      drawer.setAttribute("aria-hidden", "true");
    }
    if (backdrop) backdrop.hidden = true;
  }

  function addTask(title, tag, priority) {
    var now = new Date();
    state.tasks.unshift({
      id: "t" + Date.now(),
      title: title,
      tag: tag || "生活",
      priority: priority || "medium",
      done: false,
      time: String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0"),
      completedAt: null
    });
    save();
    render();
  }

  function toggleTask(id) {
    var task = state.tasks.filter(function (t) { return t.id === id; })[0];
    if (!task) return;
    task.done = !task.done;
    task.completedAt = task.done ? new Date().toISOString() : null;
    save();
    render();
    showToast(task.done ? "完成一件，留下一道光。" : "已恢复到进行中");
  }

  function deleteTask(id) {
    state.tasks = state.tasks.filter(function (t) { return t.id !== id; });
    save();
    render();
    showToast("任务已删除");
  }

  function restoreTask(id) {
    var index = -1;
    state.archive.forEach(function (task, i) { if (task.id === id) index = i; });
    if (index < 0) return;
    var task = state.archive.splice(index, 1)[0];
    var now = new Date();
    state.tasks.unshift({
      id: task.id,
      title: task.title,
      tag: task.tag,
      priority: task.priority,
      done: false,
      time: String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0"),
      completedAt: null
    });
    save();
    render();
    showToast("已放回今日清单");
  }

  function resetDemo() {
    openConfirm({
      title: "恢复演示数据？",
      body: "当前的新建、勾选与删除会被清空，回到初始的 6 件任务和 4 条归档。",
      label: "恢复",
      danger: false,
      onConfirm: function () {
        var data = seed();
        state.tasks = data.tasks;
        state.archive = data.archive;
        state.filter = "all";
        save();
        render();
        closeAll();
        showToast("演示数据已恢复");
      }
    });
  }

  function bind() {
    var form = $("#loginForm");
    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var email = $("#loginEmail").value.trim();
        var password = $("#loginPassword").value;
        var error = $("#loginError");
        var submit = $("#loginSubmit");
        if (!email || email.indexOf("@") < 1) {
          error.textContent = "请输入有效的邮箱地址。";
          error.classList.add("is-open");
          $("#loginEmail").focus();
          return;
        }
        if (password.length < 6) {
          error.textContent = "密码至少 6 位。演示密码是 glowlist2026。";
          error.classList.add("is-open");
          $("#loginPassword").focus();
          return;
        }
        error.textContent = "";
        error.classList.remove("is-open");
        submit.disabled = true;
        var original = submit.textContent;
        submit.textContent = "正在进入…";
        setTimeout(function () {
          submit.disabled = false;
          submit.textContent = original;
          if (window.PD && window.PD.showPage) window.PD.showPage("今日清单");
          showToast("欢迎回来，今天也从一件开始。");
        }, 700);
      });
    }

    var demo = $("#demoLogin");
    if (demo) {
      demo.addEventListener("click", function () {
        $("#loginEmail").value = "demo@glowlist.app";
        $("#loginPassword").value = "glowlist2026";
        var error = $("#loginError");
        if (error) { error.textContent = ""; error.classList.remove("is-open"); }
        showToast("已填入演示账号");
      });
    }

    var quiet = $(".quiet-link");
    if (quiet) {
      quiet.addEventListener("click", function (event) {
        event.preventDefault();
        showToast("演示环境不提供找回密码");
      });
    }

    var create = $("#createTaskBtn");
    if (create) create.addEventListener("click", openTaskModal);
    $$("[data-open-task]").forEach(function (button) { button.addEventListener("click", openTaskModal); });

    var taskForm = $("#taskForm");
    if (taskForm) {
      taskForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var title = $("#taskTitle").value.trim();
        if (!title) {
          $("#taskTitle").focus();
          showToast("先给这件事起个名字", "bad");
          return;
        }
        addTask(title, $("#taskTag").value, $("#taskPriority").value);
        closeModal($("#taskModal"));
        showToast("已加入今日清单");
      });
    }

    $$("[data-close-modal]").forEach(function (button) {
      button.addEventListener("click", function () {
        var modal = button.closest(".modal-backdrop");
        closeModal(modal);
        confirmAction = null;
      });
    });

    $$(".modal-backdrop").forEach(function (backdrop) {
      backdrop.addEventListener("click", function (event) {
        if (event.target === backdrop) {
          closeModal(backdrop);
          confirmAction = null;
        }
      });
    });

    var confirmButton = $("#confirmDelete");
    if (confirmButton) {
      confirmButton.addEventListener("click", function () {
        var action = confirmAction;
        confirmAction = null;
        closeModal($("#confirmModal"));
        if (action) action();
      });
    }

    var list = $("#taskList");
    if (list) {
      list.addEventListener("click", function (event) {
        var row = event.target.closest(".task");
        if (!row) return;
        var id = row.getAttribute("data-id");
        if (event.target.closest(".task-check")) {
          toggleTask(id);
          return;
        }
        if (event.target.closest(".task-del")) {
          openConfirm({
            title: "删除这条任务？",
            body: "删除后不会出现在归档里。这个动作只影响本地演示数据。",
            label: "删除",
            danger: true,
            onConfirm: function () { deleteTask(id); }
          });
          return;
        }
        var task = state.tasks.filter(function (t) { return t.id === id; })[0];
        if (task && event.target.closest(".task-main")) openDrawer(task);
      });
    }

    $$(".filter").forEach(function (button) {
      button.addEventListener("click", function () {
        state.filter = button.getAttribute("data-filter");
        renderToday();
      });
    });

    var archive = $("#archiveList");
    if (archive) {
      archive.addEventListener("click", function (event) {
        var button = event.target.closest("[data-restore]");
        if (button) restoreTask(button.getAttribute("data-restore"));
      });
    }

    $$("[data-goto]").forEach(function (button) {
      button.addEventListener("click", function () {
        if (window.PD && window.PD.showPage) window.PD.showPage(button.getAttribute("data-goto"));
      });
    });

    var reset = $("#resetDemo");
    if (reset) reset.addEventListener("click", resetDemo);

    var drawerBackdrop = $("#drawerBackdrop");
    if (drawerBackdrop) drawerBackdrop.addEventListener("click", closeDrawer);
    $$("[data-close-drawer]").forEach(function (button) { button.addEventListener("click", closeDrawer); });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      var openConfirmModal = $("#confirmModal");
      if (openConfirmModal && !openConfirmModal.hidden) { closeModal(openConfirmModal); confirmAction = null; return; }
      var openTask = $("#taskModal");
      if (openTask && !openTask.hidden) { closeModal(openTask); return; }
      closeDrawer();
    });
  }

  function init() {
    var saved = load();
    state.tasks = saved.tasks;
    state.archive = saved.archive;
    bind();
    render();
    var initial = document.body.getAttribute("data-initial-page") || "登录";
    if (window.PD && window.PD.showPage) window.PD.showPage(initial);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
