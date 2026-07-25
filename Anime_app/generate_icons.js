const fs = require('fs');
const path = require('path');

const themes = [
  { id: 'dark-white', bg: '#000000', crown: '#ffffff', text: '#ffffff' },
  { id: 'dark-burgundy', bg: '#000000', crown: '#800020', text: '#ffffff' },
  { id: 'dark-coral', bg: '#000000', crown: '#e74c3c', text: '#ffffff' },
  { id: 'light-black', bg: '#ffffff', crown: '#000000', text: '#000000' },
  { id: 'light-burgundy', bg: '#ffffff', crown: '#800020', text: '#000000' },
  { id: 'light-coral', bg: '#ffffff', crown: '#e74c3c', text: '#000000' },
];

const publicDir = path.join(__dirname, 'public/icons');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

themes.forEach(t => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="110" fill="${t.bg}"/>
  <g>
    <path d="M 65 360 L 115 200 H 155 L 205 360 H 170 L 158 318 H 112 L 100 360 Z M 121 286 H 149 L 135 236 Z" fill="${t.text}"/>
    <circle cx="218" cy="212" r="10" fill="${t.crown}"/>
    <circle cx="256" cy="190" r="12" fill="${t.crown}"/>
    <circle cx="294" cy="212" r="10" fill="${t.crown}"/>
    <path d="M 218 222 L 236 270 L 256 214 L 276 270 L 294 222 L 310 326 H 202 Z" fill="${t.crown}"/>
    <rect x="202" y="342" width="108" height="18" rx="4" fill="${t.crown}"/>
    <path d="M 307 200 H 337 V 264 H 381 V 200 H 411 V 360 H 381 V 292 H 337 V 360 H 307 Z" fill="${t.text}"/>
  </g>
</svg>`;
  fs.writeFileSync(path.join(publicDir, `${t.id}.svg`), svg);
});
console.log('All 6 vector SVG icon themes created successfully.');
