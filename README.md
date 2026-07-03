# ErasmusChain

DApp/web app universitaria per la **certificazione e verifica di documenti Erasmus**.  
Lo studente carica un PDF → viene salvato su IPFS (Pinata) → il CID viene registrato su Ethereum Sepolia → l'università può cercare e verificare i documenti senza dipendere dal wallet dello studente.

---

## Caratteristiche

- **Pagina studente separata**: upload PDF, MetaMask, registrazione on-chain.
- **Pagina università separata**: sola lettura, ricerca tramite wallet studente, verifica CID, apertura/download da IPFS.
- **Backend sicuro**: upload verso Pinata solo lato backend, nessuna API KEY o JWT token nel frontend.
- **Smart contract su Sepolia**: registrazione document, getMyDocuments, getStudentDocuments(address), verifyDocument(address, cid).
- **Docker Compose**: tutto parte con un solo comando.

---

## Requisiti

- **Docker** e **Docker Compose** installati.
- Un browser con **MetaMask** (per la parte studente).
- Un account **Pinata** (per IPFS).
- Un wallet di test con **ETH Sepolia** (per testare il contratto).

> Se non hai ETH Sepolia, usa un faucet per caricare ETH sul tuo wallet: [https://sepoliafaucet.com](https://sepoliafaucet.com)

---

## Setup rapido

1. **Clona la repo**  
   ```bash
   git clone <repo-url>
   cd erasmuschain
   ```

2. **Crea il file `.env`**  
   ```bash
   cp .env.example .env
   ```

3. **Compila `.env`**  
   Segui la sezione **Configurazione Pinata e blockchain** qui sotto.

4. **Avvia tutto con Docker**  
   ```bash
   docker compose up --build
   ```

5. **Apri nel browser**
   - Studente: `http://localhost/student`
   - Università: `http://localhost/university`
   - Università: `http://localhost/landing`

---

## Configurazione Pinata e blockchain

### 1. Pinata JWT

1. Vai su [https://pinata.cloud](https://pinata.cloud) e accedi.
2. Vai in **API Keys** → **Generate New JWT**.
3. Copia il JWT e incollalo in `.env`:
   ```env
   PINATA_JWT=ey...
   ```

> ⚠️ **Non pushare mai il `.env` su GitHub.** Il `.gitignore` lo esclude già.

### 2. RPC Sepolia e wallet

In `.env`:
```env
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
CHAIN_ID=11155111
```

Per il frontend università (sola lettura), queste stesse URL sono usate in `frontend/shared/js/config.js`.

### 3. Deploy dello smart contract

Segui la guida in `contracts/README.md` per:
- compilare il contratto
- deployarlo su Sepolia
- aggiornare `CONTRACT_ADDRESS` in `.env`
- aggiornare `frontend/shared/js/config.js`

---

## Flusso di dimostrazione

### Parte studente
1. Apri `http://localhost/student`
2. Collega MetaMask
3. Carica un PDF
4. Il backend riceve il file, lo invia a Pinata e restituisce il CID
5. Il contratto registra il documento con `certifyDocument(...)`
6. Nella lista dei tuoi documenti vedi il CID e il timestamp

### Parte università
1. Apri `http://localhost/university`
2. Inserisci l'indirizzo wallet dello studente (senza collegare MetaMask)
3. Clicca su **Cerca documenti**
4. Vedi la lista dei documenti CERTIFICATI
5. Clicca su:
   - **Apri** → apre il PDF dal gateway Pinata
   - **Download** → scarica il PDF
   - **Verifica** → controlla se il CID è autentico sulla blockchain

---

## Sicurezza

- **Nessun dato sensibile nel frontend**: le chiavi Pinata sono solo nel backend, tramite `PINATA_JWT` in `.env`.
- **Backend come proxy sicuro**: il frontend non comunica direttamente con Pinata.
- **`.env` escluso dal versionamento**: il repository include solo `.env.example`.
- **Errori gestiti senza esporre KEYS o TOKEN**: il backend restituisce messaggi generici, non stack trace.

> Il progetto è stato progettato per proteggere le chiavi e ridurre l'esposizione dei dati sensibili.

---

## Struttura del progetto

```bash
erasmuschain/
├── frontend/
│   ├── student/          # UI studente con MetaMask
│   ├── university/       # UI università in sola lettura
│   ├── guide/  
│   ├── landing/  
│   └── shared/           # CSS e JS condivisi
├── backend/
│   ├── src/
│   │   ├── routes/       # health, upload
│   │   ├── services/     # Pinata service
│   │   ├── middleware/   # error handler
│   │   ├── config/       # env
│   │   └── utils/        # http errors
│   ├── Dockerfile
│   └── package.json
├── contracts/
│   ├── src/              # ErasmusChain.sol
│   ├── script/           # Deploy script
│   ├── abi/              # ABI generata
│   └── deployments/      # Metadati Sepolia
├── docs/
│   ├── architecture.md
│   └── security.md
├── nginx/
│   └── default.conf
├── docker-compose.yml
├── README.md
├── .env.example
└── .gitignore
```

---

## Supporto e domande frequenti

**Devo installare npm a mano?**  
No. Tutto è dentro Docker.

**Devo configurare Nginx?**  
No. Il `docker-compose.yml` è già pronto.

**L'università deve collegare MetaMask?**  
No. L'università è in sola lettura tramite RPC pubblico Sepolia.

**Posso usare un'altra rete?**  
Sì, ma il contratto va deployato sulla rete scelta e vanno aggiornati `CHAIN_ID` e `CONTRACT_ADDRESS`.

**Come verifico se il CID è autentico?**  
L'interfaccia università ha il pulsante **Verifica** che chiama `verifyDocument(address, cid)` sullo smart contract.

---

## Licenza

Progetto universitario per scopi didattici.
