/* app.js — controlador de interfaz. Conecta Habits/Expenses/Budgets/Gamification con el DOM. */

const state = {
  expenseFilter: { mode: "month", month: todayISO().slice(0, 7), day: todayISO(), category: "" },
  calendar: { habitId: null, month: todayISO().slice(0, 7) },
  selectedIcon: "🎯",
};

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initNav();
  initModals();
  initIconPicker();
  initHabitForm();
  initExpenseForm();
  initExpenseFilters();
  initBudgetEditor();
  initCalendarModal();
  initSettings();

  document.getElementById("todayLabel").textContent = new Date().toLocaleDateString("es-CO", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  document.getElementById("filterMonth").value = state.expenseFilter.month;
  document.getElementById("filterDay").value = state.expenseFilter.day;

  renderAll();
});

function renderAll() {
  renderGamification();
  renderMascot();
  renderDashboard();
  renderHabits();
  renderExpenses();
  renderBudgets();
  renderBadges();
}

/* ---------- THEME ---------- */
function initTheme() {
  const toggle = document.getElementById("themeToggle");
  const saved = localStorage.getItem("habitgenius_theme");
  if (saved === "dark") { document.body.classList.add("dark"); toggle.checked = true; }
  toggle.addEventListener("change", () => {
    document.body.classList.toggle("dark", toggle.checked);
    localStorage.setItem("habitgenius_theme", toggle.checked ? "dark" : "light");
  });
}

/* ---------- NAV ---------- */
function initNav() {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("view-" + btn.dataset.view).classList.add("active");
    });
  });
}

/* ---------- MODALS ---------- */
function initModals() {
  document.getElementById("openHabitModal").addEventListener("click", () => openModal("habitModal"));
  document.getElementById("openExpenseModal").addEventListener("click", () => {
    document.getElementById("expenseDate").value = todayISO();
    openModal("expenseModal");
  });
  document.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", () => closeModal(btn.dataset.close));
  });
  document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
    backdrop.addEventListener("click", (e) => { if (e.target === backdrop) closeModal(backdrop.id); });
  });
}
function openModal(id) { document.getElementById(id).classList.add("open"); }
function closeModal(id) { document.getElementById(id).classList.remove("open"); }

/* ---------- ICON PICKER (hábitos) ---------- */
function initIconPicker() {
  const picker = document.getElementById("iconPicker");
  HABIT_ICONS.forEach((icon, i) => {
    const span = document.createElement("span");
    span.className = "icon-option" + (i === 0 ? " selected" : "");
    span.textContent = icon;
    span.addEventListener("click", () => {
      document.querySelectorAll(".icon-option").forEach((o) => o.classList.remove("selected"));
      span.classList.add("selected");
      state.selectedIcon = icon;
      document.getElementById("habitIcon").value = icon;
    });
    picker.appendChild(span);
  });
}

/* ---------- HABITS ---------- */
function initHabitForm() {
  document.getElementById("habitForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("habitName").value;
    const freq = document.getElementById("habitFrequency").value;
    if (!name.trim()) return;
    Habits.add(name, freq, state.selectedIcon);
    e.target.reset();
    state.selectedIcon = HABIT_ICONS[0];
    document.querySelectorAll(".icon-option").forEach((o, i) => o.classList.toggle("selected", i === 0));
    closeModal("habitModal");
    renderAll();
  });
}

function renderHabits() {
  const today = todayISO();
  const container = document.getElementById("habitCards");
  container.innerHTML = "";
  const habits = Habits.all();
  document.getElementById("habitsEmptyMsg").style.display = habits.length ? "none" : "block";

  habits.forEach((habit) => {
    const done = Habits.isDoneOn(habit, today);
    const streak = Habits.currentStreak(habit);
    const card = document.createElement("div");
    card.className = "habit-card";
    card.innerHTML = `
      <div class="habit-card-top">
        <span class="habit-icon">${habit.icon || "🎯"}</span>
        <span class="habit-name">${escapeHTML(habit.name)}</span>
      </div>
      <span class="habit-streak">${streak > 0 ? "🔥 " + streak + " días de racha" : "Sin racha activa"}</span>
      <div class="habit-actions">
        <button class="today-btn ${done ? "done" : ""}" data-action="toggle">${done ? "✔ Hecho hoy" : "Marcar hoy"}</button>
        <button class="btn" data-action="calendar">📅</button>
        <button class="btn danger" data-action="delete">🗑️</button>
      </div>
    `;
    card.querySelector('[data-action="toggle"]').addEventListener("click", () => {
      const wasDone = Habits.isDoneOn(habit, today);
      Habits.toggleDay(habit.id, today);
      if (!wasDone) launchConfetti();
      renderAll();
    });
    card.querySelector('[data-action="calendar"]').addEventListener("click", () => openCalendar(habit.id));
    card.querySelector('[data-action="delete"]').addEventListener("click", () => {
      if (confirm(`¿Eliminar el hábito "${habit.name}"?`)) { Habits.remove(habit.id); renderAll(); }
    });
    container.appendChild(card);
  });
}

/* ---------- CALENDAR MODAL ---------- */
function initCalendarModal() {
  document.getElementById("calPrevMonth").addEventListener("click", () => shiftCalendarMonth(-1));
  document.getElementById("calNextMonth").addEventListener("click", () => shiftCalendarMonth(1));
}

function openCalendar(habitId) {
  state.calendar.habitId = habitId;
  state.calendar.month = todayISO().slice(0, 7);
  renderCalendar();
  openModal("calendarModal");
}

function shiftCalendarMonth(delta) {
  const [y, m] = state.calendar.month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  state.calendar.month = d.toISOString().slice(0, 7);
  renderCalendar();
}

function renderCalendar() {
  const habit = Habits.all().find((h) => h.id === state.calendar.habitId);
  if (!habit) return;
  const month = state.calendar.month;
  const [y, m] = month.split("-").map(Number);
  const firstWeekday = new Date(y, m - 1, 1).getDay();
  const monthName = new Date(y, m - 1, 1).toLocaleDateString("es-CO", { month: "long", year: "numeric" });

  document.getElementById("calendarTitle").textContent = `${habit.icon} ${habit.name} · ${monthName}`;

  const grid = document.getElementById("calendarGrid");
  grid.innerHTML = "";
  for (let i = 0; i < firstWeekday; i++) {
    const empty = document.createElement("span");
    empty.className = "cal-day empty";
    grid.appendChild(empty);
  }
  const today = todayISO();
  Habits.daysInMonth(month).forEach((iso) => {
    const cell = document.createElement("span");
    const isFuture = iso > today;
    cell.className = "cal-day" + (Habits.isDoneOn(habit, iso) ? " done" : "") + (isFuture ? " future" : "");
    cell.textContent = Number(iso.slice(8));
    if (!isFuture) {
      cell.addEventListener("click", () => {
        const wasDone = Habits.isDoneOn(habit, iso);
        Habits.toggleDay(habit.id, iso);
        if (!wasDone) launchConfetti();
        renderCalendar();
        renderAll();
      });
    }
    grid.appendChild(cell);
  });
}

/* ---------- EXPENSES ---------- */
function initExpenseForm() {
  document.getElementById("expenseForm").addEventListener("submit", (e) => {
    e.preventDefault();
    Expenses.add({
      desc: document.getElementById("expenseDesc").value,
      amount: document.getElementById("expenseAmount").value,
      category: document.getElementById("expenseCategory").value,
      date: document.getElementById("expenseDate").value,
    });
    e.target.reset();
    closeModal("expenseModal");
    renderAll();
  });
}

function initExpenseFilters() {
  const modeSel = document.getElementById("filterMode");
  const monthInput = document.getElementById("filterMonth");
  const dayInput = document.getElementById("filterDay");
  const catSel = document.getElementById("filterCategory");

  modeSel.addEventListener("change", () => {
    state.expenseFilter.mode = modeSel.value;
    document.getElementById("filterMonthGroup").style.display = modeSel.value === "month" ? "flex" : "none";
    document.getElementById("filterDayGroup").style.display = modeSel.value === "day" ? "flex" : "none";
    renderExpenses();
  });
  monthInput.addEventListener("change", () => { state.expenseFilter.month = monthInput.value; renderExpenses(); });
  dayInput.addEventListener("change", () => { state.expenseFilter.day = dayInput.value; renderExpenses(); });
  catSel.addEventListener("change", () => { state.expenseFilter.category = catSel.value; renderExpenses(); });
}

function renderExpenses() {
  const cats = Expenses.categories();
  const filterCatSel = document.getElementById("filterCategory");
  const currentVal = state.expenseFilter.category;
  filterCatSel.innerHTML = '<option value="">Todas</option>' + cats.map((c) => `<option value="${c}">${c}</option>`).join("");
  filterCatSel.value = currentVal;
  document.getElementById("categoryList").innerHTML = cats.map((c) => `<option value="${c}">`).join("");

  const list = Expenses.filtered(state.expenseFilter);
  const tbody = document.getElementById("expenseTableBody");
  tbody.innerHTML = "";
  document.getElementById("expensesEmptyMsg").style.display = list.length ? "none" : "block";

  list.forEach((exp) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${exp.date}</td>
      <td>${iconForCategory(exp.category)} ${escapeHTML(exp.desc)}</td>
      <td>${escapeHTML(exp.category)}</td>
      <td>${formatCurrency(exp.amount)}</td>
      <td></td>
    `;
    const delBtn = document.createElement("button");
    delBtn.className = "btn danger";
    delBtn.textContent = "Eliminar";
    delBtn.addEventListener("click", () => { Expenses.remove(exp.id); renderAll(); });
    tr.lastElementChild.appendChild(delBtn);
    tbody.appendChild(tr);
  });

  document.getElementById("filterTotal").textContent = formatCurrency(Expenses.total(list));
}

/* ---------- BUDGETS ---------- */
function initBudgetEditor() {
  document.getElementById("addBudgetBtn").addEventListener("click", () => {
    const cat = document.getElementById("budgetCategory").value.trim();
    const amount = document.getElementById("budgetAmount").value;
    if (!cat || !amount) return;
    Budgets.set(cat, amount);
    document.getElementById("budgetCategory").value = "";
    document.getElementById("budgetAmount").value = "";
    renderAll();
  });
}

function budgetRowHTML(status) {
  const cls = status.over ? "over" : status.pct >= 80 ? "warn" : "";
  return `
    <div class="budget-row ${cls}">
      <span class="budget-icon">${iconForCategory(status.category)}</span>
      <span class="budget-name">${escapeHTML(status.category)}</span>
      <span class="bar-track"><span class="bar-fill" style="width:${status.pct}%"></span></span>
      <span class="budget-amounts">${formatCurrency(status.spent)} / ${formatCurrency(status.limit)}</span>
    </div>
  `;
}

function renderBudgets() {
  const month = state.expenseFilter.month || todayISO().slice(0, 7);
  const statuses = Budgets.statusForMonth(month);

  const editor = document.getElementById("budgetEditor");
  editor.innerHTML = statuses.length
    ? statuses.map(budgetRowHTML).join("")
    : '<p class="empty-msg">Aún no has definido presupuestos.</p>';

  const summaryCard = document.getElementById("budgetSummaryCard");
  const currentMonth = todayISO().slice(0, 7);
  const currentStatuses = Budgets.statusForMonth(currentMonth);
  if (currentStatuses.length) {
    summaryCard.style.display = "block";
    document.getElementById("budgetSummary").innerHTML = currentStatuses.map(budgetRowHTML).join("");
  } else {
    summaryCard.style.display = "none";
  }
}

/* ---------- GAMIFICATION: nivel, puntos, mascota, insignias ---------- */
function renderGamification() {
  document.getElementById("levelBadge").textContent = "Nv. " + Gamification.level();
  document.getElementById("pointsLabel").textContent = Gamification.points() + " pts";
  document.getElementById("levelBarFill").style.width = Gamification.progressToNextLevel().pct + "%";
}

function renderMascot() {
  const msg = Gamification.mascotMessage(todayISO());
  document.getElementById("mascotEmoji").textContent = msg.emoji;
  document.getElementById("mascotText").textContent = msg.text;
}

function renderBadges() {
  const grid = document.getElementById("badgesGrid");
  grid.innerHTML = "";
  const earnedIds = new Set(Gamification.earnedBadges().map((b) => b.id));
  Gamification.BADGES.forEach((badge) => {
    const earned = earnedIds.has(badge.id);
    const div = document.createElement("div");
    div.className = "badge-card" + (earned ? " earned" : "");
    div.innerHTML = `
      <span class="badge-icon">${badge.icon}</span>
      <div class="badge-name">${badge.name}</div>
      <div class="badge-desc">${badge.desc}</div>
    `;
    grid.appendChild(div);
  });
}

/* ---------- DASHBOARD ---------- */
function renderDashboard() {
  const today = todayISO();
  const month = today.slice(0, 7);

  document.getElementById("statToday").textContent = formatCurrency(Expenses.totalForDay(today));
  document.getElementById("statMonth").textContent = formatCurrency(Expenses.totalForMonth(month));
  document.getElementById("statHabits").textContent = Habits.all().length;
  document.getElementById("statStreak").textContent = Habits.longestStreakOverall() + " 🔥";

  const byCategory = Expenses.byCategoryForMonth(month);
  const chart = document.getElementById("categoryChart");
  chart.innerHTML = "";
  const max = byCategory.length ? byCategory[0][1] : 0;
  if (!byCategory.length) {
    chart.innerHTML = '<p class="empty-msg">Sin gastos este mes todavía.</p>';
  } else {
    byCategory.forEach(([cat, amount]) => {
      const row = document.createElement("div");
      row.className = "bar-row";
      row.innerHTML = `
        <span class="bar-label">${iconForCategory(cat)} ${escapeHTML(cat)}</span>
        <span class="bar-track"><span class="bar-fill" style="width:${(amount / max) * 100}%"></span></span>
        <span class="bar-amount">${formatCurrency(amount)}</span>
      `;
      chart.appendChild(row);
    });
  }

  const habitList = document.getElementById("dashboardHabitList");
  habitList.innerHTML = "";
  const habits = Habits.all();
  if (!habits.length) {
    habitList.innerHTML = '<li class="empty-msg" style="justify-content:center">Aún no tienes hábitos.</li>';
  } else {
    habits.forEach((h) => {
      const li = document.createElement("li");
      const done = Habits.isDoneOn(h, today);
      li.innerHTML = `<span>${h.icon || "🎯"} ${escapeHTML(h.name)}</span>`;
      const btn = document.createElement("button");
      btn.className = "btn" + (done ? " primary" : "");
      btn.textContent = done ? "✔ Hecho" : "Marcar";
      btn.addEventListener("click", () => {
        const wasDone = Habits.isDoneOn(h, today);
        Habits.toggleDay(h.id, today);
        if (!wasDone) launchConfetti();
        renderAll();
      });
      li.appendChild(btn);
      habitList.appendChild(li);
    });
  }
}

/* ---------- CONFETTI ---------- */
function launchConfetti() {
  const layer = document.getElementById("confettiLayer");
  const colors = ["#6c5ce7", "#00c2a8", "#fd79a8", "#fdcb6e", "#00b894"];
  for (let i = 0; i < 24; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = Math.random() * 100 + "vw";
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = Math.random() * 0.3 + "s";
    layer.appendChild(piece);
    setTimeout(() => piece.remove(), 1800);
  }
}

/* ---------- SETTINGS: export / import / reset ---------- */
function initSettings() {
  document.getElementById("exportBtn").addEventListener("click", () => {
    const blob = new Blob([DB.exportJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `habitgenius-backup-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("importInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try { DB.importJSON(reader.result); renderAll(); alert("Datos importados correctamente."); }
      catch (err) { alert("El archivo no tiene un formato válido."); }
    };
    reader.readAsText(file);
    e.target.value = "";
  });

  document.getElementById("resetBtn").addEventListener("click", () => {
    if (confirm("Esto borrará todos tus hábitos y gastos guardados. ¿Continuar?")) {
      DB.resetAll();
      renderAll();
    }
  });
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
