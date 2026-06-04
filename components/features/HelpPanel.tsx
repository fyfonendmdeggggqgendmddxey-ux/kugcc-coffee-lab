import React from 'react';

export default function HelpPanel() {
    return (
        <div className="h-full flex flex-col p-6 font-mono overflow-y-auto">
            <h2 className="text-xs font-bold tracking-[0.2em] uppercase mb-6 text-gray-500 border-b border-gray-900 pb-2">
                User Guide / Help
            </h2>

            <div className="space-y-8 text-[11px] leading-relaxed text-gray-400 max-w-2xl">
                
                {/* 1. Getting Started */}
                <section>
                    <h3 className="text-sm font-bold text-gray-300 mb-3 border-b border-gray-800 pb-1">🚀 1. はじめに（Getting Started）</h3>
                    <p className="mb-2">
                        Coffee Labへようこそ！このアプリは、あなたが購入したコーヒー豆の情報を管理し、日々の抽出（ドリップ）レシピを記録するためのツールです。
                    </p>
                    <ul className="list-disc pl-4 space-y-1">
                        <li><strong>Library:</strong> 購入した豆を登録・一覧表示します。</li>
                        <li><strong>Timer:</strong> ドリップ時のタイマーとレシピを表示します。</li>
                        <li><strong>Logs:</strong> 抽出ごとの評価（Tasting Log）を記録します。</li>
                    </ul>
                </section>

                {/* 2. AI Auto-fill */}
                <section>
                    <h3 className="text-sm font-bold text-gray-300 mb-3 border-b border-gray-800 pb-1">📸 2. AIによる自動入力機能（Auto-fill）</h3>
                    <p className="mb-2">
                        手入力の手間を省くため、コーヒー袋の写真を撮るだけでAI（Gemini）が自動で豆の名前やフレーバー、焙煎日を読み取ります！
                    </p>
                    <div className="bg-gray-900/50 p-3 border border-gray-800 rounded mb-2">
                        <strong className="text-gray-300 block mb-1">【設定方法】</strong>
                        <ol className="list-decimal pl-4 space-y-1">
                            <li><a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">Google AI Studio</a> にアクセスし、無料のAPIキーを取得します。</li>
                            <li>当アプリの <strong>Settingsタブ</strong> を開き、「API Integrations」の欄に取得したキーを貼り付けます。</li>
                            <li>Libraryタブの 📸 アイコンから写真をアップロードすると自動解析が始まります！</li>
                        </ol>
                    </div>
                    <p className="text-[10px] text-gray-500">※ 写真から焙煎日が読み取れなかった場合、Settingsで設定した「Roaster Aging Defaults（店舗ごとのデフォルト日数）」が自動適用されます。</p>
                </section>

                {/* 3. Aging */}
                <section>
                    <h3 className="text-sm font-bold text-gray-300 mb-3 border-b border-gray-800 pb-1">⏳ 3. エイジング管理（Aging）</h3>
                    <p className="mb-2">
                        コーヒー豆は焙煎直後からガスが抜け（Degas）、味が落ち着いて飲み頃（Peak）を迎えます。
                    </p>
                    <ul className="list-disc pl-4 space-y-2">
                        <li><span className="px-1.5 py-0.5 text-[8px] border border-amber-900 bg-amber-950/20 text-amber-500 rounded-sm">Degas</span> 焙煎直後。まだガスが多く、味が安定していない状態です。</li>
                        <li><span className="px-1.5 py-0.5 text-[8px] border border-emerald-900 bg-emerald-950/20 text-emerald-400 rounded-sm">Peak</span> 飲み頃のピーク！味が最も開いて美味しい時期です。</li>
                        <li><span className="px-1.5 py-0.5 text-[8px] border border-sky-900 bg-sky-950/20 text-sky-400 rounded-sm">Good</span> ピークは過ぎましたが、まだまだ美味しく飲めます。</li>
                        <li><span className="px-1.5 py-0.5 text-[8px] border border-gray-800 bg-gray-900/40 text-gray-500 rounded-sm">Aged</span> 焙煎からかなり日数が経過した状態です。</li>
                    </ul>
                    <p className="mt-2 text-[10px]">※ 豆の登録時に「Ideal Peak (Days)」を設定することで、Peakを迎える日数をカスタマイズできます。</p>
                </section>

                {/* 4. Brewing */}
                <section>
                    <h3 className="text-sm font-bold text-gray-300 mb-3 border-b border-gray-800 pb-1">⏱️ 4. ドリップ・タイマー（Brewing Timer）</h3>
                    <p className="mb-2">
                        豆ごとに「独自のレシピ」を保存することができます。
                    </p>
                    <ul className="list-disc pl-4 space-y-1">
                        <li>Libraryから豆を選択し、「Timer」タブに移動します。</li>
                        <li>デフォルトでは「Standard V60 Recipe」が適用されます。</li>
                        <li>「📝 EDIT RECIPE」ボタンから、豆の量・湯温・お湯を注ぐタイミング（%）を自分好みに変更できます。</li>
                    </ul>
                </section>

                {/* 5. Data & Backup */}
                <section>
                    <h3 className="text-sm font-bold text-gray-300 mb-3 border-b border-gray-800 pb-1">💾 5. データ保存とバックアップ（Data Management）</h3>
                    <p className="mb-2">
                        このアプリのデータは、<strong>お使いのブラウザ（ローカルストレージ）にのみ保存</strong>されます。サーバーには送信されません。
                    </p>
                    <p className="mb-2 text-red-400">
                        ⚠️ ブラウザの履歴やキャッシュを完全に消去すると、データが消えてしまいます！
                    </p>
                    <p>
                        定期的に <strong>Settingsタブ</strong> の一番下にある「Export Backup」ボタンを押し、JSONファイルとしてバックアップを保存することをおすすめします。別のスマホやPCにデータを移す際も、このファイルから「Import Data」できます。
                    </p>
                </section>

            </div>
        </div>
    );
}
