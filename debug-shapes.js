const fs = require('fs');

const primaryColor = '#3A6B1A';
const scale = 1;
const pxPerMm = 3.78 * scale;
const s = (mm) => mm * pxPerMm;

const html = `
<html>
<body style="background: #ccc; padding: 50px; display: flex; gap: 20px;">
  <!-- FRONT -->
  <div style="width: ${s(53.98)}px; height: ${s(85.60)}px; background: white; position: relative; border-radius: ${s(3.18)}px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
    <svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" viewBox="0 0 540 856" preserveAspectRatio="none">
      <defs>
        <path id="textArc" d="M 330 500 A 190 190 0 0 1 330 120" />
      </defs>
      <!-- Green curve -->
      <path d="M 0 0 L 260 0 L 260 100 C 260 220, 110 210, 110 320 C 110 420, 240 450, 260 550 C 280 650, 410 650, 410 856 L 0 856 Z" fill="${primaryColor}" />
      
      <!-- Faded triangles -->
      <polygon points="-20,550 180,550 80,720" fill="#FFFFFF" opacity="0.1" />
      <polygon points="30,620 230,620 130,790" fill="#FFFFFF" opacity="0.1" />
      <polygon points="-50,690 140,690 40,860" fill="#FFFFFF" opacity="0.1" />
    </svg>
    <div style="position: absolute; left: ${s(31)}px; top: ${s(31)}px; transform: translate(-50%, -50%); width: ${s(31)}px; height: ${s(31)}px; border-radius: 50%; background: #eee;"></div>
  </div>

  <!-- BACK -->
  <div style="width: ${s(53.98)}px; height: ${s(85.60)}px; background: ${primaryColor}; position: relative; border-radius: ${s(3.18)}px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
    <svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" viewBox="0 0 540 856" preserveAspectRatio="none">
      <path d="M 180 0 L 540 0 L 540 220 C 400 220, 270 200, 180 0 Z" fill="#FFFFFF" />
    </svg>
    <div style="position: absolute; top: ${s(13)}px; left: 50%; transform: translate(-50%, -50%); width: ${s(19)}px; height: ${s(19)}px; border-radius: 50%; background: #ccc;"></div>
  </div>
</body>
</html>
`;
fs.writeFileSync('debug-shapes.html', html);
console.log('Created debug-shapes.html');
