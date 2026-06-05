import {
  createReadOnlyProvider,
  createReadOnlyContract,
  getStudentDocumentsReadOnly,
  verifyDocumentReadOnly,
} from '../shared/js/contract.js';
import { buildIpfsUrl } from '../shared/js/ipfs.js';

const provider = createReadOnlyProvider();
const contractReadOnly = createReadOnlyContract(provider);

const searchForm = document.getElementById('searchForm');
const studentWalletInput = document.getElementById('studentWallet');
const searchBtn = document.getElementById('searchBtn');
const documentsList = document.getElementById('documentsList');
const verifyForm = document.getElementById('verifyForm');
const verifyWalletInput = document.getElementById('verifyWallet');
const verifyCidInput = document.getElementById('verifyCid');
const verifyBtn = document.getElementById('verifyBtn');
const verifyResult = document.getElementById('verifyResult');

const DOCUMENT_TYPE_META = {
  'Transcript of Records': { short: 'TOR', labelClass: 'doc-tag doc-tag-blue' },
  'Learning Agreement': { short: 'LA', labelClass: 'doc-tag doc-tag-green' },
  'Certificate of Stay': { short: 'COS', labelClass: 'doc-tag doc-tag-orange' },
  Other: { short: 'ALTRO', labelClass: 'doc-tag doc-tag-purple' },
};

searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const studentAddress = studentWalletInput.value.trim();
  if (!isValidAddress(studentAddress)) {
    alert('Indirizzo wallet non valido.');
    return;
  }

  searchBtn.disabled = true;
  searchBtn.textContent = 'Ricerca...';
  documentsList.innerHTML = '<div class="loading">Ricerca in corso...</div>';

  try {
    const docs = await getStudentDocumentsReadOnly(contractReadOnly, studentAddress);
    renderDocuments(docs, studentAddress);
  } catch (_) {
    documentsList.innerHTML = emptyState('Errore', 'Non è stato possibile recuperare i documenti.');
  } finally {
    searchBtn.disabled = false;
    searchBtn.textContent = 'Cerca documenti';
  }
});

verifyForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const studentAddress = verifyWalletInput.value.trim();
  const cid = verifyCidInput.value.trim();
  if (!isValidAddress(studentAddress)) {
    alert('Indirizzo wallet non valido.');
    return;
  }
  if (!cid) {
    alert('Inserisci un CID.');
    return;
  }

  verifyBtn.disabled = true;
  verifyBtn.textContent = 'Verifica...';
  verifyResult.style.display = 'block';
  verifyResult.innerHTML = '<div class="loading">Verifica in corso...</div>';

  try {
    const isValid = await verifyDocumentReadOnly(contractReadOnly, studentAddress, cid);
    verifyResult.innerHTML = isValid
      ? '<div class="inline-note success-note">CID autentico</div>'
      : '<div class="inline-note error-note">CID non autentico</div>';
  } catch (err) {
    verifyResult.innerHTML = `<div class="inline-note error-note">${escapeHtml(err.message)}</div>`;
  } finally {
    verifyBtn.disabled = false;
    verifyBtn.textContent = 'Verifica CID';
  }
});

function renderDocuments(docs, studentAddress) {
  if (!docs || docs.length === 0) {
    documentsList.innerHTML = emptyState('Nessun documento', 'Non risultano documenti per questo wallet.');
    return;
  }

  const sortedDocs = [...docs].sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
  documentsList.innerHTML = '';

  sortedDocs.forEach((doc) => {
    const localMeta = getDocumentMetadata(doc.cid);
    const docType = localMeta?.type || 'Other';
    const docTitle = localMeta?.title || 'Documento Erasmus';
    const docDescription = localMeta?.description || '';
    const date = new Date(Number(doc.timestamp) * 1000).toLocaleDateString('it-IT');
    const typeMeta = getTypeMeta(docType);
    const fileName = buildPdfFileName(docTitle);

    const item = document.createElement('article');
    item.className = 'doc-card';
    item.innerHTML = `
      <div class="doc-card-top">
        <span class="${typeMeta.labelClass}">${escapeHtml(typeMeta.short)}</span>
      </div>
      <div class="doc-card-title">${escapeHtml(docTitle)}</div>
      <div class="doc-card-subtitle">${escapeHtml(docType)}</div>
      <div class="doc-card-note">${escapeHtml(docDescription || 'Nessuna nota')}</div>
      <div class="doc-card-foot">${escapeHtml(date)}</div>
      <div class="doc-card-actions actions-with-labels">
        <button class="mini-action" type="button" data-copy-wallet="${escapeAttribute(studentAddress)}" aria-label="Copia account studente">
          <span class="mini-action-icon">${userIcon()}</span>
          <span class="mini-action-text">Copia account</span>
        </button>
        <button class="mini-action" type="button" data-copy-cid="${escapeAttribute(doc.cid)}" aria-label="Copia CID documento">
          <span class="mini-action-icon">${copyIcon()}</span>
          <span class="mini-action-text">Copia CID</span>
        </button>
        <a href="${buildIpfsUrl(doc.cid)}" target="_blank" rel="noopener noreferrer" class="mini-action" aria-label="Apri documento PDF">
          <span class="mini-action-icon">${openIcon()}</span>
          <span class="mini-action-text">Apri</span>
        </a>
        <button class="mini-action" type="button" data-download-cid="${escapeAttribute(doc.cid)}" data-download-name="${escapeAttribute(fileName)}" aria-label="Scarica PDF con nome documento">
          <span class="mini-action-icon">${downloadIcon()}</span>
          <span class="mini-action-text">Scarica</span>
        </button>
        <button class="mini-action" type="button" data-fill-verify-cid="${escapeAttribute(doc.cid)}" data-fill-verify-wallet="${escapeAttribute(studentAddress)}" aria-label="Usa per verifica">
          <span class="mini-action-icon">${checkIcon()}</span>
          <span class="mini-action-text">Verifica</span>
        </button>
      </div>
    `;

    item.querySelector('[data-copy-cid]').addEventListener('click', async (e) => {
      const copied = await copyToClipboard(doc.cid);
      pulseMiniAction(e.currentTarget, copied ? 'Copiato' : 'Riprova');
    });

    item.querySelector('[data-copy-wallet]').addEventListener('click', async (e) => {
      const copied = await copyToClipboard(studentAddress);
      pulseMiniAction(e.currentTarget, copied ? 'Copiato' : 'Riprova');
    });

    item.querySelector('[data-download-cid]').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      await downloadPdfFromIpfs(doc.cid, btn.dataset.downloadName || 'document.pdf');
      pulseMiniAction(btn, 'Scaricato');
    });

    item.querySelector('[data-fill-verify-cid]').addEventListener('click', (e) => {
      verifyWalletInput.value = studentAddress;
      verifyCidInput.value = doc.cid;
      verifyResult.style.display = 'none';
      pulseMiniAction(e.currentTarget, 'Pronto');
      window.scrollTo({ top: verifyForm.offsetTop - 24, behavior: 'smooth' });
    });

    documentsList.appendChild(item);
  });
}

async function downloadPdfFromIpfs(cid, filename) {
  try {
    const response = await fetch(buildIpfsUrl(cid));
    if (!response.ok) throw new Error('Download non riuscito');
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch (_) {
    alert('Errore nel download del PDF.');
  }
}

function buildPdfFileName(title) {
  const base = String(title || 'documento')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
  return `${base || 'documento'}.pdf`;
}

function emptyState(title, text) {
  return `
    <div class="empty-state compact-empty">
      <div class="empty-state-icon">EC</div>
      <div class="empty-state-title">${escapeHtml(title)}</div>
      <div class="empty-state-text">${escapeHtml(text)}</div>
    </div>
  `;
}

function getDocumentMetadata(cid) {
  try {
    const current = JSON.parse(localStorage.getItem('erasmuschain_document_meta') || '{}');
    return current[cid] || null;
  } catch (_) {
    return null;
  }
}

function getTypeMeta(type) {
  return DOCUMENT_TYPE_META[type] || DOCUMENT_TYPE_META.Other;
}

function isValidAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      return fallbackCopy(text);
    }
  }
  return fallbackCopy(text);
}

function fallbackCopy(text) {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    textarea.remove();
    return success;
  } catch (_) {
    return false;
  }
}

function pulseMiniAction(button, text) {
  const label = button.querySelector('.mini-action-text');
  if (!label) return;
  const original = label.textContent;
  label.textContent = text;
  setTimeout(() => { label.textContent = original; }, 1100);
}

function copyIcon() {
  return '<svg aria-hidden="true" viewBox="0 0 24 24"><rect x="9" y="9" width="10" height="10" rx="2"></rect><rect x="5" y="5" width="10" height="10" rx="2"></rect></svg>';
}

function openIcon() {
  return '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M14 5h5v5"></path><path d="M10 14 19 5"></path><path d="M19 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4"></path></svg>';
}

function downloadIcon() {
  return '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 4v10"></path><path d="m8 10 4 4 4-4"></path><path d="M5 18h14"></path></svg>';
}

function checkIcon() {
  return '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"></path></svg>';
}

function userIcon() {
  return '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 21a8 8 0 0 0-16 0"></path><circle cx="12" cy="8" r="4"></circle></svg>';
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
