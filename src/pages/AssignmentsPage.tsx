import React, { useEffect, useState } from 'react';
import api from '../services/api';

interface Asset {
    id: number;
    name: string;
    type: string;
}

interface Assignment {
    id: number;
    assetId: number;
    asset?: Asset;
    quantity: number;
    assignee: string;
    date: string;
    expended: boolean;
}

interface User {
    role: string;
    baseId?: string;
}

export default function AssignmentsPage({ currentUser }: { currentUser: User }) {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [formData, setFormData] = useState({
        assetId: '',
        quantity: 0,
        assignee: '',
        date: '',
    });
    const [error, setError] = useState('');

    const fetchAssets = async () => {
        try {
            const res = await api.get('/asset');
            setAssets(res.data.data || []);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch assets');
        }
    };

    const fetchAssignments = async () => {
        try {
            const res = await api.get('/assignment');
            const assignmentsData: Assignment[] = res.data.data;

            const assetMap = new Map<number, Asset>();
            assets.forEach((a) => assetMap.set(a.id, a));

            const enriched = assignmentsData.map((a) => ({
                ...a,
                asset: a.asset || assetMap.get(a.assetId),
            }));

            setAssignments(enriched);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch assignments');
        }
    };

    const handleCreate = async () => {
        setError('');
        if (!formData.assetId || !formData.assignee || formData.quantity <= 0 || !formData.date) {
            setError('Please fill out all fields with valid data');
            return;
        }

        try {
            await api.post('/assignment', {
                assetId: Number(formData.assetId),
                quantity: formData.quantity,
                assignee: formData.assignee,
                date: formData.date,
            });
            setFormData({ assetId: '', quantity: 0, assignee: '', date: '' });
            await fetchAssignments();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Assignment creation failed');
        }
    };

    const handleMarkExpended = async (id: number) => {
        try {
            await api.patch(`/assignment/${id}/expend`);
            await fetchAssignments();
        } catch (err) {
            console.error('Failed to mark expended:', err);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const assetsRes = await api.get('/asset');
                const assetsData: Asset[] = assetsRes.data.data || [];
                setAssets(assetsData);

                const assignmentsRes = await api.get('/assignment');
                const assignmentsData: Assignment[] = assignmentsRes.data.data;

                const assetMap = new Map<number, Asset>();
                assetsData.forEach((a) => assetMap.set(a.id, a));

                const enriched = assignmentsData.map((a) => ({
                    ...a,
                    asset: a.asset || assetMap.get(a.assetId),
                }));

                setAssignments(enriched);
            } catch (err) {
                console.error(err);
                setError('Failed to load data');
            }
        };

        loadData();
    }, []);

    return (
        <div className="max-w-7xl mx-auto p-8 bg-white rounded-3xl shadow-lg space-y-8">
            <h2 className="text-4xl font-extrabold text-gray-900">Manage Assignments</h2>

            {error && (
                <div className="bg-red-100 text-red-700 px-4 py-2 rounded-md shadow-sm">
                    {error}
                </div>
            )}

            {/* Create Form */}
            <section className="bg-gray-50 p-6 rounded-xl shadow-inner">
                <h3 className="text-2xl font-semibold mb-5">Create Assignment</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <select
                        value={formData.assetId}
                        onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                        className="border border-gray-300 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                    >
                        <option value="">Select Asset</option>
                        {assets.map((a) => (
                            <option key={a.id} value={a.id}>
                                {a.name} ({a.type})
                            </option>
                        ))}
                    </select>
                    <input
                        type="text"
                        placeholder="Assignee"
                        value={formData.assignee}
                        onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                        className="border border-gray-300 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                    />
                    <input
                        type="number"
                        placeholder="Quantity"
                        value={formData.quantity}
                        min={1}
                        onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                        className="border border-gray-300 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                    />
                    <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="border border-gray-300 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                    />
                </div>
                <button
                    onClick={handleCreate}
                    className="mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold rounded-xl px-8 py-3 shadow-md transition-transform active:scale-95"
                >
                    Create Assignment
                </button>
            </section>

            {/* Assignment Table */}
            {currentUser.baseId && (
                <section className="overflow-x-auto bg-white rounded-xl shadow-md">
                    <table className="min-w-full table-auto text-gray-800">
                        <thead>
                            <tr className="bg-blue-50 uppercase text-sm font-semibold text-blue-700">
                                <th className="py-3 px-6 border-b border-blue-100">Asset</th>
                                <th className="py-3 px-6 border-b border-blue-100">Type</th>
                                <th className="py-3 px-6 border-b border-blue-100">Assignee</th>
                                <th className="py-3 px-6 border-b border-blue-100">Quantity</th>
                                <th className="py-3 px-6 border-b border-blue-100">Date</th>
                                <th className="py-3 px-6 border-b border-blue-100">Status</th>
                                <th className="py-3 px-6 border-b border-blue-100">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignments.map((a) => (
                                <tr
                                    key={a.id}
                                    className="hover:bg-gray-50 transition-colors border-b border-gray-200"
                                >
                                    <td className="py-4 px-6 font-medium">{a.asset?.name || '—'}</td>
                                    <td className="py-4 px-6">{a.asset?.type || '—'}</td>
                                    <td className="py-4 px-6">{a.assignee}</td>
                                    <td className="py-4 px-6">{a.quantity}</td>
                                    <td className="py-4 px-6">
                                        {a.date ? new Date(a.date).toLocaleDateString() : '—'}
                                    </td>
                                    <td className="py-4 px-6">
                                        <span
                                            className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${a.expended
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                                }`}
                                        >
                                            {a.expended ? 'Expended' : 'Pending'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6">
                                        {!a.expended && (
                                            <button
                                                onClick={() => handleMarkExpended(a.id)}
                                                className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 shadow-md transition"
                                            >
                                                Mark Expended
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}

        </div>
    );
}
