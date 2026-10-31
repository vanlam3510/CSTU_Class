# Doodle Ladder
A real-time drawing party for 2–8 players, built with Node.js, Express and Socket.IO. Rules are available from **How to play** on every screen.

## Run
Requires Node.js 20 or later.

```sh
npm ci
npm start
```

The server listens on port 3000 (or `PORT`) on all interfaces. Open the server address in two independent browsers, create a room, and join with the five-character code. For phones on the same network, use the host computer's LAN address rather than localhost. Internet play requires public hosting.

```sh
npm test
```

## Publish
Deploy this repository as a Node web service on a host that supports persistent processes and WebSockets (for example Render). Build command: `npm ci`; start command: `npm start`. The host must provide HTTPS and pass its assigned `PORT`. Verify two separate devices can create/join a room and complete a round at the public URL.

Use a single server instance: rooms and drawings live in memory and reset on restart. Joining during a match is disabled. Disconnects release a seat; reconnect in the lobby or after the match ends. No accounts, database, or secrets are required. Public deployment is not performed by these instructions.

The original course guide remains in `docs/index.html`.

## Words
The expanded word bank is shuffled separately for each room. No word repeats until that room has used the full bank, including across rematches. A new deck never begins with the previous round's word. Separate rooms and server restarts have independent decks and can share words.

## Host on Google Cloud Run
Cloud Run supports the Node.js server and live Socket.IO connections. GitHub Pages cannot run the server. You can keep source on GitHub and deploy from a checkout.

Prerequisites: a GCP project with billing enabled, the Google Cloud CLI authenticated to your account, and permission to enable APIs, build containers, deploy Cloud Run services, and allow public invocation. Cloud Run and builds may incur charges; review your project pricing and budgets.

From the project folder, deploy with your actual project ID (not its display name):

```sh
gcloud auth login
./deploy-gcp.sh YOUR_PROJECT_ID us-central1
```

The script prints the Cloud Run service URL. Open it on two separate devices, create a room on one, join from the other, and complete a round. The service is public and requires no player login. It uses Node 22, `/health`, port 8080, session affinity, at most one instance, and a one-hour connection/request timeout.

Rooms live in memory. Scaling to zero, deployments, instance replacement, and server restarts lose games. The one-instance limit reduces routing problems but is not durable storage or a guarantee of one process during instance replacement. Session affinity is best effort. Connections may drop when the one-hour request limit is reached. For a class demo this is a reasonable starting point; reliable multi-instance hosting would require shared room state and Socket.IO coordination.

No GCP keys belong in this repository. The Docker build excludes credentials, dependencies, Git metadata, and local archives. Deploying this repository to GitHub alone does not create the Cloud Run service.
