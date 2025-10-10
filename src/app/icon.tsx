import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
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
          borderRadius: '6px',
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M16 7C13.2386 7 11 9.23858 11 12V15.132C11 16.186 10.58 17.196 9.85 17.926L8.766 19.01C8.168 19.608 8.589 20.7 9.452 20.7H22.548C23.411 20.7 23.832 19.608 23.234 19.01L22.15 17.926C21.42 17.196 21 16.186 21 15.132V12C21 9.23858 18.7614 7 16 7Z"
            fill="white"
          />
          <ellipse cx="16" cy="22" rx="2" ry="1" fill="white" />
          <circle cx="16" cy="5" r="1.5" fill="white" />
          <rect x="15" y="5" width="2" height="2.5" fill="white" />
          <circle cx="22" cy="10" r="4" fill="#DC2626" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
