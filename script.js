/* ============================================================
   DepEd ID Order Form — script.js
   DPrints by Dylan
   ============================================================ */

// ── Configuration ────────────────────────────────────────────
// Replace this with your deployed Google Apps Script Web App URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzKjuGNuvfC184p_-RGY2WiyRrNGRmO9EEJ7OBKhI7fIW2cLrdMQ1I_LeiYbzVTjOSl/exec';

// ── File validation rules ────────────────────────────────────
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];
const ALLOWED_DOC_TYPES   = ['image/jpeg', 'image/png', 'application/pdf'];

// ── DOM references ───────────────────────────────────────────
const form          = document.getElementById('order-form');
const submitBtn     = document.getElementById('submit-btn');
const btnLabel      = document.getElementById('btn-label');
const btnSpinner    = document.getElementById('btn-spinner');
const submitError   = document.getElementById('submit-error');
const successScreen = document.getElementById('success-screen');
const refNumberEl   = document.getElementById('reference-number');

// ── File input listeners ─────────────────────────────────────
document.getElementById('idPhoto').addEventListener('change', function () {
  handleImageChange(this, 'photo-preview', 'photo-preview-wrap', 'upload-area-photo', 'err-idPhoto');
});

document.getElementById('esignature').addEventListener('change', function () {
  handleImageChange(this, 'esig-preview', 'esig-preview-wrap', 'upload-area-esig', 'err-esignature');
});

document.getElementById('supportingDoc1').addEventListener('change', function () {
  handleDocChange(this, 'doc1-name', 'doc1-name-wrap', 'upload-area-doc1', 'err-supportingDoc1', ALLOWED_DOC_TYPES);
});

// ── Handle image file selection (photo / e-signature) ────────
function handleImageChange(input, previewImgId, previewWrapId, uploadAreaId, errorElId) {
  const errorEl     = document.getElementById(errorElId);
  const previewWrap = document.getElementById(previewWrapId);
  const previewImg  = document.getElementById(previewImgId);
  const uploadArea  = document.getElementById(uploadAreaId);

  clearError(errorEl);

  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];
  const validationError = validateFile(file, ALLOWED_IMAGE_TYPES);

  if (validationError) {
    showError(errorEl, validationError);
    input.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    previewImg.src = e.target.result;
    previewWrap.classList.remove('hidden');
    uploadArea.classList.add('hidden');
  };
  reader.readAsDataURL(file);
}

// ── Handle document selection ────────────────────────────────
function handleDocChange(input, nameElId, nameWrapId, uploadAreaId, errorElId, allowedTypes) {
  const errorEl    = document.getElementById(errorElId);
  const nameEl     = document.getElementById(nameElId);
  const nameWrap   = document.getElementById(nameWrapId);
  const uploadArea = document.getElementById(uploadAreaId);

  clearError(errorEl);

  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];
  const validationError = validateFile(file, allowedTypes);

  if (validationError) {
    showError(errorEl, validationError);
    input.value = '';
    return;
  }

  nameEl.textContent = file.name;
  nameWrap.classList.remove('hidden');
  uploadArea.classList.add('hidden');
}

// ── Remove a selected file ───────────────────────────────────
function removeFile(inputId, wrapId, uploadAreaId) {
  const input      = document.getElementById(inputId);
  const wrap       = document.getElementById(wrapId);
  const uploadArea = document.getElementById(uploadAreaId);

  input.value = '';
  wrap.classList.add('hidden');
  uploadArea.classList.remove('hidden');

  const errorEl = document.getElementById('err-' + inputId);
  if (errorEl) clearError(errorEl);

  // Clear image preview src
  if (inputId === 'idPhoto')    document.getElementById('photo-preview').src = '';
  if (inputId === 'esignature') document.getElementById('esig-preview').src  = '';
}

// ── File validation helper ───────────────────────────────────
function validateFile(file, allowedTypes) {
  if (!allowedTypes.includes(file.type)) {
    const labels = allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ');
    return `Invalid file type. Allowed: ${labels}.`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'File exceeds the 5MB size limit.';
  }
  return null;
}

// ── Required fields list ─────────────────────────────────────
const REQUIRED_FIELDS = [
  { id: 'lastName',            label: 'Last Name' },
  { id: 'firstName',           label: 'First Name' },
  { id: 'address',             label: 'Address' },
  { id: 'contactNumber',       label: 'Contact No.' },
  { id: 'dateOfBirth',         label: 'Date of Birth' },
  { id: 'bloodType',           label: 'Blood Type' },
  { id: 'employeeId',          label: 'Employee Number' },
  { id: 'position',            label: 'Position' },
  { id: 'schoolName',          label: 'Name of School' },
  { id: 'schoolAddress',       label: 'School Address' },
  { id: 'division',            label: 'Schools Division of' },
  { id: 'region',              label: 'Region' },
  { id: 'schoolHeadName',      label: 'Name of School Head' },
  { id: 'schoolHeadPosition',  label: 'School Head Position' },
  { id: 'emergencyName',       label: 'Emergency Contact Name' },
  { id: 'emergencyAddress',    label: 'Emergency Contact Address' },
  { id: 'emergencyContact',    label: 'Emergency Contact Number' },
];

// ── Form validation ──────────────────────────────────────────
function validateForm() {
  let isValid = true;

  REQUIRED_FIELDS.forEach(({ id, label }) => {
    const el      = document.getElementById(id);
    const errorEl = document.getElementById('err-' + id);
    const value   = el.value.trim();

    if (!value) {
      showError(errorEl, `${label} is required.`);
      el.classList.add('invalid');
      isValid = false;
    } else {
      clearError(errorEl);
      el.classList.remove('invalid');
      el.classList.add('valid');
    }
  });

  // Email format (optional field — only validate if filled)
  const emailEl = document.getElementById('email');
  if (emailEl && emailEl.value.trim() && !isValidEmail(emailEl.value.trim())) {
    showError(document.getElementById('err-email'), 'Please enter a valid email address.');
    emailEl.classList.add('invalid');
    isValid = false;
  }

  // Contact number — 11 digits
  const contactEl = document.getElementById('contactNumber');
  if (contactEl.value.trim() && !/^\d{11}$/.test(contactEl.value.trim())) {
    showError(document.getElementById('err-contactNumber'), 'Contact number must be exactly 11 digits.');
    contactEl.classList.add('invalid');
    isValid = false;
  }

  // Emergency contact number — 11 digits
  const emergencyContactEl = document.getElementById('emergencyContact');
  if (emergencyContactEl.value.trim() && !/^\d{11}$/.test(emergencyContactEl.value.trim())) {
    showError(document.getElementById('err-emergencyContact'), 'Contact number must be exactly 11 digits.');
    emergencyContactEl.classList.add('invalid');
    isValid = false;
  }

  // ID photo — required
  const idPhotoInput = document.getElementById('idPhoto');
  if (!idPhotoInput.files || idPhotoInput.files.length === 0) {
    showError(document.getElementById('err-idPhoto'), 'ID photo is required.');
    isValid = false;
  }

  // E-signature — required
  const esigInput = document.getElementById('esignature');
  if (!esigInput.files || esigInput.files.length === 0) {
    showError(document.getElementById('err-esignature'), 'E-Signature is required.');
    isValid = false;
  }

  return isValid;
}

// ── Live validation on blur ──────────────────────────────────
REQUIRED_FIELDS.forEach(({ id }) => {
  const el = document.getElementById(id);
  if (!el) return;

  el.addEventListener('blur', () => {
    const errorEl = document.getElementById('err-' + id);
    if (!el.value.trim()) return;
    clearError(errorEl);
    el.classList.remove('invalid');
    el.classList.add('valid');

    if (id === 'contactNumber' && !/^\d{11}$/.test(el.value.trim())) {
      showError(errorEl, 'Contact number must be exactly 11 digits.');
      el.classList.add('invalid');
      el.classList.remove('valid');
    }
    if (id === 'emergencyContact' && !/^\d{11}$/.test(el.value.trim())) {
      showError(errorEl, 'Contact number must be exactly 11 digits.');
      el.classList.add('invalid');
      el.classList.remove('valid');
    }
  });

  el.addEventListener('input', () => {
    const errorEl = document.getElementById('err-' + id);
    if (el.value.trim()) {
      clearError(errorEl);
      el.classList.remove('invalid');
    }
  });
});

// ── File to Base64 helper ────────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Build payload for Apps Script ────────────────────────────
async function buildPayload() {
  const textFields = [
    'lastName', 'firstName', 'middleName',
    'address', 'contactNumber', 'dateOfBirth', 'bloodType',
    'tin', 'gsisBpNo', 'pagibigNo', 'philhealthNo',
    'employeeId', 'position', 'schoolName', 'schoolAddress',
    'division', 'region',
    'schoolHeadName', 'schoolHeadPosition',
    'emergencyName', 'emergencyAddress', 'emergencyContact',
  ];

  const params = new URLSearchParams();

  textFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) params.append(id, el.value.trim());
  });

  // Encode file fields
  const fileFields = [
    { id: 'idPhoto',        name: 'idPhoto' },
    { id: 'esignature',     name: 'esignature' },
    { id: 'supportingDoc1', name: 'supportingDoc1' },
  ];

  for (const { id, name } of fileFields) {
    const input = document.getElementById(id);
    if (input && input.files && input.files[0]) {
      const file   = input.files[0];
      const base64 = await fileToBase64(file);
      params.append(name,                  base64);
      params.append(name + '_filename',    file.name);
      params.append(name + '_mimetype',    file.type);
    }
  }

  return params;
}

// ── Form submit ──────────────────────────────────────────────
form.addEventListener('submit', async function (e) {
  e.preventDefault();
  hideElement(submitError);

  if (!validateForm()) {
    const firstError = form.querySelector('.invalid, .field-error:not(:empty)');
    if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  setLoading(true);

  try {
    const payload = await buildPayload();

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: payload.toString(),
    });

    const result = await response.json();

    if (result.status === 'success') {
      refNumberEl.textContent = result.referenceNumber;
      form.classList.add('hidden');
      successScreen.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      showSubmitError(result.message || 'Something went wrong. Please try again.');
    }

  } catch (err) {
    showSubmitError('Unable to submit. Please check your connection and try again.');
  } finally {
    setLoading(false);
  }
});

// ── Reset form ───────────────────────────────────────────────
function resetForm() {
  form.reset();
  form.classList.remove('hidden');
  successScreen.classList.add('hidden');

  form.querySelectorAll('.field-error').forEach(el => el.textContent = '');
  form.querySelectorAll('input, select').forEach(el => {
    el.classList.remove('valid', 'invalid');
  });

  removeFile('idPhoto',        'photo-preview-wrap', 'upload-area-photo');
  removeFile('esignature',     'esig-preview-wrap',  'upload-area-esig');
  removeFile('supportingDoc1', 'doc1-name-wrap',     'upload-area-doc1');

  hideElement(submitError);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── UI helpers ───────────────────────────────────────────────
function setLoading(loading) {
  submitBtn.disabled = loading;
  btnLabel.textContent = loading ? 'Submitting…' : 'Submit Order';
  btnSpinner.classList.toggle('hidden', !loading);
}

function showError(el, message) {
  if (el) el.textContent = message;
}

function clearError(el) {
  if (el) el.textContent = '';
}

function showSubmitError(message) {
  submitError.textContent = message;
  submitError.classList.remove('hidden');
  submitError.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideElement(el) {
  if (el) el.classList.add('hidden');
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
