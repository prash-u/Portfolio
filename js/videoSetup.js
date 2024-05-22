// videoSetup.js - Sets up the webcam video stream

/**
 * Sets up the webcam on a provided video element.
 * @returns {HTMLVideoElement} The video element with the webcam stream.
 */
async function setupCamera() {
    const video = document.getElementById('video');
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
                resolve(video);
            };
        });
    } catch (error) {
        console.error('Error accessing the webcam:', error);
        throw error;
    }
}

/**
 * Loads the video stream into the video element and starts playback.
 * @returns {HTMLVideoElement} The video element playing the webcam stream.
 */
async function loadVideo() {
    const video = await setupCamera();
    video.play();
    return video;
}

// When the window loads, initialize the camera setup
window.onload = loadVideo;
