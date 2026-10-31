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
