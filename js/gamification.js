/* gamification.js — puntos, niveles, insignias y mensajes de la mascota.
   Todo se CALCULA a partir de los datos reales (hábitos/gastos), no se
   guarda por separado, así nunca se desincroniza. */

const POINTS_PER_COMPLETION = 10;

const Gamification = {
  totalCompletions() {
    return Habits.all().reduce((sum, h) => sum + Object.keys(h.completions).length, 0);
  },

  points() {
    return this.totalCompletions() * POINTS_PER_COMPLETION;
  },

  level() {
    return Math.floor(this.points() / 100) + 1;
  },

  progressToNextLevel() {
    const pts = this.points();
    const inLevel = pts % 100;
    return { current: inLevel, needed: 100, pct: inLevel };
  },

  BADGES: [
    {
      id: "first_step",
      icon: "🌱",
      name: "Primer paso",
      desc: "Completa tu primer hábito",
      check: () => Gamification.totalCompletions() >= 1,
    },
    {
      id: "fire_week",
      icon: "🔥",
      name: "Racha en llamas",
      desc: "Mantén una racha de 7 días en un hábito",
      check: () => Habits.all().some((h) => Habits.currentStreak(h) >= 7),
    },
    {
      id: "epic_streak",
      icon: "🏆",
      name: "Racha épica",
      desc: "Alcanza una racha de 30 días",
      check: () => Habits.longestStreakOverall() >= 30,
    },
    {
      id: "multitask",
      icon: "🧩",
      name: "Multitarea",
      desc: "Ten 3 o más hábitos activos a la vez",
      check: () => Habits.all().length >= 3,
    },
    {
      id: "tracker",
      icon: "🧾",
      name: "Registrador",
      desc: "Registra al menos 10 gastos",
      check: () => Expenses.all().length >= 10,
    },
    {
      id: "saver",
      icon: "💎",
      name: "Ahorrador consciente",
      desc: "Cierra un mes sin pasarte de ningún presupuesto",
      check: () => Budgets.anyMonthWithinBudget(),
    },
    {
      id: "level5",
      icon: "🚀",
      name: "En despegue",
      desc: "Llega al nivel 5",
      check: () => Gamification.level() >= 5,
    },
  ],

  earnedBadges() {
    return this.BADGES.filter((b) => b.check());
  },

  MASCOT_TIPS: [
    "Un hábito pequeño hecho todos los días vale más que uno grande hecho una vez.",
    "Registrar tus gastos hoy te ahorra sorpresas a fin de mes.",
    "Las rachas no se rompen por un mal día, se rompen por dos malos días seguidos.",
    "Revisa tu categoría de gasto más alta: ahí suele estar tu mejor oportunidad de ahorro.",
    "Celebra tus rachas cortas, son la base de las largas.",
    "Un presupuesto no es una prohibición, es un mapa para gastar con intención.",
  ],

  mascotMessage(todayISO) {
    const habits = Habits.all();
    if (!habits.length) {
      return { emoji: "🐼", text: "¡Hola! Soy Genio, tu compañero. Crea tu primer hábito para empezar a ganar puntos." };
    }
    const doneToday = habits.filter((h) => Habits.isDoneOn(h, todayISO)).length;
    const total = habits.length;
    if (doneToday === total) {
      return { emoji: "🎉", text: `¡Increíble! Completaste ${total} de ${total} hábitos hoy. ¡Eres imparable!` };
    }
    if (doneToday === 0) {
      return { emoji: "🐼", text: "Aún no marcas ningún hábito hoy. ¡Vamos, tú puedes con al menos uno!" };
    }
    const tip = this.MASCOT_TIPS[new Date().getDate() % this.MASCOT_TIPS.length];
    return { emoji: "🐼", text: `Vas ${doneToday}/${total} hoy. Tip: ${tip}` };
  },
};
