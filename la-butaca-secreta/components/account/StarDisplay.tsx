"use client";

import { useId } from "react";

const STAR_PATH =
  "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z";

/** 5 estrellas (con medias) de solo lectura, mismo icono que el selector. */
export default function StarDisplay({
  value,
  size = 16,
}: {
  value: number;
  size?: number;
}) {
  const uid = useId();

  return (
    <div
      className="flex"
      role="img"
      aria-label={`${value} de 5 estrellas`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = Math.max(0, Math.min(1, value - (star - 1)));
        const clipId = `${uid}-${star}`;

        return (
          <svg
            key={star}
            viewBox="0 0 24 24"
            width={size}
            height={size}
            aria-hidden="true"
          >
            <path d={STAR_PATH} fill="#3f3f46" />

            {fill > 0 && (
              <>
                <clipPath id={clipId}>
                  <rect x="0" y="0" width={fill * 24} height="24" />
                </clipPath>
                <path d={STAR_PATH} fill="#facc15" clipPath={`url(#${clipId})`} />
              </>
            )}
          </svg>
        );
      })}
    </div>
  );
}
