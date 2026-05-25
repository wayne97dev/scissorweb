import { store, UserRow } from './store';

export function getUser(pubkey: string): UserRow | undefined {
  return store.db.users[pubkey];
}

export function ensureUser(pubkey: string): UserRow {
  let u = store.db.users[pubkey];
  if (!u) {
    u = { pubkey, balance: 0, locked: 0, createdAt: Date.now() };
    store.db.users[pubkey] = u;
    store.save();
  }
  return u;
}

export function publicBalance(pubkey: string): { balance: number; locked: number } {
  const u = store.db.users[pubkey];
  return { balance: u?.balance ?? 0, locked: u?.locked ?? 0 };
}

export function credit(pubkey: string, lamports: number) {
  assertPositive(lamports);
  const u = ensureUser(pubkey);
  u.balance += lamports;
  store.save();
}

export function canAfford(pubkey: string, lamports: number): boolean {
  const u = store.db.users[pubkey];
  return (u?.balance ?? 0) >= lamports;
}

/** Move spendable funds into escrow for a game. Throws if insufficient. */
export function lockBet(pubkey: string, lamports: number) {
  assertPositive(lamports);
  const u = ensureUser(pubkey);
  if (u.balance < lamports) throw new Error('INSUFFICIENT_BALANCE');
  u.balance -= lamports;
  u.locked += lamports;
  store.save();
}

/** Return escrowed funds to spendable balance (refund / tie / cancel). */
export function unlockBet(pubkey: string, lamports: number) {
  assertPositive(lamports);
  const u = ensureUser(pubkey);
  const release = Math.min(u.locked, lamports);
  u.locked -= release;
  u.balance += release;
  store.save();
}

/** Remove escrowed funds (they leave the loser and become part of the pot). */
export function consumeLocked(pubkey: string, lamports: number) {
  assertPositive(lamports);
  const u = ensureUser(pubkey);
  u.locked = Math.max(0, u.locked - lamports);
  store.save();
}

/** Debit spendable balance (used for withdrawals). Throws if insufficient. */
export function debit(pubkey: string, lamports: number) {
  assertPositive(lamports);
  const u = ensureUser(pubkey);
  if (u.balance < lamports) throw new Error('INSUFFICIENT_BALANCE');
  u.balance -= lamports;
  store.save();
}

function assertPositive(lamports: number) {
  if (!Number.isInteger(lamports) || lamports <= 0) {
    throw new Error('INVALID_AMOUNT');
  }
}
