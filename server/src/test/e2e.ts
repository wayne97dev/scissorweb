/**
 * Headless end-to-end test: boots an in-process server, connects two socket
 * clients, plays a full provably-fair round, and asserts the outcome, the
 * published fairness record, and the 0%-house-edge balance movements.
 *
 * Run: npm run test --workspace server
 */
import os from 'os';
import path from 'path';
import fs from 'fs';

// Configure the environment BEFORE importing anything that reads config.
const tmpData = path.join(os.tmpdir(), `rps-e2e-${Date.now()}.json`);
process.env.DEMO_MODE = 'true';
process.env.DATA_FILE = tmpData;
process.env.FAUCET_LAMPORTS = '1000000000'; // 1 SOL

import http from 'http';
import { AddressInfo } from 'net';
import { Server } from 'socket.io';
import { io as ClientIO, Socket as ClientSocket } from 'socket.io-client';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import {
  auditRecord,
  buildLoginMessage,
  computeCommitment,
  solToLamports,
  type FairnessRecord,
  type Pick,
} from '@rps/shared';
import { attachSockets } from '../sockets';
import { randomClientKey } from '../rng';

let passed = 0;
const failures: string[] = [];
function check(name: string, cond: boolean, extra?: unknown) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failures.push(name);
    console.error(`  ✗ ${name}`, extra ?? '');
  }
}

function once<T = any>(socket: ClientSocket, event: string, timeoutMs = 8000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout waiting for "${event}"`)), timeoutMs);
    socket.once(event, (data: T) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

function waitFor<T = any>(
  socket: ClientSocket,
  event: string,
  predicate: (data: T) => boolean,
  timeoutMs = 10000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout waiting for "${event}" predicate`)), timeoutMs);
    const handler = (data: T) => {
      if (predicate(data)) {
        clearTimeout(timer);
        socket.off(event, handler);
        resolve(data);
      }
    };
    socket.on(event, handler);
  });
}

interface Identity {
  pubkey: string;
  secretKey: Uint8Array;
}

function newIdentity(): Identity {
  const kp = nacl.sign.keyPair();
  return { pubkey: bs58.encode(kp.publicKey), secretKey: kp.secretKey };
}

async function login(socket: ClientSocket, id: Identity) {
  socket.emit('auth:nonce');
  const { nonce } = await once<{ nonce: string }>(socket, 'auth:nonce');
  const issued = Date.now();
  const message = buildLoginMessage(id.pubkey, nonce, issued);
  const signature = Buffer.from(
    nacl.sign.detached(new TextEncoder().encode(message), id.secretKey)
  ).toString('base64');
  socket.emit('auth:login', { pubkey: id.pubkey, message, signature });
  await once(socket, 'auth:ok');
}

async function faucetTo(socket: ClientSocket, target: number) {
  socket.emit('faucet');
  await waitFor<{ balance: number }>(socket, 'balance', (b) => b.balance >= target);
}

async function main() {
  const httpServer = http.createServer();
  const ioServer = new Server(httpServer, { cors: { origin: '*' } });
  attachSockets(ioServer);
  await new Promise<void>((r) => httpServer.listen(0, r));
  const port = (httpServer.address() as AddressInfo).port;
  const url = `http://localhost:${port}`;
  console.log(`\n[e2e] in-process server on ${url}\n`);

  const A = newIdentity(); // creator
  const B = newIdentity(); // joiner
  const sockA = ClientIO(url, { transports: ['websocket'] });
  const sockB = ClientIO(url, { transports: ['websocket'] });

  await Promise.all([once(sockA, 'connect'), once(sockB, 'connect')]);

  // --- Scenario 1: a decisive round (A: rock beats B: scissors) -------------
  console.log('Scenario 1 — decisive round, fairness + balances');
  await login(sockA, A);
  await login(sockB, B);

  const bet = 0.1;
  const betLamports = solToLamports(bet);
  await faucetTo(sockA, solToLamports(1));
  await faucetTo(sockB, solToLamports(1));

  sockA.emit('game:create', { betSol: bet, isPractice: false });
  const created = await once<{ id: string }>(sockA, 'game:created');
  const gameId = created.id;
  check('game created with id', !!gameId);

  // B joins -> committing
  const committingA = waitFor(sockA, 'game:state', (g: any) => g.status === 'committing');
  sockB.emit('game:join', { gameId });
  await committingA;

  // Commit both (A: rock, B: scissors)
  const aPick: Pick = 'rock';
  const bPick: Pick = 'scissors';
  const aKey = randomClientKey();
  const bKey = randomClientKey();
  const revealingA = waitFor(sockA, 'game:state', (g: any) => g.status === 'revealing');
  sockA.emit('game:commit', { gameId, commitment: computeCommitment(gameId, aPick, aKey) });
  sockB.emit('game:commit', { gameId, commitment: computeCommitment(gameId, bPick, bKey) });
  await revealingA;
  check('both commits advanced to revealing', true);

  // Reveal both
  const settledP = once<FairnessRecord>(sockA, 'game:settled');
  const aBalP = waitFor<{ balance: number }>(sockA, 'balance', (b) => b.balance === solToLamports(1) + betLamports);
  const bBalP = waitFor<{ balance: number }>(sockB, 'balance', (b) => b.balance === solToLamports(1) - betLamports);
  sockA.emit('game:reveal', { gameId, pick: aPick, key: aKey });
  sockB.emit('game:reveal', { gameId, pick: bPick, key: bKey });

  const record = await settledP;
  check('outcome is creator (rock beats scissors)', record.outcome === 'creator', record.outcome);
  check('winner is A', record.winner === A.pubkey);
  check('forfeit flag is null (clean round)', record.forfeitBy === null);

  const audit = auditRecord(record);
  check('creator commitment verifies', audit.creatorOk);
  check('joiner commitment verifies', audit.joinerOk);
  check('declared outcome matches recomputed', audit.outcomeOk);

  await aBalP;
  await bBalP;
  check('winner balance = 1 SOL + bet (no rake)', true);
  check('loser balance = 1 SOL - bet', true);

  // --- Scenario 2: reveal that does not match commitment is rejected --------
  console.log('\nScenario 2 — tampered reveal is rejected (integrity guard)');
  sockA.emit('game:create', { betSol: bet, isPractice: false });
  const g2 = await once<{ id: string }>(sockA, 'game:created');
  const committing2 = waitFor(sockA, 'game:state', (g: any) => g.status === 'committing');
  sockB.emit('game:join', { gameId: g2.id });
  await committing2;

  const k2a = randomClientKey();
  const k2b = randomClientKey();
  const revealing2 = waitFor(sockA, 'game:state', (g: any) => g.status === 'revealing');
  sockA.emit('game:commit', { gameId: g2.id, commitment: computeCommitment(g2.id, 'rock', k2a) });
  sockB.emit('game:commit', { gameId: g2.id, commitment: computeCommitment(g2.id, 'paper', k2b) });
  await revealing2;

  const errP = once<{ scope: string; message: string }>(sockA, 'error');
  // A committed "rock" but tries to reveal "paper" — must be rejected.
  sockA.emit('game:reveal', { gameId: g2.id, pick: 'paper', key: k2a });
  const err = await errP;
  check('tampered reveal rejected', err.message === 'REVEAL_DOES_NOT_MATCH_COMMITMENT', err);

  // Clean up scenario 2 so it doesn't leak a hung game (let it settle honestly).
  sockA.emit('game:reveal', { gameId: g2.id, pick: 'rock', key: k2a });
  sockB.emit('game:reveal', { gameId: g2.id, pick: 'paper', key: k2b });
  await once(sockA, 'game:settled');

  sockA.close();
  sockB.close();
  ioServer.close();
  httpServer.close();
  try {
    fs.unlinkSync(tmpData);
  } catch {
    /* ignore */
  }

  console.log(`\n[e2e] ${passed} checks passed, ${failures.length} failed`);
  if (failures.length) {
    console.error('FAILED:', failures.join(', '));
    process.exit(1);
  }
  console.log('[e2e] ALL GREEN');
  process.exit(0);
}

main().catch((err) => {
  console.error('[e2e] crashed:', err);
  process.exit(1);
});
