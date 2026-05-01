const https = require('https');
const fs = require('fs');
const path = require('path');

const models = [
    {
        url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-weights_manifest.json',
        filename: 'ssd_mobilenetv1_model-weights_manifest.json'
    },
    {
        url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-shard1',
        filename: 'ssd_mobilenetv1_model-shard1'
    },
    {
        url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-shard2',
        filename: 'ssd_mobilenetv1_model-shard2'
    },
    {
        url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json',
        filename: 'face_landmark_68_model-weights_manifest.json'
    },
    {
        url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1',
        filename: 'face_landmark_68_model-shard1'
    },
    {
        url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json',
        filename: 'face_recognition_model-weights_manifest.json'
    },
    {
        url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1',
        filename: 'face_recognition_model-shard1'
    }
];

const modelsDir = path.join(__dirname, 'models');
if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
}

async function downloadFile(url, filename) {
    const filePath = path.join(modelsDir, filename);
    console.log(`Downloading ${filename}...`);
    
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filePath);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`✅ Downloaded ${filename}`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filePath, () => {});
            console.error(`❌ Error downloading ${filename}:`, err.message);
            reject(err);
        });
    });
}

async function downloadAll() {
    console.log('📥 Downloading face recognition models...');
    for (const model of models) {
        try {
            await downloadFile(model.url, model.filename);
        } catch (error) {
            console.error(`Failed to download ${model.filename}`);
        }
    }
    console.log('✅ All models downloaded!');
}

downloadAll();