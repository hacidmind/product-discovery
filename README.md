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

### 5. Optional administrator login

Colleagues can use `/signup` without an administrator account. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH` only if you want a configured administrator login. The app stores a bcrypt hash rather than a plain-text password. Run:

```bash
node -e "require('bcryptjs').hash(process.argv[1], 12).then(console.log)" "your-password"
```

Copy the output into `ADMIN_PASSWORD_HASH`, adding a backslash before every dollar sign in the `.env` or `.env.local` file. Next.js expands unescaped dollar signs as environment-variable references, which corrupts bcrypt hashes:

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=\$2b\$12\$paste-the-generated-hash-here
```

Use the original password when signing in, not the hash. Restart the dev server after changing `.env` or `.env.local`. When setting the hash directly in a hosting provider's environment-variable dashboard, use the original hash without these backslashes.

## Start the App

Start the development server:

```bash
npm run dev
```

On Windows PowerShell, use `npm.cmd` if required:

```powershell
npm.cmd run dev
```

Open [http://localhost:3000](http://localhost:3000). Colleagues can create their own account at `/signup`, then sign in at `/login`. The optional administrator account uses `ADMIN_EMAIL` and the password used to create the hash.

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

### `querySrv ESERVFAIL` or `MongoDB DNS lookup failed`

This happens before MongoDB checks your database username or password. The DNS server used by the development machine must resolve the Atlas SRV record and each cluster host. Check both from PowerShell:

```powershell
Resolve-DnsName -Type SRV _mongodb._tcp.cluster0.qdccd3c.mongodb.net
Resolve-DnsName -Type SRV _mongodb._tcp.cluster0.qdccd3c.mongodb.net -Server 8.8.8.8
```

If the first command fails but the second returns cluster hosts, your default DNS resolver is the issue. Configure the active network adapter or VPN to use a DNS server that resolves Atlas records, such as Google Public DNS (`8.8.8.8` and `8.8.4.4`), if your network policy permits it. Then disconnect/reconnect the network or run `Clear-DnsClientCache` and restart `npm run dev`. Check an individual host returned by the SRV query with `Resolve-DnsName -Type A <host>`; the standard `mongodb://` URI only helps if those hostnames resolve too.

Atlas also offers a standard `mongodb://` URI in **Connect ? Drivers** with the **SRV Connection String** toggle off. Copy that full URI if SRV lookups alone fail, keeping the TLS, replica-set, and authentication options Atlas provides. Do not invent shard names or remove TLS. Confirm that the cluster is running and that your current IP is allowed in Atlas Network Access if DNS succeeds but connection still fails.

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
src/proxy.ts             Login protection for pages and APIs
data/                    Existing JSON seed/reference data
public/                  Static assets
```

The JSON files in `data/` are not the primary runtime database. MongoDB is the source of truth for records created through the application.

## Helping colleagues get started

1. Share the URL of your hosted application. Each colleague creates an account using **Sign up**.
2. Create a workspace named after the product or initiative (for example, Customer onboarding).
3. Follow the dashboard guide: capture evidence, review opportunities, then plan an experiment.
4. Use **Import** for existing documents or **Research** for a research query. Review generated findings against the original evidence.
5. Use **Switch** to change workspaces and **Download backup** to export the active workspace.

Accounts have private workspaces. Shared editing, invitations, and team permissions are not implemented; giving a colleague the same workspace name does not share your data.

The sidebar provides navigation, search, and light/dark mode. Use Ctrl/Cmd+K to search and Ctrl/Cmd+B to toggle navigation. Animations use GSAP for page entrances and Anime.js for the workflow guide, and respect the device's reduced-motion setting.

### Production sessions and existing workspaces

Set a private, randomly generated `SESSION_SECRET` before running a production build/server. Production session cookies require HTTPS. The app refuses to sign production sessions using the development fallback secret.

New workspaces have unique IDs independent of their names. If legacy workspaces share an ID across accounts, access is blocked to prevent exposing another person's records. An administrator must review ownership before migrating those records; the app does not guess who owns ambiguous legacy data.

### Animation delivery

GSAP 3.13.0 and Anime.js 4.0.2 load from version-pinned jsDelivr URLs using Next.js Script. Animation loading never blocks workspace content. Restricted networks that block jsDelivr will show the same functional interface without these animations. This checkout could not reach the npm registry during implementation, so these libraries are not bundled npm dependencies.

Run the workspace ownership regression checks with `node --test workspace-isolation.test.cjs`.


## Working through a discovery

After signing in, **Your research** shows your saved reports across your private workspaces. Search for a report, open a workspace, or choose **Start your first research** when there are no reports yet. A new workspace opens the research form automatically.

Use the navigation groups to move through your work:
- **Understand:** research reports, customer insights, interviews, imported evidence, and personas.
- **Decide:** opportunities and feature priorities.
- **Validate:** assumptions, experiments, and the Solution Tree.

In the **Solution Tree**, start with a measurable outcome. Select a card to edit its title or add the next level: customer opportunity, possible solution, then experiment. You can link existing workspace records. Including existing evidence uses explicit opportunity-to-feature links. Removing a branch keeps the linked workspace records. Changes are saved after the server confirms them; conflicting edits prompt you to reload.

Record findings using **Record results** in Experiments. Research report notes and Markdown downloads are available on the report detail page.

## Regression checks

```bash
node --test workspace-isolation.test.cjs tests/modules.test.cjs
npm run lint
npm run build
```

The regression suite uses isolated in-memory storage and covers record validation, ownership, import normalization, research history, and tree conflicts. Live MongoDB connectivity and external research providers require a separately configured integration environment. GSAP and Anime.js load from pinned CDN URLs; the interface remains usable when those scripts are unavailable and respects reduced-motion preferences.

For the isolated browser walkthrough and its setup, see [tests/README.md](tests/README.md).
