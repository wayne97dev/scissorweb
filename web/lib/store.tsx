'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  buildLoginMessage,
  computeCommitment,
  type FairnessRecord,
  type Pick,
  type PublicGame,
  type Seat,
} from '@rps/shared';
import { Identity, toBase64 } from './identity';
import { randomClientKey } from './rng';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';

export interface CustodyInfo {
  demoMode: boolean;
  rpc: string;
  platformAddress: string | null;
  faucetLamports: number;
}
export interface Balance {
  balance: number;
  locked: number;
}
export interface Toast {
  kind: 'error' | 'info' | 'success';
  message: string;
}

interface AppState {
  connected: boolean;
  identity: Identity | null;
  pubkey: string | null;
  authed: boolean;
  balance: Balance;
  custody: CustodyInfo | null;
  lobby: PublicGame[];
  activeGame: PublicGame | null;
  myGame: PublicGame | null;
  record: FairnessRecord | null;
  toast: Toast | null;
  mySeat: Seat | null;
  mySecretPick: Pick | null;

  loginWith: (id: Identity) => void;
  logout: () => void;
  faucet: () => void;
  withdraw: (lamports: number) => void;
  verifyDeposit: (signature: string) => void;
  createGame: (betSol: number, isPractice: boolean) => void;
  cancelGame: () => void;
  joinGame: (game: PublicGame) => void;
  makePick: (p: Pick) => void;
  leaveGame: () => void;
  returnToGame: () => void;
  setToast: (t: Toast | null) => void;
}

const Ctx = createContext<AppState | null>(null);
export const useApp = (): AppState => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp must be used within AppProvider');
  return c;
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const identityRef = useRef<Identity | null>(null);
  const loggingInRef = useRef(false);
  const secretsRef = useRef<Map<string, { pick: Pick; key: string }>>(new Map());
  const revealedRef = useRef<Set<string>>(new Set());

  const [connected, setConnected] = useState(false);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [pubkey, setPubkey] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);
  const [balance, setBalance] = useState<Balance>({ balance: 0, locked: 0 });
  const [custody, setCustody] = useState<CustodyInfo | null>(null);
  const [lobby, setLobby] = useState<PublicGame[]>([]);
  const [activeGame, setActiveGame] = useState<PublicGame | null>(null);
  const [myGame, setMyGame] = useState<PublicGame | null>(null);
  const [record, setRecord] = useState<FairnessRecord | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [myPick, setMyPick] = useState<{ gameId: string; pick: Pick } | null>(null);

  const activeGameRef = useRef<PublicGame | null>(null);
  activeGameRef.current = activeGame;
  const pubkeyRef = useRef<string | null>(null);
  pubkeyRef.current = pubkey;
  const myGameRef = useRef<PublicGame | null>(null);
  myGameRef.current = myGame;

  const doLogin = useCallback(async (sock: Socket, id: Identity) => {
    if (loggingInRef.current) return;
    loggingInRef.current = true;
    try {
      const nonce: string = await new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error('nonce timeout')), 8000);
        sock.once('auth:nonce', (d: { nonce: string }) => {
          clearTimeout(t);
          resolve(d.nonce);
        });
        sock.emit('auth:nonce');
      });
      const issued = Date.now();
      const message = buildLoginMessage(id.pubkey, nonce, issued);
      const sig = await id.signMessage(new TextEncoder().encode(message));
      sock.emit('auth:login', { pubkey: id.pubkey, message, signature: toBase64(sig) });
    } catch (err) {
      setToast({ kind: 'error', message: `Login failed: ${(err as Error).message}` });
    } finally {
      loggingInRef.current = false;
    }
  }, []);

  // Create the socket once and wire all persistent listeners.
  useEffect(() => {
    const sock = io(SERVER_URL, { transports: ['websocket'] });
    socketRef.current = sock;

    sock.on('connect', () => {
      setConnected(true);
      if (identityRef.current) void doLogin(sock, identityRef.current);
    });
    sock.on('disconnect', () => {
      setConnected(false);
      setAuthed(false);
    });
    sock.on('custody', (info: CustodyInfo) => setCustody(info));
    sock.on('balance', (b: Balance) => setBalance(b));
    sock.on('lobby', (d: { games: PublicGame[] }) => setLobby(d.games));
    sock.on('auth:ok', (d: { pubkey: string }) => {
      setAuthed(true);
      setPubkey(d.pubkey);
      pubkeyRef.current = d.pubkey;
    });
    sock.on('game:created', (g: PublicGame) => {
      secretsRef.current.delete(g.id);
      revealedRef.current.delete(g.id);
      setMyPick(null);
      setRecord(null);
      setActiveGame(g);
      setMyGame(g);
    });
    sock.on('game:state', (g: PublicGame) => {
      const cur = activeGameRef.current;
      const mine = g.creator === pubkeyRef.current || g.joiner === pubkeyRef.current;
      const live = g.status === 'open' || g.status === 'committing' || g.status === 'revealing';
      // Re-attach to a live game we belong to (e.g. opponent joined after we
      // went back to the lobby, or we reconnected) so we're never stranded.
      if ((cur && cur.id === g.id) || (mine && live)) setActiveGame(g);
      // Track our in-flight game so the lobby can offer a "return" button.
      if (mine) {
        if (live) setMyGame(g);
        else setMyGame((prev) => (prev && prev.id === g.id ? null : prev));
      }
    });
    sock.on('game:settled', (rec: FairnessRecord) => {
      const cur = activeGameRef.current;
      if (cur && cur.id === rec.gameId) setRecord(rec);
      setMyGame((prev) => (prev && prev.id === rec.gameId ? null : prev));
    });
    sock.on('withdraw:ok', (d: { lamports: number; signature: string }) => {
      setToast({ kind: 'success', message: `Withdrawal sent (${d.signature.slice(0, 10)}…)` });
    });
    sock.on('error', (e: { scope: string; message: string }) => {
      setToast({ kind: 'error', message: `${e.scope}: ${e.message}` });
    });

    return () => {
      sock.removeAllListeners();
      sock.close();
      socketRef.current = null;
    };
  }, [doLogin]);

  // Auto-reveal: once both sides have committed, reveal our stored pick.
  useEffect(() => {
    const g = activeGame;
    const sock = socketRef.current;
    if (!g || !sock || !pubkey) return;
    if (g.status !== 'revealing') return;
    const seat: Seat | null = g.creator === pubkey ? 'creator' : g.joiner === pubkey ? 'joiner' : null;
    if (!seat) return;
    if (revealedRef.current.has(g.id)) return;
    const secret = secretsRef.current.get(g.id);
    if (!secret) return;
    revealedRef.current.add(g.id);
    sock.emit('game:reveal', { gameId: g.id, pick: secret.pick, key: secret.key });
  }, [activeGame, pubkey]);

  const loginWith = useCallback(
    (id: Identity) => {
      identityRef.current = id;
      setIdentity(id);
      const sock = socketRef.current;
      if (sock && sock.connected) void doLogin(sock, id);
    },
    [doLogin]
  );

  const logout = useCallback(() => {
    identityRef.current = null;
    setIdentity(null);
    setAuthed(false);
    setPubkey(null);
    setActiveGame(null);
    setMyGame(null);
    setRecord(null);
    socketRef.current?.disconnect().connect();
  }, []);

  const emit = (event: string, payload?: unknown) => socketRef.current?.emit(event, payload);

  const faucet = useCallback(() => emit('faucet'), []);
  const withdraw = useCallback((lamports: number) => emit('withdraw', { lamports }), []);
  const verifyDeposit = useCallback((signature: string) => emit('deposit:verify', { signature }), []);
  const createGame = useCallback(
    (betSol: number, isPractice: boolean) => emit('game:create', { betSol, isPractice }),
    []
  );
  const cancelGame = useCallback(() => {
    const g = activeGameRef.current;
    if (g) emit('game:cancel', { gameId: g.id });
    setActiveGame(null);
    setRecord(null);
    setMyPick(null);
    setMyGame(null);
  }, []);
  const joinGame = useCallback((game: PublicGame) => {
    secretsRef.current.delete(game.id);
    revealedRef.current.delete(game.id);
    setMyPick(null);
    setRecord(null);
    setActiveGame(game);
    emit('game:join', { gameId: game.id });
    emit('game:subscribe', { gameId: game.id });
  }, []);
  const makePick = useCallback(
    (p: Pick) => {
      const g = activeGameRef.current;
      const pk = pubkey;
      if (!g || !pk || g.status !== 'committing') return;
      const seat: Seat | null = g.creator === pk ? 'creator' : g.joiner === pk ? 'joiner' : null;
      if (!seat) return;
      if (g.committed[seat]) return;
      if (secretsRef.current.has(g.id)) return;
      const key = randomClientKey();
      secretsRef.current.set(g.id, { pick: p, key });
      setMyPick({ gameId: g.id, pick: p });
      emit('game:commit', { gameId: g.id, commitment: computeCommitment(g.id, p, key) });
    },
    [pubkey]
  );
  const leaveGame = useCallback(() => {
    setActiveGame(null);
    setRecord(null);
    setMyPick(null);
  }, []);
  const returnToGame = useCallback(() => {
    const g = myGameRef.current;
    if (!g) return;
    setRecord(null);
    setActiveGame(g);
    emit('game:subscribe', { gameId: g.id }); // rejoin room + refresh state
  }, []);

  const mySeat: Seat | null = activeGame
    ? activeGame.creator === pubkey
      ? 'creator'
      : activeGame.joiner === pubkey
        ? 'joiner'
        : null
    : null;
  const mySecretPick = myPick && activeGame && myPick.gameId === activeGame.id ? myPick.pick : null;

  const value: AppState = {
    connected,
    identity,
    pubkey,
    authed,
    balance,
    custody,
    lobby,
    activeGame,
    myGame,
    record,
    toast,
    mySeat,
    mySecretPick,
    loginWith,
    logout,
    faucet,
    withdraw,
    verifyDeposit,
    createGame,
    cancelGame,
    joinGame,
    makePick,
    leaveGame,
    returnToGame,
    setToast,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
