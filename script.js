/**
 * EduTrack – Student Management System
 * script.js  |  Pure Vanilla JS, no frameworks
 */

'use strict';

/* =========================================================
   CONSTANTS & STATE
   ========================================================= */
const STORAGE_KEY = 'edutrack_students';

/** Gradient palettes for avatars — cycles through */
const AVATAR_PALETTES = [
  ['#4f8ef7','#7c3aed'], ['#34d399','#059669'], ['#fb923c','#ea580c'],
  ['#a78bfa','#ec4899'], ['#fbbf24','#f59e0b'], ['#f87171','#dc2626'],
  ['#38bdf8','#0ea5e9'], ['#4ade80','#16a34a'],
];

let state = {
  students: [],            // master list from localStorage
  filtered: [],            // after search/filter
  sortKey: 'id',
  sortDir: 'asc',
  currentPage: 1,
  perPage: 10,
  deleteTargetIndex: null,
  searchQuery: '',
  filterDept: '',
  filterGrade: '',
  filterSem: '',
};

/* =========================================================
   LOCAL STORAGE HELPERS
   ========================================================= */
function loadStudents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveStudents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.students));
}

/* =========================================================
   GRADE / PERCENTAGE CALCULATION
   ========================================================= */
function calcGrade(marks) {
  const m = Number(marks);
  if (m >= 90) return 'A+';
  if (m >= 80) return 'A';
  if (m >= 70) return 'B';
  if (m >= 60) return 'C';
  if (m >= 50) return 'D';
  return 'F';
}

function calcPercent(marks) {
  return Number(marks).toFixed(1) + '%';
}

function gradeClass(grade) {
  const map = { 'A+': 'grade-aplus', 'A': 'grade-a', 'B': 'grade-b', 'C': 'grade-c', 'D': 'grade-d', 'F': 'grade-f' };
  return map[grade] || '';
}

function isPassing(marks) { return Number(marks) >= 50; }

/* =========================================================
   AVATAR HELPERS
   ========================================================= */
function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function avatarStyle(index) {
  const [a, b] = AVATAR_PALETTES[index % AVATAR_PALETTES.length];
  return `background: linear-gradient(135deg, ${a}, ${b});`;
}

/* =========================================================
   NAVIGATION
   ========================================================= */
const sections = ['dashboard', 'add-student', 'all-students'];
const breadcrumbMap = { 'dashboard': 'Dashboard', 'add-student': 'Add Student', 'all-students': 'All Students' };

function navigateTo(section) {
  sections.forEach(s => {
    document.getElementById(`section-${s}`).classList.toggle('active', s === section);
    document.getElementById(`nav-${s}`)?.classList.toggle('active', s === section);
  });
  document.getElementById('breadcrumbText').textContent = breadcrumbMap[section] || section;

  if (section === 'dashboard') updateDashboard();
  if (section === 'all-students') renderTable();
  if (section === 'add-student') {
    // If not editing, make sure form is reset to "Add" mode
    if (!document.getElementById('editIndex').value) resetFormToAddMode();
  }

  // Close mobile sidebar
  closeMobileSidebar();
}

/* =========================================================
   SIDEBAR TOGGLE
   ========================================================= */
document.getElementById('sidebarToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('collapsed');
});

document.getElementById('mobileToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.add('mobile-open');
  document.getElementById('sidebarOverlay').classList.add('show');
});

document.getElementById('sidebarOverlay').addEventListener('click', closeMobileSidebar);

function closeMobileSidebar() {
  document.getElementById('sidebar').classList.remove('mobile-open');
  document.getElementById('sidebarOverlay').classList.remove('show');
}

/* =========================================================
   NAV LINKS
   ========================================================= */
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    navigateTo(link.dataset.section);
  });
});

document.querySelectorAll('[data-section]').forEach(el => {
  if (!el.classList.contains('nav-link')) {
    el.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(el.dataset.section);
    });
  }
});

document.getElementById('addStudentShortcut').addEventListener('click', () => navigateTo('add-student'));
document.getElementById('emptyAddBtn').addEventListener('click', () => navigateTo('add-student'));

/* =========================================================
   CLOCK
   ========================================================= */
function updateClock() {
  const now = new Date();
  const opts = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
  document.getElementById('topbarTime').textContent = now.toLocaleTimeString('en-US', opts);
}
setInterval(updateClock, 1000);
updateClock();

/* =========================================================
   FORM VALIDATION
   ========================================================= */
const validators = {
  studentId: (v, editIndex) => {
    if (!v.trim()) return 'Student ID is required.';
    if (!/^[A-Za-z0-9_-]{2,20}$/.test(v.trim())) return 'ID must be 2–20 alphanumeric chars.';
    // Duplicate check (skip own record when editing)
    const idx = state.students.findIndex(s => s.id.toLowerCase() === v.trim().toLowerCase());
    if (idx !== -1 && idx !== Number(editIndex)) return 'This Student ID already exists.';
    return '';
  },
  studentName: v => {
    if (!v.trim()) return 'Full name is required.';
    if (v.trim().length < 2) return 'Name must be at least 2 characters.';
    if (!/^[A-Za-z\s'-]+$/.test(v.trim())) return 'Name must contain only letters.';
    return '';
  },
  studentEmail: v => {
    if (!v.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'Enter a valid email address.';
    return '';
  },
  studentDept: v => (!v ? 'Please select a department.' : ''),
  studentSem:  v => (!v ? 'Please select a semester.' : ''),
  studentMarks: v => {
    if (v === '' || v === null || v === undefined) return 'Marks are required.';
    const n = Number(v);
    if (isNaN(n) || n < 0 || n > 100) return 'Marks must be between 0 and 100.';
    return '';
  },
};

function showError(fieldId, msg) {
  const field = document.getElementById(fieldId);
  const errEl = document.getElementById('err-' + fieldId);
  if (!field || !errEl) return;
  if (msg) {
    field.classList.add('error-field');
    errEl.textContent = '⚠ ' + msg;
  } else {
    field.classList.remove('error-field');
    errEl.textContent = '';
  }
}

function validateAll(editIndex) {
  const fields = ['studentId', 'studentName', 'studentEmail', 'studentDept', 'studentSem', 'studentMarks'];
  let valid = true;
  fields.forEach(f => {
    const val = document.getElementById(f).value;
    const extra = f === 'studentId' ? editIndex : undefined;
    const err = validators[f](val, extra);
    showError(f, err);
    if (err) valid = false;
  });
  return valid;
}

/* =========================================================
   GRADE PREVIEW (live)
   ========================================================= */
document.getElementById('studentMarks').addEventListener('input', updateGradePreview);

function updateGradePreview() {
  const marksVal = document.getElementById('studentMarks').value;
  const preview = document.getElementById('gradePreview');
  if (marksVal === '' || isNaN(Number(marksVal))) { preview.style.display = 'none'; return; }
  const marks = Math.min(100, Math.max(0, Number(marksVal)));
  const grade = calcGrade(marks);
  const pass  = isPassing(marks);
  const cls   = gradeClass(grade);

  document.getElementById('gpPercent').textContent = marks.toFixed(1) + '%';

  const gpGrade = document.getElementById('gpGrade');
  gpGrade.textContent = grade;
  gpGrade.className = 'gp-grade ' + cls;

  const gpStatus = document.getElementById('gpStatus');
  gpStatus.textContent = pass ? 'PASS' : 'FAIL';
  gpStatus.className = 'gp-status ' + (pass ? 'status-pass' : 'status-fail');

  preview.style.display = 'block';
}

/* =========================================================
   FORM SUBMISSION (Add / Edit)
   ========================================================= */
document.getElementById('studentForm').addEventListener('submit', e => {
  e.preventDefault();
  const editIdx = document.getElementById('editIndex').value;
  if (!validateAll(editIdx)) return;

  const student = {
    id:        document.getElementById('studentId').value.trim(),
    name:      document.getElementById('studentName').value.trim(),
    email:     document.getElementById('studentEmail').value.trim(),
    dept:      document.getElementById('studentDept').value,
    semester:  document.getElementById('studentSem').value,
    marks:     Number(document.getElementById('studentMarks').value),
    grade:     calcGrade(Number(document.getElementById('studentMarks').value)),
    percent:   Number(document.getElementById('studentMarks').value),
    addedAt:   editIdx !== '' ? state.students[Number(editIdx)]?.addedAt : new Date().toISOString(),
  };

  if (editIdx !== '') {
    state.students[Number(editIdx)] = student;
    showToast('success', 'ri-check-line', `${student.name}'s record updated successfully.`);
  } else {
    state.students.push(student);
    showToast('success', 'ri-user-add-line', `${student.name} added successfully!`);
  }

  saveStudents();
  resetFormToAddMode();
  updateNotifBadge();
  navigateTo('all-students');
});

/* =========================================================
   RESET / CANCEL EDIT
   ========================================================= */
document.getElementById('resetBtn').addEventListener('click', resetFormToAddMode);

function resetFormToAddMode() {
  document.getElementById('editIndex').value = '';
  document.getElementById('studentForm').reset();
  document.getElementById('gradePreview').style.display = 'none';
  document.getElementById('formSectionTitle').textContent = 'Add New Student';
  document.getElementById('formSectionSubtitle').textContent = 'Fill in the details below to register a new student.';
  document.getElementById('submitBtn').innerHTML = '<i class="ri-save-line"></i> Save Student';
  // Clear errors
  ['studentId','studentName','studentEmail','studentDept','studentSem','studentMarks'].forEach(f => showError(f, ''));
}

/* =========================================================
   EDIT STUDENT
   ========================================================= */
function editStudent(index) {
  const s = state.students[index];
  if (!s) return;
  document.getElementById('editIndex').value = index;
  document.getElementById('studentId').value    = s.id;
  document.getElementById('studentName').value  = s.name;
  document.getElementById('studentEmail').value = s.email;
  document.getElementById('studentDept').value  = s.dept;
  document.getElementById('studentSem').value   = s.semester;
  document.getElementById('studentMarks').value = s.marks;
  document.getElementById('formSectionTitle').textContent = 'Edit Student Record';
  document.getElementById('formSectionSubtitle').textContent = `Updating details for ${s.name} (${s.id}).`;
  document.getElementById('submitBtn').innerHTML = '<i class="ri-save-3-line"></i> Update Student';
  updateGradePreview();
  navigateTo('add-student');
}

/* =========================================================
   DELETE STUDENT
   ========================================================= */
function openDeleteModal(index) {
  state.deleteTargetIndex = index;
  const s = state.students[index];
  document.getElementById('deleteStudentName').textContent = `${s.name} (${s.id})`;
  document.getElementById('deleteModal').classList.add('show');
}

document.getElementById('confirmDelete').addEventListener('click', () => {
  const idx = state.deleteTargetIndex;
  if (idx === null || idx === undefined) return;
  const name = state.students[idx]?.name;
  state.students.splice(idx, 1);
  saveStudents();
  renderTable();
  updateDashboard();
  closeDeleteModal();
  updateNotifBadge();
  showToast('info', 'ri-delete-bin-6-line', `${name}'s record has been deleted.`);
});

document.getElementById('cancelDelete').addEventListener('click', closeDeleteModal);
document.getElementById('deleteModal').addEventListener('click', e => {
  if (e.target === document.getElementById('deleteModal')) closeDeleteModal();
});

function closeDeleteModal() {
  document.getElementById('deleteModal').classList.remove('show');
  state.deleteTargetIndex = null;
}

/* =========================================================
   SEARCH & FILTERS
   ========================================================= */
const searchInput  = document.getElementById('searchInput');
const clearSearch  = document.getElementById('clearSearch');
const filterDept   = document.getElementById('filterDept');
const filterGrade  = document.getElementById('filterGrade');
const filterSem    = document.getElementById('filterSem');

searchInput.addEventListener('input', () => {
  state.searchQuery = searchInput.value.trim();
  clearSearch.classList.toggle('visible', state.searchQuery.length > 0);
  state.currentPage = 1;
  applyFiltersAndRender();
});

clearSearch.addEventListener('click', () => {
  searchInput.value = '';
  state.searchQuery = '';
  clearSearch.classList.remove('visible');
  state.currentPage = 1;
  applyFiltersAndRender();
});

filterDept.addEventListener('change', () => { state.filterDept = filterDept.value; state.currentPage = 1; applyFiltersAndRender(); });
filterGrade.addEventListener('change', () => { state.filterGrade = filterGrade.value; state.currentPage = 1; applyFiltersAndRender(); });
filterSem.addEventListener('change', () => { state.filterSem = filterSem.value; state.currentPage = 1; applyFiltersAndRender(); });

document.getElementById('clearFilters').addEventListener('click', () => {
  searchInput.value = '';
  filterDept.value = '';
  filterGrade.value = '';
  filterSem.value = '';
  clearSearch.classList.remove('visible');
  state.searchQuery = '';
  state.filterDept = '';
  state.filterGrade = '';
  state.filterSem = '';
  state.currentPage = 1;
  applyFiltersAndRender();
});

function applyFiltersAndRender() {
  const q = state.searchQuery.toLowerCase();
  state.filtered = state.students.filter(s => {
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
    const matchDept   = !state.filterDept  || s.dept === state.filterDept;
    const matchGrade  = !state.filterGrade || s.grade === state.filterGrade;
    const matchSem    = !state.filterSem   || String(s.semester) === state.filterSem;
    return matchSearch && matchDept && matchGrade && matchSem;
  });
  renderTable();
}

/* =========================================================
   SORTING
   ========================================================= */
document.querySelectorAll('.sortable').forEach(th => {
  th.addEventListener('click', () => {
    const key = th.dataset.sort;
    if (state.sortKey === key) {
      state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      state.sortKey = key;
      state.sortDir = 'asc';
    }
    // Update header classes
    document.querySelectorAll('.sortable').forEach(h => h.classList.remove('sort-asc','sort-desc'));
    th.classList.add(state.sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
    state.currentPage = 1;
    renderTable();
  });
});

function sortFiltered() {
  const { sortKey, sortDir } = state;
  state.filtered.sort((a, b) => {
    let av = a[sortKey] ?? '', bv = b[sortKey] ?? '';
    if (sortKey === 'marks' || sortKey === 'percent' || sortKey === 'sem') {
      av = Number(av); bv = Number(bv);
    } else {
      av = String(av).toLowerCase(); bv = String(bv).toLowerCase();
    }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });
}

/* =========================================================
   RENDER TABLE
   ========================================================= */
function renderTable() {
  // Apply filter first if filtered is stale
  if (state.filtered.length === 0 && state.students.length > 0
      && !state.searchQuery && !state.filterDept && !state.filterGrade && !state.filterSem) {
    state.filtered = [...state.students];
  }
  if (state.filtered.length === 0 && state.students.length === 0) {
    state.filtered = [];
  }

  sortFiltered();

  const total      = state.filtered.length;
  const perPage    = Number(document.getElementById('perPage').value);
  state.perPage    = perPage;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  state.currentPage = Math.min(state.currentPage, totalPages);

  const start = (state.currentPage - 1) * perPage;
  const end   = Math.min(start + perPage, total);
  const pageData = state.filtered.slice(start, end);

  const tbody = document.getElementById('studentTableBody');
  const tableEmpty = document.getElementById('tableEmpty');
  const table = document.getElementById('studentTable');

  // Update results info
  let infoText = '';
  if (total === 0) {
    infoText = state.students.length === 0 ? 'No students yet.' : 'No results match your filters.';
  } else {
    infoText = `Showing ${start + 1}–${end} of ${total} student${total !== 1 ? 's' : ''}`;
    if (state.students.length !== total) infoText += ` (filtered from ${state.students.length} total)`;
  }
  document.getElementById('resultsInfo').textContent = infoText;

  if (total === 0) {
    table.style.display = 'none';
    tableEmpty.classList.add('show');
    document.getElementById('paginationBar').style.display = 'none';
    return;
  }

  table.style.display = '';
  tableEmpty.classList.remove('show');
  document.getElementById('paginationBar').style.display = '';

  tbody.innerHTML = pageData.map((s, i) => {
    const globalIdx = state.students.indexOf(s);
    const cls  = gradeClass(s.grade);
    const pass = isPassing(s.marks);
    const avStyle = avatarStyle(globalIdx);
    const initials = getInitials(s.name);
    return `
      <tr>
        <td class="td-id">${escHtml(s.id)}</td>
        <td>
          <div class="td-name">
            <div class="table-avatar" style="${avStyle}">${initials}</div>
            ${escHtml(s.name)}
          </div>
        </td>
        <td class="td-email" title="${escHtml(s.email)}">${escHtml(s.email)}</td>
        <td><span class="td-dept">${escHtml(s.dept)}</span></td>
        <td style="text-align:center">${escHtml(String(s.semester))}</td>
        <td style="text-align:center;font-weight:700">${escHtml(String(s.marks))}</td>
        <td style="text-align:center;font-weight:600;color:${pass ? 'var(--clr-green)' : 'var(--clr-red)'}">${Number(s.percent).toFixed(1)}%</td>
        <td style="text-align:center"><span class="grade-pill ${cls}">${escHtml(s.grade)}</span></td>
        <td>
          <div class="td-actions">
            <button class="btn-icon edit" title="Edit student" onclick="editStudent(${globalIdx})">
              <i class="ri-edit-line"></i>
            </button>
            <button class="btn-icon delete" title="Delete student" onclick="openDeleteModal(${globalIdx})">
              <i class="ri-delete-bin-6-line"></i>
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');

  renderPagination(total, totalPages);
}

/* =========================================================
   PAGINATION
   ========================================================= */
function renderPagination(total, totalPages) {
  const info = document.getElementById('paginationInfo');
  const controls = document.getElementById('paginationControls');
  const { currentPage } = state;

  info.textContent = `Page ${currentPage} of ${totalPages}`;
  controls.innerHTML = '';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'page-btn';
  prevBtn.innerHTML = '<i class="ri-arrow-left-s-line"></i>';
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener('click', () => { state.currentPage--; renderTable(); });
  controls.appendChild(prevBtn);

  const pageNums = getPageNumbers(currentPage, totalPages);
  pageNums.forEach(p => {
    if (p === '...') {
      const ellipsis = document.createElement('button');
      ellipsis.className = 'page-btn';
      ellipsis.textContent = '…';
      ellipsis.disabled = true;
      controls.appendChild(ellipsis);
    } else {
      const btn = document.createElement('button');
      btn.className = 'page-btn' + (p === currentPage ? ' active' : '');
      btn.textContent = p;
      btn.addEventListener('click', () => { state.currentPage = p; renderTable(); });
      controls.appendChild(btn);
    }
  });

  const nextBtn = document.createElement('button');
  nextBtn.className = 'page-btn';
  nextBtn.innerHTML = '<i class="ri-arrow-right-s-line"></i>';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener('click', () => { state.currentPage++; renderTable(); });
  controls.appendChild(nextBtn);
}

function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [];
  if (current <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i);
    pages.push('...'); pages.push(total);
  } else if (current >= total - 3) {
    pages.push(1); pages.push('...');
    for (let i = total - 4; i <= total; i++) pages.push(i);
  } else {
    pages.push(1); pages.push('...');
    for (let i = current - 1; i <= current + 1; i++) pages.push(i);
    pages.push('...'); pages.push(total);
  }
  return pages;
}

document.getElementById('perPage').addEventListener('change', () => {
  state.currentPage = 1;
  renderTable();
});

/* =========================================================
   DASHBOARD UPDATE
   ========================================================= */
function updateDashboard() {
  const students = state.students;
  const total    = students.length;

  document.getElementById('totalStudents').textContent = total;

  // Unique departments
  const depts = [...new Set(students.map(s => s.dept))].filter(Boolean);
  document.getElementById('totalDepts').textContent = depts.length;

  // Avg percentage
  const avg = total > 0 ? students.reduce((sum, s) => sum + Number(s.percent), 0) / total : 0;
  document.getElementById('avgPercent').textContent = avg.toFixed(1) + '%';

  // Top performers (A+ or A)
  const top = students.filter(s => s.grade === 'A+' || s.grade === 'A').length;
  document.getElementById('topPerformers').textContent = top;

  // Trends (simple count labels)
  document.getElementById('trendStudents').textContent = total > 0 ? `${total} enrolled` : '—';
  document.getElementById('trendDepts').textContent = depts.length > 0 ? `${depts.length} active` : '—';
  document.getElementById('trendAvg').textContent = avg > 0 ? (avg >= 70 ? '↑ Good' : '↓ Below avg') : '—';
  document.getElementById('trendTop').textContent = top > 0 ? `${top} students` : '—';

  // Notification badge = number of failing students
  updateNotifBadge();

  // Grade Distribution
  const grades = { 'A+': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 };
  students.forEach(s => { if (grades[s.grade] !== undefined) grades[s.grade]++; });

  const gradeEmptyState = document.getElementById('gradeEmptyState');
  const gradeBars = document.getElementById('gradeBars');

  if (total === 0) {
    gradeBars.style.display = 'none';
    gradeEmptyState.style.display = 'flex';
  } else {
    gradeBars.style.display = 'block';
    gradeEmptyState.style.display = 'none';
    const setBar = (id, countId, count) => {
      const pct = total > 0 ? (count / total * 100) : 0;
      document.getElementById(id).style.width = pct + '%';
      document.getElementById(countId).textContent = count;
    };
    setBar('bar-aplus','count-aplus', grades['A+']);
    setBar('bar-a',    'count-a',     grades['A']);
    setBar('bar-b',    'count-b',     grades['B']);
    setBar('bar-c',    'count-c',     grades['C']);
    setBar('bar-d',    'count-d',     grades['D']);
    setBar('bar-f',    'count-f',     grades['F']);
  }

  // Recent Students (last 5)
  const recentList = document.getElementById('recentList');
  const recent = [...students].reverse().slice(0, 5);
  if (recent.length === 0) {
    recentList.innerHTML = `<div class="empty-state-mini"><i class="ri-user-search-line"></i><p>No students added yet</p></div>`;
  } else {
    recentList.innerHTML = recent.map((s, i) => {
      const globalIdx = state.students.indexOf(s);
      const avStyle = avatarStyle(globalIdx);
      const cls = gradeClass(s.grade);
      return `
        <div class="recent-item">
          <div class="recent-avatar" style="${avStyle}">${getInitials(s.name)}</div>
          <div class="recent-info">
            <span class="recent-name">${escHtml(s.name)}</span>
            <span class="recent-dept">${escHtml(s.dept)} • Sem ${escHtml(String(s.semester))}</span>
          </div>
          <span class="recent-grade ${cls}">${escHtml(s.grade)}</span>
        </div>`;
    }).join('');
  }

  // Department Breakdown
  const deptBreakdown = document.getElementById('deptBreakdown');
  if (depts.length === 0) {
    deptBreakdown.innerHTML = `<div class="empty-state-mini"><i class="ri-building-line"></i><p>No departments recorded yet</p></div>`;
  } else {
    const deptCounts = {};
    students.forEach(s => { deptCounts[s.dept] = (deptCounts[s.dept] || 0) + 1; });
    deptBreakdown.innerHTML = Object.entries(deptCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([dept, cnt]) => `
        <div class="dept-chip">
          <span class="dept-chip-name">${escHtml(dept)}</span>
          <span class="dept-chip-count">${cnt}</span>
        </div>`).join('');
  }
}

function updateNotifBadge() {
  const failing = state.students.filter(s => !isPassing(s.marks)).length;
  document.getElementById('notifBadge').textContent = failing;
  document.getElementById('notifBadge').style.display = failing > 0 ? '' : 'none';
}

/* =========================================================
   TOAST NOTIFICATIONS
   ========================================================= */
function showToast(type, icon, message) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="ri-${icon}"></i><span class="toast-text">${escHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

/* =========================================================
   SECURITY: HTML ESCAPE
   ========================================================= */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* =========================================================
   REAL-TIME FIELD VALIDATION (on blur)
   ========================================================= */
['studentId','studentName','studentEmail','studentDept','studentSem','studentMarks'].forEach(fieldId => {
  const el = document.getElementById(fieldId);
  el.addEventListener('blur', () => {
    const editIdx = document.getElementById('editIndex').value;
    const extra = fieldId === 'studentId' ? editIdx : undefined;
    const err = validators[fieldId](el.value, extra);
    showError(fieldId, err);
  });
  el.addEventListener('input', () => {
    if (el.classList.contains('error-field')) {
      const editIdx = document.getElementById('editIndex').value;
      const extra = fieldId === 'studentId' ? editIdx : undefined;
      const err = validators[fieldId](el.value, extra);
      showError(fieldId, err);
    }
  });
});

/* =========================================================
   VIEW-ALL LINK on dashboard
   ========================================================= */
document.getElementById('recentList').addEventListener('click', e => {
  const link = e.target.closest('[data-section="all-students"]');
  if (link) { e.preventDefault(); navigateTo('all-students'); }
});

/* =========================================================
   KEYBOARD SHORTCUTS
   ========================================================= */
document.addEventListener('keydown', e => {
  // Escape to close modals
  if (e.key === 'Escape') {
    closeDeleteModal();
  }
});

/* =========================================================
   INIT
   ========================================================= */
function init() {
  state.students = loadStudents();
  state.filtered = [...state.students];
  updateDashboard();
  updateNotifBadge();
  navigateTo('dashboard');

  // Seed demo data if localStorage is empty
  if (state.students.length === 0) {
    seedDemoData();
  }
}

/* =========================================================
   DEMO DATA (first run only)
   ========================================================= */
function seedDemoData() {
  const demo = [
    { id: 'STU001', name: 'Alice Johnson',    email: 'alice@university.edu',   dept: 'Computer Science',       semester: '5', marks: 92 },
    { id: 'STU002', name: 'Bob Martinez',     email: 'bob@university.edu',     dept: 'Information Technology', semester: '3', marks: 78 },
    { id: 'STU003', name: 'Clara Chen',       email: 'clara@university.edu',   dept: 'Data Science',           semester: '6', marks: 85 },
    { id: 'STU004', name: 'David Kumar',      email: 'david@university.edu',   dept: 'Electrical Engineering', semester: '4', marks: 61 },
    { id: 'STU005', name: 'Eva Brown',        email: 'eva@university.edu',     dept: 'Artificial Intelligence',semester: '7', marks: 95 },
    { id: 'STU006', name: 'Frank Wilson',     email: 'frank@university.edu',   dept: 'Mechanical Engineering', semester: '2', marks: 48 },
    { id: 'STU007', name: 'Grace Lee',        email: 'grace@university.edu',   dept: 'Biotechnology',          semester: '8', marks: 73 },
    { id: 'STU008', name: 'Henry Thompson',   email: 'henry@university.edu',   dept: 'Civil Engineering',      semester: '1', marks: 55 },
    { id: 'STU009', name: 'Iris Patel',       email: 'iris@university.edu',    dept: 'Business Administration',semester: '6', marks: 88 },
    { id: 'STU010', name: 'James Nguyen',     email: 'james@university.edu',   dept: 'Computer Science',       semester: '4', marks: 67 },
    { id: 'STU011', name: 'Karen Smith',      email: 'karen@university.edu',   dept: 'Data Science',           semester: '5', marks: 91 },
    { id: 'STU012', name: 'Leo Fernandez',    email: 'leo@university.edu',     dept: 'Electronics & Communication', semester: '3', marks: 44 },
  ];

  demo.forEach(d => {
    state.students.push({
      ...d,
      semester: d.semester,
      grade:    calcGrade(d.marks),
      percent:  d.marks,
      addedAt:  new Date().toISOString(),
    });
  });

  saveStudents();
  state.filtered = [...state.students];
  updateDashboard();
  updateNotifBadge();
}

/* =========================================================
   KICK-OFF
   ========================================================= */
init();
