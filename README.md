<a id="readme-top"></a>

<!-- PROJECT LOGO -->

<br />
<div align="center">
  <h1 align="center">Fruitbox Ranked</h1>

  <p align="center">
    Fast-paced multiplayer strategy game with real-time gameplay and competitive ranked matchmaking.
    <br />
    <br />
    <br />
    <br />
  </p>
</div>

---

## About the Project

**Fruitbox Ranked** is a full-stack multiplayer game platform built for competitive players. Experience real-time gameplay powered by **Socket.io**, climb the ranked ladder with our intelligent **matchmaking system**, and showcase your skills in both public matches and private rooms with friends.

Featuring secure authentication, persistent match history, and a sophisticated rating system, Fruitbox Ranked delivers the core infrastructure for a modern competitive gaming experience.

### Features

* **Real-time Multiplayer** using Socket.io WebSocket communication
* **Ranked Matchmaking System** with rating-based player progression
* **Private Game Rooms** for custom sessions with friends
* **User Authentication & Profiles** with match history and statistics
* **Interactive Game Board** with real-time state synchronization
* **Secure Backend** with Next.js API routes and full TypeScript type safety

<p align="right">(<a href="#readme-top">back to top</a>)</p>

![Landing Page Preview](public/readme/landing_page.png)

---

## Built With

This project combines modern full-stack technologies with scalable real-time architecture:

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge\&logo=nextdotjs\&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge\&logo=react\&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge\&logo=nodedotjs\&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge\&logo=socketdotio\&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge\&logo=typescript\&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge\&logo=postgresql\&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge\&logo=prisma\&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge\&logo=tailwindcss\&logoColor=white)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

![Gameplay preview](public/readme/gameplay.png)

---

## Getting Started

Follow these steps to run Fruitbox Ranked locally:

### Prerequisites

* Node.js (v18 or higher)
* PostgreSQL database
* npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/fruitbox-ranked.git
   cd fruitbox-ranked
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the project root:

   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/fruitbox
   NEXT_PUBLIC_GAME_SERVER_URL=http://localhost:3001
   ```

4. **Set up the database**

   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

5. **Run the application**

   Start the frontend development server:
   ```bash
   npm run dev
   ```

   In another terminal, start the real-time game server:
   ```bash
   npm run server:dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to play.

### Available Commands

```bash
npm run dev              # Start Next.js frontend in dev mode
npm run server:dev      # Start game server with live reload
npm run server:start    # Start production game server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint
npm run test            # Run test suite
npm run typecheck:server # Type-check server code
npm run prisma:generate # Generate Prisma client
npm run prisma:migrate  # Run database migrations
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Usage

1. **Sign up / Log in** with your username and password
2. **Join the Ranked Queue** to find opponents or **Create a Private Room** for friends
3. **Play in real-time** with live game state synchronization
4. **Check your stats** and climb the competitive ranking ladder
5. Your **match history** is saved automatically for future reference

---

## Project Structure

```
app/                    # Next.js frontend
├── api/               # REST API routes
├── auth/              # Authentication pages
└── profile/           # User profile pages

components/            # React components
├── auth/              # Auth UI components
├── game/              # Game UI and logic
└── menu/              # Navigation and menus

lib/                   # Shared utilities
├── auth.ts            # Auth configuration
├── game/              # Game engine logic
└── multiplayer/       # Real-time multiplayer code

server/                # Game server (Node.js)
├── matchmaking.ts     # Matchmaking service
├── room-registry.ts   # Room management
└── match-ratings.ts   # Ranking system

prisma/                # Database schema and migrations
tests/                 # Test suite
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Architecture Highlights

- **Separation of Concerns**: Frontend (Next.js) and backend (Node.js) run as separate services
- **Type Safety**: Full TypeScript coverage across frontend and backend
- **Real-time Sync**: Socket.io protocols define strict message contracts for game state
- **Scalability**: Room registry allows horizontal scaling of game servers
- **Database-First Design**: Prisma ORM with PostgreSQL for reliable data persistence

<p align="right">(<a href="#readme-top">back to top</a>)</p>
