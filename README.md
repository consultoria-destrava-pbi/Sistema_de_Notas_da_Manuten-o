# Sistema de Notas de Manutenção TEG

Sistema corporativo para registrar ocorrências de manutenção, acompanhar o histórico e exportar relatórios em Excel e PDF.

## Funcionalidades

- Cadastro de notas
- Numeração automática
- Data, turno, período, colaborador, equipamento, local
- Problema, causa, solução, EDT, tempo EDT, status
- Múltiplas fotos por ocorrência
- Histórico com filtros por:
  - data inicial
  - data final
  - turno
  - equipamento
  - status
  - busca textual
- Dashboard com indicadores:
  - total de registros
  - concluídos
  - pendentes
  - quantidade de EDT
  - tempo total EDT
- Exportação para Excel
- Exportação para PDF
- Persistência local via localStorage
- Persistência em nuvem via Firebase Firestore + Storage
- Compatibilidade com GitHub Pages

## Estrutura do projeto

- index.html
- css/style.css
- js/app.js
- README.md

## Configuração do Firebase

1. Crie um projeto no Firebase.
2. Ative:
   - Firestore
   - Storage
3. No arquivo `js/app.js`, substitua o objeto abaixo:

```javascript
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID"
};