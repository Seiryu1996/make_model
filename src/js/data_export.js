// エクスポート関連の機能

// 画像エクスポート
function exportImage() {
    const tempSelected = selectedPartIndex;
    selectedPartIndex = -1;
    animate();
    
    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'face_motion_studio_export.png';
        a.click();
        URL.revokeObjectURL(url);
        
        selectedPartIndex = tempSelected;
    });
}

// データエクスポート（軽量版）
function exportData() {
    const data = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        parts: parts.map(p => ({
            name: p.name,
            type: p.type,
            x: p.x,
            y: p.y,
            scale: p.scale,
            baseScale: p.baseScale,
            rotation: p.rotation,
            visible: p.visible,
            pivotX: p.pivotX,
            pivotY: p.pivotY
        })),
        params: {
            blink: window.params.blink,
            mouth: window.params.mouth,
            breath: window.params.breath,
            leftBlink: window.params.leftBlink,
            rightBlink: window.params.rightBlink,
            angleX: window.params.angleX,
            angleY: window.params.angleY,
            angleZ: window.params.angleZ
        }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'face_motion_studio_data.json';
    a.click();
    URL.revokeObjectURL(url);
}

// 完全データエクスポート（画像データも含む）
function exportDataWithImages() {
    const partsWithImages = parts.map(part => {
        // 画像をBase64データとして保存
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = part.img.width;
        tempCanvas.height = part.img.height;
        
        tempCtx.drawImage(part.img, 0, 0);
        const imageData = tempCanvas.toDataURL('image/png');
        
        return {
            name: part.name,
            type: part.type,
            x: part.x,
            y: part.y,
            scale: part.scale,
            baseScale: part.baseScale,
            rotation: part.rotation,
            visible: part.visible,
            pivotX: part.pivotX,
            pivotY: part.pivotY,
            imageData: imageData
        };
    });

    const data = {
        version: '1.1', // 画像データ含む版
        timestamp: new Date().toISOString(),
        parts: partsWithImages,
        params: {
            blink: window.params.blink,
            mouth: window.params.mouth,
            breath: window.params.breath,
            leftBlink: window.params.leftBlink,
            rightBlink: window.params.rightBlink,
            angleX: window.params.angleX,
            angleY: window.params.angleY,
            angleZ: window.params.angleZ
        }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'face_motion_studio_complete_data.json';
    a.click();
    URL.revokeObjectURL(url);
}

// エクスポート機能をグローバルに公開
window.exportImage = exportImage;
window.exportData = exportData;
window.exportDataWithImages = exportDataWithImages;