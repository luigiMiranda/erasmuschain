# Smart Contract ErasmusChain

Questo contratto registra i documenti certificati degli studenti Erasmus su Ethereum Sepolia.

## Funzioni principali

- `certifyDocument(string cid)` → registra un documento e restituisce il documento count.
- `getMyDocuments(address student)` → restituisce la lista dei documenti di uno studente.
- `getStudentDocuments(address student)` → stessa funzione, usata dall'università per cercare.
- `verifyDocument(address student, string cid)` → restituisce true se il CID è autentico.
- `getDocumentCountForStudent(address student)` → numero di documenti dello studente.

## Compilazione

Puoi compilare il contratto usando:

- **Remix IDE**: [https://remix.ethereum.org](https://remix.ethereum.org)
- **Foundry**: `forge build`
- **Hardhat**: `npx hardhat compile`

Per i test universitari, usa Remix:

1. Apri `src/ErasmusChain.sol` in Remix.
2. Seleziona compiler `0.8.20`.
3. Clicca su **Compile**.
4. Vai in **Deploy & Run**.

## Deploy su Sepolia (Remix)

1. Collega MetaMask e passa alla rete **Sepolia**.
2. Assicurati di avere ETH Sepolia (usa un faucet).
3. In **Deploy & Run**:
   - Environment: **Injected Provider (MetaMask)**
   - Contract: **ErasmusChain**
   - Clicca **Deploy**
4. Conferma la transazione in MetaMask.
5. Dopo il deploy, copia l'indirizzo del contratto.

## Aggiornare il progetto dopo il deploy

1. Apri `.env` e imposta:
   ```env
   CONTRACT_ADDRESS=0x...
   ```
2. Apri `frontend/shared/js/config.js` e aggiorna:
   ```javascript
   contractAddress: '0x...',
   ```
3. Aggiorna `contracts/deployments/sepolia.json` con l'indirizzo.

## Verifica su Etherscan

1. Vai su [https://sepolia.etherscan.io](https://seholia.etherscan.io)
2. Cerca il tuo indirizzo di contratto.
3. Se vuoi, verifica il sorgente:
   - Clicca **Contract** → **Verify and Check Source**
   - Incolla il codice di `ErasmusChain.sol`

## Test

Per testare il contratto:

1. Lo studente carica un PDF → ottiene il CID.
2. Chiama `certifyDocument(cid)` con MetaMask.
3. L'università chiama `getStudentDocuments(walletStudent)` per vedere i documenti.
4. L'università chiama `verifyDocument(walletStudent, cid)` per verificare l'autenticità.