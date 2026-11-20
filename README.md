# EduTrack – Student Management System

A **modern, fully-featured Student Management System** built with pure HTML, CSS, and Vanilla JavaScript. No frameworks, no backend, no build tools required.

---

## 📸 Features

| Feature | Details |
|---|---|
| **Dashboard** | Live summary cards, grade distribution bars, recent students, department breakdown |
| **Add Student** | Fully validated form with real-time grade preview |
| **Edit / Delete** | Inline edit and delete with confirmation modal |
| **Search** | Filter by name or Student ID in real-time |
| **Filters** | Dropdown filters for Department, Grade, and Semester |
| **Sorting** | Click any column header to sort ascending/descending |
| **Pagination** | Configurable rows per page (5 / 10 / 20 / 50) |
| **Auto Grade** | Percentage and grade calculated automatically from marks |
| **Persistence** | All data saved to `localStorage` — survives page refresh |
| **Validation** | Duplicate ID check, email format, number range, required fields |
| **Demo Data** | 12 sample students pre-loaded on first launch |
| **Responsive** | Works on desktop, tablet, and mobile |
| **Dark Theme** | Premium dark UI with glassmorphism and smooth animations |

---

## 🚀 Setup

No installation or build step required.

### Method 1 — Open Directly in Browser
1. Navigate to your project folder (`skill lab/`)
2. Double-click **`index.html`**
3. The app opens in your default browser

### Method 2 — Live Server (VS Code)
1. Install the **Live Server** extension in VS Code
2. Right-click `index.html` → **Open with Live Server**
3. The app auto-reloads on file changes

---

## 📂 File Structure

```
skill lab/
│
├── index.html      ← Application structure & markup
├── style.css       ← All styles (dark theme, animations, responsive)
├── script.js       ← All logic (CRUD, search, sort, localStorage)
└── README.md       ← This file
```

---

## 🎓 Grading Scale

| Grade | Marks | Status |
|-------|-------|--------|
| A+    | 90–100 | Pass |
| A     | 80–89  | Pass |
| B     | 70–79  | Pass |
| C     | 60–69  | Pass |
| D     | 50–59  | Pass |
| F     | 0–49   | Fail |

---

## 📋 Usage Guide

### Adding a Student
1. Click **Add Student** in the sidebar
2. Fill in all required fields (ID, Name, Email, Department, Semester, Marks)
3. The grade and percentage preview updates live as you type marks
4. Click **Save Student** — the record is saved to localStorage immediately

### Editing a Student
1. Go to **All Students**
2. Click the ✏️ pencil icon on any row
3. The form pre-fills with the student's current data
4. Make changes and click **Update Student**

### Deleting a Student
1. Click the 🗑️ trash icon on any row
2. Confirm deletion in the popup modal
3. The record is permanently removed

### Searching & Filtering
- Use the **search bar** to filter by name or Student ID in real time
- Use the **Department**, **Grade**, and **Semester** dropdowns to narrow results
- Click **Clear** to reset all filters at once

### Sorting
- Click any column header (ID, Name, Department, Semester, Marks, %, Grade) to sort
- Click again to reverse the sort order

### Notifications Badge
- The bell icon shows how many students are currently **failing** (marks < 50)

---

## 🛠 Browser Compatibility

| Browser | Supported |
|---------|-----------|
| Chrome 80+ | ✅ |
| Firefox 75+ | ✅ |
| Edge 80+ | ✅ |
| Safari 14+ | ✅ |

---

## 💾 Data Storage

All student records are stored in the browser's **localStorage** under the key `edutrack_students`.

- Data persists across browser sessions and page refreshes
- To reset all data, open the browser's DevTools → Application → Local Storage → delete the `edutrack_students` key
- Alternatively, use the browser's "Clear Site Data" option

---

## ⚠️ Validation Rules

| Field | Rule |
|-------|------|
| Student ID | Required, 2–20 alphanumeric characters, must be unique |
| Full Name | Required, letters and spaces only, min 2 chars |
| Email | Required, valid email format |
| Department | Required, must select from dropdown |
| Semester | Required, must select from dropdown |
| Marks | Required, number between 0 and 100 |

---

## 🎨 Design System

- **Font**: Inter (Google Fonts)
- **Icons**: Remix Icons (CDN)
- **Theme**: Dark mode with deep navy/indigo tones
- **Accent Colors**: Electric blue `#4f8ef7`, Purple `#a78bfa`, Green `#34d399`, Orange `#fb923c`
- **Animations**: Smooth slide-in sections, animated grade bars, toast notifications

---

*Built with ❤️ using HTML, CSS & Vanilla JavaScript — EduTrack v1.0*
