interface SquirrelLogoProps {
  size?: number;
  className?: string;
}

export function SquirrelLogo({ size = 32, className = "" }: SquirrelLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Squirrel silhouette based on reference - side profile with bushy tail */}
      
      {/* Tail - large and bushy, curving upward */}
      <path
        d="M75 65 
           C85 55 90 40 85 28 
           C82 20 75 15 68 18 
           C62 20 58 28 60 38 
           C61 45 58 52 55 58"
        fill="currentColor"
        opacity="0.95"
      />
      
      {/* Body - rounded and sitting */}
      <path
        d="M55 58 
           C52 50 48 45 42 45 
           C35 45 28 52 28 62 
           C28 72 35 78 45 78 
           C52 78 58 75 60 70 
           C62 65 58 60 55 58"
        fill="currentColor"
      />
      
      {/* Head - round with pointed snout */}
      <path
        d="M42 45 
           C42 38 38 32 32 32 
           C26 32 22 37 22 43 
           C22 48 25 52 30 54 
           C35 56 40 52 42 48"
        fill="currentColor"
      />
      
      {/* Ear - pointed, characteristic squirrel ear */}
      <path
        d="M30 32 
           C28 26 30 20 35 18 
           C38 17 40 20 39 24 
           C38 28 35 32 32 34"
        fill="currentColor"
      />
      
      {/* Snout/Nose area */}
      <ellipse
        cx="18"
        cy="45"
        rx="4"
        ry="3"
        fill="currentColor"
      />
      
      {/* Front leg/paw - holding position */}
      <path
        d="M35 62 
           C32 65 30 70 32 74 
           C34 76 38 75 40 72"
        fill="currentColor"
      />
      
      {/* Back leg/foot */}
      <path
        d="M52 72 
           C50 76 52 80 56 82 
           C60 83 64 80 62 76 
           C60 73 56 72 52 72"
        fill="currentColor"
      />
      
      {/* Acorn being held */}
      <ellipse
        cx="28"
        cy="58"
        rx="5"
        ry="6"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        d="M24 52 C26 50 30 50 32 52 L32 54 C30 53 26 53 24 54 Z"
        fill="currentColor"
        opacity="0.7"
      />
    </svg>
  );
}
