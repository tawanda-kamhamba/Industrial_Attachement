# IASMS Frontend (React TypeScript)

Modern React TypeScript frontend for the Industrial Attachment Management System (IASMS), with reusable components, Tailwind CSS, and analytics charts on admin and supervisor dashboards.

## Stack

- **React 18** + **TypeScript**
- **Vite** – build and dev server
- **React Router 6** – routing
- **Tailwind CSS** – styling
- **Recharts** – analytics charts

## Getting started

**Use HTTPS for npm** (required since 2021). The project includes an `.npmrc` that sets the registry to `https://registry.npmjs.org/`. If you previously set the registry to `http://`, fix it with:

```bash
npm config set registry https://registry.npmjs.org/
```

Then install and run:

```bash
cd frontend
npm install
npm run dev
```

If `npm install` fails with "tarball seems to be corrupted" or "ENOENT: Cannot cd into":

1. Close any IDE/terminal using the `frontend` folder.
2. Delete `node_modules` and `package-lock.json` in `frontend`.
3. Clear cache and reinstall:
   ```bash
   npm cache clean --force
   npm install
   ```
   Or run `npm run clean-install` (clears cache then installs; you still need to remove `node_modules` and `package-lock.json` first if the install was half-done).
4. If it still fails, try installing from a different network or temporarily disabling antivirus for the project folder.

### Windows: `TAR_ENTRY_ERROR` or `spawn cmd.exe ENOENT`

These often come from **path length limits** (Windows 260-character default) or antivirus locking files. Try in order:

**Option A – Short path (most reliable)**  
Move (or copy) the whole project to a short folder, then install there:

- Example: `C:\iasms\frontend` or `C:\dev\iasms`
- In PowerShell (run as Administrator if needed):
  ```powershell
  xcopy /E /I C:\xampp\htdocs\iasms\frontend C:\iasms\frontend
  cd C:\iasms\frontend
  Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
  Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
  npm install
  npm run dev
  ```
- Then open `http://localhost:3000`. You can keep developing from `C:\iasms\frontend` and copy built files back to XAMPP if needed.

**Option B – Enable long paths (Windows 10/11)**  
Run PowerShell **as Administrator**:

```powershell
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

Restart the terminal (and optionally the PC), then delete `node_modules` and `package-lock.json` and run `npm install` again from `frontend`.

**Option C – Use pnpm (often works when npm fails)**  
[pnpm](https://pnpm.io/) uses a different layout and often avoids path issues:

```powershell
npm install -g pnpm
cd C:\xampp\htdocs\iasms\frontend
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
pnpm install
pnpm run dev
```

**Option D – Install without scripts, then rebuild**  
If the failure is during a postinstall script (e.g. esbuild), try:

```powershell
npm install --ignore-scripts
npm rebuild
npm run dev
```

Or run: `npm run install:no-scripts`

Open [http://localhost:3000](http://localhost:3000). Use the login pages to enter as Student, Admin, or Institutional Supervisor (mock auth; no backend required for UI).

## Scripts

| Command       | Description              |
|---------------|--------------------------|
| `npm run dev` | Start dev server (port 3000) |
| `npm run build` | Production build       |
| `npm run preview` | Preview production build |

## Project structure

```
src/
├── components/
│   ├── ui/           # Reusable UI (TopBar, Sidebar, StatCard, Card, DataTable, Button)
│   └── charts/      # BarChartCard, LineChartCard, PieChartCard
├── layouts/         # AdminLayout, SupervisorLayout, StudentLayout
├── pages/
│   ├── auth/        # LoginPage, AdminLoginPage, SupervisorLoginPage
│   ├── admin/       # AdminDashboard + all admin pages
│   ├── supervisor/  # SupervisorDashboard, ViewStudentLogbook
│   └── student/     # StudentDashboard, InstructionsPage
├── hooks/           # useAuth
├── services/        # api
├── types/           # Shared TypeScript types
├── App.tsx
├── main.tsx
└── index.css
```

## Connecting to the PHP backend

1. Add PHP API endpoints under e.g. `iasms/api/` that return JSON (e.g. dashboard stats, students list, auth).
2. In `src/services/api.ts`, set `baseUrl` to your API base (or use the existing Vite proxy from `/api` to `http://localhost/iasms/api`).
## Features

- **Admin dashboard**: Stat cards, registrations/submissions line charts, faculty bar chart, region pie chart; sidebar to Registered Students, Orientation, E-Logbooks, Contracts, Reports, Assumptions, Assign Supervisors, Visiting/Company Scores, Change Password.
- **Supervisor dashboard**: Stat cards (assigned students, visits, scoresheets), visit scores bar chart, assigned students table with “View Logbook” link.
- **Student dashboard**: Quick links to Instructions, E-Logbook, Orientation, Contract, Report, Assumption (links to PHP can be wired later).
- **Auth**: In-memory + localStorage; add API login when backend is ready.
