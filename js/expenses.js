/* expenses.js — lógica de negocio de gastos (sin tocar el DOM) */

const Expenses = {
  all() {
    return DB.load().expenses;
  },

  add({ desc, amount, category, date }) {
    const expense = {
      id: uid(),
      desc: desc.trim(),
      amount: Number(amount),
      category: category.trim() || "Otros",
      date: date || todayISO(),
    };
    DB.load().expenses.push(expense);
    DB.save();
    return expense;
  },

  remove(id) {
    const db = DB.load();
    db.expenses = db.expenses.filter((e) => e.id !== id);
    DB.save();
  },

  categories() {
    const set = new Set(this.all().map((e) => e.category));
    return Array.from(set).sort();
  },

  // filter: { mode: 'day'|'month'|'all', day: 'YYYY-MM-DD', month: 'YYYY-MM', category: '' }
  filtered(filter) {
    return this.all().filter((e) => {
      if (filter.category && e.category !== filter.category) return false;
      if (filter.mode === "day" && filter.day) return e.date === filter.day;
      if (filter.mode === "month" && filter.month) return e.date.slice(0, 7) === filter.month;
      return true; // mode 'all'
    }).sort((a, b) => (a.date < b.date ? 1 : -1));
  },

  total(list) {
    return list.reduce((sum, e) => sum + e.amount, 0);
  },

  totalForDay(dateISO) {
    return this.total(this.all().filter((e) => e.date === dateISO));
  },

  totalForMonth(monthISO) {
    return this.total(this.all().filter((e) => e.date.slice(0, 7) === monthISO));
  },

  byCategoryForMonth(monthISO) {
    const map = {};
    this.all()
      .filter((e) => e.date.slice(0, 7) === monthISO)
      .forEach((e) => {
        map[e.category] = (map[e.category] || 0) + e.amount;
      });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  },
};
