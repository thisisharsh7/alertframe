export default function BellLoader() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-10 h-10 bell-ring"
    >
      <style>{`
        @keyframes ring {
          0%, 100% { transform: rotate(0deg); }
          10%, 30% { transform: rotate(-10deg); }
          20%, 40% { transform: rotate(10deg); }
          50% { transform: rotate(0deg); }
        }
        .bell-ring {
          animation: ring 2s ease-in-out infinite;
          transform-origin: center top;
        }
      `}</style>
      <path
        d="M14 4C11 4 9 6 9 9V13L7 17H21L19 13V9C19 6 17 4 14 4Z"
        fill="#FFE500"
        stroke="#000000"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 17V18C12 19.1 12.9 20 14 20C15.1 20 16 19.1 16 18V17"
        stroke="#000000"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="19" cy="7.5" r="3" fill="#FF3366" stroke="#000000" strokeWidth="2" />
    </svg>
  );
}
