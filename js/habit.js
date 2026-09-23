/* habits.js — lógica de negocio de hábitos (sin tocar el DOM) */

const Habits = {
  all() {
    return DB.load().habits;
  },

  add(name, frequency, icon) {
    const habit = {
      id: uid(),
      name: name.trim(),
      frequency: frequency || "daily",
      icon: icon || "🎯",
      createdAt: todayISO(),
      completions: {},
    };
    DB.load().habits.push(habit);
    DB.save();
    return habit;
  },

  remove(id) {
    const db = DB.load();
    db.habits = db.habits.filter((h) => h.id !== id);
    DB.save();
  },

  toggleDay(id, dateISO) {
    const habit = DB.load().habits.find((h) => h.id === id);
    if (!habit) return;
    if (habit.completions[dateISO]) {
      delete habit.completions[dateISO];
    } else {
      habit.completions[dateISO] = true;
    }
    DB.save();
  },

  isDoneOn(habit, dateISO) {
    return !!habit.completions[dateISO];
  },

  // Racha actual (días consecutivos hasta hoy, contando hacia atrás)
  currentStreak(habit) {
    let streak = 0;
    let cursor = new Date();
    for (;;) {
      const iso = cursor.toISOString().slice(0, 10);
      if (habit.completions[iso]) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  },

  longestStreakOverall() {
    let max = 0;
    this.all().forEach((h) => {
      const dates = Object.keys(h.completions).sort();
      let run = 0;
      let prev = null;
      dates.forEach((d) => {
        if (prev) {
          const diff = (new Date(d) - new Date(prev)) / 86400000;
          run = diff === 1 ? run + 1 : 1;
        } else {
          run = 1;
        }
        max = Math.max(max, run);
        prev = d;
      });
    });
    return max;
  },

  // Últimos N días como array de fechas ISO, del más antiguo al más reciente
  lastNDays(n) {
    const days = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  },

  // Todas las fechas ISO del mes dado ("YYYY-MM"), para pintar el calendario
  daysInMonth(monthISO) {
    const [y, m] = monthISO.split("-").map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    const days = [];
    for (let d = 1; d <= lastDay; d++) {
      days.push(`${monthISO}-${String(d).padStart(2, "0")}`);
    }
    return days;
  },

  completionsInMonth(habit, monthISO) {
    return Object.keys(habit.completions).filter((d) => d.startsWith(monthISO)).length;
  },
};
