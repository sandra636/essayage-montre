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
        const wrist = landmarks[0];
        const mid = landmarks[9];
        const pinky = landmarks[17];

        const wristX = (1 - wrist.x) * canvas.width;
        const wristY = wrist.y * canvas.height;
        const midX = (1 - mid.x) * canvas.width;
        const midY = mid.y * canvas.height;
        const pinkyX = (1 - pinky.x) * canvas.width;
        const pinkyY = pinky.y * canvas.height;

        // Taille basée sur largeur du poignet
        const watchSize = Math.sqrt(
            Math.pow(pinkyX - wristX, 2) +
            Math.pow(pinkyY - wristY, 2)
        ) * 2.0;

        // Rotation correcte
        const angle = Math.atan2(
            midY - wristY,
            midX - wristX
        );

        // Position centrée sur le poignet
        const centerX = (wristX + pinkyX) / 2;
        const centerY = (wristY + pinkyY) / 2;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle - Math.PI / 2);
        ctx.drawImage(
            watchImg,
            -watchSize / 2,
            -watchSize / 2,
            watchSize,
            watchSize
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