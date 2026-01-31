"use client";

import { ArrowRight, Code2, MessageSquare, Brain, Shield } from "lucide-react";

export default function UserFlowPage() {
    return (
        <main className="h-screen w-full bg-[#121212] text-white flex flex-col overflow-y-auto">
            <div className="max-w-5xl mx-auto w-full p-12">
                <h1 className="text-3xl font-bold mb-4 text-white">Nodus User Journey</h1>
                <p className="text-zinc-400 mb-12">How to master coding concepts using the Nodus ecosystem.</p>

                <div className="grid gap-12 relative">
                    {/* Vertical Connecting Line (Visual only) */}
                    <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-blue-500/20 via-nodus-green/20 to-purple-500/20 md:block hidden" />

                    {/* Step 1: Learn & Explore */}
                    <div className="flex gap-6 relative">
                        <div className="w-14 h-14 rounded-full bg-[#18181b] border border-blue-500/30 flex items-center justify-center flex-shrink-0 z-10 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                            <MessageSquare size={24} className="text-blue-400" />
                        </div>
                        <div className="flex-1 bg-[#18181b] p-6 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-colors">
                            <h3 className="text-xl font-semibold text-white mb-2">1. The Notebook (Sage Chat)</h3>
                            <p className="text-zinc-400 leading-relaxed">
                                Start by asking questions in the <strong>Notebook</strong>. Sage (our Gemini-powered AI) doesn't just give answers; it provides <em>context-aware explanations</em>.
                                <br /><br />
                                If Sage explains a key concept (like "Recursion" or "Pointers"), you can save it directly to your <strong>Concept Wallet</strong> with a single click.
                            </p>
                        </div>
                    </div>

                    {/* Step 2: Experiment */}
                    <div className="flex gap-6 relative">
                        <div className="w-14 h-14 rounded-full bg-[#18181b] border border-nodus-green/30 flex items-center justify-center flex-shrink-0 z-10 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                            <Code2 size={24} className="text-nodus-green" />
                        </div>
                        <div className="flex-1 bg-[#18181b] p-6 rounded-2xl border border-white/5 hover:border-nodus-green/30 transition-colors">
                            <h3 className="text-xl font-semibold text-white mb-2">2. The Code Sandbox</h3>
                            <p className="text-zinc-400 leading-relaxed">
                                Theories aren't enough. Switch to the <strong>Sandbox</strong> to write real code.
                                <br /><br />
                                Nodus supports <strong>C, C++, Python, and JavaScript</strong>.
                                The environment is "Logic-First"—we handle the compilation and execution via the Piston API so you can focus purely on writing the algorithm.
                            </p>
                        </div>
                    </div>

                    {/* Step 3: Secure Knowledge */}
                    <div className="flex gap-6 relative">
                        <div className="w-14 h-14 rounded-full bg-[#18181b] border border-yellow-500/30 flex items-center justify-center flex-shrink-0 z-10 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                            <Shield size={24} className="text-yellow-500" />
                        </div>
                        <div className="flex-1 bg-[#18181b] p-6 rounded-2xl border border-white/5 hover:border-yellow-500/30 transition-colors">
                            <h3 className="text-xl font-semibold text-white mb-2">3. The Wallet</h3>
                            <p className="text-zinc-400 leading-relaxed">
                                Your <strong>Concept Wallet</strong> is your personal knowledge vault. Unlike a standard chat history, this stores *structured concepts*.
                                <br /><br />
                                Review your saved notes here before exams or interviews to refresh your memory on specific topics you found difficult.
                            </p>
                        </div>
                    </div>

                    {/* Step 4: Verify */}
                    <div className="flex gap-6 relative">
                        <div className="w-14 h-14 rounded-full bg-[#18181b] border border-purple-500/30 flex items-center justify-center flex-shrink-0 z-10 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                            <Brain size={24} className="text-purple-500" />
                        </div>
                        <div className="flex-1 bg-[#18181b] p-6 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-colors">
                            <h3 className="text-xl font-semibold text-white mb-2">4. The Quiz</h3>
                            <p className="text-zinc-400 leading-relaxed">
                                When you're ready, head to the <strong>Quiz</strong> section. Nodus generates custom questions based on the concepts currently in your Wallet.
                                <br /><br />
                                This "Active Recall" step ensures you actually understand the material, rather than just passively reading it.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}
