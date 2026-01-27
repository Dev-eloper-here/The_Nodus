# Multi-User Transformation Plan

Currently, Nodus is a **Global Shared System**. Anyone who opens the computer sees the same notes.
To make it "Personal Account Based" (like Gmail/Notion), we need to add **Authentication**.

## 1. Hosting (Google's Alternative)
Yes, **Firebase Hosting** is the direct Google substitute for Vercel.
Since we are already using Firebase Database, it makes perfect sense to host there too.
-   **Pros**: Free tier is generous, ultra-fast integration with Firestore/Auth.
-   **Cons**: Slightly more setup than Vercel for Next.js (requires `firebase-tools`).

## 2. User Accounts & Data Privacy
To save each user's learning separately, we need to implement **Firebase Authentication**.

### Proposed Changes:

#### Phase A: Add "Sign In" Button
-   Add **Google Login** button on the Sidebar/Home.
-   Use `firebase/auth` library.

#### Phase B: Update Database Logic
We need to change how we save data.
-   **Current**: `db.collection('wallet').add({ title: "..." })`
-   **New**: `db.collection('wallet').add({ title: "...", userId: "USER_123" })`

#### Phase C: Filter Data
-   When fetching data, we will only ask for:
    `db.collection('wallet').where('userId', '==', loggedInUser.uid)`

---

## Do you want to proceed?
If you say **"Yes"**, I will:
1.  Set up the Login Page.
2.  Update the `api/wallet` code to respect user IDs.
