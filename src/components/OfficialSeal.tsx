import type { CountryInfo } from "../data/countryData";

interface SealProps {
  country: CountryInfo;
}

export default function OfficialSeal({ country }: SealProps) {
  const { sealColors, sealTopText, sealBottomText, sealCenterText } = country;

  // Country-specific center emblem
  const renderEmblem = () => {
    switch (country.id) {
      case "bd": // Bangladesh - Shapla (Water Lily)
        return (
          <g transform="translate(100,88)">
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * 45 * Math.PI) / 180 - Math.PI / 2;
              return (
                <ellipse
                  key={i}
                  cx={Math.cos(angle) * 14}
                  cy={Math.sin(angle) * 14}
                  rx="9" ry="4.5"
                  fill="none"
                  stroke={sealColors.secondary}
                  strokeWidth="1.2"
                  transform={`rotate(${i * 45}, ${Math.cos(angle) * 14}, ${Math.sin(angle) * 14})`}
                />
              );
            })}
            <circle cx="0" cy="0" r="5" fill={sealColors.secondary} opacity="0.3" />
            <circle cx="0" cy="0" r="3" fill={sealColors.secondary} opacity="0.5" />
          </g>
        );

      case "us": // USA - Star
        return (
          <g transform="translate(100,88)">
            <polygon
              points="0,-20 5,-7 19,-7 8,3 12,17 0,9 -12,17 -8,3 -19,-7 -5,-7"
              fill="none" stroke={sealColors.primary} strokeWidth="1.5"
            />
            <polygon
              points="0,-12 3,-4 12,-4 5,2 7,10 0,5 -7,10 -5,2 -12,-4 -3,-4"
              fill={sealColors.primary} opacity="0.3"
            />
            {/* Small stars around */}
            {Array.from({ length: 5 }).map((_, i) => {
              const a = (i * 72 * Math.PI) / 180 - Math.PI / 2;
              return (
                <text key={i} x={Math.cos(a) * 28} y={Math.sin(a) * 28 + 3} textAnchor="middle" fontSize="6" fill={sealColors.secondary}>★</text>
              );
            })}
          </g>
        );

      case "uk": // UK - Crown
        return (
          <g transform="translate(100,88)">
            {/* Crown shape */}
            <path d="M-15,5 L-15,-8 L-8,-2 L0,-12 L8,-2 L15,-8 L15,5 Z" fill="none" stroke={sealColors.secondary} strokeWidth="1.5" />
            <path d="M-15,5 L-15,10 L15,10 L15,5 Z" fill="none" stroke={sealColors.secondary} strokeWidth="1.5" />
            <circle cx="-15" cy="-8" r="2.5" fill={sealColors.secondary} opacity="0.4" />
            <circle cx="0" cy="-12" r="2.5" fill={sealColors.secondary} opacity="0.4" />
            <circle cx="15" cy="-8" r="2.5" fill={sealColors.secondary} opacity="0.4" />
            <line x1="-20" y1="14" x2="20" y2="14" stroke={sealColors.primary} strokeWidth="1" />
          </g>
        );

      case "fr": // France - Marianne / RF
        return (
          <g transform="translate(100,85)">
            {/* Tricolor bars */}
            <rect x="-18" y="-15" width="12" height="30" fill={sealColors.primary} opacity="0.2" rx="1" />
            <rect x="-6" y="-15" width="12" height="30" fill="#FFFFFF" opacity="0.1" stroke="#ccc" strokeWidth="0.5" rx="1" />
            <rect x="6" y="-15" width="12" height="30" fill={sealColors.secondary} opacity="0.2" rx="1" />
            {/* Fasces symbol (simplified) */}
            <line x1="0" y1="-20" x2="0" y2="20" stroke={sealColors.primary} strokeWidth="1.5" />
            <ellipse cx="0" cy="-22" rx="4" ry="3" fill="none" stroke={sealColors.primary} strokeWidth="1" />
          </g>
        );

      case "de": // Germany - Eagle
        return (
          <g transform="translate(100,88)">
            {/* Simplified Bundesadler (Federal Eagle) */}
            <path d="M0,-18 C-5,-15 -18,-5 -20,5 C-20,10 -15,15 -10,12 C-5,10 -3,5 0,8 C3,5 5,10 10,12 C15,15 20,10 20,5 C18,-5 5,-15 0,-18 Z"
              fill="none" stroke={sealColors.primary} strokeWidth="1.5" />
            {/* Beak */}
            <path d="M-3,-10 L0,-5 L3,-10" fill="none" stroke={sealColors.accent} strokeWidth="1.5" />
            {/* Eye */}
            <circle cx="0" cy="-13" r="1.5" fill={sealColors.secondary} />
          </g>
        );

      case "pl": // Poland - Eagle (White Eagle)
        return (
          <g transform="translate(100,88)">
            {/* Polish White Eagle (simplified) */}
            <path d="M0,-20 C-6,-16 -20,-5 -22,5 C-22,12 -16,16 -10,13 C-5,10 -3,5 0,8 C3,5 5,10 10,13 C16,16 22,12 22,5 C20,-5 6,-16 0,-20 Z"
              fill="none" stroke={sealColors.primary} strokeWidth="1.5" />
            {/* Crown on eagle */}
            <path d="M-5,-20 L-5,-24 L-2,-22 L0,-26 L2,-22 L5,-24 L5,-20" fill="none" stroke={sealColors.primary} strokeWidth="1" />
            <circle cx="0" cy="-14" r="1.5" fill={sealColors.primary} />
          </g>
        );

      case "in": // India - Ashoka Chakra
        return (
          <g transform="translate(100,88)">
            {/* Ashoka Chakra (24-spoke wheel) */}
            <circle cx="0" cy="0" r="18" fill="none" stroke={sealColors.accent} strokeWidth="1.5" />
            <circle cx="0" cy="0" r="5" fill={sealColors.accent} opacity="0.3" />
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i * 15 * Math.PI) / 180;
              return (
                <line key={i} x1={Math.cos(angle) * 5} y1={Math.sin(angle) * 5} x2={Math.cos(angle) * 18} y2={Math.sin(angle) * 18}
                  stroke={sealColors.accent} strokeWidth="0.7" />
              );
            })}
            {/* Lion capital hint */}
            <circle cx="0" cy="0" r="2" fill={sealColors.accent} opacity="0.5" />
          </g>
        );

      case "jp": // Japan - Chrysanthemum
        return (
          <g transform="translate(100,88)">
            {/* Imperial chrysanthemum (simplified) */}
            {Array.from({ length: 16 }).map((_, i) => {
              const angle = (i * 22.5 * Math.PI) / 180;
              return (
                <ellipse key={i}
                  cx={Math.cos(angle) * 12}
                  cy={Math.sin(angle) * 12}
                  rx="6" ry="3"
                  fill="none" stroke={sealColors.primary} strokeWidth="0.8"
                  transform={`rotate(${i * 22.5}, ${Math.cos(angle) * 12}, ${Math.sin(angle) * 12})`}
                />
              );
            })}
            <circle cx="0" cy="0" r="5" fill={sealColors.primary} opacity="0.2" />
            <circle cx="0" cy="0" r="3" fill={sealColors.primary} opacity="0.4" />
          </g>
        );

      case "ca": // Canada - Maple Leaf
        return (
          <g transform="translate(100,88)">
            {/* Simplified maple leaf shape */}
            <path d="M0,-20 L3,-12 L10,-15 L7,-8 L15,-6 L8,-2 L12,5 L5,3 L3,10 L0,6 L-3,10 L-5,3 L-12,5 L-8,-2 L-15,-6 L-7,-8 L-10,-15 L-3,-12 Z"
              fill="none" stroke={sealColors.primary} strokeWidth="1.3" />
            <path d="M0,-20 L3,-12 L10,-15 L7,-8 L15,-6 L8,-2 L12,5 L5,3 L3,10 L0,6 L-3,10 L-5,3 L-12,5 L-8,-2 L-15,-6 L-7,-8 L-10,-15 L-3,-12 Z"
              fill={sealColors.primary} opacity="0.15" />
            <line x1="0" y1="10" x2="0" y2="18" stroke={sealColors.primary} strokeWidth="1.5" />
          </g>
        );

      case "au": // Australia - Southern Cross
        return (
          <g transform="translate(100,88)">
            {/* Southern Cross constellation */}
            {[
              { x: 0, y: -15, size: 5 },
              { x: -10, y: -5, size: 4 },
              { x: 10, y: -5, size: 4 },
              { x: -5, y: 8, size: 3.5 },
              { x: 5, y: 8, size: 3.5 },
              { x: 12, y: 0, size: 2.5 },
            ].map((star, i) => (
              <g key={i}>
                <text x={star.x} y={star.y + star.size / 2} textAnchor="middle" fontSize={star.size * 2.5} fill={sealColors.secondary}>★</text>
              </g>
            ))}
            {/* Commonwealth star */}
            <text x="0" y="20" textAnchor="middle" fontSize="8" fill={sealColors.secondary}>★</text>
          </g>
        );

      case "it": // Italy — Stella d'Italia
        return (
          <g transform="translate(100,88)">
             <polygon
              points="0,-22 6,-8 21,-8 9,3 13,18 0,10 -13,18 -9,3 -21,-8 -6,-8"
              fill="none" stroke={sealColors.primary} strokeWidth="1.8"
            />
            <path d="M-10,10 Q0,0 10,10" fill="none" stroke={sealColors.secondary} strokeWidth="1" opacity="0.4" />
            <circle cx="0" cy="0" r="12" fill={sealColors.primary} opacity="0.05" />
          </g>
        );

      case "sg": // Singapore — Crescent & 5 Stars
        return (
          <g transform="translate(100,88)">
            {/* Crescent */}
            <path d="M-12,-15 A15,15 0 1,0 -12,15 A12,12 0 1,1 -12,-15" fill={sealColors.primary} opacity="0.8" />
            {/* 5 Stars in a circle */}
            {Array.from({ length: 5 }).map((_, i) => {
              const a = (i * 72 * Math.PI) / 180 - Math.PI / 6;
              const x = 5 + Math.cos(a) * 8;
              const y = Math.sin(a) * 8;
              return (
                <text key={i} x={x} y={y + 3} textAnchor="middle" fontSize="9" fill={sealColors.primary}>★</text>
              );
            })}
          </g>
        );

      default:
        return (
          <g transform="translate(100,88)">
            <circle cx="0" cy="0" r="15" fill="none" stroke={sealColors.primary} strokeWidth="1.5" />
          </g>
        );
    }
  };

  return (
    <div className="relative w-44 h-44 mx-auto">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Outer decorative ring */}
        <circle cx="100" cy="100" r="96" fill="none" stroke={sealColors.primary} strokeWidth="3" />

        {/* Gear-like outer edge */}
        {Array.from({ length: 36 }).map((_, i) => {
          const angle = (i * 10 * Math.PI) / 180;
          const inner = 93;
          const outer = 97;
          return (
            <line key={`gear-${i}`}
              x1={100 + Math.cos(angle) * inner}
              y1={100 + Math.sin(angle) * inner}
              x2={100 + Math.cos(angle) * outer}
              y2={100 + Math.sin(angle) * outer}
              stroke={sealColors.primary} strokeWidth="1.5"
            />
          );
        })}

        <circle cx="100" cy="100" r="90" fill="none" stroke={sealColors.secondary} strokeWidth="2" strokeDasharray="5 3" />
        <circle cx="100" cy="100" r="85" fill="none" stroke={sealColors.primary} strokeWidth="1.5" />

        {/* Star decorations around the circle */}
        {Array.from({ length: 20 }).map((_, i) => {
          const angle = (i * 18 * Math.PI) / 180;
          const x = 100 + 87.5 * Math.cos(angle);
          const y = 100 + 87.5 * Math.sin(angle);
          return <circle key={`star-${i}`} cx={x} cy={y} r="1.5" fill={sealColors.secondary} />;
        })}

        {/* Curved text arcs */}
        <defs>
          <path id={`topArc-${country.id}`} d="M 25,100 a 75,75 0 0,1 150,0" fill="none" />
          <path id={`bottomArc-${country.id}`} d="M 175,100 a 75,75 0 0,1 -150,0" fill="none" />
        </defs>

        <text fill={sealColors.primary} fontWeight="bold" fontSize="9">
          <textPath href={`#topArc-${country.id}`} textAnchor="middle" startOffset="50%">
            {sealTopText}
          </textPath>
        </text>

        <text fill={sealColors.primary} fontWeight="bold" fontSize="8.5">
          <textPath href={`#bottomArc-${country.id}`} textAnchor="middle" startOffset="50%">
            {sealBottomText}
          </textPath>
        </text>

        {/* Inner circle */}
        <circle cx="100" cy="100" r="52" fill="none" stroke={sealColors.primary} strokeWidth="2" />
        <circle cx="100" cy="100" r="49" fill="none" stroke={sealColors.secondary} strokeWidth="0.5" />

        {/* Country-specific emblem */}
        {renderEmblem()}

        {/* Center text */}
        <text x="100" y="120" textAnchor="middle" fill={sealColors.primary} fontSize="8" fontWeight="bold">
          {sealCenterText}
        </text>
        <text x="100" y="130" textAnchor="middle" fill={sealColors.secondary} fontSize="5.5">
          OFFICIAL SEAL
        </text>

        {/* Stars at bottom */}
        <text x="100" y="143" textAnchor="middle" fill={sealColors.primary} fontSize="7">
          ★ ★ ★
        </text>
      </svg>

    </div>
  );
}
