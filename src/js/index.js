// グローバル変数
let canvas, ctx;
let parts = [];
let selectedPartIndex = -1;
let animating = true;
let animationTime = 0;
let animationId = null;
let cameraInstance = null;

// モバイル用ドラッグ変数
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

// パラメータ
window.params = {
    blink: 0,
    mouth: 0,
    breath: 1
};

// 初期化
window.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    
    setupEventListeners();
    startAnimation();
    
    // 既存パーツの位置を中央に修正（もしあれば）
    fixExistingPartsPosition();
});

// 既存パーツの位置修正
function fixExistingPartsPosition() {
    if (parts.length > 0) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        parts.forEach((part, index) => {
            if (part.x === 350 && part.y === 350) {
                part.x = centerX;
                part.y = centerY;
            }
        });
    }
}

// イベントリスナー設定
function setupEventListeners() {
    // ファイルアップロード
    document.getElementById('mainFileInput').addEventListener('change', (e) => {
        if (e.target.files[0]) loadMainImage(e.target.files[0]);
    });
    
    document.getElementById('partFileInput').addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            loadPartImages(e.target.files);
        }
    });
    
    // キャンバスクリック（タッチ対応）
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        selectPartAt(x, y);
    });
    
    // タッチイベント追加（パーツ選択とドラッグ対応）
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (touch.clientX - rect.left) * scaleX;
        const y = (touch.clientY - rect.top) * scaleY;
        
        selectPartAt(x, y);
        
        // ドラッグ開始の準備
        if (selectedPartIndex >= 0) {
            isDragging = true;
            dragStartX = x;
            dragStartY = y;
        }
    });
    
    // タッチムーブ（ドラッグ）
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!isDragging || selectedPartIndex < 0) return;
        
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (touch.clientX - rect.left) * scaleX;
        const y = (touch.clientY - rect.top) * scaleY;
        
        // パーツの位置を更新
        const deltaX = x - dragStartX;
        const deltaY = y - dragStartY;
        
        parts[selectedPartIndex].x += deltaX;
        parts[selectedPartIndex].y += deltaY;
        
        // スライダーの値も更新
        document.getElementById('posXSlider').value = parts[selectedPartIndex].x;
        document.getElementById('posXValue').textContent = Math.round(parts[selectedPartIndex].x);
        document.getElementById('posYSlider').value = parts[selectedPartIndex].y;
        document.getElementById('posYValue').textContent = Math.round(parts[selectedPartIndex].y);
        
        // 次のフレームのための開始位置を更新
        dragStartX = x;
        dragStartY = y;
    });
    
    // タッチエンド
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        isDragging = false;
    });
    
    // 表情スライダー
    document.getElementById('blinkSlider').addEventListener('input', (e) => {
        window.params.blink = e.target.value / 100;
        document.getElementById('blinkValue').textContent = e.target.value + '%';
    });
    
    document.getElementById('mouthSlider').addEventListener('input', (e) => {
        window.params.mouth = e.target.value / 100;
        document.getElementById('mouthValue').textContent = e.target.value + '%';
    });
    
    document.getElementById('breathSlider').addEventListener('input', (e) => {
        window.params.breath = e.target.value / 100;
        document.getElementById('breathValue').textContent = (e.target.value / 100).toFixed(1);
    });
    
    // トランスフォームスライダー
    document.getElementById('posXSlider').addEventListener('input', (e) => {
        if (selectedPartIndex >= 0) {
            parts[selectedPartIndex].x = parseInt(e.target.value);
            document.getElementById('posXValue').textContent = e.target.value;
        }
    });
    
    document.getElementById('posYSlider').addEventListener('input', (e) => {
        if (selectedPartIndex >= 0) {
            parts[selectedPartIndex].y = parseInt(e.target.value);
            document.getElementById('posYValue').textContent = e.target.value;
        }
    });
    
    document.getElementById('rotationSlider').addEventListener('input', (e) => {
        if (selectedPartIndex >= 0) {
            parts[selectedPartIndex].rotation = parseInt(e.target.value);
            document.getElementById('rotationValue').textContent = e.target.value + '°';
        }
    });
    
    document.getElementById('scaleSlider').addEventListener('input', (e) => {
        if (selectedPartIndex >= 0) {
            parts[selectedPartIndex].scale = parts[selectedPartIndex].baseScale * (e.target.value / 100);
            document.getElementById('scaleValue').textContent = e.target.value + '%';
        }
    });
    
    // pivotドラッグ用のマウスイベント
    canvas.addEventListener('mousedown', handlePointerStart);
    canvas.addEventListener('mousemove', handlePointerMove);
    canvas.addEventListener('mouseup', handlePointerEnd);
    canvas.addEventListener('mouseleave', handlePointerEnd);

    // pivotドラッグ用のタッチイベント
    canvas.addEventListener('touchstart', handlePointerStart);
    canvas.addEventListener('touchmove', handlePointerMove);
    canvas.addEventListener('touchend', handlePointerEnd);
}

// グローバル化
window.selectPart = selectPart;
window.editPartName = editPartName;
window.changePartType = changePartType;
window.togglePart = togglePart;
window.movePartUp = movePartUp;
window.movePartDown = movePartDown;

// メイン画像読み込み
function loadMainImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const scale = Math.min(500 / img.width, 500 / img.height);
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            
            parts.push({
                name: 'ベース',
                type: 'base',
                img: img,
                x: centerX,
                y: centerY,
                scale: scale,
                baseScale: scale,
                rotation: 0,
                visible: true,
                pivotX: img.width / 2,
                pivotY: img.height / 2
            });
            
            
            document.getElementById('upload-area').classList.add('hidden');
            document.getElementById('canvas').classList.remove('hidden');
            updatePartsList();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// 複数パーツ画像読み込み
function loadPartImages(fileList) {
    Array.from(fileList).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const name = file.name.replace(/\.[^/.]+$/, '');
                // 画像が大きい場合はメイン画像サイズ、小さい場合はパーツサイズで自動判定
                const isLargeImage = img.width > 300 || img.height > 300;
                const scale = isLargeImage ? 
                    Math.min(500 / img.width, 500 / img.height) : 
                    Math.min(150 / img.width, 150 / img.height);
                
                // キャンバスの中心に配置
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2;
                
                parts.push({
                    name: name,
                    type: isLargeImage ? 'base' : 'other',
                    img: img,
                    x: centerX,
                    y: centerY,
                    scale: scale,
                    baseScale: scale,
                    rotation: 0,
                    visible: true,
                    pivotX: img.width / 2,
                    pivotY: img.height / 2
                });
                
                
                // キャンバス表示の切り替え（パーツ追加でも表示されるように）
                document.getElementById('upload-area').classList.add('hidden');
                document.getElementById('canvas').classList.remove('hidden');
                
                updatePartsList();
                selectPart(parts.length - 1);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// パーツ追加
function addPart() {
    document.getElementById('partFileInput').click();
}

// パーツリスト更新
function updatePartsList() {
    const list = document.getElementById('partsList');
    list.innerHTML = '';
    
    parts.forEach((part, index) => {
        const item = document.createElement('div');
        item.className = 'part-item';
        if (index === selectedPartIndex) {
            item.className += ' selected';
        }
        
        item.innerHTML = `
            <div class="part-name">${part.name}</div>
            <select>
                <option value="base" ${part.type === 'base' ? 'selected' : ''}>ベース</option>
                <option value="left_eye" ${part.type === 'left_eye' ? 'selected' : ''}>左目</option>
                <option value="right_eye" ${part.type === 'right_eye' ? 'selected' : ''}>右目</option>
                <option value="mouth" ${part.type === 'mouth' ? 'selected' : ''}>口</option>
                <option value="eyebrow" ${part.type === 'eyebrow' ? 'selected' : ''}>眉</option>
                <option value="hair" ${part.type === 'hair' ? 'selected' : ''}>髪</option>
                <option value="other" ${part.type === 'other' ? 'selected' : ''}>その他</option>
            </select>
            <button class="visibility-btn">${part.visible ? '👁️' : '❌'}</button>
            <button class="move-up-btn" style="width:28px;">⬆️</button>
            <button class="move-down-btn" style="width:28px;">⬇️</button>
        `;
        
        item.addEventListener('click', (e) => {
            if (
                e.target.classList.contains('visibility-btn') ||
                e.target.classList.contains('move-up-btn') ||
                e.target.classList.contains('move-down-btn') ||
                e.target.tagName === 'SELECT'
            ) return;
            selectPart(index);
        });

        item.querySelector('.part-name').addEventListener('dblclick', (e) => {
            e.stopPropagation();
            editPartName(index);
        });

        item.querySelector('select').addEventListener('change', (e) => {
            changePartType(index, e.target.value);
            updatePartsList();
        });

        item.querySelector('.visibility-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            togglePart(index);
        });

        item.querySelector('.move-up-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            movePartUp(index);
        });
        item.querySelector('.move-down-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            movePartDown(index);
        });

        list.appendChild(item);
    });
}

// パーツ選択
function selectPart(index) {
    selectedPartIndex = index;
    updatePartsList();
    animate();
    
    if (index >= 0 && index < parts.length) {
        const part = parts[index];
        document.getElementById('transformControls').classList.remove('hidden');
        
        // スライダー値を設定
        document.getElementById('posXSlider').value = part.x;
        document.getElementById('posXValue').textContent = Math.round(part.x);
        document.getElementById('posYSlider').value = part.y;
        document.getElementById('posYValue').textContent = Math.round(part.y);
        document.getElementById('rotationSlider').value = part.rotation;
        document.getElementById('rotationValue').textContent = part.rotation + '°';
        document.getElementById('scaleSlider').value = (part.scale / part.baseScale) * 100;
        document.getElementById('scaleValue').textContent = Math.round((part.scale / part.baseScale) * 100) + '%';
    } else {
        document.getElementById('transformControls').classList.add('hidden');
    }
}

// キャンバス上のパーツ選択
function selectPartAt(x, y) {
    if (parts.length === 0) return;
    
    for (let i = parts.length - 1; i >= 0; i--) {
        const part = parts[i];
        if (!part.visible) continue;
        
        const dx = x - part.x;
        const dy = y - part.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // スマホの場合は判定範囲を大きくする
        const isMobile = window.innerWidth <= 768;
        const baseRadius = Math.max(part.img.width * part.scale / 2, part.img.height * part.scale / 2);
        const hitRadius = isMobile ? Math.max(baseRadius, 80) : Math.max(baseRadius, 40);
        
        if (dist < hitRadius) {
            selectPart(i);
            return;
        }
    }
    selectPart(-1);
}

// パーツタイプ変更
function changePartType(index, type) {
    parts[index].type = type;
}

// パーツ表示切り替え
function togglePart(index) {
    parts[index].visible = !parts[index].visible;
    updatePartsList();
}

// パーツ削除
function deletePart() {
    if (selectedPartIndex >= 0 && confirm('選択中のパーツを削除しますか？')) {
        parts.splice(selectedPartIndex, 1);
        selectPart(-1);
        updatePartsList();
    }
}

// 表情設定
function setExpression(type) {
    const expressions = {
        normal: { blink: 0, mouth: 0 },
        happy: { blink: 0.2, mouth: 0.3 },
        sad: { blink: 0.3, mouth: 0 },
        angry: { blink: 0.4, mouth: 0.1 },
        surprised: { blink: 0, mouth: 0.8 },
        wink: { blink: 0.5, mouth: 0 }
    };
    
    const expr = expressions[type];
    if (expr) {
        window.params.blink = expr.blink;
        window.params.mouth = expr.mouth;
        
        document.getElementById('blinkSlider').value = expr.blink * 100;
        document.getElementById('blinkValue').textContent = Math.round(expr.blink * 100) + '%';
        document.getElementById('mouthSlider').value = expr.mouth * 100;
        document.getElementById('mouthValue').textContent = Math.round(expr.mouth * 100) + '%';
    }
}

// アニメーション開始
function startAnimation() {
    animate();
}

// アニメーション
function animate() {
    animationId = requestAnimationFrame(animate);
    
    if (!animating) return;
    
    animationTime += 0.016;
    
    // キャンバスクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 呼吸（無効化）
    const breathY = 0;
    
    // パーツ描画
    parts.forEach((part, index) => {
        if (!part.visible) return;
        
        // pivotX, pivotYが未定義ならデフォルト値をセット
        if (typeof part.pivotX !== 'number') part.pivotX = part.img.width / 2;
        if (typeof part.pivotY !== 'number') part.pivotY = part.img.height / 2;
        
        ctx.save();
        
        let x = part.x;
        let y = part.y + breathY;
        let scaleX = part.scale;
        let scaleY = part.scale;
        let rotation = (part.rotation || 0) * Math.PI / 180;
        
        // 頭部姿勢の変換を全体に適用（相対的な位置関係を保持）
        if (window.params) {
            // 顔の中心点を基準とした変換
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            
            // パーツの中心点からの相対位置を計算
            const relativeX = x - centerX;
            const relativeY = y - centerY;
            
            // 頭部回転を適用
            const headRotation = (window.params.angleZ || 0) * Math.PI / 180;
            const cos = Math.cos(headRotation);
            const sin = Math.sin(headRotation);
            
            // 回転行列による変換
            const rotatedX = relativeX * cos - relativeY * sin;
            const rotatedY = relativeX * sin + relativeY * cos;
            
            // 変換後の位置を設定
            x = centerX + rotatedX + (window.params.angleX || 0) * 0.5;
            y = centerY + rotatedY + (window.params.angleY || 0) * 0.5;
            
            // パーツ自体の回転に頭部回転を追加
            rotation += headRotation;
        }
        
        // パーツタイプ別処理
        switch(part.type) {
            case 'left_eye':
                const leftBlinkValue = (window.params.leftBlink || 0);
                // 左目は左目のみの値を使用（全体のblinkは使わない）
                scaleY *= (1 - leftBlinkValue * 0.95);
                y += leftBlinkValue * 2;
                break;
            case 'right_eye':
                const rightBlinkValue = (window.params.rightBlink || 0);
                // 右目は右目のみの値を使用（全体のblinkは使わない）
                scaleY *= (1 - rightBlinkValue * 0.95);
                y += rightBlinkValue * 2;
                break;
            case 'mouth':
                scaleY *= (1 + window.params.mouth * 0.5);
                y += window.params.mouth * 10;
                break;
            case 'eyebrow':
                // 眉毛は全体のblinkではなく、より強い方の目に反応
                const maxBlink = Math.max(window.params.leftBlink || 0, window.params.rightBlink || 0);
                if (maxBlink > 0.3) {
                    rotation -= 10 * Math.PI / 180;
                }
                break;
            case 'hair':
                // 髪の揺れを無効化
                break;
        }
        
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.scale(scaleX, scaleY);
        
        // pivotを考慮して描画
        ctx.drawImage(part.img, -part.pivotX, -part.pivotY);
        
        // 選択中のpivotマーカー
        if (index === selectedPartIndex) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(0, 0, 10 / scaleX, 0, 2 * Math.PI);
            ctx.fillStyle = 'red';
            ctx.globalAlpha = 0.7;
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2 / scaleX;
            ctx.stroke();
            ctx.restore();
        }
        
        // 選択中のハイライト
        if (index === selectedPartIndex) {
            ctx.strokeStyle = '#4fc3f7';
            ctx.lineWidth = 3 / scaleX;
            ctx.strokeRect(
                -part.pivotX - 10,
                -part.pivotY - 10,
                part.img.width + 20,
                part.img.height + 20
            );
        }
        
        ctx.restore();
    });

}

// アニメーション切り替え
function toggleAnimation() {
    animating = !animating;
}

// 画像エクスポート
function exportImage() {
    const tempSelected = selectedPartIndex;
    selectedPartIndex = -1;
    animate();
    
    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'live2d_export.png';
        a.click();
        URL.revokeObjectURL(url);
        
        selectedPartIndex = tempSelected;
    });
}

// データエクスポート
function exportData() {
    const data = {
        version: '1.0',
        parts: parts.map(p => ({
            name: p.name,
            type: p.type,
            y: p.y,
            scale: p.scale,
            rotation: p.rotation
        })),
        params: window.params
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'live2d_model.json';
    a.click();
    URL.revokeObjectURL(url);
}

// パーツ名編集
function editPartName(index) {
    const newName = prompt('新しいパーツ名を入力してください', parts[index].name);
    if (newName) {
        parts[index].name = newName;
        updatePartsList();
    }
}

// レイヤー順変更
function movePartUp(index) {
    if (index > 0) {
        [parts[index - 1], parts[index]] = [parts[index], parts[index - 1]];
        updatePartsList();
    }
}
function movePartDown(index) {
    if (index < parts.length - 1) {
        [parts[index + 1], parts[index]] = [parts[index], parts[index + 1]];
        updatePartsList();
    }
}

// pivotドラッグ用変数
let draggingPivot = false;
let dragOffsetX = 0, dragOffsetY = 0;

// キャンバスイベント追加（マウス＋タッチ対応）
function handlePointerStart(e) {
    if (selectedPartIndex < 0) return;
    const part = parts[selectedPartIndex];
    const rect = canvas.getBoundingClientRect();
    let x, y;
    
    if (e.type === 'touchstart') {
        e.preventDefault();
        const touch = e.touches[0];
        x = touch.clientX - rect.left;
        y = touch.clientY - rect.top;
    } else {
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
    }

    // パーツのpivot位置を計算
    const px = part.x + Math.cos(part.rotation * Math.PI / 180) * (-(part.pivotX - part.img.width / 2) * part.scale);
    const py = part.y + Math.sin(part.rotation * Math.PI / 180) * (-(part.pivotY - part.img.height / 2) * part.scale);

    // pivotマーカー半径（タッチの場合は大きく）
    const r = e.type === 'touchstart' ? 20 : 10;
    if (Math.abs(x - px) < r && Math.abs(y - py) < r) {
        draggingPivot = true;
        dragOffsetX = x - px;
        dragOffsetY = y - py;
    }
}

function handlePointerMove(e) {
    if (!draggingPivot || selectedPartIndex < 0) return;
    const part = parts[selectedPartIndex];
    const rect = canvas.getBoundingClientRect();
    let x, y;
    
    if (e.type === 'touchmove') {
        e.preventDefault();
        const touch = e.touches[0];
        x = touch.clientX - rect.left - dragOffsetX;
        y = touch.clientY - rect.top - dragOffsetY;
    } else {
        x = e.clientX - rect.left - dragOffsetX;
        y = e.clientY - rect.top - dragOffsetY;
    }

    // 逆変換してpivotX, pivotYを求める
    const dx = (x - part.x) / part.scale;
    const dy = (y - part.y) / part.scale;
    const angle = -part.rotation * Math.PI / 180;
    const localX = Math.cos(angle) * dx - Math.sin(angle) * dy + part.img.width / 2;
    const localY = Math.sin(angle) * dx + Math.cos(angle) * dy + part.img.height / 2;

    part.pivotX = Math.max(0, Math.min(part.img.width, localX));
    part.pivotY = Math.max(0, Math.min(part.img.height, localY));
}

function handlePointerEnd() {
    draggingPivot = false;
}




