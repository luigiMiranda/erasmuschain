import axios from 'axios';
import { env } from '../config/env.js';
import { ServiceUnavailableError, BadRequestError } from '../utils/http-errors.js';

const PINATA_UPLOAD_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';

export async function uploadFileToPinata(fileBuffer, fileName) {
  if (!env.pinataJwt) {
    throw new ServiceUnavailableError('PINATA_JWT non configurato.', 'PINATA_JWT missing');
  }

  const formData = new FormData();
  formData.append('file', new Blob([fileBuffer]), fileName);

  const headers = {
    'Authorization': `Bearer ${env.pinataJwt}`,
    'Content-Type': 'multipart/form-data',
  };

  try {
    const response = await axios.post(PINATA_UPLOAD_URL, formData, { headers });
    
    if (!response.data || !response.data.IpfsHash) {
      throw new ServiceUnavailableError('Risposta Pinata non valida.', 'Invalid Pinata response');
    }

    const cid = response.data.IpfsHash;
    return { cid };
  } catch (err) {
    if (err.response?.status === 401) {
      throw new ServiceUnavailableError('Chiave Pinata non valida.', 'Pinata 401');
    }
    if (err.response?.status === 413) {
      throw new BadRequestError('File troppo grande.', 'Pinata 413');
    }
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      throw new ServiceUnavailableError('Timeout durante l\'upload su Pinata.', 'Pinata timeout');
    }
    throw new ServiceUnavailableError('Errore durante l\'upload su Pinata.', err.message);
  }
}