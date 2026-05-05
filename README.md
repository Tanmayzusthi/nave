#  Nave OS

Nave OS is an AI-powered personal operating system that combines chat, memory, tasks, and notes into one intelligent workspace.

Built for real-time interaction with AI using modern web technologies.

---

##  Features

###  AI Chat
- Powered by OpenRouter (LLM APIs)
- Real-time conversational interface
- Chat history stored in Firestore

### Smart Memory
- Auto memory detection (WIP)
- Manual memory management
- Context-aware responses

###  Notes
- Create and manage notes
- Synced with Firestore

###  Tasks
- Task tracking system
- Live updates

###  Voice Mode (WIP)
- ElevenLabs integration (Text-to-Speech)
- Planned speech-to-text interaction

###  File Upload (WIP)
- PDF, text, image upload support
- Screenshot paste support (planned)

---

##  Tech Stack

- **Frontend:** React + Vite
- **Backend:** Vercel Serverless Functions
- **Database:** Firebase Firestore
- **Auth:** Firebase Authentication
- **AI:** OpenRouter API
- **Voice:** ElevenLabs API
- **Hosting:** Vercel

---

## ⚙️ Setup Instructions

### 1. Clone Repository

```bash
git clone https://github.com/Tanmayzusthi/nave.git
cd nave

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
