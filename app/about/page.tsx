"use client";

import { CheckCircle2, Cpu, Globe, Layers, Code2, Shield } from "lucide-react";

export default function AboutPage() {
    return (
        <main className="h-screen w-full bg-[#121212] text-white flex flex-col overflow-y-auto">
            <div className="max-w-4xl mx-auto w-full p-12">
                <div className="mb-12">
                    <h1 className="text-4xl font-bold mb-4">About <span className="text-nodus-green">Nodus</span></h1>
                    <p className="text-xl text-zinc-400">
                        An intelligent, full-stack coding tutor built for modern learners.
                    </p>
                </div>

                <div className="space-y-12">
                    {/* What is Nodus? */}
                    <section className="bg-[#18181b] p-8 rounded-2xl border border-white/5">
                        <h2 className="text-xl font-semibold text-white mb-4">What is Nodus?</h2>
                        <p className="text-zinc-400 leading-relaxed mb-6">
                            Nodus isn't just a chatbot wrapper. It is a purpose-built educational platform that integrates
                            **Contextual AI**, **Live Code Execution**, and **Knowledge Management** into a single interface.
                            We realized that learning to code often involves jumping between generic AI chats, heavy IDEs, and
                            scattered notes. Nodus unifies these into one cohesive workflow.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-zinc-300 border border-white/10">Education</span>
                            <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-zinc-300 border border-white/10">Productivity</span>
                            <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-zinc-300 border border-white/10">AI Agents</span>
                        </div>
                    </section>

                    {/* Tech Stack */}
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                            <Layers size={20} className="text-blue-400" />
                            Under the Hood
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-5 bg-[#18181b] rounded-xl border border-white/5 hover:bg-white/[0.02] transition-colors group">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="bg-blue-500/10 p-2 rounded-lg text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                                        <Globe size={20} />
                                    </div>
                                    <h3 className="font-medium text-white">Next.js & Frontend</h3>
                                </div>
                                <p className="text-sm text-zinc-500">
                                    Built on Next.js 14 (App Router) for server-side performance.
                                    Styled with Tailwind CSS and Framer Motion for a sleek, responsive dark-mode UI.
                                </p>
                            </div>

                            <div className="p-5 bg-[#18181b] rounded-xl border border-white/5 hover:bg-white/[0.02] transition-colors group">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="bg-green-500/10 p-2 rounded-lg text-nodus-green group-hover:bg-green-500/20 transition-colors">
                                        <Cpu size={20} />
                                    </div>
                                    <h3 className="font-medium text-white">Gemini 1.5 Flash</h3>
                                </div>
                                <p className="text-sm text-zinc-500">
                                    Powered by Google's latest Gemini model. We use advanced prompt engineering to ensure
                                    Sage acts as a tutor (Socratic method) rather than just a code completion tool.
                                </p>
                            </div>

                            <div className="p-5 bg-[#18181b] rounded-xl border border-white/5 hover:bg-white/[0.02] transition-colors group">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="bg-yellow-500/10 p-2 rounded-lg text-yellow-500 group-hover:bg-yellow-500/20 transition-colors">
                                        <Code2 size={20} />
                                    </div>
                                    <h3 className="font-medium text-white">Piston API & Monaco</h3>
                                </div>
                                <p className="text-sm text-zinc-500">
                                    The "Sandbox" embeds the VS Code editor (Monaco) and uses the Piston API to remotely
                                    execute C, C++, and Python code in secure, isolated containers.
                                </p>
                            </div>

                            <div className="p-5 bg-[#18181b] rounded-xl border border-white/5 hover:bg-white/[0.02] transition-colors group">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="bg-orange-500/10 p-2 rounded-lg text-orange-500 group-hover:bg-orange-500/20 transition-colors">
                                        <Shield size={20} />
                                    </div>
                                    <h3 className="font-medium text-white">Firebase & Persistence</h3>
                                </div>
                                <p className="text-sm text-zinc-500">
                                    User authentication, chat history, and the Concept Wallet are all persisted in Firebase
                                    Firestore, ensuring your learning journey is never lost.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
