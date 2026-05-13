const watchImages = [
    'Images/w1.png',
    'Images/w2.png',
    'Images/w3.png'
];

let currentWatch = 0;
let watchTexture = null;

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const status = document.getElementById('status');
const loading = document.getElementById('loading');

// Three.js setup
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new THREE.Scene();
const camera3D = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera3D.position.z = 5;

// Lumières
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
dirLight.position.set(0, 1, 1);
scene.add(dirLight);

// Crée la montre 3D
const watchGeometry = new THREE.CylinderGeometry(1, 1, 0.2, 32);
const textureLoader = new THREE.TextureLoader();
watchTexture = textureLoader.load(watchImages[0]);
const watchMaterial = new THREE.MeshPhongMaterial({
    map: watchTexture,
    transparent: true
});
const watchMesh = new THREE.Mesh(watchGeometry, watchMaterial);
scene.add(watchMesh);
watchMesh.visible = false;

// Bracelet haut
const strapGeo1 = new THREE.BoxGeometry(0.4, 0.6, 0.1);
const strapMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
const strap1 = new THREE.Mesh(strapGeo1, strapMat);
strap1.position.set(0, 1.3, 0);
watchMesh.add(strap1);

// Bracelet bas
const strapGeo2 = new THREE.BoxGeometry(0.4, 0.6, 0.1);
const strap2 = new THREE.Mesh(strapGeo2, strapMat);
strap2.position.set(0, -1.3, 0);
watchMesh.add(strap2);

function selectWatch(index) {
    currentWatch = index;
    document.querySelectorAll('.btn-montre').forEach((btn, i) => {
        btn.classList.toggle('active', i === index);
    });
    watchTexture = textureLoader.load(watchImages[index]);
    watchMesh.material.map = watchTexture;
    watchMesh.material.needsUpdate = true;
}

window.selectWatch = selectWatch;

function resizeCanvas() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera3D.aspect = window.innerWidth / window.innerHeight;
    camera3D.updateProjectionMatrix();
}
window.addEventListener('resize', resizeCanvas);

// MediaPipe
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
    if (results.multiHandLandmarks &&
        results.multiHandLandmarks.length > 0) {

        const landmarks = results.multiHandLandmarks[0];

        const wrist = landmarks[0];
        const mid = landmarks[9];
        const index_mcp = landmarks[5];
        const pinky_mcp = landmarks[17];

        // Convertit coordonnées MediaPipe en coordonnées 3D
        const wristX = (0.5 - wrist.x) * 10;
        const wristY = (0.5 - wrist.y) * 10;
        const wristZ = -wrist.z * 10;

        const midX = (0.5 - mid.x) * 10;
        const midY = (0.5 - mid.y) * 10;

        const indexX = (0.5 - index_mcp.x) * 10;
        const indexY = (0.5 - index_mcp.y) * 10;
        const pinkyX = (0.5 - pinky_mcp.x) * 10;
        const pinkyY = (0.5 - pinky_mcp.y) * 10;

        // Largeur du poignet
        const wristWidth = Math.sqrt(
            Math.pow(indexX - pinkyX, 2) +
            Math.pow(indexY - pinkyY, 2)
        );

        // Position de la montre
        watchMesh.position.x = wristX + (midX - wristX) * 0.1;
        watchMesh.position.y = wristY + (midY - wristY) * 0.1;
        watchMesh.position.z = wristZ;

        // Taille selon distance
        const scale = wristWidth * 0.5;
        watchMesh.scale.set(scale, scale, scale);

        // Rotation selon orientation de la main
        const angleZ = Math.atan2(
            midY - wristY,
            midX - wristX
        );
        watchMesh.rotation.z = angleZ - Math.PI / 2;
        watchMesh.rotation.x = Math.PI / 2;

        // Inclinaison selon tilt de la main
        const tilt = (index_mcp.y - pinky_mcp.y) * 3;
        watchMesh.rotation.y = tilt;

        watchMesh.visible = true;

        status.textContent = '✅ Poignet détecté !';
        status.style.color = '#00ff00';

    } else {
        watchMesh.visible = false;
        status.textContent = 'Montrez votre poignet à la caméra';
        status.style.color = 'white';
    }

    renderer.render(scene, camera3D);
});

// Animation
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera3D);
}
animate();

// Caméra
const mediapipeCamera = new Camera(video, {
    onFrame: async () => {
        await hands.send({ image: video });
    },
    width: 1280,
    height: 720,
    facingMode: 'environment'
});

mediapipeCamera.start().then(() => {
    loading.style.display = 'none';
}).catch((err) => {
    loading.innerHTML = '❌ Erreur caméra : ' + err.message;
});