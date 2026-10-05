import React, { useEffect, useMemo, useState } from 'react';

import {
    Activity,
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    ChevronRight,
    CircleDollarSign,
    Clock3,
    Copy,
    Database,
    FileWarning,
    Gauge,
    History,
    Layers3,
    Network,
    Play,
    RefreshCw,
    Search,
    Server,
    ShieldCheck,
    Smartphone,
    Wifi,
    WifiOff,
    X,
    Zap,
} from 'lucide-react';

import {
    createTransaction,
    failTransaction,
    getLogs,
    getStats,
    getTransactions,
    reconcileTransaction,
    simulateConflict,
    syncTransactions
} from './api';


// --------------------------------------------------
// DEMO DATA
// --------------------------------------------------

const initial = [
    {
        id: 'TXN1001',
        amount: 500,
        customer: 'Rahul Kumar',
        merchant: 'Campus Cafe',
        source: 'OFFLINE',
        status: 'RECONCILED',
        time: '10:42:12',
        serverAmount: 500,
    },
    {
        id: 'TXN1002',
        amount: 1299,
        customer: 'Ankit Singh',
        merchant: 'Tech Store',
        source: 'OFFLINE',
        status: 'RECONCILED',
        time: '10:41:02',
        serverAmount: 1299,
    },
    {
        id: 'TXN1003',
        amount: 500,
        customer: 'Priya Sharma',
        merchant: 'City Mart',
        source: 'OFFLINE',
        status: 'CONFLICT',
        time: '10:39:44',
        serverAmount: 700,
    },
    {
        id: 'TXN1004',
        amount: 850,
        customer: 'Aman Verma',
        merchant: 'Food Hub',
        source: 'OFFLINE',
        status: 'DUPLICATE',
        time: '10:37:18',
        serverAmount: 850,
    },
    {
        id: 'TXN1005',
        amount: 2200,
        customer: 'Neha Gupta',
        merchant: 'Book World',
        source: 'OFFLINE',
        status: 'FAILED',
        time: '10:34:11',
        serverAmount: null,
    },
    {
        id: 'TXN1006',
        amount: 350,
        customer: 'Ravi Das',
        merchant: 'Campus Cafe',
        source: 'OFFLINE',
        status: 'QUEUED',
        time: '10:31:08',
        serverAmount: null,
    },
];

const initLogs = [
    {
        id: 1,
        action: 'Reconciliation',
        tx: 'TXN1003',
        result: 'CONFLICT',
        detail: 'Amount mismatch: ₹500 vs ₹700',
        time: '10:39:47',
    },
    {
        id: 2,
        action: 'Duplicate Detection',
        tx: 'TXN1004',
        result: 'DUPLICATE',
        detail: 'Same transaction reference detected',
        time: '10:37:22',
    },
    {
        id: 3,
        action: 'Sync',
        tx: 'TXN1002',
        result: 'SUCCESS',
        detail: 'Server record matched',
        time: '10:41:04',
    },
];

const nav = [
    ['dashboard', 'Dashboard', Gauge],
    ['transactions', 'Transactions', Layers3],
    ['reconciliation', 'Reconciliation', ShieldCheck],
    ['logs', 'Audit Logs', History],
];


// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function meta(s) {
    return (
        {
            RECONCILED: [
                'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
                CheckCircle2,
            ],
            DUPLICATE: [
                'bg-amber-400/10 text-amber-300 border-amber-400/20',
                Copy,
            ],
            CONFLICT: [
                'bg-red-400/10 text-red-300 border-red-400/20',
                AlertTriangle,
            ],
            FAILED: [
                'bg-rose-500/10 text-rose-300 border-rose-400/20',
                FileWarning,
            ],
            QUEUED: [
                'bg-blue-400/10 text-blue-300 border-blue-400/20',
                Clock3,
            ],
            SYNCED: [
                'bg-cyan-400/10 text-cyan-300 border-cyan-400/20',
                RefreshCw,
            ],
            PENDING: [
                'bg-violet-400/10 text-violet-300 border-violet-400/20',
                Clock3,
            ],
        }[s] || [
            'bg-slate-400/10 text-slate-300 border-slate-400/20',
            Clock3,
        ]
    );
}

function Badge({ status }) {
    const [m, I] = meta(status);

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${m}`}
        >
            <I size={12} />
            {status}
        </span>
    );
}

function Card({
    title,
    value,
    hint,
    icon: I,
    tone = 'blue',
}) {
    const tones = {
        blue: 'text-blue-300 bg-blue-400/10 border-blue-400/15',
        green: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/15',
        amber: 'text-amber-300 bg-amber-400/10 border-amber-400/15',
        red: 'text-red-300 bg-red-400/10 border-red-400/15',
        violet: 'text-violet-300 bg-violet-400/10 border-violet-400/15',
    };

    const t = tones[tone];

    return (
        <div className="glass rounded-2xl p-4 shadow-glow">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs text-slate-400">{title}</p>

                    <p className="mt-2 text-2xl font-bold text-white">
                        {value}
                    </p>

                    <p className="mt-1 text-[11px] text-slate-500">
                        {hint}
                    </p>
                </div>

                <div className={`rounded-xl border p-2.5 ${t}`}>
                    <I size={18} />
                </div>
            </div>
        </div>
    );
}

function Mini({ label, value }) {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
            <p className="text-[9px] uppercase tracking-wider text-slate-600">
                {label}
            </p>

            <p className="mt-1 text-lg font-bold text-slate-200">
                {value}
            </p>
        </div>
    );
}

function Info({ l, v }) {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
            <p className="text-[9px] uppercase tracking-wider text-slate-600">
                {l}
            </p>

            <p className="mt-1 truncate text-xs text-slate-300">
                {v}
            </p>
        </div>
    );
}

function Compare({ l, v }) {
    return (
        <div className="rounded-xl border border-red-400/10 bg-slate-950/50 p-3">
            <p className="text-[9px] text-slate-500">{l}</p>

            <p className="mt-1 text-lg font-bold text-white">
                {v}
            </p>
        </div>
    );
}


// --------------------------------------------------
// PIPELINE
// --------------------------------------------------

function Pipeline({ online, q }) {
    const steps = [
        ['Offline Transaction', Smartphone],
        ['Local Queue', Database],
        ['Synchronize', RefreshCw],
        ['Verify', ShieldCheck],
        ['Match Records', Network],
        ['Reconcile', CheckCircle2],
    ];

    return (
        <div className="glass rounded-2xl p-5">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="font-semibold text-white">
                        Reconciliation Pipeline
                    </h2>

                    <p className="text-xs text-slate-500">
                        Live transaction lifecycle
                    </p>
                </div>

                <span className="text-xs text-slate-400">
                    {q} queued
                </span>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-2">
                {steps.map(([label, I], i) => (
                    <React.Fragment key={label}>
                        <div
                            className={`flex min-w-0 flex-1 items-center gap-2 rounded-xl border px-3 py-3 ${i === 0 && !online
                                    ? 'border-amber-400/30 bg-amber-400/5'
                                    : 'border-slate-700/60 bg-slate-900/40'
                                }`}
                        >
                            <div className="rounded-lg bg-slate-800 p-2 text-slate-300">
                                <I size={15} />
                            </div>

                            <div className="min-w-0">
                                <p className="truncate text-[11px] font-semibold text-slate-200">
                                    {label}
                                </p>

                                <p className="text-[10px] text-slate-500">
                                    {i === 0
                                        ? online
                                            ? 'Ready'
                                            : 'Connectivity lost'
                                        : i === 1
                                            ? `${q} waiting`
                                            : 'Engine active'}
                                </p>
                            </div>
                        </div>

                        {i < 5 && (
                            <ArrowRight
                                className="hidden text-slate-700 md:block"
                                size={15}
                            />
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
}


// --------------------------------------------------
// TABLE
// --------------------------------------------------

function Table({ rows, onSelect }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0c1220]">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                <div>
                    <h2 className="font-semibold text-white">
                        Transaction Ledger
                    </h2>

                    <p className="text-xs text-slate-500">
                        Offline and synchronized payment records
                    </p>
                </div>

                <span className="rounded-lg bg-slate-800 px-2 py-1 text-[11px] text-slate-400">
                    {rows.length} records
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                    <thead className="bg-slate-950/40 text-[10px] uppercase tracking-wider text-slate-500">
                        <tr>
                            {[
                                'Transaction',
                                'Customer / Merchant',
                                'Amount',
                                'Source',
                                'Status',
                                'Time',
                                '',
                            ].map((h, i) => (
                                <th
                                    key={i}
                                    className="px-5 py-3 font-medium"
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-800/80">
                        {rows.map((tx) => (
                            <tr
                                key={tx.id}
                                className="group hover:bg-slate-800/20"
                            >
                                <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-200">
                                    {tx.id}
                                </td>

                                <td className="px-5 py-4">
                                    <p className="text-xs font-medium text-slate-200">
                                        {tx.customer}
                                    </p>

                                    <p className="mt-0.5 text-[10px] text-slate-500">
                                        {tx.merchant}
                                    </p>
                                </td>

                                <td className="px-5 py-4 text-sm font-semibold text-white">
                                    ₹{Number(tx.amount).toLocaleString('en-IN')}
                                </td>

                                <td className="px-5 py-4 text-[10px] font-semibold text-blue-300">
                                    {tx.source || 'OFFLINE'}
                                </td>

                                <td className="px-5 py-4">
                                    <Badge status={tx.status} />
                                </td>

                                <td className="px-5 py-4 font-mono text-[10px] text-slate-500">
                                    {tx.time || '—'}
                                </td>

                                <td className="px-5 py-4 text-right">
                                    <button
                                        onClick={() => onSelect(tx)}
                                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-white"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {!rows.length && (
                    <div className="p-10 text-center text-sm text-slate-500">
                        No transactions found.
                    </div>
                )}
            </div>
        </div>
    );
}


// --------------------------------------------------
// DRAWER
// --------------------------------------------------

function Drawer({
    tx,
    close,
    reconcile,
    fail,
}) {
    if (!tx) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
            onMouseDown={close}
        >
            <aside
                className="h-full w-full max-w-md overflow-y-auto border-l border-slate-800 bg-[#090f1b] p-6 shadow-2xl slide-in"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] uppercase tracking-[.2em] text-slate-500">
                            Transaction Detail
                        </p>

                        <h2 className="mt-1 font-mono text-lg font-bold text-white">
                            {tx.id}
                        </h2>
                    </div>

                    <button
                        onClick={close}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs text-slate-500">
                                Transaction amount
                            </p>

                            <p className="mt-1 text-3xl font-bold text-white">
                                ₹{Number(tx.amount).toLocaleString('en-IN')}
                            </p>
                        </div>

                        <Badge status={tx.status} />
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                        <Info
                            l="Customer"
                            v={tx.customer}
                        />

                        <Info
                            l="Merchant"
                            v={tx.merchant}
                        />

                        <Info
                            l="Source"
                            v={tx.source || 'OFFLINE'}
                        />

                        <Info
                            l="Created"
                            v={tx.time || '—'}
                        />
                    </div>
                </div>

                {tx.status === 'CONFLICT' && (
                    <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/5 p-5">
                        <div className="flex items-center gap-2 text-red-300">
                            <AlertTriangle size={16} />

                            <p className="text-sm font-semibold">
                                Conflict detected
                            </p>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <Compare
                                l="Offline record"
                                v={`₹${tx.amount}`}
                            />

                            <Compare
                                l="Server record"
                                v={`₹${tx.serverAmount ?? '—'}`}
                            />
                        </div>

                        <p className="mt-3 text-xs leading-5 text-red-200/70">
                            Same transaction reference exists on the server,
                            but the amount does not match.
                        </p>
                    </div>
                )}

                {tx.status === 'DUPLICATE' && (
                    <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
                        <div className="flex items-center gap-2 text-amber-300">
                            <Copy size={16} />

                            <p className="text-sm font-semibold">
                                Duplicate transaction
                            </p>
                        </div>

                        <p className="mt-2 text-xs leading-5 text-amber-100/60">
                            Existing server record found with the same
                            transaction reference.
                        </p>
                    </div>
                )}

                <div className="mt-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Event timeline
                    </p>

                    <div className="mt-3 space-y-3">
                        {[
                            [
                                'Transaction created',
                                'Offline device stored local record',
                                '10:31:08',
                                true,
                            ],
                            [
                                'Queued',
                                'Waiting for connectivity',
                                '10:31:09',
                                true,
                            ],
                            [
                                'Synchronization',
                                tx.status === 'QUEUED'
                                    ? 'Waiting for network'
                                    : 'Sync attempt completed',
                                '10:41:04',
                                tx.status !== 'QUEUED',
                            ],
                            [
                                'Reconciliation',
                                tx.status === 'QUEUED'
                                    ? 'Not started'
                                    : `${tx.status} result generated`,
                                '10:41:05',
                                tx.status !== 'QUEUED',
                            ],
                        ].map(([title, description, time, done], i) => (
                            <div
                                className="flex gap-3"
                                key={title}
                            >
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`mt-0.5 h-2.5 w-2.5 rounded-full ${done
                                                ? 'bg-blue-400'
                                                : 'bg-slate-700'
                                            }`}
                                    />

                                    {i < 3 && (
                                        <div className="mt-1 h-8 w-px bg-slate-800" />
                                    )}
                                </div>

                                <div className="-mt-1 flex-1">
                                    <div className="flex justify-between gap-3">
                                        <p className="text-xs font-medium text-slate-200">
                                            {title}
                                        </p>

                                        <p className="font-mono text-[9px] text-slate-600">
                                            {time}
                                        </p>
                                    </div>

                                    <p className="mt-0.5 text-[10px] text-slate-500">
                                        {description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {(tx.status === 'QUEUED' ||
                    tx.status === 'SYNCED') && (
                        <div className="mt-6 grid grid-cols-2 gap-2">
                            <button
                                onClick={() => reconcile(tx)}
                                className="rounded-xl bg-blue-500 px-4 py-3 text-xs font-semibold text-white hover:bg-blue-400"
                            >
                                Reconcile
                            </button>

                            <button
                                onClick={() => fail(tx)}
                                className="rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-xs font-semibold text-red-300"
                            >
                                Mark Failed
                            </button>
                        </div>
                    )}
            </aside>
        </div>
    );
}


// --------------------------------------------------
// MAIN APP
// --------------------------------------------------

export default function App() {
    const [active, setActive] = useState('dashboard');
    const [online, setOnline] = useState(true);

    const [rows, setRows] = useState(initial);
    const [logs, setLogs] = useState(initLogs);

    const [selected, setSelected] = useState(null);
    const [search, setSearch] = useState('');

    const [toast, setToast] = useState(null);
    const [loading, setLoading] = useState(false);

    const [useBackend, setUseBackend] = useState(true);
    const [lastSync, setLastSync] = useState('Just now');


    // --------------------------------------------------
    // STATS
    // --------------------------------------------------

    const stats = useMemo(
        () => ({
            total: rows.length,

            reconciled: rows.filter(
                (x) => x.status === 'RECONCILED'
            ).length,

            duplicate: rows.filter(
                (x) => x.status === 'DUPLICATE'
            ).length,

            conflict: rows.filter(
                (x) => x.status === 'CONFLICT'
            ).length,

            failed: rows.filter(
                (x) => x.status === 'FAILED'
            ).length,

            queued: rows.filter(
                (x) =>
                    x.status === 'QUEUED' ||
                    x.status === 'SYNCED'
            ).length,
        }),
        [rows]
    );


    // --------------------------------------------------
    // SEARCH
    // --------------------------------------------------

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();

        if (!q) return rows;

        return rows.filter((x) =>
            [
                x.id,
                x.customer,
                x.merchant,
                x.status,
            ].some((v) =>
                String(v ?? '')
                    .toLowerCase()
                    .includes(q)
            )
        );
    }, [rows, search]);


    // --------------------------------------------------
    // LOAD BACKEND DATA
    // --------------------------------------------------

    useEffect(() => {
        async function load() {
            if (!useBackend) return;

            try {
                const [transactions, auditLogs] =
                    await Promise.all([
                        getTransactions(),
                        getLogs(),
                    ]);

                if (
                    Array.isArray(transactions) &&
                    transactions.length
                ) {
                    setRows(transactions);
                }

                if (
                    Array.isArray(auditLogs) &&
                    auditLogs.length
                ) {
                    setLogs(auditLogs);
                }
            } catch (error) {
                console.error(error);
            }
        }

        load();
    }, [useBackend]);


    // --------------------------------------------------
    // TOAST
    // --------------------------------------------------

    useEffect(() => {
        if (!toast) return;

        const timer = setTimeout(
            () => setToast(null),
            2800
        );

        return () => clearTimeout(timer);
    }, [toast]);


    const notify = (
        message,
        type = 'success'
    ) => {
        setToast({
            message,
            type,
        });
    };


    // --------------------------------------------------
    // REFRESH
    // --------------------------------------------------

    const refresh = async () => {
        setLoading(true);

        try {
            const [transactions, auditLogs] =
                await Promise.all([
                    getTransactions(),
                    getLogs(),
                ]);

            if (Array.isArray(transactions)) {
                setRows(transactions);
            }

            if (Array.isArray(auditLogs)) {
                setLogs(auditLogs);
            }

            setLastSync(
                new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                })
            );

            notify('Dashboard refreshed from backend');
        } catch (error) {
            console.error(error);

            notify(
                'Backend unavailable — demo data active',
                'warning'
            );
        } finally {
            setLoading(false);
        }
    };


    // --------------------------------------------------
    // CREATE TRANSACTION
    // --------------------------------------------------

    const createTx = async () => {
        const id = `TXN${String(Date.now()).slice(-6)}`;

        const amount = [
            250,
            350,
            499,
            750,
            1299,
            2200,
        ][
            Math.floor(Math.random() * 6)
        ];

        const tx = {
            id,

            amount,

            customer: [
                'Rahul Kumar',
                'Priya Sharma',
                'Aman Verma',
                'Neha Gupta',
            ][
                Math.floor(Math.random() * 4)
            ],

            merchant: [
                'Campus Cafe',
                'City Mart',
                'Food Hub',
                'Tech Store',
            ][
                Math.floor(Math.random() * 4)
            ],

            source: 'OFFLINE',

            status: online
                ? 'SYNCED'
                : 'QUEUED',

            time: new Date().toLocaleTimeString([], {
                hour12: false,
            }),

            serverAmount: amount,
        };

        if (useBackend) {
            try {
                const created = await createTransaction({
                    transactionId: id,
                    customerName: tx.customer,
                    merchantName: tx.merchant,
                    amount,
                    source: 'OFFLINE',
                });

                setRows((p) => [
                    created,
                    ...p,
                ]);

                notify(
                    `${created.transactionId || id} created`
                );

                return;
            } catch (error) {
                console.error(error);
            }
        }

        setRows((p) => [
            tx,
            ...p,
        ]);

        notify(
            `${id} generated ${online
                ? 'and queued for sync'
                : 'offline'
            }`
        );
    };


    // --------------------------------------------------
    // DUPLICATE
    // --------------------------------------------------

    const duplicate = () => {
        const base =
            rows.find(
                (x) => x.status === 'RECONCILED'
            ) || rows[0];

        if (!base) return;

        const d = {
            ...base,

            id: `DUP-${base.id}-${Date.now()
                .toString()
                .slice(-3)}`,

            status: 'DUPLICATE',

            time: new Date().toLocaleTimeString([], {
                hour12: false,
            }),
        };

        setRows((p) => [
            d,
            ...p,
        ]);

        setLogs((p) => [
            {
                id: Date.now(),
                action: 'Duplicate Detection',
                tx: d.id,
                result: 'DUPLICATE',
                detail:
                    'Existing transaction reference detected',
                time: d.time,
            },
            ...p,
        ]);

        notify(
            'Duplicate scenario simulated',
            'warning'
        );
    };


    // --------------------------------------------------
    // CONFLICT - BACKEND VERSION
    // --------------------------------------------------

    const conflict = async () => {
        const base =
            rows.find(x => x.status === 'SYNCED') ||
            rows.find(x => x.status === 'QUEUED') ||
            rows[0];

        if (!base) {
            notify(
                'No transaction available for conflict test',
                'warning'
            );
            return;
        }

        try {
            await simulateConflict(base.transactionId || base.id);

            await refresh();

            notify(
                `Conflict detected for ${base.transactionId || base.id}`,
                'warning'
            );
        } catch (error) {
            console.error(error);
            notify('Failed to simulate conflict', 'error');
        }
    };


    // --------------------------------------------------
// SYNC
// --------------------------------------------------

const sync = async () => {
    if (!online) {
        notify(
            'Go Online first to synchronize',
            'warning'
        );

        return;
    }

    setLoading(true);

    if (useBackend) {
        try {
            const result =
                await syncTransactions();

            notify(
                result?.message ||
                'Synchronization completed'
            );

            await refresh();

            setLoading(false);

            return;
        } catch (error) {
            console.error(error);
        }
    }

    await new Promise(
        (resolve) =>
            setTimeout(resolve, 700)
    );

    setRows((p) =>
        p.map((x) =>
            x.status === 'QUEUED'
                ? {
                    ...x,
                    status: 'RECONCILED',
                    serverAmount: x.amount,
                }
                : x
        )
    );

    setLogs((p) => [
        {
            id: Date.now(),
            action: 'Sync',
            tx: 'BATCH',
            result: 'SUCCESS',
            detail:
                'Queued records synchronized',
            time: new Date().toLocaleTimeString([], {
                hour12: false,
            }),
        },
        ...p,
    ]);

    setLastSync(
        new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        })
    );

    notify(
        'Queued transactions synchronized'
    );

    setLoading(false);
};


// --------------------------------------------------
// RECONCILE
// --------------------------------------------------

const reconcile = async (tx) => {
    if (useBackend) {
        try {
            const result =
                await reconcileTransaction(
                    tx.transactionId || tx.id,
                    {
                        serverTransactionId:
                            tx.transactionId || tx.id,

                        amount:
                            tx.serverAmount ??
                            tx.amount,
                    }
                );

            setRows((p) =>
                p.map((x) =>
                    x.id === tx.id
                        ? {
                            ...x,
                            ...result,
                        }
                        : x
                )
            );

            notify(
                'Reconciliation result received'
            );

            setSelected({
                ...tx,
                ...result,
            });

            return;
        } catch (error) {
            console.error(error);
        }
    }

    setRows((p) =>
        p.map((x) =>
            x.id === tx.id
                ? {
                    ...x,
                    status: 'RECONCILED',
                    serverAmount: x.amount,
                }
                : x
        )
    );

    setLogs((p) => [
        {
            id: Date.now(),
            action: 'Reconciliation',
            tx: tx.id,
            result: 'RECONCILED',
            detail:
                'Offline and server records matched',
            time: new Date().toLocaleTimeString([], {
                hour12: false,
            }),
        },
        ...p,
    ]);

    notify(
        `${tx.id} reconciled successfully`
    );

    setSelected({
        ...tx,
        status: 'RECONCILED',
        serverAmount: tx.amount,
    });
};


// --------------------------------------------------
// FAIL
// --------------------------------------------------

const fail = async (tx) => {
    if (useBackend) {
        try {
            await failTransaction(
                tx.transactionId || tx.id,
                'Manual simulation failure'
            );

            notify(
                `${tx.id} marked as failed`,
                'warning'
            );

            await refresh();

            return;
        } catch (error) {
            console.error(error);
        }
    }

    setRows((p) =>
        p.map((x) =>
            x.id === tx.id
                ? {
                    ...x,
                    status: 'FAILED',
                }
                : x
        )
    );

    notify(
        `${tx.id} marked as failed`,
        'warning'
    );
};


// --------------------------------------------------
// UI
// --------------------------------------------------

return (
    <div className="min-h-screen bg-[#070b14] text-slate-200 grid-bg">

        {/* HEADER */}

        <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#070b14]/90 backdrop-blur-xl">
            <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-3 lg:px-6">

                <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 ring-1 ring-blue-400/20">
                        <Zap
                            size={18}
                            className="text-blue-300"
                        />
                    </div>

                    <div>
                        <h1 className="text-sm font-bold text-white">
                            OfflinePay
                        </h1>

                        <p className="text-[9px] uppercase tracking-[.22em] text-slate-500">
                            Transaction Reconciliation Simulator
                        </p>
                    </div>

                </div>

                <div className="flex items-center gap-2">

                    <div
                        className={`hidden items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold sm:flex ${online
                                ? 'border-emerald-400/20 bg-emerald-400/5 text-emerald-300'
                                : 'border-amber-400/20 bg-amber-400/5 text-amber-300'
                            }`}
                    >
                        <span
                            className={`h-1.5 w-1.5 rounded-full ${online
                                    ? 'bg-emerald-400 animate-pulse-soft'
                                    : 'bg-amber-400'
                                }`}
                        />

                        SYSTEM {online ? 'ONLINE' : 'OFFLINE'}
                    </div>

                    <button
                        onClick={() =>
                            setOnline((v) => !v)
                        }
                        className={`rounded-xl border px-3 py-2 text-[10px] font-semibold ${online
                                ? 'border-amber-400/20 bg-amber-400/5 text-amber-300'
                                : 'border-emerald-400/20 bg-emerald-400/5 text-emerald-300'
                            }`}
                    >
                        {online ? (
                            <WifiOff
                                size={14}
                                className="inline mr-1.5"
                            />
                        ) : (
                            <Wifi
                                size={14}
                                className="inline mr-1.5"
                            />
                        )}

                        {online
                            ? 'Go Offline'
                            : 'Go Online'}
                    </button>

                    <button
                        onClick={refresh}
                        className="rounded-xl border border-slate-700 bg-slate-900/60 p-2 text-slate-400 hover:text-white"
                    >
                        <RefreshCw
                            size={15}
                            className={
                                loading
                                    ? 'animate-spin'
                                    : ''
                            }
                        />
                    </button>

                </div>
            </div>
        </header>


        <div className="mx-auto flex max-w-[1500px]">

            {/* SIDEBAR */}

            <aside className="hidden w-56 shrink-0 border-r border-slate-800/80 px-3 py-5 lg:block">

                <div className="mb-5 px-3 text-[9px] font-semibold uppercase tracking-[.2em] text-slate-600">
                    Control Center
                </div>

                <nav className="space-y-1">

                    {nav.map(
                        ([id, label, I]) => (
                            <button
                                key={id}
                                onClick={() =>
                                    setActive(id)
                                }
                                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium ${active === id
                                        ? 'bg-blue-500/10 text-blue-300'
                                        : 'text-slate-500 hover:bg-slate-900 hover:text-slate-200'
                                    }`}
                            >
                                <I size={16} />
                                {label}
                            </button>
                        )
                    )}

                </nav>

                <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">

                    <div className="flex items-center gap-2 text-slate-300">
                        <Server size={15} />

                        <span className="text-xs font-semibold">
                            Backend
                        </span>
                    </div>

                    <p className="mt-2 text-[10px] leading-4 text-slate-600">
                        Spring Boot API with local simulator fallback.
                    </p>

                    <button
                        onClick={() =>
                            setUseBackend((v) => !v)
                        }
                        className={`mt-3 w-full rounded-lg border px-2 py-1.5 text-[10px] ${useBackend
                                ? 'border-emerald-400/20 text-emerald-300'
                                : 'border-slate-700 text-slate-500'
                            }`}
                    >
                        {useBackend
                            ? 'API Connected Mode'
                            : 'Demo Mode'}
                    </button>

                </div>
            </aside>


            {/* MAIN */}

            <main className="min-w-0 flex-1 px-4 py-5 lg:px-6">

                <div className="mb-5 flex items-end justify-between gap-3">

                    <div>

                        <div className="mb-1 flex items-center gap-2 text-[10px] text-slate-600">
                            <Activity size={12} />
                            LIVE SIMULATION
                        </div>

                        <h2 className="text-2xl font-bold text-white">
                            {active === 'dashboard'
                                ? 'Reconciliation Dashboard'
                                : active === 'transactions'
                                    ? 'Transaction Ledger'
                                    : active === 'reconciliation'
                                        ? 'Reconciliation Center'
                                        : 'Audit Logs'}
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            Simulate offline payment records and observe reconciliation.
                        </p>

                    </div>

                    <div className="hidden text-right sm:block">
                        <p className="text-[9px] uppercase tracking-wider text-slate-600">
                            Last sync
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            {lastSync}
                        </p>
                    </div>

                </div>


                {/* DASHBOARD */}

                {active === 'dashboard' && (
                    <div className="space-y-5">

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">

                            <Card
                                title="Total Transactions"
                                value={stats.total}
                                hint="All simulated records"
                                icon={CircleDollarSign}
                            />

                            <Card
                                title="Reconciled"
                                value={stats.reconciled}
                                hint="Records matched"
                                icon={CheckCircle2}
                                tone="green"
                            />

                            <Card
                                title="Duplicate"
                                value={stats.duplicate}
                                hint="Duplicate detected"
                                icon={Copy}
                                tone="amber"
                            />

                            <Card
                                title="Conflict"
                                value={stats.conflict}
                                hint="Mismatch detected"
                                icon={AlertTriangle}
                                tone="red"
                            />

                            <Card
                                title="Failed"
                                value={stats.failed}
                                hint="Sync / processing failed"
                                icon={FileWarning}
                                tone="violet"
                            />

                        </div>


                        <div className="grid gap-5 xl:grid-cols-[1fr_330px]">

                            {/* SIMULATION */}

                            <div className="glass rounded-2xl p-5">

                                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                                    <div>
                                        <h2 className="font-semibold text-white">
                                            Simulation Control
                                        </h2>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Generate edge cases for the hackathon demo.
                                        </p>
                                    </div>

                                    <div
                                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[10px] font-semibold ${online
                                                ? 'border-emerald-400/15 bg-emerald-400/5 text-emerald-300'
                                                : 'border-amber-400/15 bg-amber-400/5 text-amber-300'
                                            }`}
                                    >
                                        {online ? (
                                            <Wifi size={14} />
                                        ) : (
                                            <WifiOff size={14} />
                                        )}

                                        Network{' '}
                                        {online
                                            ? 'Available'
                                            : 'Unavailable'}
                                    </div>

                                </div>


                                <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">

                                    <button
                                        onClick={createTx}
                                        className="rounded-xl bg-blue-500 px-3 py-3 text-xs font-semibold text-white hover:bg-blue-400"
                                    >
                                        <Play
                                            size={14}
                                            className="mx-auto mb-1"
                                        />

                                        Generate Transaction
                                    </button>

                                    <button
                                        onClick={duplicate}
                                        className="rounded-xl border border-amber-400/15 bg-amber-400/5 px-3 py-3 text-xs font-semibold text-amber-300"
                                    >
                                        <Copy
                                            size={14}
                                            className="mx-auto mb-1"
                                        />

                                        Simulate Duplicate
                                    </button>

                                    <button
                                        onClick={conflict}
                                        className="rounded-xl border border-red-400/15 bg-red-400/5 px-3 py-3 text-xs font-semibold text-red-300"
                                    >
                                        <AlertTriangle
                                            size={14}
                                            className="mx-auto mb-1"
                                        />

                                        Simulate Conflict
                                    </button>

                                    <button
                                        onClick={sync}
                                        disabled={loading}
                                        className="rounded-xl border border-emerald-400/15 bg-emerald-400/5 px-3 py-3 text-xs font-semibold text-emerald-300"
                                    >
                                        <RefreshCw
                                            size={14}
                                            className={`mx-auto mb-1 ${loading
                                                    ? 'animate-spin'
                                                    : ''
                                                }`}
                                        />

                                        Reconnect & Sync
                                    </button>

                                </div>


                                <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">

                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Clock3 size={13} />

                                        Offline queue

                                        <span className="font-semibold text-slate-200">
                                            {stats.queued}
                                        </span>
                                    </div>

                                    <button
                                        onClick={() =>
                                            setActive('transactions')
                                        }
                                        className="flex items-center gap-1 text-[11px] font-semibold text-blue-300"
                                    >
                                        View ledger
                                        <ArrowRight size={13} />
                                    </button>

                                </div>

                            </div>


                            {/* HEALTH */}

                            <div className="glass rounded-2xl p-5">

                                <div className="flex items-center justify-between">

                                    <div>
                                        <h2 className="font-semibold text-white">
                                            Reconciliation Health
                                        </h2>

                                        <p className="text-xs text-slate-500">
                                            Current simulator state
                                        </p>
                                    </div>

                                    <ShieldCheck
                                        size={18}
                                        className="text-emerald-300"
                                    />

                                </div>

                                <div className="mt-5">

                                    <div className="flex items-end justify-between">

                                        <span className="text-xs text-slate-500">
                                            Match rate
                                        </span>

                                        <span className="text-xl font-bold text-white">
                                            {stats.total
                                                ? Math.round(
                                                    (stats.reconciled /
                                                        stats.total) *
                                                    100
                                                )
                                                : 0}
                                            %
                                        </span>

                                    </div>

                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">

                                        <div
                                            className="h-full rounded-full bg-emerald-400"
                                            style={{
                                                width: `${stats.total
                                                        ? (stats.reconciled /
                                                            stats.total) *
                                                        100
                                                        : 0
                                                    }%`,
                                            }}
                                        />

                                    </div>

                                </div>

                                <div className="mt-5 grid grid-cols-2 gap-2">

                                    <Mini
                                        label="Queued"
                                        value={stats.queued}
                                    />

                                    <Mini
                                        label="Exceptions"
                                        value={
                                            stats.duplicate +
                                            stats.conflict +
                                            stats.failed
                                        }
                                    />

                                </div>

                                <div className="mt-4 rounded-xl border border-blue-400/10 bg-blue-400/5 p-3">

                                    <p className="text-[10px] font-semibold text-blue-300">
                                        Engine status
                                    </p>

                                    <p className="mt-1 text-[10px] leading-4 text-slate-500">
                                        Idempotency and record matching layer is ready.
                                    </p>

                                </div>

                            </div>

                        </div>


                        <Pipeline
                            online={online}
                            q={stats.queued}
                        />


                        <div className="flex items-center justify-between">

                            <div>
                                <h2 className="font-semibold text-white">
                                    Recent Transactions
                                </h2>

                                <p className="text-xs text-slate-500">
                                    Latest records
                                </p>
                            </div>

                            <button
                                onClick={() =>
                                    setActive('transactions')
                                }
                                className="text-[11px] font-semibold text-blue-300"
                            >
                                View all
                            </button>

                        </div>

                        <Table
                            rows={rows.slice(0, 8)}
                            onSelect={setSelected}
                        />

                    </div>
                )}


                {/* TRANSACTIONS */}

                {active === 'transactions' && (
                    <div className="space-y-4">

                        <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-[#0c1220] p-4 sm:flex-row">

                            <div className="relative flex-1">

                                <Search
                                    size={15}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                                />

                                <input
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Search transaction, customer, merchant or status..."
                                    className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 pl-9 pr-3 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-blue-400/30"
                                />

                            </div>

                            <button
                                onClick={createTx}
                                className="rounded-xl bg-blue-500 px-4 py-2 text-xs font-semibold text-white"
                            >
                                + New Transaction
                            </button>

                        </div>

                        <Table
                            rows={filtered}
                            onSelect={setSelected}
                        />

                    </div>
                )}


                {/* RECONCILIATION */}

                {active === 'reconciliation' && (
                    <div className="space-y-5">

                        <Pipeline
                            online={online}
                            q={stats.queued}
                        />

                        <div className="grid gap-4 md:grid-cols-3">

                            <Card
                                title="Ready to Sync"
                                value={stats.queued}
                                hint="Waiting for connectivity"
                                icon={RefreshCw}
                            />

                            <Card
                                title="Exceptions"
                                value={
                                    stats.duplicate +
                                    stats.conflict +
                                    stats.failed
                                }
                                hint="Require attention"
                                icon={AlertTriangle}
                                tone="amber"
                            />

                            <Card
                                title="Matched"
                                value={stats.reconciled}
                                hint="Successfully reconciled"
                                icon={ShieldCheck}
                                tone="green"
                            />

                        </div>

                        <Table
                            rows={rows.filter((x) =>
                                [
                                    'QUEUED',
                                    'SYNCED',
                                    'CONFLICT',
                                    'DUPLICATE',
                                    'FAILED',
                                ].includes(x.status)
                            )}
                            onSelect={setSelected}
                        />

                    </div>
                )}


                {/* LOGS */}

                {active === 'logs' && (
                    <div className="rounded-2xl border border-slate-800 bg-[#0c1220]">

                        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">

                            <div>
                                <h2 className="font-semibold text-white">
                                    Audit Logs
                                </h2>

                                <p className="text-xs text-slate-500">
                                    Every sync and reconciliation event
                                </p>
                            </div>

                            <button
                                onClick={() =>
                                    setLogs([])
                                }
                                className="text-[10px] text-slate-600 hover:text-red-300"
                            >
                                Clear demo logs
                            </button>

                        </div>

                        <div className="divide-y divide-slate-800/80">

                            {logs.map((l) => (
                                <div
                                    key={l.id}
                                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                                >

                                    <div className="flex items-start gap-3">

                                        <div className="mt-0.5 rounded-lg bg-slate-800 p-2 text-slate-400">
                                            <History size={14} />
                                        </div>

                                        <div>

                                            <p className="text-xs font-semibold text-slate-200">
                                                {l.action}{' '}
                                                <span className="font-mono text-slate-500">
                                                    · {l.tx}
                                                </span>
                                            </p>

                                            <p className="mt-1 text-[10px] text-slate-500">
                                                {l.detail}
                                            </p>

                                        </div>

                                    </div>

                                    <div className="flex items-center gap-3">

                                        <Badge
                                            status={
                                                l.result === 'SUCCESS'
                                                    ? 'RECONCILED'
                                                    : l.result
                                            }
                                        />

                                        <span className="font-mono text-[9px] text-slate-600">
                                            {l.time}
                                        </span>

                                    </div>

                                </div>
                            ))}

                            {!logs.length && (
                                <div className="p-10 text-center text-sm text-slate-600">
                                    No audit events.
                                </div>
                            )}

                        </div>

                    </div>
                )}

            </main>
        </div>


        {/* DRAWER */}

        <Drawer
            tx={selected}
            close={() =>
                setSelected(null)
            }
            reconcile={reconcile}
            fail={fail}
        />


        {/* TOAST */}

        {toast && (
            <div className="fixed bottom-5 right-5 z-[60] rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 shadow-2xl slide-in">

                <div className="flex items-center gap-3">

                    {toast.type === 'warning' ? (
                        <AlertTriangle
                            size={16}
                            className="text-amber-300"
                        />
                    ) : (
                        <CheckCircle2
                            size={16}
                            className="text-emerald-300"
                        />
                    )}

                    <p className="text-xs font-medium text-slate-200">
                        {toast.message}
                    </p>

                </div>

            </div>
        )}

    </div>
);
}