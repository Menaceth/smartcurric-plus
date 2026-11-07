# SmartCurric+

A smart, real-time classroom attendance management system built with **React**, **Firebase**, and **Tailwind CSS**. It supports multiple attendance methods — QR code scanning, face recognition (coming soon), and WiFi proximity (coming soon) — with separate dashboards for students and teachers.

---

## Features

### Student Dashboard
- **QR Code Scanner** — Scan a classroom QR code to mark attendance instantly
- **Daily Routine View** — See your full class schedule with live Present/Absent status
- **Attendance Summary** — Track your overall attendance percentage at a glance
- **AI Suggestions** — Get random study/activity suggestions for free periods

### Teacher Dashboard
- **Live Classroom View** — Real-time attendance grid for all students; manually toggle any student's status
- **Reports** — Attendance summary table with per-student percentages and progress bars; drill down into individual student records
- **Manage Schedule** — Add and delete classes from the shared timetable (stored in Firestore)
- **QR Tools** — Generate a unique QR code for any class, ready to display on a projector

### Authentication
- Email / password sign-up and login via **Firebase Auth**
- Role detection: teacher emails are listed in the config — everyone else is a student

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite (rolldown-vite) |
| Styling | Tailwind CSS 3 |
| Backend / DB | Firebase (Auth + Firestore) |
| QR Scanning | html5-qrcode |
| QR Generation | qrcode.react + api.qrserver.com |

---

## Getting Started

### Prerequisites
- Node.js ≥ 18
- A Firebase project with **Authentication** (Email/Password) and **Firestore** enabled

### 1. Clone the repo

```bash
git clone https://github.com/your-username/smart-class-app.git
cd smart-class-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Firebase

Copy the example env file and fill in your Firebase project credentials:

```bash
cp .env.example .env.local
```

Then edit `.env.local`:

```env
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID
VITE_FIREBASE_MEASUREMENT_ID=YOUR_MEASUREMENT_ID
```

> [!IMPORTANT]
> `.env.local` is listed in `.gitignore` and will never be committed. Only the safe `.env.example` template is tracked by Git.

### 4. Set teacher emails

In [`src/App.jsx`](src/App.jsx), update the `TEACHER_EMAILS` array with the email addresses that should have teacher-level access:

```js
const TEACHER_EMAILS = ['teacher@yourschool.com', 'admin@yourschool.com'];
```

### 5. Run the dev server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the local development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

---

## Firestore Collections

| Collection | Purpose |
|---|---|
| `attendance_dev` | One document per user; stores `name`, `email`, and an `attendance` map keyed by subject |
| `schedule_dev` | One document per schedule entry; stores `subject`, `time`, `room`, and `type` (`"class"`) |

---

## Project Structure

```
smart-class-app/
├── public/
├── src/
│   ├── App.jsx          # Entire application (single-file architecture)
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## Roadmap

- [ ] Face recognition attendance
- [ ] WiFi proximity-based attendance
- [ ] Export attendance reports to CSV / PDF
- [ ] Push notifications for absent students
- [ ] Multi-day / weekly schedule support
- [ ] Dark mode

---

## License

This project is open-source. Feel free to fork and adapt it for your institution.
