"use client";

import { useState, useEffect } from 'react';
import Tooltip from '../common/Tooltip';
import { useLanguage } from '@/utils/LanguageContext';

const DEFAULT_ROASTERS = ['Kurasu', 'Onibus', 'Glitch', 'Blue Bottle', 'Starbucks'];
const DEFAULT_ORIGINS = ['Ethiopia', 'Colombia', 'Brazil', 'Kenya', 'Guatemala', 'Indonesia'];
const DEFAULT_PROCESSES = ['Washed', 'Natural', 'Honey', 'Anaerobic', 'Experimental', 'Wet Hulled'];
const DEFAULT_ROAST_LEVELS = ['Light', 'Medium', 'Dark', 'Italian', 'French', 'City'];
const DEFAULT_VARIETIES = ['Geisha', 'Bourbon', 'Typica', 'Caturra', 'SL28', 'Pacamara'];
const DEFAULT_DRIPPERS = ['Hario V60', 'Kalita Wave', 'Origami', 'Hario Switch', 'Aeropress', 'Chemex', 'French Press'];
const DEFAULT_ACCESSORIES = ['Paragon', 'Melodrip', 'Sifter', 'WDT Tool', 'Paper Filter (Bottom)', 'LilyDrip'];

export default function SettingsPanel() {
    const { language, setLanguage, t } = useLanguage();

    const [roasters, setRoasters] = useState<string[]>([]);
    const [origins, setOrigins] = useState<string[]>([]);
    const [processes, setProcesses] = useState<string[]>([]);
    const [roastLevels, setRoastLevels] = useState<string[]>([]);
    const [varieties, setVarieties] = useState<string[]>([]);
    const [drippers, setDrippers] = useState<string[]>([]);
    const [accessories, setAccessories] = useState<string[]>([]);

    const [newRoaster, setNewRoaster] = useState('');
    const [newOrigin, setNewOrigin] = useState('');
    const [newProcess, setNewProcess] = useState('');
    const [newRoastLevel, setNewRoastLevel] = useState('');
    const [newVariety, setNewVariety] = useState('');
    const [newDripper, setNewDripper] = useState('');
    const [newAccessory, setNewAccessory] = useState('');

    const [geminiApiKey, setGeminiApiKey] = useState('');
    const [roasterDefaults, setRoasterDefaults] = useState<Record<string, number>>({});
    
    const [newDefaultRoaster, setNewDefaultRoaster] = useState('');
    const [newDefaultDays, setNewDefaultDays] = useState<number | ''>('');

    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    // Load custom lists from LocalStorage on mount
    useEffect(() => {
        const savedRoasters = localStorage.getItem('kugcc_custom_roasters');
        if (savedRoasters) setRoasters(JSON.parse(savedRoasters));
        else saveRoasters(DEFAULT_ROASTERS);

        const savedOrigins = localStorage.getItem('kugcc_custom_origins');
        if (savedOrigins) setOrigins(JSON.parse(savedOrigins));
        else saveOrigins(DEFAULT_ORIGINS);

        const savedProcesses = localStorage.getItem('kugcc_custom_processes');
        if (savedProcesses) setProcesses(JSON.parse(savedProcesses));
        else saveProcesses(DEFAULT_PROCESSES);

        const savedRoastLevels = localStorage.getItem('kugcc_custom_roast_levels');
        if (savedRoastLevels) setRoastLevels(JSON.parse(savedRoastLevels));
        else saveRoastLevels(DEFAULT_ROAST_LEVELS);

        const savedVarieties = localStorage.getItem('kugcc_custom_varieties');
        if (savedVarieties) setVarieties(JSON.parse(savedVarieties));
        else saveVarieties(DEFAULT_VARIETIES);

        const savedDrippers = localStorage.getItem('kugcc_custom_drippers');
        if (savedDrippers) setDrippers(JSON.parse(savedDrippers));
        else saveDrippers(DEFAULT_DRIPPERS);

        const savedAccessories = localStorage.getItem('kugcc_custom_accessories');
        if (savedAccessories) setAccessories(JSON.parse(savedAccessories));
        else saveAccessories(DEFAULT_ACCESSORIES);

        const savedApiKey = localStorage.getItem('kugcc_gemini_api_key');
        if (savedApiKey) setGeminiApiKey(savedApiKey);
        
        const savedRoasterDefaults = localStorage.getItem('kugcc_roaster_defaults');
        if (savedRoasterDefaults) setRoasterDefaults(JSON.parse(savedRoasterDefaults));

        const savedTheme = localStorage.getItem('kugcc_theme');
        if (savedTheme === 'light' || savedTheme === 'dark') setTheme(savedTheme);
    }, []);

    // Save helpers
    const saveRoasters = (list: string[]) => {
        setRoasters(list);
        localStorage.setItem('kugcc_custom_roasters', JSON.stringify(list));
    };

    const saveOrigins = (list: string[]) => {
        setOrigins(list);
        localStorage.setItem('kugcc_custom_origins', JSON.stringify(list));
    };

    const saveProcesses = (list: string[]) => {
        setProcesses(list);
        localStorage.setItem('kugcc_custom_processes', JSON.stringify(list));
    };

    const saveRoastLevels = (list: string[]) => {
        setRoastLevels(list);
        localStorage.setItem('kugcc_custom_roast_levels', JSON.stringify(list));
    };

    const saveVarieties = (list: string[]) => {
        setVarieties(list);
        localStorage.setItem('kugcc_custom_varieties', JSON.stringify(list));
    };

    const saveDrippers = (list: string[]) => {
        setDrippers(list);
        localStorage.setItem('kugcc_custom_drippers', JSON.stringify(list));
    };

    const saveAccessories = (list: string[]) => {
        setAccessories(list);
        localStorage.setItem('kugcc_custom_accessories', JSON.stringify(list));
    };

    const saveGeminiApiKey = (val: string) => {
        setGeminiApiKey(val);
        localStorage.setItem('kugcc_gemini_api_key', val);
    };

    const saveRoasterDefaults = (map: Record<string, number>) => {
        setRoasterDefaults(map);
        localStorage.setItem('kugcc_roaster_defaults', JSON.stringify(map));
    };

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('kugcc_theme', newTheme);
        if (newTheme === 'light') {
            document.documentElement.classList.add('light');
        } else {
            document.documentElement.classList.remove('light');
        }
    };

    const addRoasterDefault = () => {
        const roaster = newDefaultRoaster.trim();
        if (roaster && newDefaultDays !== '' && typeof newDefaultDays === 'number') {
            saveRoasterDefaults({ ...roasterDefaults, [roaster]: newDefaultDays });
            setNewDefaultRoaster('');
            setNewDefaultDays('');
        }
    };
    const removeRoasterDefault = (roaster: string) => {
        const updated = { ...roasterDefaults };
        delete updated[roaster];
        saveRoasterDefaults(updated);
    };

    // Add / Remove handlers
    const addRoaster = () => {
        const trimmed = newRoaster.trim();
        if (trimmed && !roasters.includes(trimmed)) {
            saveRoasters([...roasters, trimmed]);
            setNewRoaster('');
        }
    };
    const removeRoaster = (item: string) => saveRoasters(roasters.filter(r => r !== item));

    const addOrigin = () => {
        const trimmed = newOrigin.trim();
        if (trimmed && !origins.includes(trimmed)) {
            saveOrigins([...origins, trimmed]);
            setNewOrigin('');
        }
    };
    const removeOrigin = (item: string) => saveOrigins(origins.filter(o => o !== item));

    const addProcess = () => {
        const trimmed = newProcess.trim();
        if (trimmed && !processes.includes(trimmed)) {
            saveProcesses([...processes, trimmed]);
            setNewProcess('');
        }
    };
    const removeProcess = (item: string) => saveProcesses(processes.filter(p => p !== item));

    const addRoastLevel = () => {
        const trimmed = newRoastLevel.trim();
        if (trimmed && !roastLevels.includes(trimmed)) {
            saveRoastLevels([...roastLevels, trimmed]);
            setNewRoastLevel('');
        }
    };
    const removeRoastLevel = (item: string) => saveRoastLevels(roastLevels.filter(r => r !== item));

    const addVariety = () => {
        const trimmed = newVariety.trim();
        if (trimmed && !varieties.includes(trimmed)) {
            saveVarieties([...varieties, trimmed]);
            setNewVariety('');
        }
    };
    const removeVariety = (item: string) => saveVarieties(varieties.filter(v => v !== item));

    const addDripper = () => {
        const trimmed = newDripper.trim();
        if (trimmed && !drippers.includes(trimmed)) {
            saveDrippers([...drippers, trimmed]);
            setNewDripper('');
        }
    };
    const removeDripper = (item: string) => saveDrippers(drippers.filter(d => d !== item));

    const addAccessory = () => {
        const trimmed = newAccessory.trim();
        if (trimmed && !accessories.includes(trimmed)) {
            saveAccessories([...accessories, trimmed]);
            setNewAccessory('');
        }
    };
    const removeAccessory = (item: string) => saveAccessories(accessories.filter(a => a !== item));

    // Data Management
    const handleExportData = () => {
        const beansStr = localStorage.getItem('kugcc_beans');
        let beans = beansStr ? JSON.parse(beansStr) : [];
        
        // Exclude default sample beans from export
        beans = beans.filter((b: any) => !['1', '2', '3'].includes(b.id));

        const logsStr = localStorage.getItem('kugcc_logs');
        let logs = logsStr ? JSON.parse(logsStr) : [];

        // Also exclude any logs that belong to the sample beans
        logs = logs.filter((l: any) => !['1', '2', '3'].includes(l.beanId));

        const recipesStr = localStorage.getItem('kugcc_recipes');
        const globalRecipes = recipesStr ? JSON.parse(recipesStr) : [];
        
        const payload = { beans, logs, globalRecipes };
        const dataStr = JSON.stringify(payload, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `kugcc_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const rawData = JSON.parse(event.target?.result as string);
                let importedBeans: any[] = [];
                let importedLogs: any[] = [];
                let importedRecipes: any[] = [];

                if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
                    importedBeans = Array.isArray(rawData.beans) ? rawData.beans : [];
                    importedLogs = Array.isArray(rawData.logs) ? rawData.logs : [];
                    importedRecipes = Array.isArray(rawData.globalRecipes) ? rawData.globalRecipes : [];
                } else if (Array.isArray(rawData)) {
                    importedBeans = rawData;
                } else {
                    alert("Invalid backup file format.");
                    return;
                }

                const beansStr = localStorage.getItem('kugcc_beans');
                const currentBeans: any[] = beansStr ? JSON.parse(beansStr) : [];
                const currentIds = new Set(currentBeans.map(b => b.id));
                const newBeans = importedBeans.filter((b: any) => !currentIds.has(b.id));

                const savedLogs = localStorage.getItem('kugcc_logs');
                const currentLogs: any[] = savedLogs ? JSON.parse(savedLogs) : [];
                const currentLogIds = new Set(currentLogs.map(l => l.id));
                const newLogs = importedLogs.filter((l: any) => !currentLogIds.has(l.id));

                const savedRecipes = localStorage.getItem('kugcc_recipes');
                const currentRecipes: any[] = savedRecipes ? JSON.parse(savedRecipes) : [];
                const currentRecipeIds = new Set(currentRecipes.map(r => r.id));
                const newRecipes = importedRecipes.filter((r: any) => !currentRecipeIds.has(r.id));

                if (newBeans.length > 0 || newLogs.length > 0 || newRecipes.length > 0) {
                    localStorage.setItem('kugcc_beans', JSON.stringify([...currentBeans, ...newBeans]));
                    localStorage.setItem('kugcc_logs', JSON.stringify([...currentLogs, ...newLogs]));
                    localStorage.setItem('kugcc_recipes', JSON.stringify([...currentRecipes, ...newRecipes]));
                    alert(`Successfully imported data:\n- Beans: ${newBeans.length} added\n- Tasting Logs: ${newLogs.length} added\n- Global Recipes: ${newRecipes.length} added`);
                    window.location.reload();
                } else {
                    alert("No new data found. All imported items already exist.");
                }
            } catch (error) {
                console.error("Import failed:", error);
                alert("Failed to parse backup file.");
            }
            e.target.value = '';
        };
        reader.readAsText(file);
    };

    const handleResetAndLoadDemo = () => {
        if (!confirm("⚠️ WARNING: This will completely delete all your beans and tasting logs, and restore default demo data.\n\nAre you sure you want to proceed?")) {
            return;
        }

        const demoBeans = [
            { id: '1', name: 'Ethiopia Yirgacheffe', roaster: 'Kurasu', origin: 'Ethiopia', roastLevel: 'Light', process: 'Washed', roastDate: new Date().toISOString(), recipeOverride: { beanWeight: 15, ratio: 16, temperature: 93, grindSize: '22', grinderModel: 'S3', dripper: 'Hario V60', steps: [{ id: '1', name: 'Bloom', waterPercentage: 20, duration: 45 }, { id: '2', name: 'First Pour', waterPercentage: 40, duration: 45 }, { id: '3', name: 'Second Pour', waterPercentage: 40, duration: 45 }] } },
            { id: '2', name: 'Colombia Huila', roaster: 'Onibus', origin: 'Colombia', roastLevel: 'Medium', process: 'Honey', roastDate: new Date().toISOString(), recipeOverride: { beanWeight: 15, ratio: 16, temperature: 93, grindSize: '22', grinderModel: 'S3', dripper: 'Hario V60', steps: [{ id: '1', name: 'Bloom', waterPercentage: 20, duration: 45 }, { id: '2', name: 'First Pour', waterPercentage: 40, duration: 45 }, { id: '3', name: 'Second Pour', waterPercentage: 40, duration: 45 }] } },
            { id: '3', name: 'Kenya AA', roaster: 'Glitch', origin: 'Kenya', roastLevel: 'Light', process: 'Washed', roastDate: new Date().toISOString(), recipeOverride: { beanWeight: 15, ratio: 16, temperature: 93, grindSize: '22', grinderModel: 'S3', dripper: 'Hario V60', steps: [{ id: '1', name: 'Bloom', waterPercentage: 20, duration: 45 }, { id: '2', name: 'First Pour', waterPercentage: 40, duration: 45 }, { id: '3', name: 'Second Pour', waterPercentage: 40, duration: 45 }] } },
        ];

        const demoLogs = [
            { id: 'log_1', beanId: '1', rating: 4, notes: 'Very floral and bright citrus acidity. Clean cup with jasmine notes.', date: new Date(Date.now() - 86400000 * 2).toISOString() },
            { id: 'log_2', beanId: '2', rating: 5, notes: 'Super sweet caramel body. Peach notes on the finish. Perfect morning brew.', date: new Date(Date.now() - 86400000).toISOString() }
        ];

        localStorage.setItem('kugcc_beans', JSON.stringify(demoBeans));
        localStorage.setItem('kugcc_logs', JSON.stringify(demoLogs));
        localStorage.setItem('kugcc_custom_roasters', JSON.stringify(DEFAULT_ROASTERS));
        localStorage.setItem('kugcc_custom_origins', JSON.stringify(DEFAULT_ORIGINS));
        localStorage.setItem('kugcc_custom_processes', JSON.stringify(DEFAULT_PROCESSES));
        localStorage.setItem('kugcc_custom_roast_levels', JSON.stringify(DEFAULT_ROAST_LEVELS));
        localStorage.setItem('kugcc_custom_varieties', JSON.stringify(DEFAULT_VARIETIES));
        localStorage.setItem('kugcc_custom_drippers', JSON.stringify(DEFAULT_DRIPPERS));
        localStorage.setItem('kugcc_custom_accessories', JSON.stringify(DEFAULT_ACCESSORIES));
        
        alert("System database reset successfully. Demo seed data has been loaded.");
        window.location.reload();
    };

    return (
        <div className="flex flex-col h-full w-full p-6 md:p-8 font-mono overflow-y-auto pb-24">
            <h2 className="text-white uppercase tracking-[0.3em] mb-6 md:mb-8 border-b border-gray-800 pb-4 text-sm md:text-base text-center">
                System Config
            </h2>

            {/* Language Selection */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs text-gray-400 uppercase tracking-widest">{t('Language')}</h3>
                </div>
                <div className="flex bg-gray-900/50 p-1 rounded-sm border border-gray-800 w-full max-w-xs">
                    <button
                        onClick={() => setLanguage('en')}
                        className={`flex-1 py-2 text-[10px] uppercase tracking-widest transition-all ${language === 'en' ? 'bg-white text-black shadow-sm border border-gray-300' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        English
                    </button>
                    <button
                        onClick={() => setLanguage('ja')}
                        className={`flex-1 py-2 text-[10px] uppercase tracking-widest transition-all ${language === 'ja' ? 'bg-white text-black shadow-sm border border-gray-300' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        日本語
                    </button>
                </div>
            </div>

            {/* Theme & Appearance */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs text-gray-400 uppercase tracking-widest">{t('Appearance')}</h3>
                </div>
                <div className="flex bg-gray-900/50 p-1 rounded-sm border border-gray-800 w-full max-w-xs">
                    <button
                        onClick={() => theme !== 'dark' && toggleTheme()}
                        className={`flex-1 py-2 text-[10px] uppercase tracking-widest transition-all ${theme === 'dark' ? 'bg-black text-white shadow-sm border border-gray-700' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        🌙 Dark
                    </button>
                    <button
                        onClick={() => theme !== 'light' && toggleTheme()}
                        className={`flex-1 py-2 text-[10px] uppercase tracking-widest transition-all ${theme === 'light' ? 'bg-white text-black shadow-sm border border-gray-300' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        ☀️ Light
                    </button>
                </div>
            </div>

            {/* API Integrations */}
            <div className="mb-8 pb-6 border-b border-gray-900 border-dashed">
                <h3 className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span>API Integrations</span>
                    <Tooltip content="Gemini APIキーを設定すると、写真からAIが自動で情報を抽出する機能が使えるようになります！" position="right">
                        <span className="text-gray-400 cursor-help">[?]</span>
                    </Tooltip>
                    <span className="bg-blue-900/50 text-blue-400 text-[8px] px-1.5 py-0.5 rounded">NEW</span>
                </h3>
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] text-gray-400 leading-relaxed">
                        <strong>Google Gemini API Key</strong><br/>
                        Used for "Auto-fill from Photo" feature. Get a free key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-white underline hover:text-blue-300">Google AI Studio</a>.
                    </label>
                    <div className="flex gap-2">
                        <input 
                            type="password" 
                            placeholder="AIzaSy..." 
                            value={geminiApiKey}
                            onChange={(e) => saveGeminiApiKey(e.target.value)}
                            className="flex-1 bg-gray-900/50 border-none text-[10px] p-2 text-white placeholder-gray-700 focus:ring-1 focus:ring-gray-700 rounded-sm font-sans"
                        />
                    </div>
                </div>
            </div>

            {/* Roasters Manager */}
            <div className="mb-6">
                <h3 className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Custom Roasters (店舗リスト)</h3>
                <div className="flex flex-wrap gap-1.5 mb-2.5 max-h-[100px] overflow-y-auto border border-gray-900 p-2 bg-gray-950/20">
                    {roasters.map(item => (
                        <span key={item} className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] bg-gray-900 border border-gray-800 text-gray-300 rounded">
                            {item}
                            <button onClick={() => removeRoaster(item)} className="text-gray-600 hover:text-red-500 font-bold">×</button>
                        </span>
                    ))}
                    {roasters.length === 0 && <span className="text-[10px] text-gray-700 italic">No roasters configured.</span>}
                </div>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Add Roaster..." 
                        value={newRoaster}
                        onChange={(e) => setNewRoaster(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addRoaster()}
                        className="flex-1 bg-gray-900/50 border-none text-[10px] p-2 text-white placeholder-gray-700 focus:ring-1 focus:ring-gray-700 rounded-sm font-sans"
                    />
                    <button onClick={addRoaster} className="px-3 py-1.5 border border-gray-800 hover:border-white text-[10px] text-gray-400 hover:text-white uppercase transition-colors shrink-0">Add</button>
                </div>
            </div>

            {/* Roaster Defaults Manager */}
            <div className="mb-6">
                <h3 className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span>Roaster Aging Defaults (焙煎日の自動補完)</span>
                    <Tooltip content="設定しておくと、写真から焙煎日が読み取れなかった時に自動で適用されます。" position="right">
                        <span className="text-gray-400 cursor-help">[?]</span>
                    </Tooltip>
                    <span className="bg-blue-900/50 text-blue-400 text-[8px] px-1.5 py-0.5 rounded">NEW</span>
                </h3>
                <p className="text-[9px] text-gray-500 mb-2 leading-relaxed">
                    AIが写真から焙煎日を読み取れなかった場合に備えて、店舗ごとに「購入時点で大体何日前に焙煎されているか」のデフォルト日数を設定できます。（例：「Glitch」で「7」と設定すると、自動的に7日前の日付が入力されます）。未設定の店舗の場合は空欄になります。
                </p>
                <div className="flex flex-col gap-1.5 mb-2.5 max-h-[100px] overflow-y-auto border border-gray-900 p-2 bg-gray-950/20">
                    {Object.entries(roasterDefaults).map(([r, days]) => (
                        <div key={r} className="flex justify-between items-center text-[10px] bg-gray-900 border border-gray-800 text-gray-300 rounded px-2 py-1">
                            <span>{r}</span>
                            <div className="flex items-center gap-3">
                                <span className="text-gray-400">{days} 日前</span>
                                <button onClick={() => removeRoasterDefault(r)} className="text-gray-600 hover:text-red-500 font-bold text-xs">×</button>
                            </div>
                        </div>
                    ))}
                    {Object.keys(roasterDefaults).length === 0 && <span className="text-[10px] text-gray-700 italic">未設定</span>}
                </div>
                <div className="flex gap-2">
                    <select 
                        value={newDefaultRoaster}
                        onChange={(e) => setNewDefaultRoaster(e.target.value)}
                        className="flex-[2] bg-gray-900/50 border-none text-[10px] p-2 text-white focus:ring-1 focus:ring-gray-700 rounded-sm font-sans"
                    >
                        <option value="">店舗を選択...</option>
                        {roasters.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <input 
                        type="number" 
                        min="0"
                        placeholder="何日前..." 
                        value={newDefaultDays}
                        onChange={(e) => setNewDefaultDays(e.target.value === '' ? '' : parseInt(e.target.value))}
                        onKeyDown={(e) => e.key === 'Enter' && addRoasterDefault()}
                        className="flex-1 bg-gray-900/50 border-none text-[10px] p-2 text-white placeholder-gray-700 focus:ring-1 focus:ring-gray-700 rounded-sm font-sans"
                    />
                    <button onClick={addRoasterDefault} className="px-3 py-1.5 border border-gray-800 hover:border-white text-[10px] text-gray-400 hover:text-white uppercase transition-colors shrink-0">追加</button>
                </div>
            </div>

            {/* Origins Manager */}
            <div className="mb-6">
                <h3 className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Custom Origins (生産国)</h3>
                <div className="flex flex-wrap gap-1.5 mb-2.5 max-h-[100px] overflow-y-auto border border-gray-900 p-2 bg-gray-950/20">
                    {origins.map(item => (
                        <span key={item} className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] bg-gray-900 border border-gray-800 text-gray-300 rounded">
                            {item}
                            <button onClick={() => removeOrigin(item)} className="text-gray-600 hover:text-red-500 font-bold">×</button>
                        </span>
                    ))}
                    {origins.length === 0 && <span className="text-[10px] text-gray-700 italic">No origins configured.</span>}
                </div>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Add Origin..." 
                        value={newOrigin}
                        onChange={(e) => setNewOrigin(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addOrigin()}
                        className="flex-1 bg-gray-900/50 border-none text-[10px] p-2 text-white placeholder-gray-700 focus:ring-1 focus:ring-gray-700 rounded-sm font-sans"
                    />
                    <button onClick={addOrigin} className="px-3 py-1.5 border border-gray-800 hover:border-white text-[10px] text-gray-400 hover:text-white uppercase transition-colors shrink-0">Add</button>
                </div>
            </div>

            {/* Processes Manager */}
            <div className="mb-6">
                <h3 className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Custom Processes (精製方法)</h3>
                <div className="flex flex-wrap gap-1.5 mb-2.5 max-h-[100px] overflow-y-auto border border-gray-900 p-2 bg-gray-950/20">
                    {processes.map(item => (
                        <span key={item} className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] bg-gray-900 border border-gray-800 text-gray-300 rounded">
                            {item}
                            <button onClick={() => removeProcess(item)} className="text-gray-600 hover:text-red-500 font-bold">×</button>
                        </span>
                    ))}
                    {processes.length === 0 && <span className="text-[10px] text-gray-700 italic">No processes configured.</span>}
                </div>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Add Process..." 
                        value={newProcess}
                        onChange={(e) => setNewProcess(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addProcess()}
                        className="flex-1 bg-gray-900/50 border-none text-[10px] p-2 text-white placeholder-gray-700 focus:ring-1 focus:ring-gray-700 rounded-sm font-sans"
                    />
                    <button onClick={addProcess} className="px-3 py-1.5 border border-gray-800 hover:border-white text-[10px] text-gray-400 hover:text-white uppercase transition-colors shrink-0">Add</button>
                </div>
            </div>

            {/* Roast Levels Manager */}
            <div className="mb-6">
                <h3 className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Custom Roast Levels (焙煎度)</h3>
                <div className="flex flex-wrap gap-1.5 mb-2.5 max-h-[100px] overflow-y-auto border border-gray-900 p-2 bg-gray-950/20">
                    {roastLevels.map(item => (
                        <span key={item} className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] bg-gray-900 border border-gray-800 text-gray-300 rounded">
                            {item}
                            <button onClick={() => removeRoastLevel(item)} className="text-gray-600 hover:text-red-500 font-bold">×</button>
                        </span>
                    ))}
                    {roastLevels.length === 0 && <span className="text-[10px] text-gray-700 italic">No roast levels configured.</span>}
                </div>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Add Roast Level..." 
                        value={newRoastLevel}
                        onChange={(e) => setNewRoastLevel(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addRoastLevel()}
                        className="flex-1 bg-gray-900/50 border-none text-[10px] p-2 text-white placeholder-gray-700 focus:ring-1 focus:ring-gray-700 rounded-sm font-sans"
                    />
                    <button onClick={addRoastLevel} className="px-3 py-1.5 border border-gray-800 hover:border-white text-[10px] text-gray-400 hover:text-white uppercase transition-colors shrink-0">Add</button>
                </div>
            </div>

            {/* Varieties Manager */}
            <div className="mb-6">
                <h3 className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Custom Varieties (品種)</h3>
                <div className="flex flex-wrap gap-1.5 mb-2.5 max-h-[100px] overflow-y-auto border border-gray-900 p-2 bg-gray-950/20">
                    {varieties.map(item => (
                        <span key={item} className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] bg-gray-900 border border-gray-800 text-gray-300 rounded">
                            {item}
                            <button onClick={() => removeVariety(item)} className="text-gray-600 hover:text-red-500 font-bold">×</button>
                        </span>
                    ))}
                    {varieties.length === 0 && <span className="text-[10px] text-gray-700 italic">No varieties configured.</span>}
                </div>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Add Variety..." 
                        value={newVariety}
                        onChange={(e) => setNewVariety(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addVariety()}
                        className="flex-1 bg-gray-900/50 border-none text-[10px] p-2 text-white placeholder-gray-700 focus:ring-1 focus:ring-gray-700 rounded-sm font-sans"
                    />
                    <button onClick={addVariety} className="px-3 py-1.5 border border-gray-800 hover:border-white text-[10px] text-gray-400 hover:text-white uppercase transition-colors shrink-0">Add</button>
                </div>
            </div>

            {/* Drippers Manager */}
            <div className="mb-6">
                <h3 className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Custom Drippers (器具/ドリッパー)</h3>
                <div className="flex flex-wrap gap-1.5 mb-2.5 max-h-[100px] overflow-y-auto border border-gray-900 p-2 bg-gray-950/20">
                    {drippers.map(item => (
                        <span key={item} className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] bg-gray-900 border border-gray-800 text-gray-300 rounded">
                            {item}
                            <button onClick={() => removeDripper(item)} className="text-gray-600 hover:text-red-500 font-bold">×</button>
                        </span>
                    ))}
                    {drippers.length === 0 && <span className="text-[10px] text-gray-700 italic">No drippers configured.</span>}
                </div>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Add Dripper..." 
                        value={newDripper}
                        onChange={(e) => setNewDripper(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addDripper()}
                        className="flex-1 bg-gray-900/50 border-none text-[10px] p-2 text-white placeholder-gray-700 focus:ring-1 focus:ring-gray-700 rounded-sm font-sans"
                    />
                    <button onClick={addDripper} className="px-3 py-1.5 border border-gray-800 hover:border-white text-[10px] text-gray-400 hover:text-white uppercase transition-colors shrink-0">Add</button>
                </div>
            </div>

            {/* Accessories Manager */}
            <div className="mb-8">
                <h3 className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Custom Accessories (追加器具)</h3>
                <div className="flex flex-wrap gap-1.5 mb-2.5 max-h-[100px] overflow-y-auto border border-gray-900 p-2 bg-gray-950/20">
                    {accessories.map(item => (
                        <span key={item} className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] bg-gray-900 border border-gray-800 text-gray-300 rounded">
                            {item}
                            <button onClick={() => removeAccessory(item)} className="text-gray-600 hover:text-red-500 font-bold">×</button>
                        </span>
                    ))}
                    {accessories.length === 0 && <span className="text-[10px] text-gray-700 italic">No accessories configured.</span>}
                </div>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Add Accessory..." 
                        value={newAccessory}
                        onChange={(e) => setNewAccessory(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addAccessory()}
                        className="flex-1 bg-gray-900/50 border-none text-[10px] p-2 text-white placeholder-gray-700 focus:ring-1 focus:ring-gray-700 rounded-sm font-sans"
                    />
                    <button onClick={addAccessory} className="px-3 py-1.5 border border-gray-800 hover:border-white text-[10px] text-gray-400 hover:text-white uppercase transition-colors shrink-0">Add</button>
                </div>
            </div>

            {/* Data Management Section */}
            <div className="mt-auto pt-6 border-t border-gray-900 space-y-3">
                <h3 className="text-[10px] text-gray-600 uppercase tracking-widest">Backup & System</h3>
                <div className="flex gap-2">
                    <button
                        onClick={handleExportData}
                        className="flex-1 py-2.5 text-[9px] text-gray-500 hover:text-white border border-gray-800 hover:border-gray-500 transition-colors uppercase tracking-wider text-center"
                    >
                        Export Backup
                    </button>
                    <label className="flex-1 py-2.5 text-[9px] text-gray-500 hover:text-white border border-gray-800 hover:border-gray-500 transition-colors uppercase tracking-wider text-center cursor-pointer">
                        Import Data
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleImportData}
                            className="hidden"
                        />
                    </label>
                </div>
                <button
                    onClick={handleResetAndLoadDemo}
                    className="w-full py-2.5 text-[9px] text-red-900/60 hover:text-red-500 border border-gray-900/50 hover:border-red-900 transition-colors uppercase tracking-wider"
                >
                    Reset & Load Demo
                </button>
            </div>
        </div>
    );
}
