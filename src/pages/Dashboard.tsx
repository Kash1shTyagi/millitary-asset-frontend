// src/pages/Dashboard.tsx

import { useEffect, useState } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    BarElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import AssetsPage from './AssetsPage';
import AssignmentsPage from './AssignmentsPage';
import PurchasesPage from './PurchasesPage';
import TransfersPage from './TransfersPage';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    BarElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface AssetModel {
    id: number;
    name: string;
    type: string;
    current_quantity: number;
    baseId: number;
}

interface PurchaseModel {
    id: number;
    assetId: number;
    quantity: number;
    baseId: number;
    date: string;
    Asset?: AssetModel;
}

interface TransferModel {
    id: number;
    assetId: number;
    fromBaseId: number;
    toBaseId: number;
    quantity: number;
    timestamp: string;
    date: string;
    updatedAt: string;
    Asset?: AssetModel;
    fromBase: { id: number; name: string };
    toBase: { id: number; name: string };
}

interface BaseModel {
    id: number;
    name: string;
    location: string;
}

interface MetricsResponse {
    totalAssets: number;
    pendingTransfers: number;
    recentPurchases: PurchaseModel[];
}

const Dashboard: React.FC = () => {
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();

    if (!isAuthenticated) {
        navigate('/login');
        return null;
    }

    if (!user) return null;

    return (
        <Routes>
            <Route path="" element={<DashboardLayout />}>
                <Route index element={user.role === 'Admin' ? <AdminDashboard /> : <BaseDashboard />} />
                <Route path="assets" element={<AssetsPage currentUser={{
                    ...user,
                    baseId: user.baseId ? String(user.baseId) : undefined
                }} />} />
                <Route path="assignments" element={<AssignmentsPage currentUser={{
                    ...user,
                    baseId: user.baseId ? String(user.baseId) : undefined
                }} />} />
                <Route path="purchases" element={<PurchasesPage currentUser={{
                    ...user,
                    baseId: user.baseId ? String(user.baseId) : undefined
                }} />} />
                <Route path="transfers" element={<TransfersPage currentUser={{
                    ...user,
                    baseId: user.baseId ? String(user.baseId) : undefined
                }}/>} />
            </Route>
        </Routes>
    );
};

export default Dashboard;

// Spinner and Error
const Spinner: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex items-center justify-center h-screen">
        <p className="text-xl text-gray-500 animate-pulse">{message}</p>
    </div>
);

const Error: React.FC<{ message: string; onLogout: () => void }> = ({ message, onLogout }) => (
    <div className="flex flex-col items-center justify-center h-screen text-center">
        <p className="text-red-500 text-xl mb-4">{message}</p>
        <button onClick={onLogout} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg">
            Logout
        </button>
    </div>
);

// TableCard
const TableCard: React.FC<{
    title: string;
    headers: string[];
    rows: string[][];
    emptyMessage?: string;
    fullWidth?: boolean;
}> = ({ title, headers, rows, emptyMessage, fullWidth }) => (
    <div className={`${fullWidth ? 'w-full' : ''} bg-white rounded-2xl shadow-lg p-6`}>
        <h2 className="text-2xl font-semibold mb-4">{title}</h2>
        {rows.length > 0 ? (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {headers.map((h) => (
                                <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {rows.map((r, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                                {r.map((c, j) => (
                                    <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {c}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : (
            <p className="text-gray-500">{emptyMessage || 'No data available.'}</p>
        )}
    </div>
);

// Base Dashboard
const BaseDashboard: React.FC = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
    const [purchases, setPurchases] = useState<PurchaseModel[]>([]);
    const [transfers, setTransfers] = useState<TransferModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [monthlyIn, setMonthlyIn] = useState<number[]>([]);
    const [monthlyOut, setMonthlyOut] = useState<number[]>([]);

    useEffect(() => {
        (async () => {
            setLoading(true);
            setError('');
            try {
                const [{ data: { data: m } }, { data: { data: p } }, { data: { data: t } }] = await Promise.all([
                    api.get('/dashboard/metrics'),
                    api.get('/purchase'),
                    api.get('/transfer'),
                ]);
                setMetrics(m);
                setPurchases(p);
                setTransfers(t);
            } catch (e: any) {
                console.error(e);
                setError(e.response?.data?.message || 'Failed to load dashboard.');
            } finally {
                setLoading(false);
            }
        })();
    }, [user]);

    useEffect(() => {
        if (!transfers) return;
        const inArray = new Array(12).fill(0);
        const outArray = new Array(12).fill(0);
        transfers.forEach((t) => {
            const month = new Date(t.timestamp).getMonth();
            if (t.toBaseId === user?.baseId) inArray[month] += t.quantity;
            if (t.fromBaseId === user?.baseId) outArray[month] += t.quantity;
        });
        setMonthlyIn(inArray);
        setMonthlyOut(outArray);
    }, [transfers, user?.baseId]);

    if (loading) return <Spinner message="Loading Dashboard..." />;
    if (error || !metrics) return <Error message={error || 'No data available.'} onLogout={() => { logout(); navigate('/login'); }} />;

    const year = new Date().getFullYear();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyPurch = months.map((_, i) =>
        purchases.filter((p) => new Date(p.date).getFullYear() === year && new Date(p.date).getMonth() === i)
            .reduce((sum, p) => sum + p.quantity, 0)
    );

    return (
        <div className="mx-auto p-6 w-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold">Base Dashboard</h1>
                <button onClick={() => { logout(); navigate('/login'); }} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">
                    Logout
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                    { label: 'Total Assets', value: metrics.totalAssets },
                    { label: 'Pending Transfers', value: metrics.pendingTransfers },
                    { label: 'Monthly Purchased', value: monthlyPurch.reduce((a, b) => a + b, 0) },
                    { label: 'Monthly Transferred', value: monthlyIn.reduce((a, b) => a + b, 0) + monthlyOut.reduce((a, b) => a + b, 0) },
                ].map((card) => (
                    <div key={card.label} className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition w-full">
                        <p className="text-sm text-gray-400">{card.label}</p>
                        <p className="mt-2 text-2xl font-bold text-gray-800">{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Purchases in {year}</h3>
                    <Line
                        data={{
                            labels: months,
                            datasets: [
                                {
                                    label: 'Qty',
                                    data: monthlyPurch,
                                    backgroundColor: 'rgba(59,130,246,0.3)',
                                    borderColor: '#3B82F6',
                                    fill: true,
                                },
                            ],
                        }}
                    />
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Transfers In vs Out in {year}</h3>
                    <Bar
                        data={{
                            labels: months,
                            datasets: [
                                { label: 'In', data: monthlyIn, backgroundColor: '#10B981' },
                                { label: 'Out', data: monthlyOut, backgroundColor: '#EF4444' },
                            ],
                        }}
                    />
                </div>
            </div>

            {/* Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <TableCard
                    title="Recent Purchases"
                    headers={['Date', 'Asset', 'Qty']}
                    rows={purchases.map((p) => [
                        new Date(p.date).toLocaleDateString(),
                        p.Asset?.name ?? '-',
                        p.quantity.toString(),
                    ])}
                    emptyMessage="No purchases"
                    fullWidth
                />
                <TableCard
                    title="Recent Transfers"
                    headers={['Date', 'Asset', 'Qty', 'From', 'To']}
                    rows={transfers.map((t) => [
                        new Date(t.updatedAt).toLocaleDateString(),
                        t.Asset?.name ?? '-',
                        t.quantity.toString(),
                        t.fromBase.name,
                        t.toBase.name,
                    ])}
                    emptyMessage="No transfers"
                    fullWidth
                />
            </div>
        </div>
    );
};

// Admin Dashboard
const AdminDashboard: React.FC = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [bases, setBases] = useState<BaseModel[]>([]);
    const [selected, setSelected] = useState<number>(0);
    const [assets, setAssets] = useState<AssetModel[]>([]);
    const [assetMapAdmin, setAssetMapAdmin] = useState<Record<number, string>>({});
    const [transfers, setTransfers] = useState<TransferModel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/base').then((r) => {
            setBases(r.data.data);
            const firstId = r.data.data[0]?.id;
            if (firstId) setSelected(firstId);
        });
    }, []);

    useEffect(() => {
        if (!selected) return;
        api.get(`/asset/${selected}`).then((r) => {
            setAssets(r.data.data);
            const map: Record<number, string> = {};
            r.data.data.forEach((a: AssetModel) => (map[a.id] = a.name));
            setAssetMapAdmin(map);
        });
    }, [selected]);

    useEffect(() => {
        api.get('/transfer').then((r) => setTransfers(r.data.data)).finally(() => setLoading(false));
    }, []);

    if (loading) return <Spinner message="Loading Admin Dashboard..." />;

    return (
        <div className="mx-auto p-6 w-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold">Admin Dashboard</h1>
                <button onClick={() => { logout(); navigate('/login'); }} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">
                    Logout
                </button>
            </div>

            <div className="mb-8">
                <label className="block mb-2 text-sm text-gray-600">Select Base:</label>
                <select
                    value={selected}
                    onChange={(e) => setSelected(+e.target.value)}
                    className="px-4 py-2 border rounded-lg w-full focus:ring-2 focus:ring-blue-500"
                >
                    {bases.map((b) => (
                        <option key={b.id} value={b.id}>
                            {b.name} ({b.location})
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <TableCard
                    title={`Assets at ${bases.find((b) => b.id === selected)?.name}`}
                    headers={['ID', 'Name', 'Type', 'Qty']}
                    rows={assets.map((a) => [a.id.toString(), a.name, a.type, a.current_quantity.toString()])}
                    emptyMessage="No assets"
                    fullWidth
                />
                <TableCard
                    title="All Transfers"
                    headers={['Date', 'Asset', 'Qty', 'From', 'To']}
                    rows={transfers.map((t) => [
                        new Date(t.updatedAt || t.date).toLocaleDateString(),
                        assetMapAdmin[t.assetId] ?? t.Asset?.name ?? '-',
                        t.quantity.toString(),
                        t.fromBase.name,
                        t.toBase.name,
                    ])}
                    emptyMessage="No transfers"
                    fullWidth
                />
            </div>
        </div>
    );
};
