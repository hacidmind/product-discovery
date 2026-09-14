# Verification

Run the backend regression suite from the repository root:

```powershell
node --test workspace-isolation.test.cjs tests/modules.test.cjs
npm.cmd run lint
npm.cmd run build
```

The backend checks execute the route handlers with in-memory storage. They cover creation, listing, deletion, required fields, workspace ownership, JSON import normalization and relationship remapping, report history, and Solution Tree save conflicts.

## Browser walkthrough

`browser-review.cjs` uses Playwright and installed Microsoft Edge. Playwright is an optional verification dependency; install it separately if needed (`npm install --no-save playwright`). The script only targets localhost:3007 and intercepts API requests with fixtures. It blocks external hosts, so no test data is written to MongoDB.

Build and run a separate local instance in PowerShell:

```powershell
$env:NEXT_BUILD_DIR = '.next-review'
npm.cmd run build
$env:SESSION_SECRET = 'module-review-only-session-secret'
npm.cmd run start -- --port 3007
```

In another terminal, from the repository root:

```powershell
node tests/browser-review.cjs
```

The secret above is exclusively for this isolated localhost test server. Close that server after testing. The script creates a temporary session for the test instance; it does not validate your account password.

The walkthrough checks login routing, saved and empty research libraries, populated module pages, report notes and downloads, experiment results, tree editing and failed-save recovery, mobile width, and first research creation. It writes screenshots in the repository root.

## Integration limits

These checks do not confirm live MongoDB connectivity, external research-provider responses, or CDN animation loading. The browser walkthrough explicitly tests usable rendering when external scripts are blocked. GSAP and Anime.js are configured as progressive enhancements with reduced-motion support.
