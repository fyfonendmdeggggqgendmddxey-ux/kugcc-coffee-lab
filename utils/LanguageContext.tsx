"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'ja';

interface LanguageContextProps {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
    // Dashboard
    "Library": { en: "Library", ja: "ライブラリ" },
    "Timer": { en: "Timer", ja: "抽出タイマー" },
    "Recipes": { en: "Recipes", ja: "レシピ管理" },
    "Settings": { en: "Settings", ja: "各種設定" },
    
    // Right Panel Tabs
    "Tasting Log": { en: "Tasting Log", ja: "テイスティングログ" },
    "Guide": { en: "Guide", ja: "ガイド" },
    
    // Bean Form
    "Bean Name": { en: "Bean Name", ja: "豆の名前" },
    "Roaster": { en: "Roaster", ja: "ロースター(店舗)" },
    "Origin": { en: "Origin", ja: "生産国" },
    "Roast Level": { en: "Roast Level", ja: "焙煎度" },
    "Process": { en: "Process", ja: "精製方法" },
    "Variety": { en: "Variety", ja: "品種" },
    "Roast Date": { en: "Roast Date", ja: "焙煎日" },
    "Save": { en: "Save", ja: "保存" },
    "Cancel": { en: "Cancel", ja: "キャンセル" },
    
    // Timer
    "Ready": { en: "Ready", ja: "準備完了" },
    "Brewing": { en: "Brewing", ja: "抽出中" },
    "Enjoy": { en: "Enjoy", ja: "完成" },
    "Start": { en: "Start", ja: "スタート" },
    "Reset": { en: "Reset", ja: "リセット" },
    "EDIT RECIPE": { en: "EDIT RECIPE", ja: "レシピを編集" },
    
    // Recipe Editor
    "Recipe Settings": { en: "Recipe Settings", ja: "抽出設定" },
    "Bean Weight (g)": { en: "Bean Weight (g)", ja: "粉量 (g)" },
    "Water Ratio (1:X)": { en: "Water Ratio (1:X)", ja: "湯比率 (1:X)" },
    "Total Water": { en: "Total Water", ja: "総注湯量" },
    "Temperature (°C)": { en: "Temperature (°C)", ja: "湯温 (°C)" },
    "Grind Size": { en: "Grind Size", ja: "挽き目" },
    "Grinder Model": { en: "Grinder Model", ja: "グラインダー" },
    "Dripper / Tool": { en: "Dripper / Tool", ja: "ドリッパー・器具" },
    "Save as New": { en: "Save as New", ja: "新しく保存" },
    
    // Tasting Log
    "Record New Tasting Log": { en: "Record New Tasting Log", ja: "新しいログを記録" },
    "Rating": { en: "Rating", ja: "評価 (★)" },
    "Tasting Notes": { en: "Tasting Notes", ja: "テイスティングノート" },
    
    // Settings
    "Appearance": { en: "Appearance", ja: "外観" },
    "Language": { en: "Language", ja: "言語設定" },
    "Backup & System": { en: "Backup & System", ja: "バックアップとシステム" },
    "Export Backup": { en: "Export Backup", ja: "バックアップを出力" },
    "Import Data": { en: "Import Data", ja: "データを復元" },
    "Reset & Load Demo": { en: "Reset & Load Demo", ja: "データをリセットしてデモを読み込む" },
};

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguageState] = useState<Language>('en');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const savedLang = localStorage.getItem('kugcc_language') as Language;
        if (savedLang === 'en' || savedLang === 'ja') {
            setLanguageState(savedLang);
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('kugcc_language', lang);
    };

    const t = (key: string): string => {
        if (!isMounted) return key; // return key during SSR to avoid hydration mismatch
        return translations[key]?.[language] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
