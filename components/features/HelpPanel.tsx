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
                        Coffee Labへようこそ！このアプリは、あなたが購入したコーヒー豆の情報を管理し、日々の抽出（ドリップ）レシピを記録・実行するためのプロフェッショナル向けツールです。
                    </p>
                    <ul className="list-disc pl-4 space-y-1">
                        <li><strong>Library:</strong> 購入した豆を登録・一覧表示します。</li>
                        <li><strong>Timer:</strong> ドリップ時のタイマーとレシピを表示し、抽出をガイドします。</li>
                        <li><strong>Recipes:</strong> 汎用レシピや豆ごとのレシピを管理します。</li>
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
                </section>

                {/* 3. Brewing Timer & Test Drip */}
                <section>
                    <h3 className="text-sm font-bold text-gray-300 mb-3 border-b border-gray-800 pb-1">⏱️ 3. タイマーとTest Drip（ダイヤルイン）</h3>
                    <p className="mb-2">
                        タイマータブでは、レシピに沿った抽出ガイドと、自由な抽出を記録するTest Dripモードが使えます。
                    </p>
                    <div className="space-y-3">
                        <div>
                            <strong className="text-gray-300">【通常モード（Standard）】</strong>
                            <p>レシピ通りに時間を計るモードです。タイマーを開始すると、設定したステップ（蒸らし、第1投など）に合わせてカウントダウンが進行し、注ぐべき目標湯量が画面にリアルタイム表示されます。</p>
                        </div>
                        <div>
                            <strong className="text-blue-400">【Test Drip（ダイヤルイン・モード）】</strong>
                            <p>「あなたが実際に注いだタイミングを記録し、後からレシピ化する」ための逆算型タイマーです。初めての豆や、微調整を行いたい時に最適です。</p>
                            <ol className="list-decimal pl-4 mt-1 space-y-1">
                                <li>画面下部のパネル右端にあるスイッチを <strong className="text-blue-400">TEST DRIP</strong> に切り替えます。</li>
                                <li>スタートすると、タイマーが1周60秒のストップウォッチとしてシームレスに回転します。</li>
                                <li>湯を注ぐタイミングで「LAP」ボタン（またはSpaceキー）を押し、ラップを刻みます（回数無制限）。</li>
                                <li>「FINISH」を押すと、実測秒数とレシピのズレがサマリーとして表示されます。</li>
                                <li>そのまま「Save Dial-in as New Recipe」を押せば、実測データが反映された新規レシピとして保存できます！</li>
                            </ol>
                        </div>
                    </div>
                </section>

                {/* 4. Aging Theory */}
                <section>
                    <h3 className="text-sm font-bold text-gray-300 mb-3 border-b border-gray-800 pb-1">⏳ 4. エイジングと科学理論（Aging Theory）</h3>
                    <p className="mb-2">
                        コーヒー豆は焙煎直後からガスが抜け（Degas）、味が落ち着いて飲み頃（Peak）を迎えます。当アプリは以下の科学的理論に基づいてエイジングを管理します。
                    </p>
                    <ul className="list-disc pl-4 space-y-2 mb-4">
                        <li><span className="px-1.5 py-0.5 text-[8px] border border-amber-900 bg-amber-950/20 text-amber-500 rounded-sm">Degas</span> 焙煎直後。まだガスが多く、味が安定していない状態です。</li>
                        <li><span className="px-1.5 py-0.5 text-[8px] border border-emerald-900 bg-emerald-950/20 text-emerald-400 rounded-sm">Peak</span> 飲み頃のピーク！味が最も開いて美味しい時期です。</li>
                        <li><span className="px-1.5 py-0.5 text-[8px] border border-sky-900 bg-sky-950/20 text-sky-400 rounded-sm">Good</span> ピークは過ぎましたが、まだまだ美味しく飲めます。</li>
                        <li><span className="px-1.5 py-0.5 text-[8px] border border-gray-800 bg-gray-900/40 text-gray-500 rounded-sm">Aged</span> 焙煎からかなり日数が経過した状態です。</li>
                    </ul>
                    
                    <div className="bg-gray-900/30 p-3 border border-gray-800 rounded">
                        <strong className="text-gray-300 block mb-2">🔬 脱ガス（Degassing）のメカニズムと速度論</strong>
                        <p className="mb-2">
                            焙煎中に生成された二酸化炭素（CO₂）が豆の多孔質構造から放出される現象です。脱ガスの速度はフィックの拡散の法則（Fick's law）に従い、時間に対して指数関数的に減少（Exponential decay）します。
                        </p>
                        <ul className="list-disc pl-4 space-y-1 mb-3">
                            <li><strong>焙煎度:</strong> 深煎りほど細胞壁が脆くガス放出が速い。</li>
                            <li><strong>温度:</strong> 保管温度が高いほど拡散速度が速い（アレニウスの式）。</li>
                        </ul>
                        <strong className="text-gray-400 block mb-1 text-[10px]">📚 参考文献（References）:</strong>
                        <ul className="list-disc pl-4 space-y-1 text-[9px] text-gray-500">
                            <li>Smrke, S., et al. (2018). "Time-Resolved Gravimetric Method to Assess Degassing of Roasted Coffee."</li>
                            <li>Shimoni, E., & Labuza, T. P. (2000). "Degassing Kinetics and Sorption Equilibrium of Carbon Dioxide in Fresh Roasted and Ground Coffee."</li>
                            <li>Wang, X., & Lim, L. T. (2014). "Effect of Roasting Conditions on Carbon Dioxide Degassing Behavior in Coffee."</li>
                        </ul>
                    </div>
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
                        定期的に <strong>Settingsタブ</strong> の一番下にある「Export Backup」ボタンを押し、JSONファイルとしてバックアップを保存することをおすすめします。
                    </p>
                </section>

                {/* 6. Grind Size Reference */}
                <section>
                    <h3 className="text-sm font-bold text-gray-300 mb-3 border-b border-gray-800 pb-1">⚙️ 6. 挽き目リファレンス（Grind Size Reference）</h3>
                    <p className="mb-2">
                        代表的なグラインダー（ミル）の挽き目（クリック数）の目安です。抽出の参考にしてください。
                    </p>
                    <div className="overflow-x-auto border border-gray-800 rounded-sm">
                        <table className="w-full text-[10px] text-left whitespace-nowrap">
                            <thead className="bg-gray-900/50 text-gray-400">
                                <tr>
                                    <th className="px-3 py-2 border-b border-r border-gray-800 font-bold uppercase tracking-wider">Grinder Model</th>
                                    <th className="px-3 py-2 border-b border-r border-gray-800 font-bold uppercase tracking-wider text-center">Fine (Espresso)</th>
                                    <th className="px-3 py-2 border-b border-r border-gray-800 font-bold uppercase tracking-wider text-center">Med-Fine (Pour Over)</th>
                                    <th className="px-3 py-2 border-b font-bold uppercase tracking-wider text-center">Coarse (French Press)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-gray-900 hover:bg-gray-900/30">
                                    <td className="px-3 py-2 border-r border-gray-900 font-bold text-gray-300">Comandante C40 MK4</td>
                                    <td className="px-3 py-2 border-r border-gray-900 text-center text-gray-400">10-15</td>
                                    <td className="px-3 py-2 border-r border-gray-900 text-center text-gray-400">18-25</td>
                                    <td className="px-3 py-2 text-center text-gray-400">28-32</td>
                                </tr>
                                <tr className="border-b border-gray-900 hover:bg-gray-900/30">
                                    <td className="px-3 py-2 border-r border-gray-900 font-bold text-gray-300">Comandante RedClix</td>
                                    <td className="px-3 py-2 border-r border-gray-900 text-center text-gray-400">20-30</td>
                                    <td className="px-3 py-2 border-r border-gray-900 text-center text-gray-400">36-50</td>
                                    <td className="px-3 py-2 text-center text-gray-400">56-64</td>
                                </tr>
                                <tr className="border-b border-gray-900 hover:bg-gray-900/30">
                                    <td className="px-3 py-2 border-r border-gray-900 font-bold text-gray-300">1Zpresso K-Ultra</td>
                                    <td className="px-3 py-2 border-r border-gray-900 text-center text-gray-400">30-40</td>
                                    <td className="px-3 py-2 border-r border-gray-900 text-center text-gray-400">55-75</td>
                                    <td className="px-3 py-2 text-center text-gray-400">85-100</td>
                                </tr>
                                <tr className="border-b border-gray-900 hover:bg-gray-900/30">
                                    <td className="px-3 py-2 border-r border-gray-900 font-bold text-gray-300">KINGrinder K6</td>
                                    <td className="px-3 py-2 border-r border-gray-900 text-center text-gray-400">35-50</td>
                                    <td className="px-3 py-2 border-r border-gray-900 text-center text-gray-400">70-90</td>
                                    <td className="px-3 py-2 text-center text-gray-400">100-120</td>
                                </tr>
                                <tr className="border-b border-gray-900 hover:bg-gray-900/30">
                                    <td className="px-3 py-2 border-r border-gray-900 font-bold text-gray-300">Timemore C2/C3</td>
                                    <td className="px-3 py-2 border-r border-gray-900 text-center text-gray-400">10-14</td>
                                    <td className="px-3 py-2 border-r border-gray-900 text-center text-gray-400">15-20</td>
                                    <td className="px-3 py-2 text-center text-gray-400">22-26</td>
                                </tr>
                                <tr className="border-gray-900 hover:bg-gray-900/30">
                                    <td className="px-3 py-2 border-r border-gray-900 font-bold text-gray-300">Timemore X-Lite</td>
                                    <td className="px-3 py-2 border-r border-gray-900 text-center text-gray-400">5-7</td>
                                    <td className="px-3 py-2 border-r border-gray-900 text-center text-gray-400">8.5-11.5</td>
                                    <td className="px-3 py-2 text-center text-gray-400">14-16</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

            </div>
        </div>
    );
}
