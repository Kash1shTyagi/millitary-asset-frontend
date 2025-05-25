import React, { useEffect, useState } from 'react';
import api from '../services/api';

interface Base {
    id: number;
    name: string;
}

interface Asset {
    id: number;
    name: string;
    type: string;
}

interface Transfer {
    id: number;
    assetId: number;
    fromBaseId: number;
    toBaseId: number;
    quantity: number;
    timestamp: string;
    Asset?: Asset;
    fromBase?: Base;
    toBase?: Base;
}

interface User {
    role: string;
    baseId?: string;
}

export default function TransfersPage({ currentUser }: { currentUser: User }) {
    const [transfers, setTransfers] = useState<Transfer[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [bases, setBases] = useState<Base[]>([]);
    const [form, setForm] = useState({
        assetId: '',
        fromBaseId: '',
        toBaseId: '',
        quantity: '',
    });
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchData() {
            try {
                const [transferRes, assetRes, baseRes] = await Promise.all([
                    api.get('/transfer'),
                    api.get('/asset'),
                    api.get('/base'),
                ]);

                setTransfers(transferRes.data.data || []);
                setAssets(assetRes.data.data || []);
                setBases(baseRes.data.data || []);
            } catch (err) {
                console.error(err);
                setError('Failed to load data');
            }
        }

        fetchData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!form.assetId || !form.fromBaseId || !form.toBaseId || !form.quantity) {
            setError('Please fill in all fields');
            return;
        }

        if (form.fromBaseId === form.toBaseId) {
            setError('From and To Base cannot be the same');
            return;
        }

        try {
            const payload = {
                assetId: Number(form.assetId),
                fromBaseId: Number(form.fromBaseId),
                toBaseId: Number(form.toBaseId),
                quantity: Number(form.quantity),
            };

            await api.post('/transfer', payload);
            setForm({ assetId: '', fromBaseId: '', toBaseId: '', quantity: '' });

            const updated = await api.get('/transfer');
            setTransfers(updated.data.data || []);
        } catch (err) {
            console.error(err);
            setError('Failed to create transfer');
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-8 bg-gray-50 min-h-screen">
            <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
                <header>
                    <h2 className="text-4xl font-extrabold text-gray-900 mb-1">Manage Transfers</h2>
                    <p className="text-gray-500 text-lg">View and create asset transfers between bases.</p>
                </header>

                {error && (
                    <div className="bg-red-100 text-red-700 px-6 py-3 rounded-md font-semibold">
                        {error}
                    </div>
                )}

                {/* Transfer Form */}
                <section className="bg-gray-50 p-6 rounded-lg shadow-inner">
                    <h3 className="text-2xl font-semibold mb-6 text-gray-800 border-b border-gray-300 pb-3">
                        Create Transfer
                    </h3>

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <select
                            name="assetId"
                            value={form.assetId}
                            onChange={handleChange}
                            className="rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        >
                            <option value="">Select Asset</option>
                            {assets.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.name} ({a.type})
                                </option>
                            ))}
                        </select>

                        <select
                            name="fromBaseId"
                            value={form.fromBaseId}
                            onChange={handleChange}
                            className="rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        >
                            <option value="">From Base</option>
                            {bases.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                </option>
                            ))}
                        </select>

                        <select
                            name="toBaseId"
                            value={form.toBaseId}
                            onChange={handleChange}
                            className="rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        >
                            <option value="">To Base</option>
                            {bases.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                </option>
                            ))}
                        </select>

                        <input
                            type="number"
                            name="quantity"
                            placeholder="Quantity"
                            min={1}
                            value={form.quantity}
                            onChange={handleChange}
                            className="rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        />
                        <button
                            type="submit"
                            className="md:col-span-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg px-6 py-3 shadow-md hover:from-blue-700 hover:to-indigo-700 transition"
                        >
                            Create Transfer
                        </button>
                    </form>
                </section>

                {/* Transfers Table */}
                {currentUser.baseId && (
                    <section className="overflow-x-auto rounded-lg shadow-lg">
                        <table className="min-w-full divide-y divide-gray-200 bg-white">
                            <thead className="bg-gray-100">
                                <tr>
                                    {['Asset', 'Type', 'From Base', 'To Base', 'Quantity', 'Date'].map((header) => (
                                        <th
                                            key={header}
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                                {transfers.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-gray-400 italic">
                                            No transfers found.
                                        </td>
                                    </tr>
                                )}

                                {transfers.map((t) => (
                                    <tr key={t.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                                            {t.Asset?.name || '—'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">{t.Asset?.type || '—'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">{t.fromBase?.name || '—'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">{t.toBase?.name || '—'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-indigo-600">
                                            {t.quantity}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                            {t.timestamp ? new Date(t.timestamp).toLocaleDateString() : '—'}
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
