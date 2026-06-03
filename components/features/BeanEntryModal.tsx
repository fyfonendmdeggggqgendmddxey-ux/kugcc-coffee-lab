"use client";

import { useState } from 'react';
import { Bean, DEFAULT_RECIPE } from '@/utils/types';

interface BeanEntryModalProps {
    onSave: (bean: Bean) => void;
    onCancel: () => void;
    initialBean?: Bean;
    roasters?: string[];
    origins?: string[];
    processes?: string[];
    roastLevels?: string[];
    varieties?: string[];
}

export default function BeanEntryModal({
    onSave,
    onCancel,
    initialBean,
    roasters = [],
    origins = [],
    processes = [],
    roastLevels = [],
    varieties = []
}: BeanEntryModalProps) {
    const [formData, setFormData] = useState({
        name: initialBean?.name || '',
        roaster: initialBean?.roaster || '',
        origin: initialBean?.origin || '',
        variety: initialBean?.variety || '',
        roastLevel: initialBean?.roastLevel || 'Light',
        process: initialBean?.process || 'Washed',
        roastDate: (initialBean && initialBean.roastDate) ? initialBean.roastDate.split('T')[0] : new Date().toISOString().split('T')[0],
        idealAgingDays: initialBean?.idealAgingDays?.toString() || '',
        shopRecommendedDays: initialBean?.shopRecommendedDays?.toString() || '',
        storageLocation: initialBean?.storageLocation || ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = () => {
        if (!formData.name || !formData.roaster) {
            alert("Name and Roaster are required.");
            return;
        }

        const newBean: Bean = {
            id: initialBean?.id || Date.now().toString(),
            name: formData.name,
            roaster: formData.roaster,
            origin: formData.origin,
            variety: formData.variety,
            roastLevel: formData.roastLevel,
            process: formData.process,
            roastDate: new Date(formData.roastDate).toISOString(),
            recipeOverride: initialBean?.recipeOverride || DEFAULT_RECIPE,
            idealAgingDays: formData.idealAgingDays ? parseInt(formData.idealAgingDays, 10) : undefined,
            shopRecommendedDays: formData.shopRecommendedDays ? parseInt(formData.shopRecommendedDays, 10) : undefined,
            storageLocation: formData.storageLocation || undefined
        };
        onSave(newBean);
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-black border border-gray-800 w-full max-w-md p-8 relative">
                <h2 className="text-sm font-bold tracking-[0.2em] uppercase mb-8 text-white border-b border-gray-900 pb-4">
                    {initialBean ? 'Edit Bean Entry' : 'New Bean Entry'}
                </h2>

                <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase text-gray-500 tracking-widest">Name</label>
                        <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. Ethiopia Yirgacheffe"
                            className="bg-transparent border-b border-gray-800 text-white p-2 focus:border-white focus:outline-none transition-colors"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] uppercase text-gray-500 tracking-widest">Roaster</label>
                            <input
                                list="roasters-list"
                                name="roaster"
                                value={formData.roaster}
                                onChange={handleChange}
                                placeholder="e.g. Kurasu"
                                className="bg-transparent border-b border-gray-800 text-white p-2 focus:border-white focus:outline-none transition-colors"
                            />
                            <datalist id="roasters-list">
                                {roasters.map(r => <option key={r} value={r} />)}
                            </datalist>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] uppercase text-gray-500 tracking-widest">Origin</label>
                            <input
                                list="origins-list"
                                name="origin"
                                value={formData.origin}
                                onChange={handleChange}
                                placeholder="e.g. Ethiopia"
                                className="bg-transparent border-b border-gray-800 text-white p-2 focus:border-white focus:outline-none transition-colors"
                            />
                            <datalist id="origins-list">
                                {origins.map(o => <option key={o} value={o} />)}
                            </datalist>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] uppercase text-gray-500 tracking-widest">Roast Level</label>
                            <input
                                list="roast-levels"
                                name="roastLevel"
                                value={formData.roastLevel}
                                onChange={handleChange}
                                placeholder="Select or type..."
                                className="bg-transparent border-b border-gray-800 text-white p-2 focus:border-white focus:outline-none transition-colors"
                            />
                            <datalist id="roast-levels">
                                {roastLevels.map(rl => <option key={rl} value={rl} />)}
                            </datalist>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] uppercase text-gray-500 tracking-widest">Process</label>
                            <input
                                list="process-types"
                                name="process"
                                value={formData.process}
                                onChange={handleChange}
                                placeholder="Select or type..."
                                className="bg-transparent border-b border-gray-800 text-white p-2 focus:border-white focus:outline-none transition-colors"
                            />
                            <datalist id="process-types">
                                {processes.map(p => <option key={p} value={p} />)}
                            </datalist>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase text-gray-500 tracking-widest">Roast Date</label>
                        <input
                            type="date"
                            name="roastDate"
                            value={formData.roastDate}
                            onChange={handleChange}
                            className="bg-transparent border-b border-gray-800 text-white p-2 focus:border-white focus:outline-none block w-full"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase text-gray-500 tracking-widest">Variety (Optional)</label>
                        <input
                            list="varieties-list"
                            name="variety"
                            value={formData.variety}
                            onChange={handleChange}
                            placeholder="e.g. Geisha, Bourbon"
                            className="bg-transparent border-b border-gray-800 text-white p-2 focus:border-white focus:outline-none transition-colors"
                        />
                        <datalist id="varieties-list">
                            {varieties.map(v => <option key={v} value={v} />)}
                        </datalist>
                    </div>

                    <div className="pt-4 border-t border-gray-900 mt-2">
                        <h3 className="text-[10px] text-gray-500 uppercase tracking-widest mb-4">Aging Records (Optional)</h3>
                        <div className="grid grid-cols-2 gap-6 mb-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] uppercase text-gray-500 tracking-widest" title="Theoretical ideal days until peak">Ideal Peak (Days)</label>
                                <input
                                    type="number"
                                    min="0"
                                    name="idealAgingDays"
                                    value={formData.idealAgingDays}
                                    onChange={handleChange}
                                    placeholder="e.g. 14"
                                    className="bg-transparent border-b border-gray-800 text-white p-2 focus:border-white focus:outline-none transition-colors"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] uppercase text-gray-500 tracking-widest" title="Shop recommended days until peak">Shop Rec (Days)</label>
                                <input
                                    type="number"
                                    min="0"
                                    name="shopRecommendedDays"
                                    value={formData.shopRecommendedDays}
                                    onChange={handleChange}
                                    placeholder="e.g. 7"
                                    className="bg-transparent border-b border-gray-800 text-white p-2 focus:border-white focus:outline-none transition-colors"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] uppercase text-gray-500 tracking-widest">Storage Location</label>
                            <input
                                type="text"
                                name="storageLocation"
                                value={formData.storageLocation}
                                onChange={handleChange}
                                placeholder="e.g. Freezer, Wine Cellar, Room Temp"
                                className="bg-transparent border-b border-gray-800 text-white p-2 focus:border-white focus:outline-none transition-colors"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 mt-10">
                    <button
                        onClick={onCancel}
                        className="text-xs uppercase tracking-widest text-gray-500 hover:text-white px-4 py-2"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="text-xs uppercase tracking-widest bg-white text-black px-6 py-2 hover:bg-gray-200 transition-colors"
                    >
                        Save Entry
                    </button>
                </div>
            </div>
        </div >
    );
}
