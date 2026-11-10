export async function resizeImageToBase64(file: File, maxSize: number = 800): Promise<{data: string, mime: string}> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxSize) {
                        height = Math.round(height * (maxSize / width));
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width = Math.round(width * (maxSize / height));
                        height = maxSize;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error("画像の変換に失敗しました。別の写真を選んでください。"));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                // Use jpeg for compression to avoid base64 bloat
                const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                const mime = 'image/jpeg';
                const data = dataUrl.split(',')[1];
                resolve({ data, mime });
            };
            img.onerror = () => reject(new Error("この画像を開けませんでした。JPEGまたはPNGに変換して再実行してください。"));
            img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error("画像ファイルを読み込めませんでした。選び直してください。"));
        reader.readAsDataURL(file);
    });
}
