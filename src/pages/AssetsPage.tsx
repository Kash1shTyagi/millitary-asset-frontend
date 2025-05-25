import React, { useEffect, useState } from 'react';
import api from '../services/api';

interface Base {
    id: number;
    name: string;
    location: string;
}

interface Asset {
    id: number;
    type: string;
    name: string;
    current_quantity: number;
    baseId: number;
    Base?: Base;
}

interface User {
    role: string;
    baseId?: string; // string because you're converting it in Dashboard
}

type UpdateOperation = 'add' | 'remove';

export default function AssetsPage({ currentUser }: { currentUser: User }) {

    const [assets, setAssets] = useState<Asset[]>([]);
    const [bases, setBases] = useState<Base[]>([]);
    const [formData, setFormData] = useState({
        type: '',
        name: '',
        quantity: 0,
        baseId: '', // string to match <select> value
    });
    const [updateData, setUpdateData] = useState({
        assetId: '',
        quantity: 0,
        operation: 'add' as UpdateOperation,
    });
    const [error, setError] = useState('');

    useEffect(() => {
        // Fetch assets and bases on mount
        const fetchData = async () => {
            try {
                const assetsRes = await api.get('/asset');
                const assetsData: Asset[] = assetsRes.data.data || [];
                setAssets(assetsData);

                // Optionally fetch bases if user is admin and can select base
                // Assuming you have an endpoint to get bases
                const basesRes = await api.get('/base');
                const basesData: Base[] = basesRes.data.data || [];
                setBases(basesData);
            } catch (err) {
                setError('Failed to load assets or bases');
                console.error(err);
            }
        };
        fetchData();
    }, []);

    const handleCreate = async () => {
        setError('');
        if (!formData.type || !formData.name || !formData.baseId || formData.quantity <= 0) {
            setError('Please fill all fields with valid data');
            return;
        }
        try {
            await api.post('/asset', {
                type: formData.type,
                name: formData.name,
                quantity: formData.quantity,
                baseId: Number(formData.baseId),
            });
            setFormData({ type: '', name: '', quantity: 0, baseId: '' });

            // Reload assets
            const res = await api.get('/asset');
            setAssets(res.data.data || []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create asset');
        }
    };

    const handleUpdate = async () => {
        setError('');
        if (!updateData.assetId || updateData.quantity <= 0) {
            setError('Please select an asset and enter a valid quantity');
            return;
        }
        try {
            await api.patch(`/asset/${updateData.assetId}`, {
                quantity: updateData.quantity,
                operation: updateData.operation,
            });

            setUpdateData({ assetId: '', quantity: 0, operation: 'add' });

            // Reload assets
            const res = await api.get('/asset');
            setAssets(res.data.data || []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update asset');
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-8 bg-gray-50 min-h-screen">
            <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
                <header>
                    <h2 className="text-4xl font-extrabold text-gray-900 mb-1">Manage Assets</h2>
                    <p className="text-gray-500 text-lg">Create and update military assets inventory.</p>
                </header>

                {error && (
                    <div className="bg-red-100 text-red-700 px-6 py-3 rounded-md font-semibold">
                        {error}
                    </div>
                )}

                {/* Create Asset Form */}
                <section className="bg-gray-50 p-6 rounded-lg shadow-inner">
                    <h3 className="text-2xl font-semibold mb-6 text-gray-800 border-b border-gray-300 pb-3">
                        Create Asset
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <input
                            type="text"
                            placeholder="Asset Type"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                        />
                        <input
                            type="text"
                            placeholder="Asset Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                        />
                        <input
                            type="number"
                            placeholder="Initial Quantity"
                            min={1}
                            value={formData.quantity || ''}
                            onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                            className="rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                        />
                        <select
                            value={formData.baseId}
                            onChange={(e) => setFormData({ ...formData, baseId: e.target.value })}
                            className="rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                        >
                            <option value="">Select Base</option>
                            {bases.map((base) => (
                                <option key={base.id} value={base.id}>
                                    {base.name} ({base.location})
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={handleCreate}
                            className="col-span-1 md:col-span-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg px-6 py-3 shadow-md hover:from-blue-700 hover:to-indigo-700 transition"
                        >
                            Create Asset
                        </button>
                    </div>
                </section>

                {/* Update Asset Quantity */}
                <section className="bg-gray-50 p-6 rounded-lg shadow-inner">
                    <h3 className="text-2xl font-semibold mb-6 text-gray-800 border-b border-gray-300 pb-3">
                        Update Asset Quantity
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                        <select
                            value={updateData.assetId}
                            onChange={(e) => setUpdateData({ ...updateData, assetId: e.target.value })}
                            className="rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                        >
                            <option value="">Select Asset</option>
                            {assets.map((asset) => (
                                <option key={asset.id} value={asset.id}>
                                    {asset.name} ({asset.type}) - {asset.Base?.name || 'Unknown Base'}
                                </option>
                            ))}
                        </select>
                        <input
                            type="number"
                            placeholder="Quantity"
                            min={1}
                            value={updateData.quantity || ''}
                            onChange={(e) => setUpdateData({ ...updateData, quantity: Number(e.target.value) })}
                            className="rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                        />
                        <select
                            value={updateData.operation}
                            onChange={(e) =>
                                setUpdateData({ ...updateData, operation: e.target.value as UpdateOperation })
                            }
                            className="rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                        >
                            <option value="add">Add</option>
                            <option value="remove">Remove</option>
                        </select>
                        <button
                            onClick={handleUpdate}
                            className="bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold rounded-lg px-6 py-3 shadow-md hover:from-green-700 hover:to-teal-700 transition"
                        >
                            Update Quantity
                        </button>
                    </div>
                </section>

                {/* Assets Table */}
                {currentUser.baseId && (
                    <section className="overflow-x-auto rounded-lg shadow-lg">
                        <table className="min-w-full divide-y divide-gray-200 bg-white">
                            <thead className="bg-gray-100">
                                <tr>
                                    {['Asset Name', 'Type', 'Quantity', 'Base Name', 'Base Location'].map((header) => (
                                        <th
                                            key={header}
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider select-none"
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {assets.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-gray-400 italic">
                                            No assets found.
                                        </td>
                                    </tr>
                                )}
                                {assets.map((asset) => (
                                    <tr
                                        key={asset.id}
                                        className="hover:bg-gray-50 transition cursor-default"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">{asset.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">{asset.type}</td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-indigo-600">{asset.current_quantity}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">{asset.Base?.name || '—'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">{asset.Base?.location || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                )}

            </div>
        </div>
    );
}
