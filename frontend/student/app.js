import {
  connectWallet,
  getWalletAddress,
  certifyDocument,
  getMyDocuments,
} from '../shared/js/contract.js';
import { uploadPdfToBackend, buildIpfsUrl } from '../shared/js/ipfs.js';

let currentCid = null;
let pendingDocumentMeta = null;
let connectedAddress = '';

const connectBtn = document.getElementById('connectBtn');
const copyWalletBtn = document.getElementById('copyWalletBtn');
const walletStatus = document.getElementById('walletStatus');
const walletConnected = document.getElementById('walletConnected');
const documentTypeInput = document.getElementById('documentType');
const documentTitleInput = document.getElementById('documentTitle');
const documentDescriptionInput = document.getElementById('documentDescription');
const pdfFileInput = document.getElementById('pdfFile');
const uploadBtn = document.getElementById('uploadBtn');
const uploadResult = document.getElementById('uploadResult');
const cidLink = document.getElementById('cidLink');
const copyCidBtn = document.getElementById('copyCidBtn');
const registerBtn = document.getElementById('registerBtn');
const registerResult = document.getElementById('registerResult');
const documentsList = document.getElementById('documentsList');
const refreshDocsBtn = document.getElementById('refreshDocsBtn');
const topbarWalletDot = document.getElementById('topbarWalletDot');
const topbarWalletStatus = document.getElementById('topbarWalletStatus');
const walletDot = document.getElementById('walletDot');

const DOCUMENT_TYPE_META = {
  'Transcript of Records': { short: 'TOR', labelClass: 'doc-tag doc-tag-blue' },
  'Learning Agreement': { short: 'LA', labelClass: 'doc-tag doc-tag-green' },
  'Certificate of Stay': { short: 'COS', labelClass: 'doc-tag doc-tag-orange' },
  Other: { short: 'ALTRO', labelClass: 'doc-tag doc-tag-purple' },
};

document.addEventListener('DOMContentLoaded', async () => {
  checkUploadReady();
  await tryRestoreWalletState();
});

connectBtn.addEventListener('click', async () => {
  try {
    setWalletPendingState('Connessione in corso...');
    connectBtn.disabled = true;
    connectBtn.textContent = 'Connessione...';
    const { address } = await connectWallet();
    applyConnectedWalletState(address);
    await loadMyDocuments();
  } catch (err) {
    setWalletDisconnectedState(`Errore: ${err.message}`);
  } finally {
    connectBtn.disabled = false;
    if (connectBtn.style.display !== 'none') connectBtn.textContent = 'Collega MetaMask';
  }
});

copyWalletBtn.addEventListener('click', async () => {
  if (!connectedAddress) return;
  const copied = await copyToClipboard(connectedAddress);
  pulseButton(copyWalletBtn, copied ? 'Copiato' : 'Riprova');
});

[documentTypeInput, documentTitleInput, documentDescriptionInput, pdfFileInput].forEach((el) => {
  el.addEventListener('input', checkUploadReady);
  el.addEventListener('change', checkUploadReady);
});

uploadBtn.addEventListener('click', async () => {
  const file = pdfFileInput.files[0];
  if (!file) return;

  const metadata = collectDocumentMetadata();
  if (!metadata.valid) {
    alert(metadata.message);
    return;
  }

  uploadBtn.disabled = true;
  uploadBtn.textContent = 'Caricamento...';

  try {
    const { cid, gatewayUrl } = await uploadPdfToBackend(file);
    currentCid = cid;
    pendingDocumentMeta = metadata.payload;
    cidLink.href = gatewayUrl;
    uploadResult.style.display = 'block';
    registerBtn.disabled = false;
    registerResult.style.display = 'none';
  } catch (err) {
    alert(`Errore durante l'upload: ${err.message}`);
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.textContent = 'Carica su IPFS';
  }
});

copyCidBtn.addEventListener('click', async () => {
  if (!currentCid) return;
  const copied = await copyToClipboard(currentCid);
  pulseButton(copyCidBtn, copied ? 'CID copiato' : 'Riprova');
});

registerBtn.addEventListener('click', async () => {
  if (!currentCid) return;

  registerBtn.disabled = true;
  registerResult.style.display = 'block';
  registerResult.innerHTML = '<div class="loading">Registrazione in corso...</div>';

  try {
    await certifyDocument(currentCid);
    saveDocumentMetadata(currentCid, pendingDocumentMeta);
    registerResult.innerHTML = '<div class="inline-note success-note">Documento registrato</div>';
    currentCid = null;
    pendingDocumentMeta = null;
    uploadResult.style.display = 'none';
    registerBtn.disabled = true;
    pdfFileInput.value = '';
    documentTypeInput.value = '';
    documentTitleInput.value = '';
    documentDescriptionInput.value = '';
    checkUploadReady();
    await loadMyDocuments();
  } catch (err) {
    registerResult.innerHTML = `<div class="inline-note error-note">${escapeHtml(err.message)}</div>`;
  } finally {
    registerBtn.disabled = false;
  }
});

refreshDocsBtn.addEventListener('click', loadMyDocuments);

async function tryRestoreWalletState() {
  if (!window.ethereum) {
    setWalletDisconnectedState('MetaMask non rilevato');
    return;
  }
  try {
    const address = await getWalletAddress();
    if (address) {
      applyConnectedWalletState(address);
      await loadMyDocuments();
    } else {
      setWalletDisconnectedState('Wallet non collegato');
    }
  } catch (_) {
    setWalletDisconnectedState('Wallet non collegato');
  }
}

async function loadMyDocuments() {
  try {
    const address = connectedAddress || await getWalletAddress();
    if (!address) {
      documentsList.innerHTML = emptyState('Wallet non collegato', 'Collega MetaMask per vedere i documenti.');
      return;
    }
    const docs = await getMyDocuments(address);
    renderDocuments(docs);
  } catch (_) {
    documentsList.innerHTML = emptyState('Errore', 'Non è stato possibile recuperare i documenti.');
  }
}

function renderDocuments(docs) {
  if (!docs || docs.length === 0) {
    documentsList.innerHTML = emptyState('Nessun documento', 'Dopo la prima registrazione comparirà qui.');
    return;
  }

  const sortedDocs = [...docs].sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
  documentsList.innerHTML = '';

  for (const doc of sortedDocs) {
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
      </div>
    `;

    item.querySelector('[data-copy-cid]').addEventListener('click', async (e) => {
      const copied = await copyToClipboard(doc.cid);
      pulseMiniAction(e.currentTarget, copied ? 'Copiato' : 'Riprova');
    });

    item.querySelector('[data-download-cid]').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      await downloadPdfFromIpfs(doc.cid, btn.dataset.downloadName || 'document.pdf');
      pulseMiniAction(btn, 'Scaricato');
    });

    documentsList.appendChild(item);
  }
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

function collectDocumentMetadata() {
  const type = documentTypeInput.value.trim();
  const title = documentTitleInput.value.trim();
  const description = documentDescriptionInput.value.trim();
  if (!type) return { valid: false, message: 'Seleziona il tipo di documento.' };
  if (!title) return { valid: false, message: 'Inserisci un nome documento.' };
  return { valid: true, payload: { type, title, description } };
}

function saveDocumentMetadata(cid, metadata) {
  if (!cid || !metadata) return;
  try {
    const current = JSON.parse(localStorage.getItem('erasmuschain_document_meta') || '{}');
    current[cid] = metadata;
    localStorage.setItem('erasmuschain_document_meta', JSON.stringify(current));
  } catch (_) {}
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

function applyConnectedWalletState(address) {
  connectedAddress = address;
  walletStatus.textContent = 'Wallet collegato';
  walletConnected.style.display = 'block';
  connectBtn.style.display = 'none';
  copyWalletBtn.style.display = 'inline-flex';
  setDotState(topbarWalletDot, 'success');
  setDotState(walletDot, 'success');
  topbarWalletStatus.textContent = 'Wallet online';
  checkUploadReady();
}

function disconnectLocalWalletState() {
  connectedAddress = '';
  currentCid = null;
  pendingDocumentMeta = null;
  uploadResult.style.display = 'none';
  registerBtn.disabled = true;
  walletStatus.textContent = 'Wallet non collegato';
  walletConnected.style.display = 'none';
  connectBtn.style.display = 'inline-flex';
  copyWalletBtn.style.display = 'none';
  setDotState(topbarWalletDot, 'warning');
  setDotState(walletDot, 'warning');
  topbarWalletStatus.textContent = 'Wallet offline';
  documentsList.innerHTML = emptyState('Wallet disconnesso', 'Ricollega MetaMask per vedere i documenti.');
}

function setWalletPendingState(message) {
  walletStatus.textContent = message;
  walletConnected.style.display = 'none';
  connectBtn.style.display = 'inline-flex';
  copyWalletBtn.style.display = 'none';
  setDotState(topbarWalletDot, 'warning');
  setDotState(walletDot, 'warning');
  topbarWalletStatus.textContent = 'Connessione';
}

function setWalletDisconnectedState(message) {
  connectedAddress = '';
  walletStatus.textContent = message;
  walletConnected.style.display = 'none';
  connectBtn.style.display = 'inline-flex';
  copyWalletBtn.style.display = 'none';
  setDotState(topbarWalletDot, 'warning');
  setDotState(walletDot, 'warning');
  topbarWalletStatus.textContent = 'Wallet offline';
  registerBtn.disabled = true;
}

function setDotState(element, state) {
  if (!element) return;
  element.classList.remove('success', 'warning', 'error', 'connected');
  element.classList.add(state);
}

function checkUploadReady() {
  const hasType = Boolean(documentTypeInput.value.trim());
  const hasTitle = Boolean(documentTitleInput.value.trim());
  const hasFile = Boolean(pdfFileInput.files.length);
  const hasWallet = Boolean(connectedAddress);
  uploadBtn.disabled = !(hasType && hasTitle && hasFile && hasWallet);
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

function pulseButton(button, text) {
  const original = button.textContent;
  button.textContent = text;
  setTimeout(() => { button.textContent = original; }, 1200);
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
