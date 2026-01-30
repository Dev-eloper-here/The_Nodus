"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Wallet, ShieldAlert, Lightbulb, Plus, Search, Trash2, ArrowRight, X, Edit2, ChevronDown, ChevronUp, Expand } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, addDoc } from "firebase/firestore";

// Types
interface WalletItem {
    id: string;
    title: string;
    date: string;
    tags: string[];
    type: 'concept' | 'error';
    summary?: string; // for concepts
    severity?: 'low' | 'medium' | 'high'; // for errors
    status?: 'unresolved' | 'resolved'; // for errors
}

export default function WalletPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'concepts' | 'errors'>('concepts');
    const [items, setItems] = useState<WalletItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // Edit Mode
    const [editingItem, setEditingItem] = useState<WalletItem | null>(null);

    // Form State
    const [newTitle, setNewTitle] = useState("");
    const [newSummary, setNewSummary] = useState("");
    const [newTags, setNewTags] = useState("");
    const [newSeverity, setNewSeverity] = useState("medium");

    useEffect(() => {
        if (user) fetchWallet();
    }, [user]);

    // Populate form when editing
    useEffect(() => {
        if (editingItem) {
            setIsAdding(true);
            setNewTitle(editingItem.title);
            setNewSummary(editingItem.summary || "");
            setNewTags(editingItem.tags.join(", "));
            setNewSeverity(editingItem.severity || "medium");
        }
    }, [editingItem]);

    const fetchWallet = async () => {
        if (!user) return;
        try {
            // Use local API for full CRUD (or keep firestore direct for READ)?
            // Let's stick to API for consistency now that we have it
            const res = await fetch(`/api/wallet?userId=${user.uid}`);
            const data = await res.json();
            if (data.items) setItems(data.items);
        } catch (error) {
            console.error("Failed to fetch wallet:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveItem = async () => {
        if (!newTitle.trim() || !user) return;

        const type = activeTab === 'concepts' ? 'concept' : 'error';
        const tags = newTags.split(',').map(t => t.trim()).filter(Boolean);

        const itemData = {
            title: newTitle,
            type,
            tags: tags.length ? tags : [type],
            summary: newSummary,

            ...(type === 'error' && { severity: newSeverity }),
            // Only set status default for new items, keep existing for edits
            ...(!editingItem && type === 'error' && { status: 'unresolved' })
        };

        try {
            if (editingItem) {
                // UPDATE
                await fetch("/api/wallet", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: editingItem.id, ...itemData })
                });
            } else {
                // CREATE
                await fetch("/api/wallet", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...itemData, userId: user.uid })
                });
            }

            await fetchWallet();
            closeForm();
        } catch (error: any) {
            console.error("Failed to save item:", error);
            alert(`Failed to save: ${error.message}`);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this item?")) return;

        try {
            await fetch("/api/wallet", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id })
            });
            await fetchWallet(); // Refresh list
        } catch (error) {
            console.error(error);
        }
    };

    const closeForm = () => {
        setIsAdding(false);
        setEditingItem(null);
        setNewTitle("");
        setNewSummary("");
        setNewTags("");
        setNewSeverity("medium");
    };

    return (
        <main className="flex h-screen w-full bg-[#121212] text-white overflow-hidden font-sans">
            {/* Left Pane - Sidebar */}
            <div className="w-64 flex-shrink-0 border-r border-white/5 bg-[#18181b]">
                <Sidebar />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#18181b]">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Wallet size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tight">Knowledge Wallet</h1>
                            <p className="text-xs text-zinc-400 font-medium">Manage your saved concepts and error logs</p>
                        </div>
                    </div>
                </header>

                {/* Sub-Header / Tabs */}
                <div className="px-8 py-6">
                    <div className="flex p-1 bg-[#1e1e1e] rounded-xl border border-white/5 w-fit">
                        <button
                            onClick={() => setActiveTab('concepts')}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                activeTab === 'concepts'
                                    ? "bg-[#27272a] text-white shadow-sm ring-1 ring-white/10"
                                    : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            <Lightbulb size={16} className={activeTab === 'concepts' ? "text-yellow-500" : ""} />
                            Concept Wallet
                        </button>
                        <button
                            onClick={() => setActiveTab('errors')}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                activeTab === 'errors'
                                    ? "bg-[#27272a] text-white shadow-sm ring-1 ring-white/10"
                                    : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            <ShieldAlert size={16} className={activeTab === 'errors' ? "text-red-500" : ""} />
                            Error Wallet
                        </button>
                    </div>
                </div>

                {/* Add Item Modal / Inline Form */}
                {isAdding && (
                    <div className="mx-8 mb-8 p-6 bg-[#1e1e1e] border border-white/10 rounded-2xl animate-in slide-in-from-top-4">
                        <div className="flex justify-between mb-4">
                            <h3 className="font-semibold">{editingItem ? "Edit Item" : (activeTab === 'concepts' ? "New Concept" : "Log Error")}</h3>
                            <button onClick={closeForm}><X size={18} /></button>
                        </div>
                        <div className="space-y-4">
                            <input
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm"
                                placeholder="Title (e.g. React Hooks)"
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                            />
                            <textarea
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm h-24"
                                placeholder={activeTab === 'concepts' ? "Summary of what you learned..." : "Explain the error and fix..."}
                                value={newSummary}
                                onChange={e => setNewSummary(e.target.value)}
                            />
                            <input
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm"
                                placeholder="Tags (comma separated)"
                                value={newTags}
                                onChange={e => setNewTags(e.target.value)}
                            />
                            {activeTab === 'errors' && (
                                <select
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm"
                                    value={newSeverity}
                                    onChange={e => setNewSeverity(e.target.value)}
                                >
                                    <option value="low">Low Severity</option>
                                    <option value="medium">Medium Severity</option>
                                    <option value="high">High Severity</option>
                                </select>
                            )}
                            <div className="flex justify-end gap-2">
                                <button onClick={closeForm} className="px-4 py-2 text-sm text-zinc-400">Cancel</button>
                                <button onClick={handleSaveItem} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm">
                                    {editingItem ? "Update Item" : "Save Item"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}


                {/* Content Area */}
                <div className="flex-1 overflow-y-auto px-8 pb-8">
                    {!user ? (
                        <div className="text-center text-zinc-500 mt-20">Please sign in to view your wallet.</div>
                    ) : isLoading ? (
                        <div className="text-center text-zinc-500 mt-20">Loading wallet...</div>
                    ) : activeTab === 'concepts' ? (
                        <ConceptWalletSection
                            data={items.filter(i => i.type === 'concept')}
                            onAdd={() => { setEditingItem(null); setIsAdding(true); }}
                            onEdit={(item) => { setEditingItem(item); }}
                            onDelete={(id, e) => handleDelete(id, e)}
                        />
                    ) : (
                        <ErrorWalletSection
                            data={items.filter(i => i.type === 'error')}
                            onAdd={() => { setEditingItem(null); setIsAdding(true); }}
                            onEdit={(item) => { setEditingItem(item); }}
                            onDelete={(id, e) => handleDelete(id, e)}
                        />
                    )}
                </div>
            </div>
        </main>
    );
}

// ----------------------------------------------------------------------
// Concept Card Component
// ----------------------------------------------------------------------
function ConceptWalletSection({ data, onAdd, onEdit, onDelete }: {
    data: WalletItem[],
    onAdd: () => void,
    onEdit: (item: WalletItem) => void,
    onDelete: (id: string, e: React.MouseEvent) => void
}) {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const toggleExpand = (id: string) => {
        const newSet = new Set(expandedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedIds(newSet);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Lightbulb size={18} className="text-yellow-500" />
                    Saved Concepts
                </h2>
                <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 text-yellow-500 text-sm font-medium rounded-lg hover:bg-yellow-500/20 transition-colors border border-yellow-500/20">
                    <Plus size={16} />
                    New
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.map((concept) => (
                    <div key={concept.id} className="group bg-[#1e1e1e] border border-white/5 rounded-2xl p-5 hover:border-yellow-500/30 transition-all hover:shadow-lg hover:shadow-yellow-500/5 relative">
                        {/* Card Header */}
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex gap-2 flex-wrap">
                                {concept.tags?.map(tag => (
                                    <span key={tag} className="text-[10px] px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/10">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            <span className="text-zinc-600 text-[10px]">{concept.date}</span>
                        </div>

                        <h3 className="font-semibold text-white mb-2 group-hover:text-yellow-400 transition-colors">{concept.title}</h3>

                        {/* Summary (Collapsible) */}
                        <div className={cn(
                            "text-sm text-zinc-400 leading-relaxed mb-12 transition-all",
                            expandedIds.has(concept.id) ? "" : "line-clamp-3"
                        )}>
                            {concept.summary}
                        </div>

                        {/* Actions Bar (Open/Edit/Delete) */}
                        <div className="absolute bottom-4 right-4 left-4 flex justify-between items-center border-t border-white/5 pt-3">
                            {/* Open / Toggle Expand */}
                            <button onClick={() => toggleExpand(concept.id)} className="text-xs text-zinc-500 hover:text-white flex items-center gap-1 transition-colors">
                                {expandedIds.has(concept.id) ? (
                                    <><ChevronUp size={14} /> Collapse</>
                                ) : (
                                    <><Expand size={14} /> Open</>
                                )}
                            </button>

                            <div className="flex gap-2">
                                <button onClick={() => onEdit(concept)} className="p-1.5 text-zinc-500 hover:text-blue-400 rounded-md hover:bg-blue-500/10 transition-colors">
                                    <Edit2 size={14} />
                                </button>
                                <button onClick={(e) => onDelete(concept.id, e)} className="p-1.5 text-zinc-500 hover:text-red-500 rounded-md hover:bg-red-500/10 transition-colors">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Empty State */}
                {data.length === 0 && (
                    <div onClick={onAdd} className="bg-[#1e1e1e]/50 border-2 border-dashed border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:border-white/10 hover:bg-[#1e1e1e] transition-all min-h-[200px]">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-3">
                            <Plus size={20} className="text-zinc-500" />
                        </div>
                        <p className="text-sm font-medium text-zinc-400">Save your first concept</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// Error Card Component
// ----------------------------------------------------------------------
function ErrorWalletSection({ data, onAdd, onEdit, onDelete }: {
    data: WalletItem[],
    onAdd: () => void,
    onEdit: (item: WalletItem) => void,
    onDelete: (id: string, e: React.MouseEvent) => void
}) {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const toggleExpand = (id: string) => {
        const newSet = new Set(expandedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedIds(newSet);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <ShieldAlert size={18} className="text-red-500" />
                    Error Logs
                </h2>
                <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 text-sm font-medium rounded-lg hover:bg-red-500/20 transition-colors border border-red-500/20">
                    <Plus size={16} />
                    Log Error
                </button>
            </div>

            <div className="space-y-3">
                {data.map((error) => (
                    <div key={error.id} className="group flex flex-col p-4 bg-[#1e1e1e] border border-white/5 rounded-xl hover:border-red-500/30 transition-all">

                        <div className="flex items-center w-full">
                            <div className={cn(
                                "w-2 h-2 rounded-full mr-4 flex-shrink-0",
                                error.severity === 'high' ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" :
                                    error.severity === 'medium' ? "bg-orange-500" : "bg-blue-500"
                            )} />

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-sm font-semibold text-white truncate">{error.title}</h3>
                                    {error.status === 'resolved' && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-500 border border-green-500/10">Resolved</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                    <span>{error.date}</span>
                                    <span>•</span>
                                    <div className="flex gap-1">
                                        {error.tags?.map(tag => <span key={tag} className="text-zinc-400">#{tag}</span>)}
                                    </div>
                                </div>
                            </div>

                            {/* Actions Right Side */}
                            <div className="flex items-center gap-2 pl-4 border-l border-white/5 ml-4">
                                <button onClick={() => toggleExpand(error.id)} className="p-2 text-zinc-500 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                                    {expandedIds.has(error.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Expanded Content (Details + Edit/Delete) */}
                        {expandedIds.has(error.id) && (
                            <div className="mt-4 pt-4 border-t border-white/5 pl-6 animate-in slide-in-from-top-2">
                                <p className="text-sm text-zinc-400 leading-relaxed mb-4 whitespace-pre-wrap">
                                    {error.summary}
                                </p>
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => onEdit(error)} className="flex items-center gap-2 px-3 py-1.5 text-xs bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors">
                                        <Edit2 size={12} /> Edit
                                    </button>
                                    <button onClick={(e) => onDelete(error.id, e)} className="flex items-center gap-2 px-3 py-1.5 text-xs bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors">
                                        <Trash2 size={12} /> Delete
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {data.length === 0 && (
                    <div onClick={onAdd} className="bg-[#1e1e1e]/50 border-2 border-dashed border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-white/10 hover:bg-[#1e1e1e] transition-all">
                        <p className="text-sm font-medium text-zinc-400">No errors logged manually yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}
