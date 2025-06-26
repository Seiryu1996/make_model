// データインポート関連の機能

// JSONデータインポート機能
function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    loadImportedData(data);
                } catch (error) {
                    alert('JSONファイルの読み込みに失敗しました: ' + error.message);
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

// インポートしたデータを読み込む
function loadImportedData(data) {
    try {
        // データの妥当性チェック
        if (!data || typeof data !== 'object') {
            throw new Error('無効なデータ形式です');
        }

        console.log('読み込み開始:', data);

        // バージョンチェック（将来的な拡張のため）
        const version = data.version || '1.0';
        console.log('データバージョン:', version);

        // パーツデータの復元
        if (data.parts && Array.isArray(data.parts)) {
            console.log('パーツ数:', data.parts.length);
            restorePartsFromData(data.parts);
        } else {
            console.warn('パーツデータが見つかりません');
        }

        // パラメータの復元
        if (data.params && typeof data.params === 'object') {
            restoreParamsFromData(data.params);
        }

    } catch (error) {
        console.error('データ読み込みエラー:', error);
        alert('データの読み込み中にエラーが発生しました: ' + error.message);
    }
}

// パーツデータの復元
function restorePartsFromData(partsData) {
    console.log('パーツ復元開始:', partsData);
    
    // 既存のパーツをクリア
    parts.length = 0;
    selectedPartIndex = -1;

    if (!partsData || partsData.length === 0) {
        console.warn('復元するパーツがありません');
        return;
    }

    let loadedCount = 0;
    const totalCount = partsData.length;

    // 各パーツを復元
    partsData.forEach((partData, index) => {
        console.log(`パーツ${index}を復元中:`, partData.name);
        
        if (partData.imageData) {
            // Base64画像データから画像を復元
            const img = new Image();
            img.onload = () => {
                console.log(`画像読み込み成功: ${partData.name}`);
                
                const part = {
                    name: partData.name || `パーツ${index + 1}`,
                    type: partData.type || 'other',
                    img: img,
                    x: partData.x !== undefined ? partData.x : canvas.width / 2,
                    y: partData.y !== undefined ? partData.y : canvas.height / 2,
                    scale: partData.scale !== undefined ? partData.scale : 1,
                    baseScale: partData.baseScale !== undefined ? partData.baseScale : 1,
                    rotation: partData.rotation || 0,
                    visible: partData.visible !== undefined ? partData.visible : true,
                    pivotX: partData.pivotX !== undefined ? partData.pivotX : img.width / 2,
                    pivotY: partData.pivotY !== undefined ? partData.pivotY : img.height / 2
                };
                
                parts.push(part);
                loadedCount++;
                
                console.log(`読み込み完了: ${loadedCount}/${totalCount}`);
                
                // 全ての画像が読み込まれたらUI更新とアニメーション開始
                if (loadedCount === totalCount) {
                    console.log('全てのパーツが読み込まれました:', parts.length);
                    console.log('parts配列:', parts);
                    
                    // キャンバス表示
                    const uploadArea = document.getElementById('upload-area');
                    const canvas = document.getElementById('canvas');
                    
                    if (uploadArea) {
                        uploadArea.classList.add('hidden');
                        console.log('アップロードエリアを非表示');
                    }
                    
                    if (canvas) {
                        canvas.classList.remove('hidden');
                        console.log('キャンバスを表示');
                    }
                    
                    // パーツリスト更新
                    updatePartsList();
                    console.log('パーツリスト更新完了');
                    
                    // アニメーションを強制的に開始
                    animating = true;
                    if (animationId) {
                        cancelAnimationFrame(animationId);
                    }
                    
                    // 手動で1回描画してから継続的なアニメーション開始
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    parts.forEach((part, i) => {
                        if (part.visible && part.img) {
                            ctx.save();
                            ctx.translate(part.x, part.y);
                            ctx.rotate((part.rotation || 0) * Math.PI / 180);
                            ctx.scale(part.scale, part.scale);
                            ctx.drawImage(part.img, -part.pivotX, -part.pivotY);
                            ctx.restore();
                            console.log(`パーツ${i}を描画: ${part.name}`);
                        }
                    });
                    
                    // 継続的なアニメーション開始
                    animate();
                    
                    if (parts.length > 0) {
                        selectPart(0);
                    }
                    
                    alert('データの読み込みが完了しました');
                }
            };
            
            img.onerror = () => {
                console.error('画像の復元に失敗しました:', partData.name);
                loadedCount++;
                
                // エラーが発生してもカウントを進める
                if (loadedCount === totalCount) {
                    console.log('読み込み完了（エラーあり）');
                    updatePartsList();
                    document.getElementById('upload-area').classList.add('hidden');
                    document.getElementById('canvas').classList.remove('hidden');
                    animating = true;
                    animate();
                    alert('データの読み込みが完了しました（一部エラーあり）');
                }
            };
            
            img.src = partData.imageData;
        } else {
            console.warn('画像データが見つかりません:', partData.name);
            loadedCount++;
            
            // 画像データがない場合もカウントを進める
            if (loadedCount === totalCount) {
                console.log('読み込み完了（画像データなし）');
                updatePartsList();
                animate();
                alert('データの読み込みが完了しました（画像データなし）');
            }
        }
    });
}

// パラメータの復元
function restoreParamsFromData(paramsData) {
    // パラメータを復元
    if (paramsData.blink !== undefined) {
        window.params.blink = paramsData.blink;
        document.getElementById('blinkSlider').value = paramsData.blink * 100;
        document.getElementById('blinkValue').textContent = Math.round(paramsData.blink * 100) + '%';
    }
    
    if (paramsData.mouth !== undefined) {
        window.params.mouth = paramsData.mouth;
        document.getElementById('mouthSlider').value = paramsData.mouth * 100;
        document.getElementById('mouthValue').textContent = Math.round(paramsData.mouth * 100) + '%';
    }
    
    if (paramsData.breath !== undefined) {
        window.params.breath = paramsData.breath;
        document.getElementById('breathSlider').value = paramsData.breath * 100;
        document.getElementById('breathValue').textContent = paramsData.breath.toFixed(1);
    }

    // 個別の目のパラメータも復元（あれば）
    if (paramsData.leftBlink !== undefined) {
        window.params.leftBlink = paramsData.leftBlink;
    }
    
    if (paramsData.rightBlink !== undefined) {
        window.params.rightBlink = paramsData.rightBlink;
    }

    // 頭部姿勢パラメータも復元（あれば）
    if (paramsData.angleX !== undefined) {
        window.params.angleX = paramsData.angleX;
    }
    
    if (paramsData.angleY !== undefined) {
        window.params.angleY = paramsData.angleY;
    }
    
    if (paramsData.angleZ !== undefined) {
        window.params.angleZ = paramsData.angleZ;
    }
}

// JSONインポート機能をグローバルに公開
window.importData = importData;