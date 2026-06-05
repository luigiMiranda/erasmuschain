import { config } from './config.js';

export async function uploadPdfToBackend(file) {
  if (!file || file.type !== 'application/pdf') {
    throw new Error('Carica solo file PDF.');
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${config.backendBaseUrl}/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Errore durante l\'upload.');
  }

  return {
    cid: data.cid,
    gatewayUrl: data.gatewayUrl,
  };
}

export function buildIpfsUrl(cid) {
  return `${config.pinataGatewayBaseUrl}/${cid}`;
}