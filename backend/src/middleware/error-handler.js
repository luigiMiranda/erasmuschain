import { HttpError } from '../utils/http-errors.js';

export function errorHandler(err, req, res, next) {
  const method = req.method;
  const path = req.path;

  console.error(`[error] ${method} ${path}:`, err.message);

  if (err instanceof HttpError) {
    // Errori HTTP già definiti: restituiamo solo il messaggio sicuro
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  // Errori di validazione multer (file troppo grande, tipo non valido, ecc.)
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      error: 'Errore nel caricamento del file.',
    });
  }

  // Errori di sintassi o parsing
  if (err.name === 'SyntaxError') {
    return res.status(400).json({
      success: false,
      error: 'Richiesta non valida.',
    });
  }

  // Qualsiasi altro errore: 500 generico
  console.error('[error] interno:', err);
  return res.status(500).json({
    success: false,
    error: 'Si è verificato un errore interno.',
  });
}