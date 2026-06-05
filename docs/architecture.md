# Architettura di ErasmusChain

ErasmusChain è una DApp/web app per la certificazione e verifica di documenti Erasmus, con separazione chiara tra interfaccia studente e interfaccia università.

## Panoramica del sistema
┌─────────────────────┐ ┌──────────────────────┐ ┌──────────────────┐
│ Frontend │ │ Backend Node.js │ │ Smart Contract │
│ Studente │─────▶│ (proxy sicuro) │─────▶│ Ethereum Sepolia│
│ (MetaMask) │ │ + Pinata upload │ │ (ErasmusChain) │
└─────────────────────┘ └──────────────────────┘ └──────────────────┘
│ │ │
│ ▼ │
│ ┌──────────────────┐ │
│ │ IPFS (Pinata) │ │
│ └──────────────────┘ │
▼ ▼
┌─────────────────────┐ ┌──────────────────┐
│ Frontend │ │ Verifica │
│ Università │──────── read-only ──────────────────▶│ On-chain │
│ (sola lettura) │ │ │
└─────────────────────┘ └──────────────────┘

text

## Componenti principali

### 1. Frontend studente

- Pagina dedicata: `/student`
- Usa MetaMask per connettersi.
- Carica un PDF → invia al backend.
- Riceve il CID da Pinata.
- Registra il CID sullo smart contract con `certifyDocument(cid)`.
- Visualizza i propri documenti con `getMyDocuments(address)`.

### 2. Frontend università

- Pagina dedicata: `/university`
- **Non** usa MetaMask.
- Legge dalla blockchain tramite RPC pubblico Sepolia.
- Cerca documenti di uno studente con `getStudentDocuments(address)`.
- Verifica un CID con `verifyDocument(address, cid)`.
- Apre e scarica PDF dal gateway Pinata.

### 3. Backend Node.js

- Servizio minimo Express.
- Endpoint `/api/health` per salute del servizio.
- Endpoint `/api/upload` per upload PDF verso Pinata.
- Usa `PINATA_JWT` da variabili ambiente.
- Non espone segreti al frontend.
- Gestisce errori senza esporre stack trace.

### 4. Smart contract

- Contratto Solidity `ErasmusChain` su Sepolia.
- Funzioni:
  - `certifyDocument(string cid)` → registra documento.
  - `getMyDocuments(address student)` → documenti dello studente.
  - `getStudentDocuments(address student)` → stessa funzione, usata dall'università.
  - `verifyDocument(address student, string cid)` → verifica autenticità.

### 5. IPFS + Pinata

- File PDF caricati su IPFS tramite Pinata.
- Backend usa `pinFileToIPFS` con JWT Bearer.
- Gateway Pinata usato per aprire e scaricare i documenti.

## Flusso di esempio

### Studente
1. Carica PDF dal browser.
2. Backend riceve file, lo invia a Pinata.
3. Pinata restituisce CID.
4. Backend restituisce CID al frontend.
5. Frontend chiama `certifyDocument(cid)` con MetaMask.
6. Transazione registrata su Sepolia.

### Università
1. Inserisce wallet dello studente.
2. Chiamata `getStudentDocuments(wallet)` in sola lettura.
3. Riceve lista documenti con CID e timestamp.
4. Clicca "Apri PDF" → apre dal gateway Pinata.
5. Clicca "Verifica" → chiama `verifyDocument(wallet, cid)`.

## Decisioni architetturali

- **Separazione studente/università**: due pagine distinte, nessuna logica mischiata.
- **Universitá in sola lettura**: non dipende dal wallet dello studente, usa provider RPC pubblico.
- **Backend come proxy sicuro**: le chiavi Pinata sono solo nel backend.
- **Docker Compose**: avvio semplificato, nessuna installazione manuale.
- **Frontend statico HTML/CSS/JS**: senza framework pesanti.
