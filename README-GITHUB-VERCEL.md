# Product Discovery App: GitHub and Vercel

A concise guide for publishing this Next.js app to GitHub and deploying it with Vercel.

## 1. Upload to GitHub

From the project folder:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<username>/<repository>.git
git push -u origin main
```

Before pushing, confirm that `.env.local` and other secrets are ignored. Never commit MongoDB credentials, passwords, or session secrets.

## 2. Prepare MongoDB

Create a MongoDB Atlas cluster and database user. Copy the connection string and allow access from Vercel in Atlas **Network Access**. For a simple deployment, use `0.0.0.0/0` with a strong database password; otherwise configure an appropriate restricted access solution.

The app creates its collections automatically when data is saved.

## 3. Deploy with Vercel

1. Sign in at [vercel.com](https://vercel.com/).
2. Select **Add New Project**.
3. Import the GitHub repository.
4. Keep the detected Next.js framework and default build settings.
5. Add the environment variables below under **Settings > Environment Variables**.
6. Deploy.

### Required environment variables

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/
MONGODB_DB=product-discovery
SESSION_SECRET=<long-random-secret>
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=<bcrypt-hash>
```

Add the variables for **Production**. Add them for **Preview** too if preview deployments need to be tested.

Generate a bcrypt password hash locally:

```bash
node -e "require('bcryptjs').hash(process.argv[1], 12).then(console.log)" "your-password"
```

Put the generated value in `ADMIN_PASSWORD_HASH`. Log in to the deployed app using `ADMIN_EMAIL` and the original password.

## 4. After deployment

- Open the Vercel deployment URL and sign in.
- Create or select a product workspace.
- Confirm that research and product records are saved in MongoDB.
- Use Vercel deployment logs and MongoDB Atlas logs when troubleshooting.

Every product and its research records are isolated by the authenticated user and selected product. The server verifies product ownership before reading or changing data.

## Useful commands

```bash
npm install
npm run dev       # Local development
npm run lint      # Check code
npm run build     # Verify production build
npm run start     # Run the production build locally
```

## Important security notes

- Do not commit `.env.local`.
- Use a unique, long `SESSION_SECRET` in Vercel.
- Use a strong MongoDB password and URL-encode special characters in it.
- Use separate MongoDB databases or credentials for development and production when possible.
- Redeploy after changing Vercel environment variables.
