# 🎉 GoOut

> Piattaforma social per la creazione e partecipazione a eventi locali

## 📖 Descrizione del Progetto

**GoOut** è un'applicazione web full-stack che rivoluziona il modo in cui le persone organizzano e partecipano a eventi sociali nella propria area. Nasce dall'esigenza di avere una piattaforma centralizzata dove gli utenti possano facilmente creare eventi pubblici (concerti, meetup, attività sportive, cene di gruppo, ecc.) e connettersi con persone che condividono gli stessi interessi.

### 🎯 Obiettivo

L'obiettivo principale di GoOut è creare una community attiva dove:

- **Organizzatori** possono pianificare eventi con controllo completo sui partecipanti (numero massimo, dettagli, location)
- **Partecipanti** possono scoprire nuovi eventi, iscriversi facilmente e gestire la propria agenda sociale
- **Utenti** possono costruire la propria rete sociale seguendo altri utenti e rimanendo aggiornati sulle loro attività

### 💡 Come Funziona

1. **Registrazione**: Gli utenti si registrano creando un account (email/password) oppure utilizzando il proprio account Google per un accesso rapido
2. **Profilo Personalizzato**: Ogni utente può personalizzare il proprio profilo con foto, biografia, data di nascita e altre informazioni
3. **Creazione Eventi**: Gli utenti possono creare eventi specificando tutti i dettagli necessari (titolo, descrizione, data, luogo, numero massimo di partecipanti)
4. **Scoperta**: La homepage mostra tutti gli eventi disponibili, permettendo agli utenti di scoprire nuove opportunità sociali
5. **Iscrizione**: Con un semplice click, gli utenti possono iscriversi agli eventi che li interessano (fino al raggiungimento del limite di partecipanti)
6. **Networking**: Gli utenti possono cercare altri membri della community, visualizzare i loro profili pubblici e seguirli per rimanere connessi
7. **Gestione**: I creatori degli eventi hanno il controllo completo, potendo modificare o eliminare i propri eventi

### 🌟 Cosa Rende Speciale GoOut

- **Semplicità d'uso**: Interfaccia intuitiva e moderna che rende facile sia organizzare che partecipare agli eventi
- **Autenticazione flessibile**: Supporto sia per credenziali tradizionali che per Google Sign-In
- **Controllo partecipanti**: Sistema di gestione con numero massimo di iscritti per evento
- **Social network integrato**: Non solo eventi, ma anche una rete sociale per seguire altri utenti
- **Sicurezza**: Sistema di autenticazione robusto con JWT, refresh tokens e protezione delle route
- **Scalabilità**: Architettura moderna con separazione frontend/backend pronta per crescere

## ✨ Caratteristiche Principali

- 🔐 **Autenticazione completa** - Registrazione/Login locale e tramite Google OAuth
- 👤 **Gestione profilo** - Foto profilo, bio, data di nascita
- 📅 **Creazione eventi** - Organizza eventi con titolo, descrizione, data, location e numero massimo di partecipanti
- 🎫 **Registrazione eventi** - Iscriviti agli eventi che ti interessano
- 👥 **Sistema di follow** - Segui altri utenti e visualizza i loro profili
- 🔍 **Ricerca utenti** - Trova e connettiti con altri utenti della piattaforma
- 📱 **Design responsive** - Interfaccia moderna con Tailwind CSS

## 🛠️ Tecnologie Utilizzate

### Backend

- **Node.js** & **Express.js** - Server e API REST
- **Prisma ORM** - Object-Relational Mapping
- **SQLite** - Database
- **JWT** - Autenticazione con JSON Web Tokens (Access + Refresh tokens)
- **bcryptjs** - Hashing password
- **Google OAuth 2.0** - Autenticazione tramite Google
- **Multer** - Upload immagini profilo
- **CORS** - Cross-Origin Resource Sharing

### Frontend

- **React 19** - UI Library
- **Vite** - Build tool e dev server
- **React Router v7** - Routing
- **Axios** - HTTP client
- **Tailwind CSS v4** - Styling
- **@react-oauth/google** - Integrazione Google Sign-In

## 📋 Prerequisiti

Prima di iniziare, assicurati di avere installato:

- **Node.js** (v18 o superiore) - [Download](https://nodejs.org/)
- **npm** o **yarn** - Package manager
- **Git** - Version control

## 🚀 Installazione

### 1. Clona il repository

```bash
git clone https://github.com/AngeloAlbanesi/GoOut.git
cd GoOut
```

### 2. Configura il Backend

```bash
cd backend
npm install
```

Crea un file `.env` nella cartella `backend`:

```env
PORT=3001
JWT_SECRET=your_jwt_secret_key_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
GOOGLE_CLIENT_ID=your_google_client_id_here
```

> **Nota**: Sostituisci i valori con le tue chiavi. Per ottenere le credenziali Google OAuth, visita [Google Cloud Console](https://console.cloud.google.com/).

Inizializza il database:

```bash
npx prisma migrate dev
npx prisma generate
```

### 3. Configura il Frontend

```bash
cd ../frontend/client
npm install
```

Crea un file `.env` nella cartella `frontend/client`:

```env
VITE_API_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

## 🎯 Utilizzo

### Avvia il Backend

```bash
cd backend
npm run dev
```

Il server sarà disponibile su `http://localhost:3001`

### Avvia il Frontend

In un nuovo terminale:

```bash
cd frontend/client
npm run dev
```

L'applicazione sarà disponibile su `http://localhost:5173`

## 📁 Struttura del Progetto

```
GoOut/
├── backend/
│   ├── controllers/         # Controller per gestione logica business
│   │   ├── authControllers.js
│   │   ├── eventController.js
│   │   └── userController.js
│   ├── middleware/          # Middleware Express
│   │   ├── isAuthenticated.js
│   │   ├── isEventOwner.js
│   │   └── uploadAvatar.js
│   ├── models/              # Modelli dati
│   │   ├── eventModel.js
│   │   └── userModel.js
│   ├── prisma/              # Schema e migrazioni database
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── routes/              # Route API
│   │   ├── authRoutes.js
│   │   ├── eventRoutes.js
│   │   └── userRoutes.js
│   ├── uploads/             # File caricati dagli utenti
│   ├── index.js             # Entry point server
│   └── package.json
│
└── frontend/
    └── client/
        ├── src/
        │   ├── components/      # Componenti React riutilizzabili
        │   │   ├── EventCard.jsx
        │   │   ├── EventDetailsModal.jsx
        │   │   ├── ProtectedRoute.jsx
        │   │   └── PublicRoute.jsx
        │   ├── context/         # Context API
        │   │   └── AuthContext.jsx
        │   ├── pages/           # Pagine dell'app
        │   │   ├── HomePage.jsx
        │   │   ├── LoginPage.jsx
        │   │   ├── RegisterPage.jsx
        │   │   ├── CreateEventPage.jsx
        │   │   ├── EventPage.jsx
        │   │   ├── ProfilePage.jsx
        │   │   ├── PublicProfilePage.jsx
        │   │   └── UserSearchPage.jsx
        │   ├── services/        # API service layer
        │   │   └── api.js
        │   ├── App.jsx          # Componente principale
        │   └── main.jsx         # Entry point
        ├── public/
        ├── index.html
        └── package.json
```

## 🔌 API Endpoints

### Autenticazione

| Metodo | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Registrazione nuovo utente | No |
| POST | `/api/auth/login` | Login utente | No |
| POST | `/api/auth/google` | Autenticazione Google | No |
| POST | `/api/auth/refresh` | Refresh access token | No |
| POST | `/api/auth/logout` | Logout utente | Sì |

### Utenti

| Metodo | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| GET | `/api/users/me` | Ottieni profilo utente corrente | Sì |
| PUT | `/api/users/me` | Aggiorna profilo | Sì |
| POST | `/api/users/me/avatar` | Upload foto profilo | Sì |
| GET | `/api/users/search` | Cerca utenti | Sì |
| GET | `/api/users/:id` | Visualizza profilo pubblico | Sì |
| POST | `/api/users/:id/follow` | Segui utente | Sì |
| DELETE | `/api/users/:id/unfollow` | Smetti di seguire | Sì |
| GET | `/api/users/:id/followers` | Lista followers | Sì |
| GET | `/api/users/:id/following` | Lista following | Sì |

### Eventi

| Metodo | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| GET | `/api/events` | Lista tutti gli eventi | Sì |
| POST | `/api/events` | Crea nuovo evento | Sì |
| GET | `/api/events/:id` | Dettagli evento | Sì |
| PUT | `/api/events/:id` | Modifica evento | Sì (owner) |
| DELETE | `/api/events/:id` | Elimina evento | Sì (owner) |
| POST | `/api/events/:id/register` | Iscriviti a evento | Sì |
| DELETE | `/api/events/:id/unregister` | Annulla iscrizione | Sì |

## 🗄️ Schema Database

Il progetto utilizza Prisma ORM con SQLite. Schema principale:

- **User** - Informazioni utente, profilo e autenticazione
- **Event** - Eventi creati dagli utenti
- **Registration** - Relazione molti-a-molti tra User e Event
- **Follows** - Sistema di follow tra utenti

Per visualizzare lo schema completo: [schema.prisma](backend/prisma/schema.prisma)

## 🔐 Autenticazione

L'app implementa un sistema di autenticazione robusto:

1. **JWT Tokens**: Access token (breve durata) e Refresh token (lunga durata)
2. **Cookie HTTP-only**: I token sono memorizzati in cookie sicuri
3. **Google OAuth 2.0**: Login semplificato tramite account Google
4. **Password hashing**: Le password sono hashate con bcryptjs

## 🎨 Schermate

L'applicazione include le seguenti pagine:

- **Home** - Dashboard con lista eventi
- **Login/Registrazione** - Autenticazione utente
- **Profilo** - Gestione dati personali
- **Crea Evento** - Form per nuovo evento
- **Dettagli Evento** - Visualizzazione e iscrizione
- **Ricerca Utenti** - Trova e segui altri utenti
- **Profilo Pubblico** - Visualizza profili altri utenti

## 🤝 Contribuire

I contributi sono benvenuti! Per contribuire:

1. Fai un fork del progetto
2. Crea un branch per la tua feature (`git checkout -b feature/AmazingFeature`)
3. Committa le modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Pusha il branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📝 Licenza

Questo progetto è distribuito sotto licenza MIT. Vedi il file [LICENSE](LICENSE) per maggiori dettagli.

## 👨‍💻 Autori

**Angelo Albanesi**
**Paolo Campanari**
**Riccardo Albanesi**

- GitHub: [@AngeloAlbanesi](https://github.com/AngeloAlbanesi)
- GitHub: [@PaoloCampanari](https://github.com/PaoloCampanari)
- GitHub: [@RiccardoAlbanesi](https://github.com/AlCapone-03)

## 🎓 Informazioni Progetto

Progetto realizzato per il corso di **Applicazioni Web e Mobile** - Università di Camerino (UNICAM)

