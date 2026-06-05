# Sicurezza di ErasmusChain

Questo documento descrive le scelte di sicurezza del progetto e come proteggere le chiavi sensibili.

## Principi fondamentali

1. **Nessun segreto nel frontend**
   - Le chiavi Pinata (`PINATA_JWT`) non sono mai nel codice HTML, JS frontend o file pubblici.
   - Il frontend non comunica direttamente con Pinata usando credenziali.
   - Il backend funge da proxy sicuro tra frontend e Pinata.

2. **Variabili ambiente per i segreti**
   - Tutte le chiavi sono lette dal file `.env`.
   - Il file `.env` è escluso dal versionamento con `.gitignore`.
   - Il repository include solo `.env.example` con placeholder.

3. **Gestione sicura degli errori**
   - Il backend non espone stack trace o dettagli interni al client.
   - Gli errori restituiscono messaggi generici: "Errore durante l'upload", non "Pinata 401: JWT invalido".

4. **Upload mediato dal backend**
   - Il frontend invia il PDF al backend.
   - Il backend invia il file a Pinata.
   - Questo evita che il frontend abbia accesso diretto alle API Pinata.

5. **CORS configurato**
   - Il backend accetta solo richieste da origini consentite (`CORS_ORIGIN`).
   - Di default: `http://localhost`.

## Configurazione sicura di Pinata

### 1. Creare un JWT Pinata

1. Vai su [https://pinata.cloud](https://pinata.cloud).
2. Accedi al tuo account.
3. Vai in **API Keys**.
4. Clicca **Generate New JWT**.
5. Copia il JWT e incollalo in `.env`:
   ```env
   PINATA_JWT=ey...
   ```

### 2. Non pushare `.env` su GitHub

Il `.gitignore` include:
```gitignore
.env
node_modules
```

Assicurati di non commettere mai `.env` con le chiavi reali.

### 3. Limitare i permessi del JWT (opzionale)

Puoi creare un JWT con permessi limitati:
- Solo `pinFileToIPFS`.
- Nessun accesso a gestione pin, user, ecc.

## Ruolo del backend come livello sicuro

Il backend svolge tre funzioni di sicurezza:

1. **Proxy per Pinata**
   - Il frontend non ha accesso diretto alle API Pinata.
   - Le chiavi sono solo nel backend.

2. **Validazione input**
   - Accetta solo file PDF.
   - Verifica la dimensione massima (10 MB di default).

3. **Gestione errori**
   - Restituisce messaggi sicuri al client.
   - Non espone dettagli interni o stack trace.

## Sicurezza della blockchain

- La rete di test è **Sepolia**, non Ethereum mainnet.
- Il contratto non richiede pagamenti in ETH reale.
- L'università legge in sola lettura, senza firmare transazioni.

## Best practices per l'utente finale

1. Usa sempre `.env` con le chiavi reali, mai `.env.example`.
2. Non condividere il `.env` con nessuno.
3. Non pushare `.env` su GitHub o altri repository pubblici.
4. Se esponi accidentalmente una chiave:
   - Rigenera subito la chiave su Pinata.
   - Revoca la chiave vecchia.
   - Aggiorna `.env` con la nuova chiave.

## Checklist di sicurezza

- [ ] Nessuna chiave nel frontend.
- [ ] `PINATA_JWT` solo in `.env`.
- [ ] `.env` escluso da `.gitignore`.
- [ ] Backend valida file PDF e dimensione.
- [ ] Backend gestisce errori senza dettagli interni.
- [ ] CORS configurato per origini consentite.
- [ ] Università in sola lettura, senza MetaMask.