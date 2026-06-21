<div align="center">

# gym777

**Self-hosted training log for lifters who want to own their data.**

Track workouts, sets, and reps. See progress per exercise. Attach photos to sessions. No cloud lock-in — your data lives in a single SQLite file you can back up, export, or grep.

<!-- Replace with a real screenshot after first deploy -->
<!-- ![Screenshot](docs/screenshot.png) -->

[Demo (coming soon)](#) · [Roadmap](#-roadmap) · [Report a bug](https://github.com/i5anin/personal.app.training-log/issues)

</div>

---

## ⚠️ Status

**Alpha. Built for personal use, made public for feedback.**

Expect rough edges. Breaking changes possible between commits. Not yet recommended for irreplaceable data — but it works, and I lift with it every week.

---

## ✨ Why another training log?

There are plenty of training apps (Strong, Hevy, Jefit, FitNotes). gym777 exists because most of them get one or more of these wrong:

- ❌ Your workout history lives in someone else's SaaS
- ❌ Data export is locked behind a paywall — or absent
- ❌ Adding 100 sets requires 400 taps
- ❌ Custom programs are second-class citizens
- ❌ The UI breaks on slow connections at the gym

gym777 is **self-hostable**, **offline-first**, and **owns nothing it doesn't need to own**. Your data is a SQLite file. You decide where it lives.

---

## 🚀 Features (today)

| | Feature | Notes |
|---|---|---|
| ✅ | **Workouts** — create, edit, list | `WorkoutEditorView`, `WorkoutListView` |
| ✅ | **Exercises catalog** with muscle groups | `CatalogView`, server module `exercises` |
| ✅ | **Per-exercise progress charts** | `ExerciseChartView` |
| ✅ | **Stats view** — aggregate metrics | `StatsView` |
| ✅ | **Photo attachments** to workouts | `PhotoAttach` + server `photos` module |
| ✅ | **Muscle group anatomy diagrams** | `MuscleGroupPhotos` |
| ✅ | **Offline-first** via IndexedDB cache | `idb` library, `client/src/db/` |
| ✅ | **Single-file SQLite database** | `data/gym.db`, portable, greppable |
| 🟡 | **Auth** — single-user, no login | Multi-user planned, see Roadmap |
| 🟡 | **Mobile UI** — works, not polished | PWA install planned |

Legend: ✅ ready · 🟡 partial / known limitations · 🔲 planned

---

## 🧱 Tech stack

| Layer | Stack |
|---|---|
| **Frontend** | Vue 3.5 · Vite 8 · TypeScript · Pinia 3 · Vue Router 5 · Tailwind CSS 4 · shadcn-vue (Reka UI) · Lucide icons · dayjs · VueUse · idb |
| **Backend** | NestJS 11 · TypeORM 0.3 · better-sqlite3 12 · Fastify (via shared deps) |
| **Storage** | SQLite (single file: `data/gym.db`) on server · IndexedDB on client for offline cache |
| **Tooling** | ESLint · Prettier · Jest (server) · vue-tsc · Vite Vue Devtools |

---

## 📁 Project structure

```
gym777/
├── client/              # Vue 3 SPA
│   └── src/
│       ├── views/       # WorkoutEditor, WorkoutList, Stats, Catalog, ExerciseChart
│       ├── components/  # ExerciseEntryCard, SetRowInput, MuscleGroupSelect, ...
│       ├── stores/      # Pinia: workoutStore, catalogStore
│       ├── db/          # IndexedDB schema + seed
│       └── router/      # Hash router, 3 tabs (workouts/stats/catalog)
│
├── server/              # NestJS API
│   └── src/
│       ├── workouts/        # workouts CRUD
│       ├── exercises/       # exercises CRUD
│       ├── exercise-entries/
│       ├── set-rows/
│       ├── muscle-groups/
│       ├── photos/          # photo upload + serve
│       └── seed.service.ts  # initial DB seed
│
├── data/                # SQLite database (gym.db) — gitignored
└── inspect-db.mjs       # quick CLI to introspect DB schema and PRAGMAs
```

---

## 🏁 Quick start

**Requirements:** Node.js 20+ (24 recommended), npm.

```bash
# 1. Clone
git clone https://github.com/i5anin/personal.app.training-log.git gym777
cd gym777

# 2. Install + run server
cd server
npm install
npm run start:dev
# → API on http://localhost:3000

# 3. In a second terminal — install + run client
cd ../client
npm install
npm run dev
# → UI on http://localhost:5173
```

First run creates `data/gym.db` and seeds initial exercises + muscle groups.

### Inspect the database

```bash
node inspect-db.mjs
```

Prints all tables, columns, indexes, and PRAGMA settings.

---

## 🛠 Development

### Run scripts

```bash
# Client
cd client
npm run dev          # Vite dev server
npm run type-check   # vue-tsc
npm run build        # production build

# Server
cd server
npm run start:dev    # NestJS watch mode
npm run lint         # eslint --fix
npm run test         # jest unit tests
npm run test:cov     # coverage
npm run build        # nest build
```

### Recommended editor setup

- VS Code + [Vue (Official) / Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
- Disable Vetur if installed

---

## 🗺 Roadmap

Short-term (next 1–2 releases):

- [ ] **PWA install** — make it work as a real app on phone, install from browser
- [ ] **Program templates** — 5/3/1, PHUL, Push-Pull-Legs, StrongLifts seeded
- [ ] **CSV import** from Strong / Hevy
- [ ] **CSV/JSON export** of full history (data ownership!)
- [ ] **Real app title** in `index.html` (currently still says "Vite App")
- [ ] **Real screenshots** in this README

Mid-term:

- [ ] **Multi-user auth** (magic link or Telegram OAuth — TBD)
- [ ] **Apple Health / Google Fit** sync
- [ ] **English UI** alongside Russian
- [ ] **Mobile PWA polish** — touch targets, gestures
- [ ] **1RM estimation** + plateau detection
- [ ] **Dark mode**

Long-term:

- [ ] **Hosted version** at `app.training-log.com` (working name) with freemium model
- [ ] **API + webhooks** for integrations
- [ ] **Open program library** — community-contributed templates

See the [`Path to Telegram-level`](../my-life/Развитие/Путь%20до%20уровня%20Telegram.md) note (private, vault) for the full strategic context.

---

## 🤝 Contributing

This is a one-developer project right now — but contributions are welcome.

1. Fork
2. Create a feature branch: `git checkout -b feat/your-thing`
3. Commit with conventional messages: `feat(ui): ...`, `fix(server): ...`
4. Open a PR

For bigger changes — open an issue first to discuss direction.

### Reporting bugs

Open an issue with:
- What you did
- What you expected
- What actually happened
- Browser + OS

---

## 👤 Author

Built by [@i5anin](https://github.com/i5anin) — a Vue dev in Russia building things in public.

---

## 📜 License

MIT — see [LICENSE](LICENSE).

You can fork, modify, host, and use this for personal or commercial purposes. No warranty.

---

## 🙏 Acknowledgements

- [shadcn-vue](https://www.shadcn-vue.com/) — UI primitives
- [Reka UI](https://reka-ui.com/) — unstyled component library underneath shadcn-vue
- [Lucide](https://lucide.dev/) — icons
- [NestJS](https://nestjs.com/) — backend framework
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — fast synchronous SQLite

---

<div align="center">

**If gym777 helps you lift, star the repo ⭐ — that's the only metric I care about.**

</div>
