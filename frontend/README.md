# Frontend

Merged Vite / React frontend. See ../README.md for the application setup.

npm run dev uses port 5175 and forwards /api to port 5002.
npm run build produces the frontend/dist directory served by Flask.
npm run lint and npm run test:e2e run static and browser checks.

Home.jsx, the landing artwork, and css/styles.css are preserved from AIWorkout.
Training.css scopes tracker styles to prevent them from changing the homepage.
