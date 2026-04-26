/* ==========================================
   Chrome Background
========================================== */

(function initChromeBackground(global) {
  const registry = global.BlogChromeRegistry || (global.BlogChromeRegistry = {});

  const overlayMarkup = `
  <svg id="leaves-overlay" xmlns="http://www.w3.org/2000/svg"
       viewBox="0 0 1440 1100"
       preserveAspectRatio="xMidYMid slice"
       width="100%" height="100%"
       overflow="visible"
       aria-hidden="true">
    <defs>
      <linearGradient id="bambooGrad" x1="0%" y1="0%" x2="35%" y2="100%">
        <stop offset="0%" stop-color="#5a3010" stop-opacity="0.92"/>
        <stop offset="100%" stop-color="#3d2208" stop-opacity="0.72"/>
      </linearGradient>

      <path id="bl-1" d="M 0,-58 C 8,-34 7,28 0,60 C -7,28 -8,-34 0,-58 Z"/>
      <path id="bl-2" d="M -1,-62 C 10,-36 9,30 0,63 C -9,30 -11,-37 -1,-62 Z"/>
      <path id="bl-3" d="M 0,-72 C 5.5,-44 5,40 0,74 C -5,40 -5.5,-44 0,-72 Z"/>
      <path id="bl-4" d="M 1,-48 C 10,-27 9.5,22 0,50 C -9.5,22 -10,-27 1,-48 Z"/>
      <path id="bl-5" d="M 2,-60 C -10,-34 -9,30 0,62 C 9,30 11,-36 2,-60 Z"/>

      <filter id="bf-far" x="-12%" y="-12%" width="124%" height="124%">
        <feGaussianBlur stdDeviation="3.2"/>
      </filter>
      <filter id="bf-mid" x="-8%" y="-8%" width="116%" height="116%">
        <feGaussianBlur stdDeviation="1.0"/>
      </filter>
      <filter id="bf-near" x="-5%" y="-5%" width="110%" height="110%">
        <feGaussianBlur stdDeviation="0.35"/>
      </filter>

      <symbol id="cluster-5" overflow="visible">
        <use href="#bl-1" transform="rotate(132) translate(0,-58)"/>
        <use href="#bl-3" transform="rotate(152) translate(0,-72)"/>
        <use href="#bl-3" transform="rotate(178) translate(0,-72)"/>
        <use href="#bl-3" transform="rotate(204) translate(0,-72)"/>
        <use href="#bl-1" transform="rotate(228) translate(0,-58)"/>
      </symbol>
      <symbol id="cluster-3" overflow="visible">
        <use href="#bl-3" transform="rotate(148) translate(0,-72)"/>
        <use href="#bl-3" transform="rotate(174) translate(0,-72)"/>
        <use href="#bl-2" transform="rotate(200) translate(0,-62)"/>
        <use href="#bl-4" transform="rotate(222) translate(0,-48)"/>
      </symbol>
      <symbol id="cluster-4" overflow="visible">
        <use href="#bl-4" transform="rotate(145) translate(0,-48)"/>
        <use href="#bl-3" transform="rotate(173) translate(0,-72)"/>
        <use href="#bl-5" transform="rotate(208) translate(0,-60)"/>
      </symbol>
      <symbol id="cluster-6" overflow="visible">
        <use href="#bl-5" transform="rotate(138) translate(0,-60)"/>
        <use href="#bl-1" transform="rotate(162) translate(0,-58)"/>
        <use href="#bl-3" transform="rotate(190) translate(0,-72)"/>
        <use href="#bl-4" transform="rotate(220) translate(0,-48)"/>
      </symbol>
      <symbol id="cluster-2" overflow="visible">
        <use href="#bl-1" transform="rotate(162) translate(0,-58)"/>
        <use href="#bl-5" transform="rotate(198) translate(0,-60)"/>
      </symbol>

      <symbol id="spray-a" overflow="visible">
        <path d="M 0,0 C -28,40 -58,82 -88,128 C -112,165 -134,200 -156,234"
              fill="none" stroke="#5a3010" stroke-width="2" stroke-opacity="0.6"
              stroke-linecap="round"/>
        <use href="#cluster-4" transform="translate(-30,42) scale(0.82) rotate(-18)"/>
        <use href="#cluster-5" transform="translate(-90,134) scale(0.92) rotate(14)"/>
        <use href="#cluster-6" transform="translate(-156,232) scale(0.76) rotate(-8)"/>
      </symbol>

      <symbol id="spray-b" overflow="visible">
        <path d="M 0,0 C -22,32 -46,64 -72,98 C -90,122 -106,142 -122,162"
              fill="none" stroke="#5a3010" stroke-width="1.7" stroke-opacity="0.55"
              stroke-linecap="round"/>
        <use href="#cluster-6" transform="translate(-26,38) scale(0.75) rotate(10)"/>
        <use href="#cluster-3" transform="translate(-86,120) scale(0.82) rotate(-14)"/>
        <use href="#cluster-4" transform="translate(-122,162) scale(0.7) rotate(20)"/>
      </symbol>

      <symbol id="spray-c" overflow="visible">
        <path d="M 0,0 C -18,24 -34,46 -52,72"
              fill="none" stroke="#5a3010" stroke-width="1.4" stroke-opacity="0.5"
              stroke-linecap="round"/>
        <use href="#cluster-4" transform="translate(-28,44) scale(0.68) rotate(-22)"/>
        <use href="#cluster-2" transform="translate(-52,72) scale(0.78) rotate(16)"/>
      </symbol>

      <symbol id="culm" overflow="visible">
        <path d="M 0,0 C -42,75 -94,170 -150,275 C -198,360 -244,440 -284,510"
              fill="none" stroke="#5a3010" stroke-width="3.4" stroke-opacity="0.55"
              stroke-linecap="round"/>
        <ellipse cx="-44" cy="78" rx="6.5" ry="2.5" fill="#3a2008" opacity="0.55" transform="rotate(-30 -44 78)"/>
        <ellipse cx="-94" cy="170" rx="7" ry="2.5" fill="#3a2008" opacity="0.55" transform="rotate(-32 -94 170)"/>
        <ellipse cx="-148" cy="272" rx="6.5" ry="2.5" fill="#3a2008" opacity="0.55" transform="rotate(-34 -148 272)"/>
        <ellipse cx="-200" cy="362" rx="6.5" ry="2.5" fill="#3a2008" opacity="0.55" transform="rotate(-36 -200 362)"/>
        <ellipse cx="-248" cy="448" rx="6" ry="2.5" fill="#3a2008" opacity="0.55" transform="rotate(-38 -248 448)"/>
      </symbol>
    </defs>

    <g class="bamboo-far" fill="url(#bambooGrad)" filter="url(#bf-far)" opacity="0.3">
      <use href="#spray-a" transform="translate(1260,-30) scale(1.85) rotate(10)"/>
      <use href="#spray-b" transform="translate(1090,200) scale(1.55) rotate(-3)"/>
      <use href="#spray-a" transform="translate(900,380) scale(1.5) rotate(18)"/>
      <use href="#spray-c" transform="translate(740,560) scale(1.4)"/>
      <animateTransform attributeName="transform" type="translate"
                        values="0,0; 5,3; -2,-1; 0,0"
                        dur="34s" repeatCount="indefinite"/>
    </g>

    <g class="bamboo-mid" fill="url(#bambooGrad)" filter="url(#bf-mid)" opacity="0.58">
      <g class="bamboo-branch-a">
        <use href="#culm" transform="translate(1210,-90) scale(1.25) rotate(14)"/>
        <use href="#spray-a" transform="translate(1085,80) scale(1.2) rotate(22)"/>
        <use href="#spray-b" transform="translate(1040,200) scale(1.1) rotate(16)"/>
        <use href="#spray-c" transform="translate(930,360) scale(0.95)"/>
        <animateTransform attributeName="transform" type="translate"
                          values="0,0; 5,3; -2,4; 1,-1; 0,0"
                          dur="24s" repeatCount="indefinite"/>
      </g>

      <g class="bamboo-branch-b">
        <use href="#spray-a" transform="translate(1290,80) scale(1.1) rotate(28)"/>
        <use href="#spray-b" transform="translate(1160,260) scale(1.05) rotate(20)"/>
        <use href="#spray-c" transform="translate(1000,420) scale(0.9)"/>
        <animateTransform attributeName="transform" type="translate"
                          values="0,0; -3,4; 4,2; -1,3; 0,0"
                          dur="29s" repeatCount="indefinite"/>
      </g>

      <g class="bamboo-branch-c">
        <use href="#culm" transform="translate(1460,-50) scale(1.0)"/>
        <use href="#spray-c" transform="translate(1366,120) scale(0.78) rotate(16)"/>
        <use href="#spray-b" transform="translate(1312,222) scale(0.88) rotate(12)"/>
        <use href="#spray-b" transform="translate(1212,398) scale(1.0) rotate(3)"/>
        <use href="#spray-c" transform="translate(1040,590) scale(0.85)"/>
        <animateTransform attributeName="transform" type="translate"
                          values="0,0; 4,-2; -2,4; 1,2; 0,0"
                          dur="21s" repeatCount="indefinite"/>
      </g>
    </g>

    <g class="bamboo-near" fill="url(#bambooGrad)" filter="url(#bf-near)" opacity="0.72">
      <g class="bamboo-branch-d">
        <use href="#spray-b" transform="translate(1380,30) scale(0.85) rotate(26)"/>
        <use href="#spray-a" transform="translate(1220,130) scale(0.90) rotate(20)"/>
        <use href="#spray-c" transform="translate(1120,290) scale(0.82) rotate(-5)"/>
        <use href="#spray-b" transform="translate(1060,420) scale(0.80) rotate(8)"/>
        <animateTransform attributeName="transform" type="translate"
                          values="0,0; 3,2; -2,3; 1,-1; 0,0"
                          dur="16s" repeatCount="indefinite"/>
      </g>

      <g class="bamboo-branch-e">
        <use href="#spray-a" transform="translate(1440,-40) scale(0.82) rotate(22)"/>
        <use href="#spray-b" transform="translate(1260,160) scale(0.85) rotate(30)"/>
        <use href="#spray-c" transform="translate(1160,290) scale(0.72)"/>
        <animateTransform attributeName="transform" type="translate"
                          values="0,0; -2,3; 4,1; -1,2; 0,0"
                          dur="19s" repeatCount="indefinite"/>
      </g>
    </g>
  </svg>`;

  function mountBackground() {
    if (document.getElementById('leaves-overlay')) {
      return;
    }

    document.body.insertAdjacentHTML('afterbegin', overlayMarkup);
  }

  registry.background = {
    mountBackground,
  };
})(window);
