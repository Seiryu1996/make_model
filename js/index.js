// グローバル変数
let canvas, ctx;
let parts = [];
let selectedPartIndex = -1;
let animating = true;
let animationTime = 0;
let animationId = null;

// パラメータ
const params = {
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
});

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
    
    // キャンバスクリック
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        selectPartAt(x, y);
    });
    
    // 表情スライダー
    document.getElementById('blinkSlider').addEventListener('input', (e) => {
        params.blink = e.target.value / 100;
        document.getElementById('blinkValue').textContent = e.target.value + '%';
    });
    
    document.getElementById('mouthSlider').addEventListener('input', (e) => {
        params.mouth = e.target.value / 100;
        document.getElementById('mouthValue').textContent = e.target.value + '%';
    });
    
    document.getElementById('breathSlider').addEventListener('input', (e) => {
        params.breath = e.target.value / 100;
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
}

// メイン画像読み込み
function loadMainImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const scale = Math.min(500 / img.width, 500 / img.height);
            parts.push({
                name: 'ベース',
                type: 'base',
                img: img,
                x: 350,
                y: 350,
                scale: scale,
                baseScale: scale,
                rotation: 0,
                visible: true
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
                const scale = Math.min(150 / img.width, 150 / img.height);
                parts.push({
                    name: name,
                    type: 'other',
                    img: img,
                    x: 350,
                    y: 350,
                    scale: scale,
                    baseScale: scale,
                    rotation: 0,
                    visible: true
                });
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
            <div onclick="selectPart(${index})" style="flex: 1;">
                <div class="part-name" ondblclick="editPartName(${index})">${part.name}</div>
                <select onclick="event.stopPropagation()" onchange="changePartType(${index}, this.value)">
                    <option value="base" ${part.type === 'base' ? 'selected' : ''}>ベース</option>
                    <option value="eye" ${part.type === 'eye' ? 'selected' : ''}>目</option>
                    <option value="mouth" ${part.type === 'mouth' ? 'selected' : ''}>口</option>
                    <option value="eyebrow" ${part.type === 'eyebrow' ? 'selected' : ''}>眉</option>
                    <option value="hair" ${part.type === 'hair' ? 'selected' : ''}>髪</option>
                    <option value="other" ${part.type === 'other' ? 'selected' : ''}>その他</option>
                </select>
            </div>
            <button class="visibility-btn" onclick="togglePart(${index}); event.stopPropagation();">
                ${part.visible ? '👁️' : '❌'}
            </button>
        `;
        
        list.appendChild(item);
    });
}

// パーツ選択
function selectPart(index) {
    selectedPartIndex = index;
    updatePartsList();
    
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
    for (let i = parts.length - 1; i >= 0; i--) {
        const part = parts[i];
        if (!part.visible) continue;
        
        const dx = x - part.x;
        const dy = y - part.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < part.img.width * part.scale / 2) {
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
        params.blink = expr.blink;
        params.mouth = expr.mouth;
        
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
    
    // 呼吸
    const breathY = Math.sin(animationTime * 2) * 5 * params.breath;
    
    // パーツ描画
    parts.forEach((part, index) => {
        if (!part.visible) return;
        
        ctx.save();
        
        let x = part.x;
        let y = part.y + breathY;
        let scaleX = part.scale;
        let scaleY = part.scale;
        let rotation = (part.rotation || 0) * Math.PI / 180;
        
        // パーツタイプ別処理
        switch(part.type) {
            case 'eye':
                scaleY *= (1 - params.blink * 0.8);
                y += params.blink * 5;
                break;
            case 'mouth':
                scaleY *= (1 + params.mouth * 0.5);
                y += params.mouth * 10;
                break;
            case 'eyebrow':
                if (params.blink > 0.3) {
                    rotation -= 10 * Math.PI / 180;
                }
                break;
            case 'hair':
                x += Math.sin(animationTime * 0.8) * 3;
                rotation += Math.sin(animationTime * 0.8) * 0.02;
                break;
        }
        
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.scale(scaleX, scaleY);
        
        // 選択中のハイライト
        if (index === selectedPartIndex) {
            ctx.strokeStyle = '#4fc3f7';
            ctx.lineWidth = 3 / scaleX;
            ctx.strokeRect(
                -part.img.width / 2 - 10,
                -part.img.height / 2 - 10,
                part.img.width + 20,
                part.img.height + 20
            );
        }
        
        ctx.drawImage(part.img, -part.img.width / 2, -part.img.height / 2);
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
        params: params
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