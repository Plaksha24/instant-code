let selectedStyle = 'clean';
let currentCode = '';
 
// ── Style option buttons ──────────────────────────
document.querySelectorAll('.opt-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedStyle = btn.dataset.style;
  });
});
 
// ── Drop zone ────────────────────────────────────
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
 
dropZone.addEventListener('click', () => fileInput.click());
 
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});
 
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
 
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) showPreview(file);
});
 
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) showPreview(file);
});
 
function showPreview(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('previewImg').src = e.target.result;
    document.getElementById('previewBox').style.display = 'block';
    dropZone.style.display = 'none';
  };
  reader.readAsDataURL(file);
}
 
function removeImage() {
  document.getElementById('previewImg').src = '';
  document.getElementById('previewBox').style.display = 'none';
  dropZone.style.display = 'block';
  fileInput.value = '';
}
 
// ── Generate ─────────────────────────────────────
async function generate() {
  const imgSrc = document.getElementById('previewImg').src;
  if (!imgSrc || imgSrc === window.location.href) {
    showError('Please upload a screenshot first.');
    return;
  }
 
  const btn = document.getElementById('generateBtn');
  const errorBox = document.getElementById('errorBox');
  errorBox.classList.remove('visible');
  btn.disabled = true;
 
  showLoading();
 
  try {
    // Convert image to base64
    const base64 = imgSrc.split(',')[1];
    const mimeMatch = imgSrc.match(/data:(image\/\w+);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
 
    const styleInstructions = {
      clean: 'Write clean, semantic HTML with well-organized CSS. Use CSS variables. Modern and readable.',
      minimal: 'Write minimal HTML with inline styles only. Keep it extremely concise.',
      detailed: 'Write highly detailed HTML with extensive CSS. Include hover states, transitions, and responsive design.'
    };
 
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: base64,
        mimeType,
        style: styleInstructions[selectedStyle]
      })
    });
 
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
 
    const data = await response.json();
    if (data.error) throw new Error(data.error);
 
    currentCode = data.code;
    showCode(currentCode);
 
  } catch (err) {
    showError(err.message || 'Something went wrong. Please try again.');
  } finally {
    btn.disabled = false;
    hideLoading();
  }
}
 
// ── Loading steps animation ───────────────────────
let stepInterval;
 
function showLoading() {
  const overlay = document.getElementById('loadingOverlay');
  overlay.classList.add('visible');
 
  const steps = ['step1', 'step2', 'step3', 'step4'];
  let current = 0;
 
  steps.forEach(s => {
    const el = document.getElementById(s);
    el.classList.remove('active', 'done');
  });
 
  document.getElementById('step1').classList.add('active');
 
  stepInterval = setInterval(() => {
    if (current < steps.length - 1) {
      document.getElementById(steps[current]).classList.remove('active');
      document.getElementById(steps[current]).classList.add('done');
      current++;
      document.getElementById(steps[current]).classList.add('active');
    }
  }, 1800);
}
 
function hideLoading() {
  clearInterval(stepInterval);
  document.getElementById('loadingOverlay').classList.remove('visible');
}
 
// ── Show code ─────────────────────────────────────
function showCode(code) {
  document.getElementById('codeBlock').style.display = 'block';
  document.getElementById('codeContent').textContent = code;
  document.getElementById('results-section').style.display = 'block';
  switchTab('code');
 
  // Scroll to results
  document.getElementById('results-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
 
// ── Tabs ──────────────────────────────────────────
function switchTab(tab) {
  const codeView = document.getElementById('codeView');
  const previewView = document.getElementById('previewView');
  const tabCode = document.getElementById('tabCode');
  const tabPreview = document.getElementById('tabPreview');
 
  if (tab === 'code') {
    codeView.style.display = 'block';
    previewView.style.display = 'none';
    tabCode.classList.add('active');
    tabPreview.classList.remove('active');
  } else {
    codeView.style.display = 'none';
    previewView.style.display = 'block';
    tabCode.classList.remove('active');
    tabPreview.classList.add('active');
 
    if (currentCode) {
      const iframe = document.getElementById('previewFrame');
      iframe.srcdoc = currentCode;
    }
  }
}
 
// ── Copy ──────────────────────────────────────────
async function copyCode() {
  if (!currentCode) return;
  try {
    await navigator.clipboard.writeText(currentCode);
    const btn = event.target;
    btn.textContent = '✅ Copied!';
    setTimeout(() => { btn.textContent = '📋 Copy'; }, 2000);
  } catch {
    showError('Could not copy. Please select and copy manually.');
  }
}
 
// ── Download ──────────────────────────────────────
function downloadCode() {
  if (!currentCode) return;
  const blob = new Blob([currentCode], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'instantcode-output.html';
  a.click();
  URL.revokeObjectURL(url);
}
 
// ── Error ─────────────────────────────────────────
function showError(msg) {
  const box = document.getElementById('errorBox');
  box.textContent = msg;
  box.classList.add('visible');
}
 