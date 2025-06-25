window.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('debug-video');
    let faceMesh = null;

    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
            video.play();

            faceMesh = new FaceMesh({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
            });
            faceMesh.setOptions({
                maxNumFaces: 1,
                refineLandmarks: false,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            // トラッキング感度スライダーの反映
            const trackingSlider = document.getElementById('trackingSensitivitySlider');
            if (trackingSlider) {
                trackingSlider.addEventListener('input', (e) => {
                    const value = e.target.value / 100;
                    faceMesh.setOptions({
                        minDetectionConfidence: value,
                        minTrackingConfidence: value
                    });
                    const label = document.getElementById('trackingSensitivityValue');
                    if (label) label.textContent = Math.round(value * 100) + '%';
                });
            }

            faceMesh.onResults(results => {
                if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;
                const landmarks = results.multiFaceLandmarks[0];

                // テスト: 鼻先ランドマークの絶対値をそのまま反映
                if (window.params) {
                    window.params.angleX = landmarks[1].x * 1000; // 鼻先x
                    window.params.angleY = landmarks[1].y * 1000; // 鼻先y
                    window.params.angleZ = landmarks[1].z * 1000; // 鼻先z
                }

                // 必要ならUIにも反映
                const angleXValue = document.getElementById('angleXValue');
                const angleYValue = document.getElementById('angleYValue');
                const angleZValue = document.getElementById('angleZValue');
                if (angleXValue) angleXValue.textContent = (window.params.angleX || 0).toFixed(1) + '°';
                if (angleYValue) angleYValue.textContent = (window.params.angleY || 0).toFixed(1) + '°';
                if (angleZValue) angleZValue.textContent = (window.params.angleZ || 0).toFixed(1) + '°';
            });

            function processFrame() {
                if (video.readyState >= 2) {
                    faceMesh.send({ image: video });
                }
                requestAnimationFrame(processFrame);
            }
            processFrame();
        })
        .catch(err => {
            alert('getUserMedia失敗: ' + err.message);
            console.error('getUserMedia失敗', err);
        });
}); 