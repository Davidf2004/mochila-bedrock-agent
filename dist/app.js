import { demoText, correctionText, initialDemo, correctedDemo } from './demo.js';

const $ = selector => document.querySelector(selector);
const elements = {
  form: $('#plan-form'), text: $('#group-messages'), child: $('#child-name'), date: $('#target-date'),
  count: $('#character-count'), inputMode: $('#input-mode'), resultMode: $('#result-mode'),
  submit: $('#submit-button'), submitLabel: $('#submit-label'), error: $('#form-error'),
  example: $('#example-button'), emptyExample: $('#empty-example-button'),
  correctionPrompt: $('#correction-prompt'), correction: $('#correction-button'),
  result: $('#result'), empty: $('#empty-state'), loading: $('#loading-state'),
  status: $('#connection-status'), dialog: $('#evidence-dialog'), evidence: $('#evidence-content'), toast: $('#toast'),
};
const state = { configured: false, mode: null, data: null, childMode: false, busy: false, checked: {}, inputSnapshot: '', toastTimer: null };
const fullDemoText = `${demoText}\n${correctionText}`;
const icons = {
  source: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6.5 9.5 9.5 6.5M5.5 11.5l-1 1a2.8 2.8 0 0 1-4-4l3-3a2.8 2.8 0 0 1 4 0m1 5a2.8 2.8 0 0 0 4 0l3-3a2.8 2.8 0 0 0-4-4l-1 1" transform="translate(1 0) scale(.85)" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.5"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  child: '<svg viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="1.3"/><path d="M6 10.5c1.3 2 4.7 2 6 0M6 7h.01M12 7h.01M7 2c0 3 4 3 4 0" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
  copy: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="5" y="5" width="8" height="9" rx="1.5" stroke="currentColor"/><path d="M10 5V2H2v9h3" stroke="currentColor" stroke-linejoin="round"/></svg>',
  download: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 2v8m-3-3 3 3 3-3M2 11v3h12v-3" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round"/></svg>',
  calendar: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="2" y="4" width="12" height="10" rx="1.5" stroke="currentColor"/><path d="M5 2v4m6-4v4M2 8h12" stroke="currentColor" stroke-linecap="round"/></svg>',
};

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}
function evidenceIds(values) { return (Array.isArray(values) ? values : []).filter(id => Number.isInteger(id) && id >= 0); }
function evidenceButton(values, label = 'Ver aviso') {
  const ids = evidenceIds(values);
  return ids.length ? `<button type="button" class="source-button" data-evidence="${ids.join(',')}" aria-label="${escapeHtml(label)}, mensaje ${ids.join(', ')}">${icons.source}${escapeHtml(label)}</button>` : '';
}
function snapshot() { return JSON.stringify([elements.text.value, elements.child.value.trim(), elements.date.value]); }
function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && date.getFullYear() === Number(value.slice(0, 4)) && date.getMonth() + 1 === Number(value.slice(5, 7)) && date.getDate() === Number(value.slice(8, 10));
}
function displayDate(value) {
  return validDate(value) ? new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${value}T12:00:00`)) : 'Fecha por confirmar';
}
function validTime(value) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(value || ''); }
function displayTime(value) { return validTime(value) ? `${Number(value.slice(0, 2))}:${value.slice(3)}` : 'Por confirmar'; }
function checkKey(plan) { return `mochila:v1:${state.mode}:${String(plan.child || '').trim().toLowerCase()}:${plan.date}:${plan.title}`; }
function itemKey(item) { return `${String(item.id)}|${String(item.label).trim()}`; }
function loadChecks(plan) {
  try {
    const parsed = JSON.parse(localStorage.getItem(checkKey(plan)) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch { return {}; }
}
function saveChecks() {
  if (!state.data) return;
  try { localStorage.setItem(checkKey(state.data.plan), JSON.stringify(state.checked)); } catch { /* The list remains usable without browser storage. */ }
}
function showToast(message) {
  window.clearTimeout(state.toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add('visible');
  state.toastTimer = window.setTimeout(() => elements.toast.classList.remove('visible'), 3500);
}
function showError(message) { elements.error.textContent = message; elements.error.hidden = false; }
function clearError() { elements.error.hidden = true; elements.error.textContent = ''; }

function updateInput() {
  elements.count.textContent = `${elements.text.value.length.toLocaleString('es-MX')} / 12,000`;
  const isFixture = [demoText, fullDemoText].includes(elements.text.value.trim()) && elements.date.value === '2026-10-13';
  elements.inputMode.classList.toggle('demo', isFixture);
  elements.inputMode.textContent = isFixture
    ? 'Demo guiada · mensajes ficticios · sin llamada a IA.'
    : state.configured
      ? 'Tus mensajes se enviarán a Amazon Bedrock al crear la lista.'
      : 'Amazon Bedrock no conectado. Puedes probar el ejemplo guiado.';
  if (state.data && !state.busy) {
    const existing = $('#stale-notice');
    const stale = state.inputSnapshot !== snapshot();
    if (stale && !existing) {
      const notice = document.createElement('p');
      notice.id = 'stale-notice';
      notice.className = 'result-stale';
      notice.textContent = 'Cambiaste los datos de entrada. Esta lista todavía corresponde a la versión anterior.';
      elements.result.prepend(notice);
    } else if (!stale && existing) existing.remove();
  }
}

function renderItem(item) {
  const key = itemKey(item);
  const uncertain = item.required === 'unclear';
  const badge = uncertain ? '<span class="requirement-badge unclear">Por confirmar</span>' : item.required === 'optional' ? '<span class="requirement-badge">Opcional</span>' : '';
  const control = uncertain
    ? '<span class="uncertain-mark" aria-label="Por confirmar">?</span>'
    : `<input type="checkbox" data-item="${escapeHtml(key)}" ${state.checked[key] ? 'checked' : ''} aria-label="${escapeHtml(item.label)} preparado">`;
  const labelTag = uncertain ? 'div' : 'label';
  return `<li class="check-item"><${labelTag} class="check-label">${control}<span>${escapeHtml(item.label)}</span></${labelTag}>${badge}${evidenceButton(item.evidence)}</li>`;
}
function renderGroup(title, items) {
  if (!items.length) return '';
  return `<section class="checklist-group"><h3 class="group-label">${title}</h3><ul class="checklist">${items.map(renderItem).join('')}</ul></section>`;
}
function renderTrace(trace) {
  const labels = { read_messages: 'Leer los mensajes y sus fuentes', read_current_plan: 'Revisar la lista anterior', save_plan: 'Preparar una lista comprobable' };
  return (Array.isArray(trace) ? trace : []).map((step, index) => {
    if (typeof step === 'string') return `<li>${escapeHtml(step)}</li>`;
    const title = labels[step.tool] || step.tool || `Paso ${index + 1}`;
    const detail = step.detail || (step.status === 'error' ? 'Este paso no se pudo completar.' : state.mode === 'demo' ? 'Paso del recorrido ilustrativo de esta demo.' : 'Paso completado por el agente.');
    return `<li><strong>${escapeHtml(title)}</strong>${escapeHtml(detail)}</li>`;
  }).join('');
}
function progress() {
  const required = state.data.plan.items.filter(item => item.required === 'required' && (!state.childMode || item.kind !== 'prepare'));
  return { total: required.length, done: required.filter(item => state.checked[itemKey(item)]).length };
}
function renderResult() {
  if (!state.data) return;
  const { plan, trace } = state.data;
  const { total, done } = progress();
  const percentage = total ? Math.round(done / total * 100) : 0;
  const complete = total > 0 && done === total;
  const remainingAdultItems = plan.items.filter(item => item.kind === 'prepare' && item.required === 'required' && !state.checked[itemKey(item)]).length;
  const childName = plan.child || 'tu peque';
  const title = state.childMode ? `¡Vamos, ${childName}!` : `La mochila de ${childName}`;
  const changes = Array.isArray(plan.changes) ? plan.changes : [];
  const questions = Array.isArray(plan.questions) ? plan.questions : [];
  const changesHtml = changes.length ? `<section class="change-box" aria-label="Cambios detectados"><h3><span aria-hidden="true">↻</span> Esto cambió. Lo demás sigue listo.</h3>${changes.map(change => `<div class="change-row"><s>${escapeHtml(change.before)}</s><span aria-hidden="true">→</span><strong>${escapeHtml(change.after)}</strong>${evidenceButton(change.evidence)}</div>`).join('')}</section>` : '';
  const questionsHtml = questions.length ? `<section class="question-box"><h3>Una duda para confirmar</h3>${questions.map(question => `<div class="question-row"><p>${escapeHtml(question.question)}</p>${evidenceButton(question.evidence)}</div>`).join('')}</section>` : '';
  const visibleItems = plan.items.filter(item => !state.childMode || item.kind !== 'prepare');
  const packItems = visibleItems.filter(item => item.kind !== 'prepare' && item.kind !== 'wear');
  const wearItems = visibleItems.filter(item => item.kind === 'wear');
  const prepareItems = visibleItems.filter(item => item.kind === 'prepare');
  elements.result.classList.toggle('child-view', state.childMode);
  elements.result.innerHTML = `
    <div class="result-head"><div><p class="result-overline">${escapeHtml(plan.title)}</p><h2 class="result-title">${escapeHtml(title)}</h2><p class="result-date">${escapeHtml(displayDate(plan.date))}</p></div><button type="button" class="result-switch ${state.childMode ? 'active' : ''}" data-action="child" aria-pressed="${state.childMode}">${icons.child}${state.childMode ? 'Vista familiar' : 'Lo preparo yo'}</button></div>
    ${changesHtml}
    <div class="arrival-card"><span class="arrival-icon">${icons.clock}</span><div><p class="arrival-label">HORA DE LLEGADA</p><div class="arrival-time">${escapeHtml(displayTime(plan.arrivalTime))}${validTime(plan.arrivalTime) ? '<small>hora local</small>' : ''}</div></div><span class="arrival-source">${validTime(plan.arrivalTime) ? 'Revisa antes de salir.' : 'No hay una hora confirmada.'}<br>${evidenceButton(state.data.messages.map(message => message.id), 'Ver mensajes')}</span></div>
    <p class="summary-text">${state.childMode ? 'Marca lo que ya pusiste en tu mochila. Lo de firmar se lo dejamos a una persona adulta.' : escapeHtml(plan.summary)}</p>
    <div class="progress-header"><span>${complete ? 'Todo lo confirmado, preparado' : state.childMode ? 'Tu misión de hoy' : 'Lo que ya está listo'}</span><span class="progress-count">${done} de ${total}</span></div><div class="progress-track" role="progressbar" aria-label="Elementos confirmados preparados" aria-valuemin="0" aria-valuemax="${total || 1}" aria-valuenow="${done}"><div class="progress-fill" style="width:${percentage}%"></div></div>
    ${renderGroup(state.childMode ? 'DENTRO DE TU MOCHILA' : 'PARA LA MOCHILA', packItems)}
    ${renderGroup('PARA LLEVAR PUESTO', wearItems)}
    ${renderGroup('PARA UNA PERSONA ADULTA', prepareItems)}
    ${questionsHtml}
    ${complete ? `<div class="completion-message" role="status"><strong>${state.childMode ? 'Tu parte está lista. ¡Choca esos cinco! ✋' : 'Listo. Una cosa menos en tu cabeza.'}</strong>${state.childMode && remainingAdultItems ? `Una persona adulta todavía debe revisar ${remainingAdultItems} ${remainingAdultItems === 1 ? 'cosa' : 'cosas'} de su lista.${questions.length ? ' También queda una duda por confirmar.' : ''}` : questions.length ? 'Sólo falta aclarar la duda que aparece arriba.' : 'Ahora sí, a disfrutar lo que queda del día.'}</div>` : ''}
    <div class="export-actions" aria-label="Guardar o compartir la lista"><button type="button" class="export-button" data-action="copy">${icons.copy}Copiar lista</button><button type="button" class="export-button" data-action="download">${icons.download}Descargar</button>${validDate(plan.date) && validTime(plan.arrivalTime) ? `<button type="button" class="export-button" data-action="calendar">${icons.calendar}Al calendario</button>` : ''}</div>
    <details class="trace-details"><summary>${state.mode === 'demo' ? 'Cómo se resolvió este ejemplo' : 'Qué hizo el agente'}</summary><ol class="trace-list">${renderTrace(trace)}</ol><p class="trace-disclaimer">${state.mode === 'demo' ? 'Recorrido ilustrativo con respuestas preparadas. Esta demo no ejecuta herramientas ni usa IA.' : 'Revisa siempre las fuentes. El agente puede equivocarse.'} Sólo las marcas de tu lista se guardan en este navegador.</p></details>
  `;
  elements.empty.hidden = true;
  elements.loading.hidden = true;
  elements.result.hidden = false;
  elements.resultMode.hidden = false;
  elements.resultMode.classList.toggle('live', state.mode === 'live');
  elements.resultMode.textContent = state.mode === 'demo' ? 'Demo guiada · mensajes ficticios' : 'Generado con Amazon Bedrock';
  updateInput();
}

function applyData(data, mode) {
  const oldPlan = state.data?.plan;
  const oldChecks = state.checked;
  const oldMode = state.mode;
  state.mode = mode;
  state.data = data;
  state.checked = loadChecks(data.plan);
  if (oldPlan && oldMode === mode && oldPlan.child === data.plan.child && oldPlan.date === data.plan.date && oldPlan.title === data.plan.title) {
    for (const item of data.plan.items) {
      const key = itemKey(item);
      if (Object.hasOwn(oldChecks, key)) state.checked[key] = oldChecks[key];
    }
  }
  state.inputSnapshot = snapshot();
  saveChecks();
  renderResult();
}

function loadExample() {
  if (state.busy) return;
  clearError();
  elements.text.value = demoText;
  elements.child.value = 'Leo';
  elements.date.value = '2026-10-13';
  state.childMode = false;
  applyData(structuredClone(initialDemo), 'demo');
  elements.correctionPrompt.hidden = false;
  elements.submitLabel.textContent = 'Revisar esta mañana';
  showToast('Ejemplo cargado. Marca algo y prueba la corrección.');
}
function applyCorrection() {
  if (state.busy) return;
  if (state.mode !== 'demo' || elements.text.value.trim() !== demoText || elements.date.value !== '2026-10-13') {
    showError('La corrección pertenece al ejemplo ficticio. Pulsa “Probar ejemplo” para volver a ese recorrido. Conservamos tu texto.');
    return;
  }
  clearError();
  elements.text.value = fullDemoText;
  const data = structuredClone(correctedDemo);
  data.plan.child = elements.child.value.trim() || 'Leo';
  applyData(data, 'demo');
  elements.correctionPrompt.hidden = true;
  showToast('La llegada cambió a 7:45. Lo que preparaste sigue marcado.');
}

function setBusy(busy) {
  state.busy = busy;
  for (const element of [elements.submit, elements.text, elements.child, elements.date, elements.example, elements.emptyExample, elements.correction]) element.disabled = busy;
  $('.output-panel').setAttribute('aria-busy', String(busy));
  elements.submitLabel.textContent = busy ? 'Ordenando los avisos…' : state.data ? 'Revisar esta mañana' : 'Dejar lista la mañana';
  if (busy) {
    elements.empty.hidden = true;
    elements.result.hidden = true;
    elements.loading.hidden = false;
  } else {
    elements.loading.hidden = true;
    if (state.data) renderResult(); else elements.empty.hidden = false;
  }
}

async function submitPlan(event) {
  event.preventDefault();
  if (state.busy) return;
  clearError();
  const text = elements.text.value.trim();
  const rawChildName = elements.child.value.trim();
  const childName = rawChildName || 'Mi peque';
  const targetDate = elements.date.value;
  if (!text || !validDate(targetDate)) { showError('Pega algunos mensajes y elige una fecha válida para preparar la lista.'); return; }
  if ([demoText, fullDemoText].includes(text) && targetDate === '2026-10-13') {
    const data = structuredClone(text === fullDemoText ? correctedDemo : initialDemo);
    data.plan.child = rawChildName || 'Leo';
    applyData(data, 'demo');
    elements.correctionPrompt.hidden = text === fullDemoText;
    return;
  }
  if (!state.configured) {
    showError('Tu texto sigue aquí. Para ordenar mensajes propios hace falta conectar Amazon Bedrock en el servidor. Mientras tanto, “Probar ejemplo” te permite recorrer una demo guiada con mensajes ficticios.');
    return;
  }
  const currentPlan = state.mode === 'live' && state.data?.plan.date === targetDate && state.data?.plan.child === childName ? state.data.plan : undefined;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 90000);
  setBusy(true);
  try {
    const response = await fetch('/api/plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, childName, targetDate, ...(currentPlan ? { currentPlan } : {}) }), signal: controller.signal });
    let data;
    try { data = await response.json(); } catch { throw new Error('El servidor no devolvió una lista válida. Conservamos tus mensajes; puedes intentarlo otra vez.'); }
    if (!response.ok) {
      const message = typeof data.error === 'string' ? data.error : data.error?.message || data.message;
      throw new Error(message || 'No pudimos crear la lista. Revisa la conexión del servidor con Amazon Bedrock e inténtalo otra vez.');
    }
    if (data.mode !== 'live' || !data.plan || !Array.isArray(data.plan.items) || !Array.isArray(data.messages)) throw new Error('La respuesta llegó incompleta. Conservamos tu texto para que puedas volver a intentarlo.');
    applyData(data, 'live');
    elements.correctionPrompt.hidden = true;
    elements.status.classList.add('connected');
    elements.status.innerHTML = '<span class="status-dot"></span>Bedrock conectado';
    showToast('Tu mañana está ordenada. Revisa las fuentes antes de preparar.');
  } catch (error) {
    showError(error.name === 'AbortError' ? 'Está tardando más de lo esperado. Tus mensajes siguen aquí; puedes volver a intentarlo.' : error.message || 'No pudimos conectar. Tus mensajes siguen aquí.');
  } finally {
    window.clearTimeout(timeout);
    setBusy(false);
  }
}

function showEvidence(ids) {
  if (!state.data) return;
  const messages = state.data.messages.filter(message => ids.includes(message.id));
  elements.evidence.innerHTML = messages.length
    ? messages.map(message => `<blockquote class="message-evidence"><small>MENSAJE ${escapeHtml(message.id)}${state.mode === 'demo' ? ' · FICTICIO' : ''}</small><p>${escapeHtml(message.text)}</p></blockquote>`).join('')
    : '<p>Esta fuente no está disponible en los mensajes de la lista.</p>';
  if (typeof elements.dialog.showModal === 'function') elements.dialog.showModal();
  else elements.dialog.setAttribute('open', '');
}
function checklistText() {
  const { plan } = state.data;
  const lines = [state.mode === 'demo' ? 'MOCHILA — DEMO GUIADA · MENSAJES FICTICIOS' : 'MOCHILA', plan.title, `Para: ${plan.child || 'Mi peque'}`, displayDate(plan.date), `Hora de llegada: ${displayTime(plan.arrivalTime)}${validTime(plan.arrivalTime) ? ' (hora local)' : ''}`, ''];
  for (const item of plan.items.filter(item => !state.childMode || item.kind !== 'prepare')) {
    lines.push(`${item.required === 'unclear' ? '[?]' : state.checked[itemKey(item)] ? '[✓]' : '[ ]'} ${item.label}${item.required === 'optional' ? ' (opcional)' : item.required === 'unclear' ? ' (por confirmar)' : ''}${item.kind === 'prepare' ? ' — persona adulta' : ''} [mensaje ${evidenceIds(item.evidence).join(', ')}]`);
  }
  if (plan.changes?.length) lines.push('', 'CAMBIOS', ...plan.changes.map(change => `${change.before} → ${change.after}`));
  if (plan.questions?.length) lines.push('', 'POR CONFIRMAR', ...plan.questions.map(question => question.question));
  lines.push('', 'FUENTES', ...state.data.messages.map(message => `[${message.id}] ${message.text}`), '', 'Revisa los avisos originales antes de salir.');
  return lines.join('\n');
}
function downloadFile(name, contents, type) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 5000);
}
function icsEscape(value) { return String(value).replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,'); }
function foldIcsLine(line) {
  const encoder = new TextEncoder();
  const parts = [];
  let part = '';
  for (const character of line) {
    if (encoder.encode(part + character).length > 73) { parts.push(part); part = ' '; }
    part += character;
  }
  parts.push(part);
  return parts.join('\r\n');
}
function downloadCalendar() {
  const { plan } = state.data;
  if (!validDate(plan.date) || !validTime(plan.arrivalTime)) return;
  const uid = `mochila-${Date.now()}-${Math.random().toString(36).slice(2)}@local`;
  const start = `${plan.date.replace(/-/g, '')}T${plan.arrivalTime.replace(':', '')}00`;
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MOCHILA//Lista escolar//ES', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', `UID:${uid}`, `DTSTAMP:${stamp}`, `DTSTART:${start}`, `SUMMARY:${icsEscape(`${state.mode === 'demo' ? '[DEMO] ' : ''}Llegada: ${plan.title} — ${plan.child || 'Mi peque'}`)}`, `DESCRIPTION:${icsEscape(`${checklistText()}\n\nHora local. El evento indica llegada, no salida.`)}`, 'END:VEVENT', 'END:VCALENDAR'];
  downloadFile(`mochila-llegada-${plan.date}.ics`, `${lines.map(foldIcsLine).join('\r\n')}\r\n`, 'text/calendar;charset=utf-8');
  showToast('Calendario descargado con la hora local de llegada.');
}
async function performAction(action) {
  if (!state.data) return;
  if (action === 'child') {
    state.childMode = !state.childMode;
    renderResult();
    $('[data-action="child"]')?.focus();
  } else if (action === 'download') {
    downloadFile(`mochila-${state.data.plan.date || 'lista'}.txt`, checklistText(), 'text/plain;charset=utf-8');
    showToast('Tu lista está descargada.');
  } else if (action === 'calendar') downloadCalendar();
  else if (action === 'copy') {
    try {
      await navigator.clipboard.writeText(checklistText());
      showToast('Lista copiada, con sus fuentes.');
    } catch { showToast('No pudimos copiarla. Puedes descargar la lista como archivo.'); }
  }
}

elements.form.addEventListener('submit', submitPlan);
elements.example.addEventListener('click', loadExample);
elements.emptyExample.addEventListener('click', loadExample);
elements.correction.addEventListener('click', applyCorrection);
for (const input of [elements.text, elements.child, elements.date]) input.addEventListener('input', () => { clearError(); updateInput(); });
elements.result.addEventListener('click', event => {
  const evidence = event.target.closest('[data-evidence]');
  if (evidence) { showEvidence(evidence.dataset.evidence.split(',').map(Number)); return; }
  const action = event.target.closest('[data-action]');
  if (action) performAction(action.dataset.action);
});
elements.result.addEventListener('change', event => {
  const checkbox = event.target.closest('input[data-item]');
  if (!checkbox || !state.data) return;
  const itemId = checkbox.dataset.item;
  state.checked[itemId] = checkbox.checked;
  saveChecks();
  renderResult();
  const replacement = [...elements.result.querySelectorAll('input[data-item]')].find(input => input.dataset.item === itemId);
  replacement?.focus({ preventScroll: true });
});
$('#close-evidence').addEventListener('click', () => elements.dialog.close());
elements.dialog.addEventListener('click', event => { if (event.target === elements.dialog) { const rect = elements.dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) elements.dialog.close(); } });

async function checkConnection() {
  try {
    const response = await fetch('/api/status', { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(6000) });
    if (!response.ok) throw new Error('Unavailable');
    const status = await response.json();
    state.configured = status.configured === true;
    elements.status.innerHTML = `<span class="status-dot"></span>${state.configured ? 'Bedrock configurado' : 'Demo disponible'}`;
    elements.status.title = state.configured ? 'Configuración detectada; la conexión se verificará al crear una lista.' : 'Amazon Bedrock no conectado. La demo guiada está disponible.';
  } catch {
    state.configured = false;
    elements.status.innerHTML = '<span class="status-dot"></span>Demo disponible';
    elements.status.title = 'Servidor no conectado. Puedes usar la demo guiada.';
  }
  updateInput();
}
updateInput();
checkConnection();
