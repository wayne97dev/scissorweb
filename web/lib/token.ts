// $PVP token config.
// After the pump.fun launch, paste the mint (contract address) into TOKEN_MINT
// and redeploy — the token bar + links appear automatically across the site.
export const TOKEN_MINT = '';
export const TICKER = '$PVP';

export const hasToken = (): boolean => TOKEN_MINT.trim().length > 0;
export const dexscreenerUrl = (): string => `https://dexscreener.com/solana/${TOKEN_MINT}`;
export const pumpfunUrl = (): string => `https://pump.fun/coin/${TOKEN_MINT}`;
