## Overview

BeyondChats is an AI-assisted learning app where users upload a PDF, chat about its content, and optionally generate a quiz to test understanding. Admins can monitor platform activity and user performance.

## Roles

- **User (Student)**: Upload a PDF, open it in the viewer, chat and ask questions, generate quizzes, submit answers, and receive instant grading with recommended resources.
- **Admin**: Access `Admin Dashboard` to review recent platform activity, users, attempts, scores, and open individual user profiles.

## Frontend Tech

- React (CRA)
- Router for navigation
- `@react-pdf-viewer/core` for PDF viewing

## Environment

- **REACT_APP_BACKEND_URL**: Base URL of the API (default: `http://localhost:3001`). The value is read in multiple components and trailing slashes are trimmed.

## Authentication Flow

1. User lands on `Login` page (`/login`).
2. On submit, frontend calls `POST {REACT_APP_BACKEND_URL}/api/auth/login` with `{ email, password }`.
3. On success the backend returns `{ token, user }`.
4. Frontend stores:
   - `bc_token` cookie: Bearer token (2 days)
   - `bc_user` cookie: serialized user object with `role` (2 days)
5. User is redirected based on role:
   - `role === 'admin'` → `/admin`
   - otherwise → `/user`
6. Logout removes both cookies and returns the user to `/` (or caller-provided route).

## Navigation

- Global top bar shows:
  - Admins: `Admin Dashboard`
  - Users: `Dashboard`
  - Profile dropdown with `Profile`, and for non-admins, `Upload PDF`. Admins do not see `Upload PDF` in the profile menu.

## User Dashboard (`/user`)

- Landing area for students.
- From here users can navigate to upload PDFs or open existing study sessions, then proceed to the PDF viewer/chat experience.

## Upload PDF (`/uploadPDF`)

- Users select a local PDF or provide a URL (implementation may vary).
- After successful selection/upload, the app navigates to the PDF experience passing `pdfUrl` (and optionally `name`) via router `state` or query params.

## PDF + Chat Experience (`/pdf` or via route used in app)

- Component: `src/components/PdfViewer.js`.
- Left pane: Chat and quiz panel.
- Right pane: PDF viewer rendered using `@react-pdf-viewer/core`.

### Chat

- Initial assistant message invites the user to ask anything about the PDF.
- Messages are appended in a chronological list; the list auto-scrolls to the newest message.
- The app can call an AI backend (see `services/geminiClient` usage) to generate responses utilizing the PDF context when applicable.

### Generate Questions

- Clicking "Generate Questions" triggers server-side generation of a mixed set (MCQ, short, long) derived from the PDF content.
- Once generated, the questions appear in structured sections.

### Answering & Submission

- Users fill in answers in-place.
- On submit:
  - The app sends the answers to the backend for grading.
  - UI shows loading while grading is in progress.

### Grading & Feedback

- The result panel displays section-wise scores and an overall summary.
- If provided by the backend, a list of recommended resources is shown (may include YouTube links). Links open in a new tab.

## Admin Dashboard (`/admin`)

- Component: `src/components/AdminDashboard.js`.
- Fetches recent user activities from `{REACT_APP_BACKEND_URL}/apiAdmin/admin/activities`.
- Displays cards with:
  - Total users
  - Total attempts
  - Average score
  - Activities in the last 7 days
- Search bar filters by name or email.
- Table lists activity rows; clicking "View Profile" opens the user profile/details route (e.g., `/user?email=...`).

## Security & Cookies

- `bc_token` is sent as a Bearer token when present (set in `Authorization` header).
- `bc_user` stores minimal user identity and role to adjust UI.
- Both cookies use `SameSite=Lax` and are cleared on logout.

## Routes (summary)

- `/login` → `Login`
- `/user` → `UserDashboard`
- `/admin` → `AdminDashboard` (admin-only by role)
- `/uploadPDF` → PDF upload page (visible only for non-admins from the profile menu)
- PDF/chat route → `PdfViewer` (navigated to with router `state` containing `pdfUrl`)

## Local Development

1. Install dependencies: `npm install`
2. Create `.env` with `REACT_APP_BACKEND_URL=http://localhost:3001` (or your URL)
3. Start dev server: `npm start`
4. Open the app: `http://localhost:3000`

## Notes & Troubleshooting

- If PDFs don’t render, verify the URL is reachable and CORS-enabled.
- If grading or chat fails, confirm `REACT_APP_BACKEND_URL` is correct and the backend is running.
- If YouTube links in recommendations fail, the video may be unavailable or region-restricted; try opening the link directly in a new tab.

---

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
