const watchImages = [
    'Images/w1.png',
    'Images/w2.png',
    'Images/w3.png'
];

let currentWatch = 0;
let watchImg = new Image();
watchImg.src = watchImages[0];

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');
const loading = document.getElementById('loading');

function selectWatch(index) {
    currentWatch = index;
    watchImg = new Image();
    watchImg.src = watchImages[index];
    document.querySelectorAll('.btn-montre').forEach((btn, i) => {
        btn.classList.toggle('active', i === index);
    });
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const hands = new Hands({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.5
});

hands.onResults((results) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks &&
        results.multiHandLandmarks.length > 0) {

        const landmarks = results.multiHandLandmarks[0];

        // Points clés
        const wrist = landmarks[0];
        const index_mcp = landmarks[5];
        const pinky_mcp = landmarks[17];
        const mid_mcp = landmarks[9];

        const wristX = (1 - wrist.x) * canvas.width;
        const wristY = wrist.y * canvas.height;
        const indexX = (1 - index_mcp.x) * canvas.width;
        const indexY = index_mcp.y * canvas.height;
        const pinkyX = (1 - pinky_mcp.x) * canvas.width;
        const pinkyY = pinky_mcp.y * canvas.height;
        const midX = (1 - mid_mcp.x) * canvas.width;
        const midY = mid_mcp.y * canvas.height;

        // Largeur du poignet
        const wristWidth = Math.sqrt(
            Math.pow(indexX - pinkyX, 2) +
            Math.pow(indexY - pinkyY, 2)
        );

        // Hauteur de la montre proportionnelle
        const watchWidth = wristWidth * 1.2;
        const watchHeight = watchWidth * 0.55;

        // Angle de rotation de la main
        const angle = Math.atan2(
            midY - wristY,
            midX - wristX
        );

        // Position exacte au poignet
        const centerX = wristX + (midX - wristX) * 0.12;
        const centerY = wristY + (midY - wristY) * 0.12;

        // Perspective — écrase la hauteur quand la main est de côté
        const tiltX = index_mcp.x - pinky_mcp.x;
        const tiltY = index_mcp.y - pinky_mcp.y;
        const tilt = Math.abs(tiltX);
        const scaleY = 0.3 + tilt * 0.8;

        // Dessine avec perspective
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle - Math.PI / 2);
        ctx.scale(1, scaleY);
        ctx.drawImage(
            watchImg,
            -watchWidth / 2,
            -watchHeight / 2,
            watchWidth,
            watchHeight
        );
        ctx.restore();

        status.textContent = '✅ Poignet détecté !';
        status.style.color = '#00ff00';

    } else {
        status.textContent = 'Montrez votre poignet à la caméra';
        status.style.color = 'white';
    }
});

const camera = new Camera(video, {
    onFrame: async () => {
        await hands.send({ image: video });
    },
    width: 1280,
    height: 720,
    facingMode: 'environment'
});

camera.start().then(() => {
    loading.style.display = 'none';
}).catch((err) => {
    loading.innerHTML = '❌ Erreur caméra : ' + err.message;
});