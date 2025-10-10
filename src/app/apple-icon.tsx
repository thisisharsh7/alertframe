import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FCD34D',
        }}
      >
        <svg
          width="140"
          height="140"
          viewBox="0 0 180 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M90 45C74.536 45 62 57.536 62 73V89.198C62 95.279 59.52 101.121 55.125 105.605L48.098 112.79C44.251 116.732 46.961 123 52.697 123H127.303C133.039 123 135.749 116.732 131.902 112.79L124.875 105.605C120.48 101.121 118 95.279 118 89.198V73C118 57.536 105.464 45 90 45Z"
            fill="white"
          />
          <ellipse cx="90" cy="130" rx="12" ry="6" fill="white" />
          <circle cx="90" cy="35" r="6" fill="white" />
          <rect x="84" y="35" width="12" height="12" fill="white" />
          <circle cx="118" cy="65" r="18" fill="#EF4444" />
          <circle cx="118" cy="65" r="15" fill="#DC2626" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
