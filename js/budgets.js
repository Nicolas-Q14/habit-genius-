/* budgets.js — presupuestos mensuales por categoría, e iconos visuales. */

const CATEGORY_ICONS = {
  comida: "🍔", mercado: "🛒", transporte: "🚌", gasolina: "⛽",
  entretenimiento: "🎮", salud: "💊", educacion: "📚", "educación": "📚",
  arriendo: "🏠", vivienda: "🏠", ropa: "👕", suscripciones: "📺",
  ahorro: "💰", mascotas: "🐾", viajes: "✈️", regalos: "🎁", otros: "🏷️",
};

const HABIT_ICONS = ["💧", "📖", "🏃", "🧘", "🥗", "😴", "✍️", "🎯", "🚭", "🧹"];

function iconForCategory(category) {
  return CATEGORY_ICONS[(category || "").trim().toLowerCase()] || "🏷️";
}

const Budgets = {
  _key: "habitgenius_budgets_v1",

  all() {
    try {
      return JSON.parse(localStorage.getItem(this._key)) || {};
    } catch (e) {
      return {};
    }
  },

  set(category, amount) {
    const data = this.all();
    if (amount > 0) data[category] = Number(amount);
    else delete data[category];
    localStorage.setItem(this._key, JSON.stringify(data));
  },

  limitFor(category) {
    return this.all()[category] || 0;
  },

  // Para cada categoría con presupuesto, calcula gasto/limite del mes dado
  statusForMonth(monthISO) {
    const budgets = this.all();
    const spentByCat = {};
    Expenses.all()
      .filter((e) => e.date.slice(0, 7) === monthISO)
      .forEach((e) => { spentByCat[e.category] = (spentByCat[e.category] || 0) + e.amount; });

    return Object.entries(budgets).map(([category, limit]) => {
      const spent = spentByCat[category] || 0;
      return { category, limit, spent, pct: Math.min(100, (spent / limit) * 100), over: spent > limit };
    });
  },

  // ¿Existe algún mes pasado completo donde ningún presupuesto se haya excedido?
  anyMonthWithinBudget() {
    const budgets = this.all();
    if (!Object.keys(budgets).length) return false;
    const months = new Set(Expenses.all().map((e) => e.date.slice(0, 7)));
    for (const month of months) {
      const statuses = this.statusForMonth(month);
      if (statuses.length && statuses.every((s) => !s.over)) return true;
    }
    return false;
  },
};
