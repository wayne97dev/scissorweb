import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { config } from './config';
import { store } from './store';
import { engine } from './engine';
import { custodyInfo } from './solana';
import { attachSockets } from './sockets';

const origins = [config.clientOrigin, 'http://localhost:3000', 'http://127.0.0.1:3000'];

const app = express();
app.use(cors({ origin: origins }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/api/custody', (_req, res) => res.json(custodyInfo()));
app.get('/api/game/:id', (req, res) => {
  const g = engine.getGame(req.params.id);
  if (!g) return res.status(404).json({ error: 'GAME_NOT_FOUND' });
  res.json({
    game: engine.toPublic(g),
    record: g.status === 'settled' ? engine.toRecord(g) : null,
  });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: origins, methods: ['GET', 'POST'] },
});

attachSockets(io);

server.listen(config.port, () => {
  console.log(`[rps] server on :${config.port}  demoMode=${config.demoMode}  rpc=${config.solanaRpc}`);
});

function shutdown() {
  console.log('\n[rps] shutting down, flushing store…');
  store.flush();
  io.close();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
