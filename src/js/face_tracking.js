// フェイストラッキング関連の変数
let faceTrackingEnabled = false;
let videoElement = null;
let faceMesh = null;

function toggleFaceTracking() {
    faceTrackingEnabled = !faceTrackingEnabled;
    const btn = document.getElementById('tracking-btn');
    if (faceTrackingEnabled) {
        btn.textContent = '⏸️ トラッキング停止';
        btn.style.background = '#f44336';
        updateTrackingStatus('有効');
        startFaceTrackingCamera();
    } else {
        btn.textContent = '🔄 トラッキング開始';
        btn.style.background = '#4fc3f7';
        updateTrackingStatus('無効');
        stopFaceTrackingCamera();
    }
}

function startFaceTrackingCamera() {
    if (window.cameraInstance) return;
    videoElement = document.getElementById('debug-video');
    faceMesh = new FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });
    faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });
    faceMesh.onResults(onFaceResults);

    window.cameraInstance = new Camera(videoElement, {
        onFrame: async () => {
            await faceMesh.send({image: videoElement});
        },
        width: 640,
        height: 480
    });
    window.cameraInstance.start().then(() => {
        console.log('カメラ起動成功');
    }).catch((err) => {
        console.error('カメラ起動失敗', err);
        updateTrackingStatus('カメラ取得失敗');
    });
}

function stopFaceTrackingCamera() {
    if (window.cameraInstance) {
        window.cameraInstance.stop();
        window.cameraInstance = null;
    }
    const video = document.getElementById('debug-video');
    if (video) {
        video.srcObject = null;
    }
}

function updateTrackingStatus(status) {
    const statusEl = document.getElementById('tracking-status');
    if (statusEl) {
        statusEl.textContent = `トラッキング: ${status}`;
    }
}

function onFaceResults(results) {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
        updateTrackingStatus('顔未検出');
        return;
    }
    updateTrackingStatus('顔検出中');

    const landmarks = results.multiFaceLandmarks[0];

    // 右目のまばたき度合いを計算（カメラは鏡像なので右目のデータを左目用に使用）
    const rightEyeTop = landmarks[386];
    const rightEyeBottom = landmarks[374];
    const rightEyeOuter = landmarks[362];
    const rightEyeInner = landmarks[263];
    const rightEyeOpen = Math.abs(rightEyeTop.y - rightEyeBottom.y);
    const rightEyeWidth = Math.abs(rightEyeOuter.x - rightEyeInner.x);
    let leftBlink = 1 - (rightEyeOpen / rightEyeWidth) * 1.8;
    leftBlink = Math.max(0, Math.min(1, leftBlink));

    // 左目のまばたき度合いを計算（カメラは鏡像なので左目のデータを右目用に使用）
    const leftEyeTop = landmarks[159];
    const leftEyeBottom = landmarks[145];
    const leftEyeOuter = landmarks[33];
    const leftEyeInner = landmarks[133];
    const leftEyeOpen = Math.abs(leftEyeTop.y - leftEyeBottom.y);
    const leftEyeWidth = Math.abs(leftEyeOuter.x - leftEyeInner.x);
    let rightBlink = 1 - (leftEyeOpen / leftEyeWidth) * 1.8;
    rightBlink = Math.max(0, Math.min(1, rightBlink));

    // 全体のまばたき（両目の平均）
    let blink = (leftBlink + rightBlink) / 2;
    
    // スムージング処理（震えを軽減）
    if (!window.previousBlink) window.previousBlink = 0;
    if (!window.previousLeftBlink) window.previousLeftBlink = 0;
    if (!window.previousRightBlink) window.previousRightBlink = 0;
    
    const smoothingFactor = 0.1;
    blink = window.previousBlink * smoothingFactor + blink * (1 - smoothingFactor);
    leftBlink = window.previousLeftBlink * smoothingFactor + leftBlink * (1 - smoothingFactor);
    rightBlink = window.previousRightBlink * smoothingFactor + rightBlink * (1 - smoothingFactor);
    
    window.previousBlink = blink;
    window.previousLeftBlink = leftBlink;
    window.previousRightBlink = rightBlink;

    // 口の開き度合いを計算
    const mouthTop = landmarks[13];
    const mouthBottom = landmarks[14];
    const mouthLeft = landmarks[78];
    const mouthRight = landmarks[308];
    const mouthOpen = Math.abs(mouthTop.y - mouthBottom.y);
    const mouthWidth = Math.abs(mouthLeft.x - mouthRight.x);
    let mouth = (mouthOpen / mouthWidth) * 2.0;
    mouth = Math.max(0, Math.min(1, mouth));

    // 3D頭部姿勢推定: ピッチ、ヨー、ロールの計算
    const noseTip = landmarks[1];
    const noseRoot = landmarks[6];
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const leftMouth = landmarks[61];
    const rightMouth = landmarks[291];

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

    // 反映
    window.params.blink = blink;
    window.params.leftBlink = leftBlink;
    window.params.rightBlink = rightBlink;
    window.params.mouth = mouth;
    window.params.angleX = Math.max(-180, Math.min(180, pitch * 2));
    window.params.angleY = Math.max(-180, Math.min(180, yaw * 2));
    window.params.angleZ = Math.max(-180, Math.min(180, -roll * 2));

    // スライダーUIも連動
    document.getElementById('blinkSlider').value = Math.round(blink * 100);
    document.getElementById('blinkValue').textContent = Math.round(blink * 100) + '%';
    document.getElementById('mouthSlider').value = Math.round(mouth * 100);
    document.getElementById('mouthValue').textContent = Math.round(mouth * 100) + '%';
}