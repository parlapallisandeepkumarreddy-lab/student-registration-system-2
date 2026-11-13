/* ============================================
   STUDENT REGISTRATION SYSTEM - APP LOGIC
   ============================================ */

'use strict';

/* ---- Constants ---- */
const STORAGE_KEY = 'srs_students_v1';

/* ---- State ---- */
let students = [];
let deleteTargetIndex = null;
let searchTerm = '';

/* ---- DOM References ---- */
const $ = id => document.getElementById(id);

// Header
const totalCountEl    = $('totalCount');

// Tabs
const tabRegister     = $('tabRegister');
const tabRecords      = $('tabRecords');
const panelRegister   = $('tabPanelRegister');
const panelRecords    = $('tabPanelRecords');
const recordBadge     = $('recordBadge');

// Registration form
const registrationForm = $('registrationForm');
const studentNameInput = $('studentName');
const regNumberInput   = $('regNumber');
const departmentInput  = $('department');
const courseInput      = $('course');
const resetBtn         = $('resetBtn');

// Records
const tableBody       = $('tableBody');
const emptyState      = $('emptyState');
const goToRegisterBtn = $('goToRegisterBtn');
const searchInput     = $('searchInput');
const clearSearchBtn  = $('clearSearch');

// Summary
const summaryTotal  = $('summaryTotal');
const summaryMale   = $('summaryMale');
const summaryFemale = $('summaryFemale');
const summaryOther  = $('summaryOther');

// Toast
const toastEl = $('toast');
let toastTimer;

// Edit modal
const editModal     = $('editModal');
const editForm      = $('editForm');
const closeModal    = $('closeModal');
const cancelEdit    = $('cancelEdit');
const editNameInput = $('editName');
const editRegInput  = $('editRegNo');
const editDeptInput = $('editDept');
const editCourseInput = $('editCourse');

// Delete modal
const deleteModal       = $('deleteModal');
const closeDeleteModal  = $('closeDeleteModal');
const cancelDelete      = $('cancelDelete');
const confirmDeleteBtn  = $('confirmDelete');


/* ============================================
   LOCALSTORAGE HELPERS
   ============================================ */
function loadStudents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStudents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}


/* ============================================
   TOAST NOTIFICATION
   ============================================ */
function showToast(message, type = 'success') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toastEl.innerHTML = `<span>${icons[type] || ''}</span> ${message}`;
  toastEl.className = `toast toast--${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove('show');
  }, 3500);
}


/* ============================================
   VALIDATION HELPERS
   ============================================ */
function setError(inputEl, errorEl, msg) {
  errorEl.textContent = msg;
  if (inputEl) {
    inputEl.classList.remove('valid');
    inputEl.classList.add('invalid');
  }
}

function clearError(inputEl, errorEl) {
  errorEl.textContent = '';
  if (inputEl) {
    inputEl.classList.remove('invalid');
  }
}

function setValid(inputEl, errorEl) {
  errorEl.textContent = '';
  if (inputEl) {
    inputEl.classList.remove('invalid');
    inputEl.classList.add('valid');
  }
}

function validateRegistrationForm() {
  let valid = true;

  const name    = studentNameInput.value.trim();
  const regNo   = regNumberInput.value.trim();
  const dept    = departmentInput.value;
  const course  = courseInput.value;
  const genderEl = document.querySelector('input[name="gender"]:checked');
  const gender  = genderEl ? genderEl.value : '';

  // Name
  if (!name) {
    setError(studentNameInput, $('studentNameError'), 'Student name is required.');
    valid = false;
  } else if (name.length < 2) {
    setError(studentNameInput, $('studentNameError'), 'Name must be at least 2 characters.');
    valid = false;
  } else {
    setValid(studentNameInput, $('studentNameError'));
  }

  // Register Number
  if (!regNo) {
    setError(regNumberInput, $('regNumberError'), 'Register number is required.');
    valid = false;
  } else if (students.some(s => s.regNo.toLowerCase() === regNo.toLowerCase())) {
    setError(regNumberInput, $('regNumberError'), 'This register number already exists.');
    valid = false;
  } else {
    setValid(regNumberInput, $('regNumberError'));
  }

  // Department
  if (!dept) {
    setError(departmentInput, $('departmentError'), 'Please select a department.');
    valid = false;
  } else {
    setValid(departmentInput, $('departmentError'));
  }

  // Course
  if (!course) {
    setError(courseInput, $('courseError'), 'Please select a course.');
    valid = false;
  } else {
    setValid(courseInput, $('courseError'));
  }

  // Gender
  if (!gender) {
    $('genderError').textContent = 'Please select a gender.';
    valid = false;
  } else {
    $('genderError').textContent = '';
  }

  return valid ? { name, regNo, dept, course, gender } : null;
}

function validateEditForm(originalIndex) {
  let valid = true;

  const name    = editNameInput.value.trim();
  const regNo   = editRegInput.value.trim();
  const dept    = editDeptInput.value;
  const course  = editCourseInput.value;
  const genderEl = document.querySelector('input[name="editGender"]:checked');
  const gender  = genderEl ? genderEl.value : '';

  if (!name) {
    setError(editNameInput, $('editNameError'), 'Student name is required.');
    valid = false;
  } else { clearError(editNameInput, $('editNameError')); }

  if (!regNo) {
    setError(editRegInput, $('editRegNoError'), 'Register number is required.');
    valid = false;
  } else if (students.some((s, i) => i !== originalIndex && s.regNo.toLowerCase() === regNo.toLowerCase())) {
    setError(editRegInput, $('editRegNoError'), 'This register number already exists.');
    valid = false;
  } else { clearError(editRegInput, $('editRegNoError')); }

  if (!dept) {
    setError(editDeptInput, $('editDeptError'), 'Please select a department.');
    valid = false;
  } else { clearError(editDeptInput, $('editDeptError')); }

  if (!course) {
    setError(editCourseInput, $('editCourseError'), 'Please select a course.');
    valid = false;
  } else { clearError(editCourseInput, $('editCourseError')); }

  if (!gender) {
    $('editGenderError').textContent = 'Please select a gender.';
    valid = false;
  } else { $('editGenderError').textContent = ''; }

  return valid ? { name, regNo, dept, course, gender } : null;
}


/* ============================================
   REGISTRATION FORM HANDLERS
   ============================================ */
registrationForm.addEventListener('submit', e => {
  e.preventDefault();
  const data = validateRegistrationForm();
  if (!data) return;

  students.push({
    name:   data.name,
    regNo:  data.regNo,
    dept:   data.dept,
    course: data.course,
    gender: data.gender,
    createdAt: new Date().toISOString()
  });

  saveStudents();
  updateUI();
  registrationForm.reset();
  clearAllValidationStates();
  showToast(`🎓 ${data.name} registered successfully!`, 'success');

  // Auto-switch to records tab
  setTimeout(() => switchTab('records'), 600);
});

resetBtn.addEventListener('click', () => {
  registrationForm.reset();
  clearAllValidationStates();
});

function clearAllValidationStates() {
  ['studentName','regNumber','department','course'].forEach(id => {
    const el = $(id);
    if (el) { el.classList.remove('valid','invalid'); }
  });
  ['studentNameError','regNumberError','departmentError','courseError','genderError'].forEach(id => {
    const el = $(id);
    if (el) el.textContent = '';
  });
}

// Live validation on blur
studentNameInput.addEventListener('blur', () => {
  const val = studentNameInput.value.trim();
  if (!val) setError(studentNameInput, $('studentNameError'), 'Student name is required.');
  else if (val.length < 2) setError(studentNameInput, $('studentNameError'), 'Name must be at least 2 characters.');
  else setValid(studentNameInput, $('studentNameError'));
});

regNumberInput.addEventListener('blur', () => {
  const val = regNumberInput.value.trim();
  if (!val) setError(regNumberInput, $('regNumberError'), 'Register number is required.');
  else if (students.some(s => s.regNo.toLowerCase() === val.toLowerCase())) {
    setError(regNumberInput, $('regNumberError'), 'This register number already exists.');
  } else setValid(regNumberInput, $('regNumberError'));
});

departmentInput.addEventListener('change', () => {
  if (!departmentInput.value) setError(departmentInput, $('departmentError'), 'Please select a department.');
  else setValid(departmentInput, $('departmentError'));
});

courseInput.addEventListener('change', () => {
  if (!courseInput.value) setError(courseInput, $('courseError'), 'Please select a course.');
  else setValid(courseInput, $('courseError'));
});

document.querySelectorAll('input[name="gender"]').forEach(radio => {
  radio.addEventListener('change', () => {
    $('genderError').textContent = '';
  });
});


/* ============================================
   TAB NAVIGATION
   ============================================ */
function switchTab(tab) {
  if (tab === 'register') {
    tabRegister.classList.add('active');
    tabRecords.classList.remove('active');
    panelRegister.classList.add('active');
    panelRecords.classList.remove('active');
    tabRegister.setAttribute('aria-selected', 'true');
    tabRecords.setAttribute('aria-selected', 'false');
  } else {
    tabRecords.classList.add('active');
    tabRegister.classList.remove('active');
    panelRecords.classList.add('active');
    panelRegister.classList.remove('active');
    tabRecords.setAttribute('aria-selected', 'true');
    tabRegister.setAttribute('aria-selected', 'false');
  }
}

tabRegister.addEventListener('click', () => switchTab('register'));
tabRecords.addEventListener('click', () => switchTab('records'));
goToRegisterBtn.addEventListener('click', () => switchTab('register'));


/* ============================================
   SEARCH
   ============================================ */
searchInput.addEventListener('input', () => {
  searchTerm = searchInput.value.trim().toLowerCase();
  clearSearchBtn.classList.toggle('visible', searchTerm.length > 0);
  renderTable();
});

clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  searchTerm = '';
  clearSearchBtn.classList.remove('visible');
  renderTable();
  searchInput.focus();
});


/* ============================================
   RENDER TABLE
   ============================================ */
function getGenderBadgeClass(gender) {
  if (gender === 'Male')   return 'gender-male';
  if (gender === 'Female') return 'gender-female';
  return 'gender-other';
}

function getGenderIcon(gender) {
  if (gender === 'Male')   return '♂';
  if (gender === 'Female') return '♀';
  return '⚧';
}

function renderTable() {
  const filtered = students.filter(s => {
    if (!searchTerm) return true;
    return (
      s.name.toLowerCase().includes(searchTerm) ||
      s.regNo.toLowerCase().includes(searchTerm)
    );
  });

  tableBody.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.classList.add('visible');
    if (students.length === 0) {
      emptyState.querySelector('h3').textContent = 'No Students Registered Yet';
      emptyState.querySelector('p').textContent  = 'Register your first student using the Registration tab.';
      goToRegisterBtn.style.display = 'inline-flex';
    } else {
      emptyState.querySelector('h3').textContent = 'No Results Found';
      emptyState.querySelector('p').textContent  = `No students match "${searchInput.value}". Try a different search term.`;
      goToRegisterBtn.style.display = 'none';
    }
    return;
  }

  emptyState.classList.remove('visible');

  filtered.forEach((student, filteredIdx) => {
    const originalIdx = students.indexOf(student);
    const tr = document.createElement('tr');
    tr.style.animationDelay = `${filteredIdx * 40}ms`;

    tr.innerHTML = `
      <td>${filteredIdx + 1}</td>
      <td class="td-name">${escHtml(student.name)}</td>
      <td><span class="td-reg">${escHtml(student.regNo)}</span></td>
      <td class="dept-text">${escHtml(student.dept)}</td>
      <td>
        <span class="gender-badge ${getGenderBadgeClass(student.gender)}">
          ${getGenderIcon(student.gender)} ${escHtml(student.gender)}
        </span>
      </td>
      <td><span class="course-badge">${escHtml(student.course)}</span></td>
      <td>
        <div class="action-cell">
          <button
            class="btn btn-icon-sm btn-edit"
            aria-label="Edit ${escHtml(student.name)}"
            onclick="openEditModal(${originalIdx})"
          >✏️ Edit</button>
          <button
            class="btn btn-icon-sm btn-delete"
            aria-label="Delete ${escHtml(student.name)}"
            onclick="openDeleteModal(${originalIdx})"
          >🗑️ Delete</button>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}


/* ============================================
   SUMMARY CARDS + HEADER COUNT
   ============================================ */
function updateSummary() {
  const total  = students.length;
  const male   = students.filter(s => s.gender === 'Male').length;
  const female = students.filter(s => s.gender === 'Female').length;
  const other  = students.filter(s => s.gender === 'Other').length;

  animateCount(totalCountEl,  total);
  animateCount(summaryTotal,  total);
  animateCount(summaryMale,   male);
  animateCount(summaryFemale, female);
  animateCount(summaryOther,  other);

  recordBadge.textContent = total;
}

function animateCount(el, target) {
  if (!el) return;
  const start    = parseInt(el.textContent) || 0;
  const duration = 500;
  const step     = (timestamp, startTime) => {
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const value    = Math.floor(start + (target - start) * easeOut(progress));
    el.textContent = value;
    if (progress < 1) requestAnimationFrame(ts => step(ts, startTime));
  };
  requestAnimationFrame(ts => step(ts, ts));
}

function easeOut(t) { return 1 - Math.pow(1 - t, 3); }


/* ============================================
   EDIT MODAL
   ============================================ */
window.openEditModal = function(index) {
  const student = students[index];
  if (!student) return;

  $('editIndex').value     = index;
  editNameInput.value      = student.name;
  editRegInput.value       = student.regNo;
  editDeptInput.value      = student.dept;
  editCourseInput.value    = student.course;

  // Set gender radio
  document.querySelectorAll('input[name="editGender"]').forEach(r => {
    r.checked = r.value === student.gender;
  });

  // Clear errors
  ['editNameError','editRegNoError','editDeptError','editGenderError','editCourseError'].forEach(id => {
    $(id).textContent = '';
  });

  editModal.classList.add('active');
  editNameInput.focus();
};

function closeEditModal() {
  editModal.classList.remove('active');
}

closeModal.addEventListener('click',  closeEditModal);
cancelEdit.addEventListener('click',  closeEditModal);
editModal.addEventListener('click', e => {
  if (e.target === editModal) closeEditModal();
});

editForm.addEventListener('submit', e => {
  e.preventDefault();
  const idx  = parseInt($('editIndex').value);
  const data = validateEditForm(idx);
  if (!data) return;

  students[idx] = {
    ...students[idx],
    name:   data.name,
    regNo:  data.regNo,
    dept:   data.dept,
    course: data.course,
    gender: data.gender,
    updatedAt: new Date().toISOString()
  };

  saveStudents();
  updateUI();
  closeEditModal();
  showToast(`✏️ ${data.name}'s details updated!`, 'info');
});


/* ============================================
   DELETE MODAL
   ============================================ */
window.openDeleteModal = function(index) {
  deleteTargetIndex = index;
  deleteModal.classList.add('active');
  confirmDeleteBtn.focus();
};

function closeDeleteModal_fn() {
  deleteModal.classList.remove('active');
  deleteTargetIndex = null;
}

closeDeleteModal.addEventListener('click',  closeDeleteModal_fn);
cancelDelete.addEventListener('click',      closeDeleteModal_fn);
deleteModal.addEventListener('click', e => {
  if (e.target === deleteModal) closeDeleteModal_fn();
});

confirmDeleteBtn.addEventListener('click', () => {
  if (deleteTargetIndex === null) return;
  const removed = students.splice(deleteTargetIndex, 1)[0];
  saveStudents();
  updateUI();
  closeDeleteModal_fn();
  showToast(`🗑️ ${removed.name} has been removed.`, 'error');
});


/* ============================================
   KEYBOARD ACCESSIBILITY
   ============================================ */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeEditModal();
    closeDeleteModal_fn();
  }
});


/* ============================================
   MAIN UI REFRESH
   ============================================ */
function updateUI() {
  renderTable();
  updateSummary();
}


/* ============================================
   INIT
   ============================================ */
function init() {
  students = loadStudents();
  updateUI();
}

init();
