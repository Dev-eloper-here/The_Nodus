
# Nodus - AI-Powered Coding Mentor

**Nodus** is an advanced, intelligent coding assistant designed to bridge the gap between learning and doing. Unlike standard AI completion tools, Nodus focuses on **active mentoring**, **knowledge retention**, and **context-aware assistance**.

Built for the Google Cloud Hackathon, it leverages **Gemini 1.5 Pro/Flash** to provide deep insights, "NotebookLM-style" Retrieval-Augmented Generation (RAG), and a unique "Wallet" system to track your learning progress and coding mistakes.

## 🚀 Key Features

### 🧠 1. Context-Aware Chat (Sage)
*   **Deep Context**: Sage doesn't just read your message; it reads your code editor's active state.
*   **Smart Suggestions**: Provides real-time fixes and explanations tailored to your specific bugs.
*   **Multi-Provider Support**: Seamlessly switch between **Google Gemini** (default) and **OpenAI GPT-4**.

### 📚 2. Notebook RAG (NotebookLM Integration)
*   **Chat with Your Notes**: Upload detailed PDF documentation, lecture notes, or research papers with one click.
*   **Vector Search**: Uses **Gemini Embeddings** and **Firebase Vector Store** to retrieve the exact paragraphs needed to answer your questions.
*   **Evidence-Based Answers**: Every answer is grounded in your uploaded source material.

### 🎒 3. Concept & Error Wallets (Proactive Mentoring)
*   **Concept Wallet**: Tracks the programming concepts you've mastered (Loops, Recursion, Async).
*   **Error Wallet**: Automatically logs your frequent coding mistakes (e.g., "Infinite Loops", "Null Pointers").
*   **Proactive Warnings**: If Sage detects you making a familiar mistake, it proactively warns you *before* you run the code.

### ⚡ 4. Modern Developer Experience
*   **Full-Featured Editor**: Integrated Monaco Editor (VS Code core) with syntax highlighting.
*   **Responsive UI**: Beautiful, dark-mode-first design built with **Tailwind CSS** and **Shadcn UI**.
*   **Real-time Database**: Powered by **Firebase Firestore** for instant sync of notes and chat history.

---

## 🛠️ Technology Stack

*   **Frontend**: [Next.js 14](https://nextjs.org/) (App Router), TypeScript, Tailwind CSS
*   **AI Core**: [Google Gemini API](https://ai.google.dev/) (Generative Language & Embeddings)
*   **Backend / DB**: [Firebase](https://firebase.google.com/) (Firestore, Vector Search)
*   **Editor**: Monaco Editor (`@monaco-editor/react`)

---

## 🏁 Getting Started

Follow these steps to set up Nodus locally:

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/nodus.git
cd nodus
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory and add your API keys:

```bash
# AI Providers
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_key_here (Optional)
NEXT_PUBLIC_AI_PROVIDER=gemini

# Firebase Config (Get these from your Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
# ... (Add all standard Firebase config values)
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to start coding!

---

## 🧪 How to Test RAG (Notebook Feature)
1.  Navigate to the **Notebook** tab.
2.  Click **"Add Source"** and upload a PDF (e.g., a React documentation file).
3.  Wait for the status to change to `Ready`.
4.  Open the Chat and ask a question specifically about that PDF. Sage will retrieve the context and answer!

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
