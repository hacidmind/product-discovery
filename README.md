# Product Discovery App

A product discovery workspace built with Next.js. Use it to organize research and turn customer evidence into insights, opportunities, personas, features, assumptions, experiments, and solution trees.

The application includes its own backend through Next.js route handlers. There is no separate backend service to install or run. MongoDB stores the data, and the app provides email/password login protected by an HTTP-only session cookie.

## Requirements

- [Node.js](https://nodejs.org/) 20 or newer
- npm, installed with Node.js
- A MongoDB database through [MongoDB Atlas](https://www.mongodb.com/atlas) or a local MongoDB server

Check your installation:

```bash
node --version
npm --version
```

## First-Time Setup

### 1. Open the project folder

Run these commands from the folder that contains `package.json`:

```bash
cd path/to/product-discovery-app
```

On Windows PowerShell:

```powershell
cd "C:\Users\Abdul.Kekere-Ekun\Code\ProductDiscoveryApp\product-discovery-app"
```

### 2. Install dependencies

```bash
npm install
```

If PowerShell blocks the `npm` script, use:

```powershell
npm.cmd install
```

### 3. Configure MongoDB

For MongoDB Atlas:

1. Create a free cluster.
2. Create a database user and password.
3. Add your IP address under **Network Access**.
4. Select **Connect**, then **Drivers**, and copy the connection string.
5. Replace the username, password, and other placeholders.

You do not need to manually create the database or collections. The app creates them when records are first saved.

For local MongoDB, use:

```env
MONGODB_URI=mongodb://127.0.0.1:27017
```

### 4. Create `.env.local`

Create `.env.local` in the project root:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB=product-discovery
SESSION_SECRET=replace-with-a-long-random-string
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD_HASH=your-bcrypt-hash
```

You can also copy `.env.example` as a starting point. Never commit `.env.local`; environment files are already ignored by Git.

### 5. Generate the login password hash

The app stores a bcrypt hash rather than a plain-text password. Run:

```bash
node -e "require('bcryptjs').hash(process.argv[1], 12).then(console.log)" "your-password"
```

Copy the output into `ADMIN_PASSWORD_HASH`:

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=$2b$12$paste-the-generated-hash-here
```

Use the original password when signing in. Restart the dev server after changing `.env.local`.

## Start the App

Start the development server:

```bash
npm run dev
```

On Windows PowerShell, use `npm.cmd` if required:

```powershell
npm.cmd run dev
```

Open [http://localhost:3000](http://localhost:3000). You will be redirected to `/login`; sign in with `ADMIN_EMAIL` and the password used to create the hash.

The development server reloads automatically when you edit files.

## Typical Workflow

1. Sign in at `/login`.
2. Select one of your existing product workspaces, or create a new one.
3. If the selected product has no research, start a research query or import a research document.
4. Review generated insights, opportunities, personas, features, and assumptions.
5. Score opportunities and features, then create experiments to validate assumptions.
6. Use Dashboard, Search, Research, and Solution Tree to navigate your product work.

Products and all research records are stored in MongoDB. Each product belongs to the signed-in user, and every API read or write verifies both the session and the selected product ownership. The selected product ID is saved in the browser only as a convenience; it is never trusted by the server without an ownership check.

## Data Storage

The Next.js route handlers are the backend. MongoDB collections are created on demand:

- `products`: product workspaces
- `insights`: customer insights and evidence
- `opportunities`: prioritized opportunities
- `personas`: user personas
- `interviews`: interview transcripts and analysis
- `features`: feature ideas and prioritization scores
- `assumptions`: assumptions requiring validation
- `experiments`: validation experiments and results
- `research`: saved research queries and findings
- `tree`: solution tree data

Each product-specific record includes `productId`. The active product is sent in the `x-product-context` request header, then verified against the signed-in user's MongoDB products collection before list, detail, create, update, delete, import, or download operations.

## Available Commands

```bash
npm run dev       # Start the development server
npm run lint      # Run ESLint
npm run build     # Create a production build
npm run start     # Start the production build
```

To test the production build locally:

```bash
npm run build
npm run start
```

Then open [http://localhost:3000](http://localhost:3000).

## Troubleshooting

### `Missing MONGODB_URI environment variable`

Create `.env.local` beside `package.json`, add `MONGODB_URI`, and restart the server.

### MongoDB connection or timeout errors

Check the URI, database credentials, URL-encode special characters in the password, allow your IP in Atlas, and confirm that a local MongoDB service is running when using a local URI.

### Login always says `Invalid email or password`

Confirm that `ADMIN_EMAIL` matches the entered email and that the bcrypt hash was generated from the password being entered. Restart the server after changing environment variables.

### Port 3000 is already in use

Use another port:

```bash
npm run dev -- -p 3001
```

Then open [http://localhost:3001](http://localhost:3001).

### PowerShell says `npm` is not recognized

Try:

```powershell
npm.cmd run dev
```

If it still fails, reinstall Node.js and ensure its installation directory is on your PATH.

## Deploying

Deploy to [Vercel](https://vercel.com/) or another Node.js-compatible host. Add the same variables from `.env.local` to the host's project settings before deploying:

- `MONGODB_URI`
- `MONGODB_DB`
- `SESSION_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH`

For production, use MongoDB Atlas, a long random session secret, a strong admin password, and restricted MongoDB network access. Use HTTPS so secure session cookies are protected.

## Project Structure

```text
src/app/                 Next.js pages and route handlers
src/app/api/             In-app backend endpoints
src/components/          Shared UI and application layout
src/lib/mongodb.ts       MongoDB connection helper
src/lib/storage.ts       MongoDB CRUD abstraction
src/lib/auth.ts          Session creation and verification
src/middleware.ts        Login protection for pages and APIs
data/                    Existing JSON seed/reference data
public/                  Static assets
```

The JSON files in `data/` are not the primary runtime database. MongoDB is the source of truth for records created through the application.
