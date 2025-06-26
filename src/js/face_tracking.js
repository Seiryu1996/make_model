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

                // 3D頭部姿勢推定: ピッチ、ヨー、ロールの計算
                if (window.params) {
                    // 重要なランドマーク点を取得
                    const noseTip = landmarks[1];        // 鼻先
                    const noseRoot = landmarks[6];       // 鼻根部
                    const leftEye = landmarks[33];       // 左目内角
                    const rightEye = landmarks[263];     // 右目内角
                    const leftMouth = landmarks[61];     // 口左端
                    const rightMouth = landmarks[291];   // 口右端
                    const chin = landmarks[175];         // 顎先
                    const forehead = landmarks[10];      // 額中央

                    // ヨー角度（左右の回転）の計算
                    const eyeVector = {
                        x: rightEye.x - leftEye.x,
                        y: rightEye.y - leftEye.y,
                        z: rightEye.z - leftEye.z
                    };
                    const yaw = Math.atan2(eyeVector.z, eyeVector.x) * (180 / Math.PI);

                    // ピッチ角度（上下の回転）の計算
                    const noseVector = {
                        x: noseTip.x - noseRoot.x,
                        y: noseTip.y - noseRoot.y,
                        z: noseTip.z - noseRoot.z
                    };
                    const pitch = Math.atan2(noseVector.y, noseVector.z) * (180 / Math.PI);

                    // ロール角度（傾き）の計算
                    const mouthVector = {
                        x: rightMouth.x - leftMouth.x,
                        y: rightMouth.y - leftMouth.y,
                        z: rightMouth.z - leftMouth.z
                    };
                    const roll = Math.atan2(mouthVector.y, mouthVector.x) * (180 / Math.PI);

                    // 角度の正規化と適用（-180度から180度の範囲に調整）
                    window.params.angleX = Math.max(-180, Math.min(180, pitch * 2));    // ピッチ
                    window.params.angleY = Math.max(-180, Math.min(180, yaw * 2));      // ヨー
                    window.params.angleZ = Math.max(-180, Math.min(180, roll * 2));     // ロール
                }

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