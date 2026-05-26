import type { Server, Socket } from 'socket.io';
import { isValidPick, solToLamports, type Pick } from '@rps/shared';
import { config } from './config';
import { engine } from './engine';
import { publicBalance } from './ledger';
import { makeNonce, verifyLogin } from './auth';
import { custodyInfo, faucet, verifyAndCreditDeposit, withdraw } from './solana';
import { scheduleBotJoin } from './bot';

const userRoom = (pubkey: string) => `user:${pubkey}`;
const gameRoom = (id: string) => `game:${id}`;
const LOBBY = 'lobby';

interface SocketData {
  pubkey?: string;
  nonce?: string;
}

function emitBalance(io: Server, pubkey: string) {
  io.to(userRoom(pubkey)).emit('balance', publicBalance(pubkey));
}

function requireAuth(socket: Socket): string {
  const pubkey = (socket.data as SocketData).pubkey;
  if (!pubkey) throw new Error('NOT_AUTHENTICATED');
  return pubkey;
}

function fail(socket: Socket, scope: string, err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  socket.emit('error', { scope, message });
}

export function attachSockets(io: Server) {
  // --- broadcast engine state changes to the right rooms --------------------
  engine.on('game:update', (gameId: string) => {
    const g = engine.getGame(gameId);
    if (!g) return;
    io.to(gameRoom(gameId)).emit('game:state', engine.toPublic(g));
  });

  engine.on('settled', (gameId: string) => {
    const g = engine.getGame(gameId);
    if (!g) return;
    io.to(gameRoom(gameId)).emit('game:settled', engine.toRecord(g));
    if (!g.isPractice) {
      emitBalance(io, g.creator);
      if (g.joiner) emitBalance(io, g.joiner);
    }
  });

  engine.on('lobby:update', () => {
    io.to(LOBBY).emit('lobby', { games: engine.listOpenGames() });
  });

  // --- per-connection handlers ----------------------------------------------
  io.on('connection', (socket: Socket) => {
    socket.emit('custody', custodyInfo());

    socket.on('auth:nonce', () => {
      const nonce = makeNonce();
      (socket.data as SocketData).nonce = nonce;
      socket.emit('auth:nonce', { nonce });
    });

    socket.on('auth:login', (payload: { pubkey: string; message: string; signature: string }) => {
      try {
        const expected = (socket.data as SocketData).nonce;
        if (!expected) throw new Error('NO_NONCE_REQUESTED');
        const res = verifyLogin(payload, expected);
        if (!res.ok) throw new Error(res.error ?? 'LOGIN_FAILED');
        (socket.data as SocketData).pubkey = payload.pubkey;
        (socket.data as SocketData).nonce = undefined;
        socket.join(userRoom(payload.pubkey));
        socket.join(LOBBY);
        socket.emit('auth:ok', { pubkey: payload.pubkey });
        socket.emit('balance', publicBalance(payload.pubkey));
        socket.emit('lobby', { games: engine.listOpenGames() });

        // Resume any in-flight game this player is part of (handles navigating
        // back to the lobby or reconnecting after a refresh).
        const active = engine.findActiveGameFor(payload.pubkey);
        if (active) {
          socket.join(gameRoom(active.id));
          socket.emit('game:state', engine.toPublic(active));
        }
      } catch (err) {
        fail(socket, 'auth', err);
      }
    });

    socket.on('lobby:list', () => {
      socket.join(LOBBY);
      socket.emit('lobby', { games: engine.listOpenGames() });
    });

    socket.on('balance:get', () => {
      try {
        socket.emit('balance', publicBalance(requireAuth(socket)));
      } catch (err) {
        fail(socket, 'balance', err);
      }
    });

    socket.on('faucet', () => {
      try {
        const pubkey = requireAuth(socket);
        faucet(pubkey);
        emitBalance(io, pubkey);
      } catch (err) {
        fail(socket, 'faucet', err);
      }
    });

    socket.on('deposit:verify', async (payload: { signature: string }) => {
      try {
        const pubkey = requireAuth(socket);
        await verifyAndCreditDeposit(payload?.signature, pubkey);
        emitBalance(io, pubkey);
      } catch (err) {
        fail(socket, 'deposit', err);
      }
    });

    socket.on('withdraw', async (payload: { lamports: number }) => {
      try {
        const pubkey = requireAuth(socket);
        const lamports = Math.floor(Number(payload?.lamports));
        if (!Number.isFinite(lamports) || lamports <= 0) throw new Error('INVALID_AMOUNT');
        const signature = await withdraw(pubkey, lamports);
        emitBalance(io, pubkey);
        socket.emit('withdraw:ok', { signature, lamports });
      } catch (err) {
        fail(socket, 'withdraw', err);
      }
    });

    socket.on('game:create', (payload: { betSol: number; isPractice?: boolean }) => {
      try {
        const pubkey = requireAuth(socket);
        const isPractice = !!payload?.isPractice;
        const betLamports = solToLamports(Number(payload?.betSol));
        if (!Number.isInteger(betLamports) || betLamports <= 0) throw new Error('INVALID_BET');
        if (betLamports < config.minBetLamports || betLamports > config.maxBetLamports) {
          throw new Error('BET_OUT_OF_RANGE');
        }
        const g = engine.createGame(pubkey, betLamports, isPractice);
        socket.join(gameRoom(g.id));
        socket.emit('game:created', engine.toPublic(g));
        emitBalance(io, pubkey);
        if (isPractice) scheduleBotJoin(g.id);
      } catch (err) {
        fail(socket, 'game:create', err);
      }
    });

    socket.on('game:cancel', (payload: { gameId: string }) => {
      try {
        const pubkey = requireAuth(socket);
        engine.cancelGame(payload?.gameId, pubkey);
        emitBalance(io, pubkey);
      } catch (err) {
        fail(socket, 'game:cancel', err);
      }
    });

    socket.on('game:join', (payload: { gameId: string }) => {
      try {
        const pubkey = requireAuth(socket);
        socket.join(gameRoom(payload?.gameId));
        engine.joinGame(payload?.gameId, pubkey);
        emitBalance(io, pubkey);
      } catch (err) {
        fail(socket, 'game:join', err);
      }
    });

    socket.on('game:subscribe', (payload: { gameId: string }) => {
      const g = engine.getGame(payload?.gameId);
      if (!g) return fail(socket, 'game:subscribe', new Error('GAME_NOT_FOUND'));
      socket.join(gameRoom(g.id));
      socket.emit('game:state', engine.toPublic(g));
      if (g.status === 'settled') socket.emit('game:settled', engine.toRecord(g));
    });

    socket.on('game:commit', (payload: { gameId: string; commitment: string }) => {
      try {
        const pubkey = requireAuth(socket);
        engine.commit(payload?.gameId, pubkey, payload?.commitment);
      } catch (err) {
        fail(socket, 'game:commit', err);
      }
    });

    socket.on('game:reveal', (payload: { gameId: string; pick: Pick; key: string }) => {
      try {
        const pubkey = requireAuth(socket);
        if (!isValidPick(payload?.pick)) throw new Error('BAD_PICK');
        engine.reveal(payload?.gameId, pubkey, payload.pick, payload?.key);
      } catch (err) {
        fail(socket, 'game:reveal', err);
      }
    });
  });
}
