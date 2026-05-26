'use client';

import { useEffect, useState } from 'react';
import type { Pick } from '@rps/shared';
import { pickEmoji } from '@/lib/format';

// Drop your Leonardo-generated art here (transparent PNG, square):
//   web/public/hands/rock.png · paper.png · scissors.png
// Until the files exist, the component gracefully shows the emoji fallback.
const EXT = 'png';

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
    <span className={`relative grid place-items-center ${className}`}>
      {!loaded && (
        <span style={{ fontSize: emojiSize, lineHeight: 1 }} className="drop-shadow">
          {pickEmoji(pick)}
        </span>
      )}
      <img
        src={`/hands/${pick}.${EXT}`}
        alt={pick}
        draggable={false}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(false)}
        className={
          loaded
            ? 'max-h-full max-w-full object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]'
            : 'absolute h-0 w-0 opacity-0'
        }
      />
    </span>
  );
}
