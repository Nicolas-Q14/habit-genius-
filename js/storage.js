/* storage.js
   Capa única de persistencia. Todo el estado de la app vive en localStorage
   bajo una sola clave, como un objeto JSON:
   {
     habits:   [{ id, name, frequency, createdAt, completions: { "YYYY-MM-DD": true } }],
     expenses: [{ id, desc, amount, category, date }]
   }
*/

const STORAGE_KEY = "habitgenius_data_v1";

const DB = {
  _cache: null,

  load() {
    if (this._cache) return this._cache;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this._cache = raw ? JSON.parse(raw) : { habits: [], expenses: [] };
    } catch (e) {
      console.error("Error leyendo datos, iniciando vacío:", e);
      this._cache = { habits: [], expenses: [] };
    }
    if (!this._cache.habits) this._cache.habits = [];
    if (!this._cache.expenses) this._cache.expenses = [];
    return this._cache;
  },

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._cache));
  },

  exportJSON() {
    return JSON.stringify(this.load(), null, 2);
  },

  importJSON(jsonString) {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== "object") throw new Error("Formato inválido");
    this._cache = {
      habits: Array.isArray(parsed.habits) ? parsed.habits : [],
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
    };
    this.save();
  },

  resetAll() {
    this._cache = { habits: [], expenses: [] };
    this.save();
  },
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function formatCurrency(n) {
  return "$" + Number(n || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 });
}
