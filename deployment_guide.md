# Nodus Deployment Guide (Vercel)

Yes! You definitely should host it now. Your main features (Chat, Quiz, Wallet, RAG) are working.

**Can you update it later?**
**YES.** This is the best part.
Once you connect it to Vercel, anytime you save code and push it to GitHub, your live website will **automatically update** in 2-3 minutes. You don't need to do the setup again.

---

## Step 1: Upload Code to GitHub
(If you haven't already)
1.  Go to [GitHub.com](https://github.com) and create a **New Repository** (name it `nodus`).
2.  In your VS Code Terminal, run:
    ```bash
    git add .
    git commit -m "Ready for deployment"
    git branch -M main
    git remote add origin https://github.com/YOUR_USERNAME/nodus.git
    git push -u origin main
    ```

## Step 2: Deploy on Vercel (Recommended)
1.  Go to [Vercel.com](https://vercel.com) and Sign Up (using GitHub).
2.  Click **"Add New..."** -> **"Project"**.
3.  Select your `nodus` repository and click **Import**.

## Step 3: Add Keys (CRITICAL)
Vercel needs your secrets (API Keys) to work.
In the deployment screen, look for **"Environment Variables"** section:

Add these exactly as they are in your `.env.local` file:
1.  **Name**: `GEMINI_API_KEY`
    **Value**: `AIu.....` (Your actual key)
2.  **Name**: `NEXT_PUBLIC_FIREBASE_API_KEY`
    **Value**: `AIz.....`
3.  **Name**: `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
    **Value**: `nodus-ba1f0`

*(Copy all other keys from your .env.local file here too)*.

## Step 4: Click Deploy
-   Click **Deploy**.
-   Wait ~2 minutes.
-   You will get a live URL (like `nodus-app.vercel.app`).

---

## How to Update Later?
1.  Make changes in VS Code on your laptop.
2.  Open Terminal:
    ```bash
    git add .
    git commit -m "Added new feature"
    git push
    ```
3.  Vercel will see the "push" and automatically update your site! 🚀
