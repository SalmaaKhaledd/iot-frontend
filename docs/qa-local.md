# Local QA — IoT frontend

**Target branch:** `dev` — use the latest `dev` from origin when you test.

This guide covers **running the app locally** for QA. Auth flows use the **in-app HTTP mock** when `useMock` is `true` in the development environment (default).

## 1. Run the app

From the repository root:

```bash
npm install
npm start
```

When the dev server is ready, open **[http://localhost:4200/](http://localhost:4200/)** (or the URL printed in the terminal).

**Note:** With the mock enabled, you **do not** need a real backend at `apiUrl` for signup/login/home/profile in dev.

## 2. Scope for this pass


| Area    | Route / entry                         |
| ------- | ------------------------------------- |
| Signup  | `/` redirects to signup, or `/signup` |
| Login   | `/login`                              |
| Home    | `/home` (after login)                 |
| Profile | `/profile` (after login)              |

### 2.1 Profile picture upload — expected outcomes

When testing the avatar edit button on `/profile`, use these as the pass/fail criteria:

| Test file                                | Expected result                                                                                                              |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Valid JPG / PNG / WEBP, **≤ 1 MB**       | New picture appears immediately (optimistic preview), `Uploading new picture…` status shows, then **success message** is shown. |
| Non-image file (e.g. PDF, .txt)          | Inline error next to avatar: **“Only JPG, PNG, or WEBP images are allowed.”** No upload is attempted.                          |
| Image **larger than 1 MB**               | Inline error next to avatar: **“Profile picture must be 1MB or smaller.”** No upload is attempted.                             |
| Server failure (simulate by stopping mock) | Original avatar is restored; generic error message appears below the card.                                                   |


## 3. Mock users

Sign-in in dev uses **mock users**, not real accounts. Open `**src/app/core/interceptors/mock.interceptor.ts`** and use the `**mockUsers**` list there for email and password.

## 4. “Logged out” and sessions

- There is **no logout button** in the UI yet.
- Visiting `**/login` does not clear** the session; tokens stay in **local storage** until you clear them or call logout when it exists.
- To test **unauthenticated** behavior (e.g. `/home` should send you to login):
  - Use a **private/incognito** window, **or**
  - DevTools → **Application** → **Local Storage** → `http://localhost:4200` → remove `**iot_auth_token`** and `**iot_user**`, then refresh.

