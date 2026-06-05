"use client";
import React, { useState } from 'react';
import { useLanguage } from '@/utils/LanguageContext';

interface DashboardLayoutProps {
    left: React.ReactNode;
    center: React.ReactNode;
    right: React.ReactNode;
    activeTab: 'library' | 'timer' | 'recipes';
    onTabChange: (tab: 'library' | 'timer' | 'recipes') => void;
}

export default function DashboardLayout({ left, center, right, activeTab, onTabChange }: DashboardLayoutProps) {
    const { t } = useLanguage();

    return (
        <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-black text-white">
            {/* --- DESKTOP LAYOUT (md and up) --- */}
            
            {/* Left Column: Bean Library / Settings */}
            <aside className="hidden md:flex w-[280px] border-r border-[#333] flex-col">
                {left}
            </aside>

            {/* Center Column: Main Timer & Action */}
            <main className="hidden md:flex flex-1 flex-col items-center justify-center relative">
                {center}
            </main>

            {/* Right Column: AI Insights / Log */}
            <aside className="hidden md:flex w-[280px] border-l border-[#333] flex-col bg-black">
                {right}
            </aside>

            {/* --- MOBILE LAYOUT (below md) --- */}
            
            {/* Main Content Area */}
            <div className="flex-1 md:hidden overflow-y-auto pb-[80px] relative">
                {activeTab === 'library' && left}
                {activeTab === 'timer' && center}
                {activeTab === 'recipes' && right}
            </div>

            {/* Bottom Navigation Bar (Mobile Only) */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[70px] bg-[#0a0a0a] border-t border-[#333] flex items-center justify-around z-50 px-2 safe-area-pb">
                <button 
                    onClick={() => onTabChange('library')}
                    className={`flex flex-col items-center justify-center w-full h-full transition-colors ${activeTab === 'library' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <svg className="w-5 h-5 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span className="text-[10px] uppercase tracking-wider font-medium">{t('Library')}</span>
                </button>
                <button 
                    onClick={() => onTabChange('timer')}
                    className={`flex flex-col items-center justify-center w-full h-full transition-colors ${activeTab === 'timer' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <svg className="w-5 h-5 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-[10px] uppercase tracking-wider font-medium">{t('Timer')}</span>
                </button>
                <button 
                    onClick={() => onTabChange('recipes')}
                    className={`flex flex-col items-center justify-center w-full h-full transition-colors ${activeTab === 'recipes' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <svg className="w-5 h-5 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-[10px] uppercase tracking-wider font-medium">{t('Recipes')}</span>
                </button>
            </nav>
        </div>
    );
}
