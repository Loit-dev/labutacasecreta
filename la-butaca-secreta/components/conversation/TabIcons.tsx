// Iconos de la barra de pestañas: mismo lenguaje visual que los de
// ModeSelect.tsx (trazo dorado #facc15, sin relleno) — sustituyen a los
// emoji que llevaban antes (ver DECISIONS.md, "Iconos nuevos en
// pestañas y botones").

export function RecommenderIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 9.5l15.5-5 1.3 4-15.5 5-1.3-4z"
        stroke="#facc15"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M3 9.5V19a1 1 0 001 1h15a1 1 0 001-1v-7.3"
        stroke="#facc15"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M7.5 6.3l2 3.4M12 4.8l2 3.4" stroke="#facc15" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function CalendarIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15" rx="2" stroke="#facc15" strokeWidth="1.6" />
      <path d="M3.5 9.5h17" stroke="#facc15" strokeWidth="1.6" />
      <path d="M8 3v4M16 3v4" stroke="#facc15" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="8" cy="13.5" r="1.1" fill="#facc15" />
      <circle cx="12" cy="13.5" r="1.1" fill="#facc15" />
      <circle cx="8" cy="17" r="1.1" fill="#facc15" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" stroke="#facc15" strokeWidth="1.6" />
      <path d="M19.5 19.5l-4.3-4.3" stroke="#facc15" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function AccountIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="#facc15" strokeWidth="1.6" />
      <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" stroke="#facc15" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
