'use client';

import { useEffect, useState } from 'react';
import type { Pick } from '@rps/shared';
import { pickEmoji } from '@/lib/format';

// Art lives in web/public/hands/{rock,paper,scissors}.png (square, with bg).
// Until a file exists, the emoji fallback is shown.
const EXT = 'png';

/** Fills its (rounded, overflow-hidden) parent with the hand art, cover-style. */
export function HandArt({
  pick,
  emojiSize = '3rem',
  className = '',
}: {
  pick: Pick;
  emojiSize?: string;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => setLoaded(false), [pick]);

  return (
    <span className={`relative block overflow-hidden ${className}`}>
      {!loaded && (
        <span
          className="absolute inset-0 grid place-items-center drop-shadow"
          style={{ fontSize: emojiSize, lineHeight: 1 }}
        >
          {pickEmoji(pick)}
        </span>
      )}
      <img
        src={`/hands/${pick}.${EXT}`}
        alt={pick}
        draggable={false}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(false)}
        className={loaded ? 'h-full w-full object-cover' : 'absolute h-0 w-0 opacity-0'}
      />
    </span>
  );
}
