let animationFrameId;
let currentModel;
let videoStream;

async function setupCamera() {
    const video = document.getElementById('video');
    video.setAttribute('playsinline', true); // Ensure the video plays inline on iOS
    video.setAttribute('autoplay', 'true'); // Autoplay video
    video.setAttribute('muted', 'true'); // Mute video

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        videoStream = stream;

        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
                video.play();
                resolve(video);
            };
        });
    } catch (error) {
        console.error('Error accessing the webcam:', error);
        alert('Failed to access the webcam. Please ensure you have granted permission.');
        throw error;
    }
}

function stopDetection() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
    const context = document.getElementById('canvas').getContext('2d');
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    document.getElementById('video').pause();
    currentModel = null;
}

async function loadModel(modelName) {
    document.getElementById('loadingIndicator').style.display = 'block';
    try {
        switch (modelName) {
            case 'mobilenet':
                return await mobilenet.load();
            case 'coco-ssd':
                return await cocoSsd.load();
            case 'handpose':
                return await handpose.load();
            case 'faceapi':
                await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
                await faceapi.nets.faceExpressionNet.loadFromUri('/models');
                return faceapi;
            case 'bodypix':
                return await bodyPix.load();
            default:
                throw new Error('Unsupported model: ' + modelName);
        }
    } catch (error) {
        console.error('Error loading the model:', error);
        alert(`Failed to load model: ${error.message}`);
        return null;
    } finally {
        document.getElementById('loadingIndicator').style.display = 'none';
    }
}

async function detect(modelName) {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');

    animationFrameId = requestAnimationFrame(() => detect(modelName));

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        switch (modelName) {
            case 'handpose':
                currentModel.estimateHands(video).then(predictions => {
                    drawHandPredictions(predictions, context);
                }).catch(error => console.error('Detection failed:', error));
                break;
            case 'faceapi':
                faceapi.detectAllFaces(video).withFaceExpressions().then(predictions => {
                    drawFacePredictions(predictions, context);
                }).catch(error => console.error('Detection failed:', error));
                break;
            case 'bodypix':
                currentModel.segmentPerson(video).then(segmentations => {
                    drawBodyPix(segmentations, context);
                }).catch(error => console.error('Detection failed:', error));
                break;
            default:
                currentModel.detect(video).then(predictions => {
                    drawPredictions(predictions, context);
                }).catch(error => console.error('Detection failed:', error));
                break;
        }
    }
}

function drawPredictions(predictions, context) {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const scaleX = canvas.width / video.videoWidth;
    const scaleY = canvas.height / video.videoHeight;

    context.clearRect(0, 0, canvas.width, canvas.height);

    predictions.forEach(prediction => {
        if (prediction.bbox) {
            const [x, y, width, height] = prediction.bbox;
            const scaledX = x * scaleX;
            const scaledY = y * scaleY;
            const scaledWidth = width * scaleX;
            const scaledHeight = height * scaleY;

            context.strokeStyle = 'orange';
            context.lineWidth = 4;
            context.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);

            const text = `${prediction.class} ${Math.round(prediction.score * 100)}%`;
            context.fillStyle = 'rgba(255, 165, 0, 0.85)';
            context.font = '18px Arial';
            const textWidth = context.measureText(text).width;
            context.fillRect(scaledX, scaledY - 20, textWidth, 24);
            context.fillStyle = 'white';
            context.fillText(text, scaledX, scaledY - 5);
        }
    });
}

function drawHandPredictions(predictions, context) {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const scaleX = canvas.width / video.videoWidth;
    const scaleY = canvas.height / video.videoHeight;

    context.clearRect(0, 0, canvas.width, canvas.height);

    predictions.forEach(prediction => {
        const landmarks = prediction.landmarks;
        context.strokeStyle = 'orange';
        context.lineWidth = 4;

        landmarks.forEach(landmark => {
            const scaledX = landmark[0] * scaleX;
            const scaledY = landmark[1] * scaleY;
            context.beginPath();
            context.arc(scaledX, scaledY, 5, 0, 2 * Math.PI);
            context.fillStyle = 'orange';
            context.fill();
            context.stroke();
        });
    });
}

function drawFacePredictions(predictions, context) {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const scaleX = canvas.width / video.videoWidth;
    const scaleY = canvas.height / video.videoHeight;

    context.clearRect(0, 0, canvas.width, canvas.height);

    predictions.forEach(prediction => {
        const { expressions, detection } = prediction;
        const box = detection.box;
        const scaledX = box.x * scaleX;
        const scaledY = box.y * scaleY;
        const scaledWidth = box.width * scaleX;
        const scaledHeight = box.height * scaleY;

        context.strokeStyle = 'orange';
        context.lineWidth = 4;
        context.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);

        const expression = Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b);
        const text = `${expression} ${Math.round(expressions[expression] * 100)}%`;
        context.fillStyle = 'rgba(255, 165, 0, 0.85)';
        context.font = '18px Arial';
        const textWidth = context.measureText(text).width;
        context.fillRect(scaledX, scaledY - 20, textWidth, 24);
        context.fillStyle = 'white';
        context.fillText(text, scaledX, scaledY - 5);
    });
}

function drawBodyPix(segmentations, context) {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const scaleX = canvas.width / video.videoWidth;
    const scaleY = canvas.height / video.videoHeight;

    context.clearRect(0, 0, canvas.width, canvas.height);

    segmentations.forEach(segmentation => {
        if (segmentation.allPoses && segmentation.allPoses.length > 0) {
            const pose = segmentation.allPoses[0];
            pose.keypoints.forEach(keypoint => {
                if (keypoint.score > 0.2) {
                    const scaledX = keypoint.position.x * scaleX;
                    const scaledY = keypoint.position.y * scaleY;
                    context.beginPath();
                    context.arc(scaledX, scaledY, 5, 0, 2 * Math.PI);
                    context.fillStyle = 'orange';
                    context.fill();
                    context.stroke();
                }
            });
        }
    });
}

document.getElementById('modelSelector').addEventListener('change', function() {
    runDetection(this.value);
});

document.getElementById('startButton').addEventListener('click', function() {
    const video = document.getElementById('video');
    video.play();
    if (currentModel) {
        detect(currentModel.name);
    }
});

document.getElementById('stopButton').addEventListener('click', stopDetection);

// Start detection on page load with default model
window.onload = function() {
    const modelSelector = document.getElementById('modelSelector');
    runDetection(modelSelector.value);
};

async function runDetection(modelName) {
    await stopDetection();
    const video = await setupCamera();
    const model = await loadModel(modelName);
    if (!model) return;
    currentModel = model;
    currentModel.name = modelName;
    video.play();
    detect(modelName);
}
