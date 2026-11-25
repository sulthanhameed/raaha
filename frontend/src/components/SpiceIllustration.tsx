// Small, original vector illustrations: decorative only and independent of
// the photographs, controls and layout they sit behind.
function StarAnise() {
  return (
    <>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <g key={angle} transform={`rotate(${angle})`}>
          <path d="M0 -8 C-9 -15 -9 -31 0 -43 C9 -31 9 -15 0 -8Z" fill="rgba(242, 199, 132, .08)" />
          <path d="M0 -13 V-34" opacity=".6" />
        </g>
      ))}
      <circle r="8" fill="rgba(242, 199, 132, .12)" />
      <circle r="2" fill="currentColor" stroke="none" />
    </>
  );
}

export function HeroSpiceIllustration() {
  return (
    <svg className="hero-spices" viewBox="0 0 600 560" fill="none" aria-hidden="true" focusable="false">
      <g className="hero-spices__drawing" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path className="hero-spices__guide" d="M62 450 C138 447 176 347 271 340 C365 333 404 279 388 210 C378 167 416 97 516 70" />
        <path className="hero-spices__thread hero-spices__animated" d="M62 450 C138 447 176 347 271 340 C365 333 404 279 388 210 C378 167 416 97 516 70" pathLength="100" />
        <g transform="translate(430 142)">
          <g className="hero-spices__anise hero-spices__animated"><StarAnise /></g>
        </g>
        <g transform="translate(515 300) rotate(23)">
          <g className="hero-spices__leaf hero-spices__animated">
            <path d="M0 43 C-42 24 -44 -24 0 -44 C44 -24 42 24 0 43Z" fill="rgba(242, 199, 132, .06)" />
            <path d="M0 34 V-34 M0 -14 L-17 -25 M0 1 L-24 -13 M0 16 L-22 5 M0 -14 L17 -25 M0 1 L24 -13 M0 16 L22 5" opacity=".7" />
          </g>
        </g>
        <g transform="translate(270 428) rotate(-28)">
          <g className="hero-spices__chilli hero-spices__animated">
            <path d="M-11 -30 C-24 -8 -23 17 -8 35 C7 52 29 58 54 47 C31 48 19 34 16 15 C14 -3 11 -22 5 -30 C1 -35 -5 -35 -11 -30Z" fill="rgba(242, 199, 132, .06)" />
            <path d="M-11 -30 C-18 -38 -14 -47 -6 -49 C-5 -42 -2 -36 5 -30 M-11 -30 C-19 -34 -23 -29 -25 -24 M5 -30 C13 -37 18 -36 22 -32" />
          </g>
        </g>
        <g transform="translate(315 162)"><g className="hero-spices__twinkle hero-spices__animated"><path d="M0 -9 V9 M-9 0 H9" /><circle r="2" fill="currentColor" stroke="none" /></g></g>
        <g transform="translate(548 205)"><g className="hero-spices__twinkle hero-spices__twinkle--second hero-spices__animated"><path d="M0 -7 V7 M-7 0 H7" /><circle r="2" fill="currentColor" stroke="none" /></g></g>
        <circle cx="333" cy="264" r="3" fill="currentColor" stroke="none" opacity=".55" />
        <circle cx="205" cy="359" r="2.5" fill="currentColor" stroke="none" opacity=".6" />
      </g>
    </svg>
  );
}

export function BannerSpiceIllustration() {
  return (
    <svg className="page-ornament__spice" viewBox="0 0 200 200" fill="none" aria-hidden="true" focusable="false">
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="100" cy="100" r="91" strokeDasharray="2 9" opacity=".42" />
        <g transform="translate(100 100)">
          <g className="page-ornament__spice-anise"><StarAnise /></g>
        </g>
        <path d="M39 137 C48 124 55 111 58 94 M42 126 C29 126 22 118 21 108 C34 106 45 113 46 122 M54 108 C44 101 42 91 47 82 C58 87 62 97 58 105" opacity=".7" />
        <path d="M161 63 C152 76 145 89 142 106 M158 74 C171 74 178 82 179 92 C166 94 155 87 154 78 M146 92 C156 99 158 109 153 118 C142 113 138 103 142 95" opacity=".7" />
      </g>
    </svg>
  );
}
