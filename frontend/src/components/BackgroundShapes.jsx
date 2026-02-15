export default function BackgroundShapes() {
  return (
    <div className="fixed inset-0 overflow-hidden -z-20 pointer-events-none">
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-linear-to-br from-indigo/5 to-coral/5 blur-3xl animate-float-slow"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[700px] h-[700px] rounded-full bg-linear-to-tr from-acid-green/5 to-indigo/5 blur-3xl animate-float-slower"></div>

      <div className="absolute top-[8%] left-[4%] animate-float opacity-25">
        <svg width="160" height="160" viewBox="0 0 100 100" fill="none">
          <path
            d="M50 10C65 10 75 20 85 35C95 50 90 65 80 75C70 85 55 90 40 85C25 80 15 70 12 55C9 40 15 25 28 15C35 10 42 10 50 10Z"
            fill="var(--color-coral)"
            opacity="0.3"
            stroke="var(--color-indigo)"
            strokeWidth="0.5"
          />
          <path
            d="M50 25C60 25 67 30 72 40C77 50 74 60 68 67C62 74 53 77 44 74C35 71 28 64 26 54C24 44 28 35 36 28C40 25 45 25 50 25Z"
            fill="var(--color-coral-light)"
            opacity="0.2"
          />
        </svg>
      </div>

      <div className="absolute top-[12%] right-[8%] animate-float-reverse opacity-30">
        <svg width="140" height="140" viewBox="0 0 100 100" fill="none">
          <path
            d="M50 10L70 30L90 30L90 70L70 90L30 90L10 70L10 30L30 10L50 10Z"
            stroke="var(--color-acid-green)"
            strokeWidth="2.5"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r="20"
            fill="var(--color-acid-green)"
            opacity="0.15"
          />
          <path
            d="M35 35L50 20L65 35L50 50L35 35Z"
            fill="var(--color-acid-green-light)"
            opacity="0.3"
          />
        </svg>
      </div>

      <div className="absolute top-[6%] left-[42%] animate-rotate-slow opacity-28">
        <svg width="120" height="120" viewBox="0 0 100 100" fill="none">
          <rect
            x="25"
            y="15"
            width="50"
            height="70"
            rx="25"
            fill="var(--color-warning)"
            opacity="0.4"
            stroke="var(--color-indigo)"
            strokeWidth="1.5"
          />
          <circle
            cx="50"
            cy="35"
            r="12"
            fill="var(--color-indigo)"
            opacity="0.2"
          />
          <circle
            cx="50"
            cy="65"
            r="12"
            fill="var(--color-indigo)"
            opacity="0.2"
          />
        </svg>
      </div>

      <div className="absolute top-[38%] right-[5%] animate-float opacity-27">
        <svg width="130" height="180" viewBox="0 0 80 120" fill="none">
          <path
            d="M10 20Q30 10 40 20T60 40T40 60T60 80T40 100L20 100Q30 80 20 60T30 40T20 20Z"
            fill="var(--color-indigo-light)"
            opacity="0.25"
            stroke="var(--color-indigo)"
            strokeWidth="1"
          />
        </svg>
      </div>

      <div className="absolute bottom-[15%] left-[6%] animate-float-reverse opacity-30">
        <svg width="150" height="150" viewBox="0 0 100 100" fill="none">
          <circle
            cx="50"
            cy="50"
            r="35"
            stroke="var(--color-acid-green)"
            strokeWidth="2"
            fill="transparent"
          />
          <circle
            cx="35"
            cy="35"
            r="15"
            fill="var(--color-acid-green-light)"
            opacity="0.3"
          />
          <circle
            cx="65"
            cy="35"
            r="12"
            fill="var(--color-acid-green)"
            opacity="0.2"
          />
          <circle
            cx="50"
            cy="65"
            r="18"
            stroke="var(--color-acid-green-light)"
            strokeWidth="2"
            fill="transparent"
            strokeDasharray="4 4"
          />
        </svg>
      </div>

      <div className="absolute bottom-[18%] right-[10%] animate-pulse-slow opacity-28">
        <svg width="140" height="140" viewBox="0 0 100 100" fill="none">
          <path
            d="M50 5L75 25L85 50L75 75L50 95L25 75L15 50L25 25L50 5Z"
            stroke="var(--color-coral)"
            strokeWidth="2"
            fill="transparent"
          />
          <path
            d="M50 20L65 35L70 50L65 65L50 80L35 65L30 50L35 35L50 20Z"
            fill="var(--color-coral)"
            opacity="0.2"
          />
          <circle
            cx="50"
            cy="50"
            r="8"
            fill="var(--color-coral-light)"
            opacity="0.4"
          />
        </svg>
      </div>

      <div className="absolute top-[22%] left-[18%] animate-rotate-slow-reverse opacity-20">
        <svg width="80" height="80" viewBox="0 0 60 60" fill="none">
          <path
            d="M10 30A20 20 0 0 1 50 30"
            stroke="var(--color-warning)"
            strokeWidth="3"
            fill="transparent"
          />
          <path
            d="M50 30A20 20 0 0 1 10 30"
            stroke="var(--color-indigo)"
            strokeWidth="3"
            fill="transparent"
            strokeDasharray="5 3"
          />
        </svg>
      </div>

      <div className="absolute top-[48%] left-[12%] animate-float-slow opacity-22">
        <svg width="90" height="90" viewBox="0 0 60 60" fill="none">
          <circle
            cx="30"
            cy="30"
            r="22"
            stroke="var(--color-indigo-lighter)"
            strokeWidth="2"
            fill="transparent"
            opacity="0.5"
          />
          <circle
            cx="30"
            cy="30"
            r="15"
            stroke="var(--color-indigo)"
            strokeWidth="2.5"
            fill="transparent"
          />
          <circle
            cx="30"
            cy="30"
            r="8"
            fill="var(--color-indigo-light)"
            opacity="0.3"
          />
        </svg>
      </div>

      <div className="absolute top-[52%] right-[18%] animate-float opacity-25">
        <svg width="100" height="100" viewBox="0 0 80 80" fill="none">
          <path
            d="M10 40Q25 20 40 40T70 40"
            stroke="var(--color-acid-green)"
            strokeWidth="3"
            fill="transparent"
            strokeLinecap="round"
          />
          <circle
            cx="10"
            cy="40"
            r="5"
            fill="var(--color-acid-green)"
            opacity="0.4"
          />
          <circle
            cx="70"
            cy="40"
            r="5"
            fill="var(--color-acid-green-light)"
            opacity="0.4"
          />
        </svg>
      </div>

      <div className="absolute bottom-[10%] left-[38%] animate-float-reverse opacity-23 rotate-12">
        <svg width="75" height="75" viewBox="0 0 60 60" fill="none">
          <path
            d="M30 10L50 45H10L30 10Z"
            stroke="var(--color-coral)"
            strokeWidth="2"
            fill="transparent"
          />
          <path
            d="M30 20L42 40H18L30 20Z"
            fill="var(--color-coral-light)"
            opacity="0.25"
          />
        </svg>
      </div>

      <div className="absolute top-[35%] left-[40%] animate-rotate-ultra-slow opacity-8">
        <svg width="350" height="350" viewBox="0 0 300 300" fill="none">
          <path
            d="M50 150Q150 50 250 150"
            stroke="var(--color-indigo)"
            strokeWidth="2"
            fill="transparent"
            strokeDasharray="8 8"
          />
          <path
            d="M150 50Q50 150 150 250"
            stroke="var(--color-indigo)"
            strokeWidth="2"
            fill="transparent"
            strokeDasharray="8 8"
          />
        </svg>
      </div>

      <div className="absolute top-[60%] right-[28%] opacity-6 animate-float-slower">
        <svg width="180" height="180" viewBox="0 0 120 120" fill="none">
          <rect
            x="10"
            y="10"
            width="15"
            height="15"
            fill="var(--color-coral)"
            opacity="0.3"
          />
          <rect
            x="40"
            y="25"
            width="15"
            height="15"
            fill="var(--color-acid-green)"
            opacity="0.3"
          />
          <rect
            x="70"
            y="15"
            width="15"
            height="15"
            fill="var(--color-indigo)"
            opacity="0.3"
          />
          <rect
            x="25"
            y="50"
            width="15"
            height="15"
            fill="var(--color-warning)"
            opacity="0.3"
          />
          <rect
            x="60"
            y="60"
            width="15"
            height="15"
            fill="var(--color-coral-light)"
            opacity="0.3"
          />
          <rect
            x="85"
            y="45"
            width="15"
            height="15"
            fill="var(--color-indigo-light)"
            opacity="0.3"
          />
        </svg>
      </div>

      <div className="absolute bottom-[40%] left-[22%] animate-float-slow opacity-12">
        <svg width="120" height="60" viewBox="0 0 100 50" fill="none">
          <path
            d="M0 25Q25 15 50 25T100 25"
            stroke="var(--color-acid-green)"
            strokeWidth="2"
            fill="transparent"
            strokeLinecap="round"
          />
          <path
            d="M0 35Q25 25 50 35T100 35"
            stroke="var(--color-acid-green-light)"
            strokeWidth="1.5"
            fill="transparent"
            opacity="0.5"
          />
        </svg>
      </div>

      <div className="absolute top-[45%] right-[4%] animate-pulse-slow opacity-15">
        <svg width="90" height="90" viewBox="0 0 60 60" fill="none">
          <rect
            x="5"
            y="5"
            width="12"
            height="12"
            stroke="var(--color-indigo)"
            strokeWidth="1.5"
            fill="transparent"
          />
          <rect
            x="23"
            y="5"
            width="12"
            height="12"
            fill="var(--color-indigo-light)"
            opacity="0.2"
          />
          <rect
            x="41"
            y="5"
            width="12"
            height="12"
            stroke="var(--color-indigo)"
            strokeWidth="1.5"
            fill="transparent"
          />
          <rect
            x="5"
            y="23"
            width="12"
            height="12"
            fill="var(--color-indigo)"
            opacity="0.15"
          />
          <rect
            x="23"
            y="23"
            width="12"
            height="12"
            stroke="var(--color-indigo-lighter)"
            strokeWidth="1.5"
            fill="transparent"
          />
          <rect
            x="41"
            y="23"
            width="12"
            height="12"
            fill="var(--color-indigo-light)"
            opacity="0.2"
          />
        </svg>
      </div>
    </div>
  );
}
