import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`[server] Backend Ethereum ErasmusChain in ascolto su http://localhost:${env.port}`);
  console.log(`[server] Ambiente: ${env.nodeEnv}`);
});

process.on('SIGTERM', () => {
  console.log('[server] SIGTERM ricevuto, chiudo il server...');
  server.close(() => {
    console.log('[server] Server chiuso.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[server] SIGINT ricevuto, chiudo il server...');
  server.close(() => {
    console.log('[server] Server chiuso.');
    process.exit(0);
  });
});