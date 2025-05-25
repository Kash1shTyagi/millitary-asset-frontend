import React, { useEffect, useState } from 'react';
import api from '../services/api';

interface Asset {
    id: number;
    name: string;
    type: string;
}

interface Purchase {
    id: number;
    assetId: number;
    quantity: number;
    date: string;
    asset?: Asset;
}

interface User {
    role: string;
    baseId?: string;
}

export default function PurchasesPage({ currentUser }: { currentUser: User }) {
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [formData, setFormData] = useState({
        assetId: '',
        quantity: 0,
    });
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const assetsRes = await api.get('/asset');
                const assetsData: Asset[] = assetsRes.data.data || [];
                setAssets(assetsData);

                const purchasesRes = await api.get('/purchase');
                const purchasesData: Purchase[] = purchasesRes.data.data || [];

                const assetMap = new Map<number, Asset>();
                assetsData.forEach((a) => assetMap.set(a.id, a));

                const enrichedPurchases = purchasesData.map((p) => ({
                    ...p,
                    asset: assetMap.get(p.assetId),
                }));

                setPurchases(enrichedPurchases);
            } catch (err) {
                console.error(err);
                setError('Failed to load purchases or assets');
            }
        };

        fetchData();
    }, []);

    const handleCreate = async () => {
        setError('');
        if (!formData.assetId || formData.quantity <= 0) {
            setError('Please select a valid asset and quantity');
            return;
        }

        try {
            await api.post('/purchase', {
                assetId: Number(formData.assetId),
                quantity: formData.quantity,
            });
            setFormData({ assetId: '', quantity: 0 });

            const purchasesRes = await api.get('/purchase');
            const purchasesData: Purchase[] = purchasesRes.data.data || [];
            const assetMap = new Map(assets.map((a) => [a.id, a]));

            const enrichedPurchases = purchasesData.map((p) => ({
                ...p,
                asset: assetMap.get(p.assetId),
            }));

            setPurchases(enrichedPurchases);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create purchase');
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-8 bg-gray-50 min-h-screen">
            <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
                <header>
                    <h2 className="text-4xl font-extrabold text-gray-900 mb-1">Manage Purchases</h2>
                    <p className="text-gray-500 text-lg">View and approve new purchase requests.</p>
                </header>

                {error && (
                    <div className="bg-red-100 text-red-700 px-6 py-3 rounded-md font-semibold">
                        {error}
                    </div>
                )}

                {/* Create Purchase Form */}
                <section className="bg-gray-50 p-6 rounded-lg shadow-inner">
                    <h3 className="text-2xl font-semibold mb-6 text-gray-800 border-b border-gray-300 pb-3">
                        Create Purchase
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <select
                            value={formData.assetId}
                            onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                            className="rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                        >
                            <option value="">Select Asset</option>
                            {assets.map((asset) => (
                                <option key={asset.id} value={asset.id}>
                                    {asset.name} ({asset.type})
                                </option>
                            ))}
                        </select>

                        <input
                            type="number"
                            placeholder="Quantity"
                            min={1}
                            value={formData.quantity || ''}
                            onChange={(e) =>
                                setFormData({ ...formData, quantity: Number(e.target.value) })
                            }
                            className="rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                        />

                        <button
                            onClick={handleCreate}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg px-6 py-3 shadow-md hover:from-blue-700 hover:to-indigo-700 transition"
                        >
                            Create Purchase
                        </button>
                    </div>
                </section>

                {/* Purchases Table */}
                {currentUser.baseId && (
                    <section className="overflow-x-auto rounded-lg shadow-lg">
                        <table className="min-w-full divide-y divide-gray-200 bg-white">
                            <thead className="bg-gray-100">
                                <tr>
                                    {['Asset', 'Type', 'Quantity', 'Date'].map((header) => (
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
                                {purchases.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-gray-400 italic">
                                            No purchases found.
                                        </td>
                                    </tr>
                                )}
                                {purchases.map((p) => (
                                    <tr
                                        key={p.id}
                                        className="hover:bg-gray-50 transition cursor-default"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                                            {p.asset?.name || '—'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                                            {p.asset?.type || '—'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-indigo-600">
                                            {p.quantity}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                            {p.date ? new Date(p.date).toLocaleDateString() : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>)}
            </div>
        </div>
    );
}
