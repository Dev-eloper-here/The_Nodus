"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Brain, Trophy, ChevronRight, RefreshCw, Loader2, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Question {
    question: string;
    options: string[];
    answer: number;
    explanation: string;
}

export default function QuizPage() {
    const [topic, setTopic] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'finished'>('idle');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [score, setScore] = useState(0);
    const [showExplanation, setShowExplanation] = useState(false);

    const handleGenerateQuiz = async () => {
        if (!topic.trim()) return;

        setIsLoading(true);
        setQuestions([]);
        setGameStatus('idle');

        try {
            const res = await fetch("/api/quiz", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topic }),
            });

            const data = await res.json();

            if (data.questions) {
                setQuestions(data.questions);
                setGameStatus('playing');
                setCurrentQuestionIndex(0);
                setScore(0);
                setSelectedOption(null);
                setShowExplanation(false);
            } else {
                alert("Failed to generate quiz. Try a different topic.");
            }
        } catch (error) {
            console.error(error);
            alert("Something went wrong.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOptionSelect = (index: number) => {
        if (selectedOption !== null) return; // Prevent changing answer

        setSelectedOption(index);
        setShowExplanation(true);

        if (index === questions[currentQuestionIndex].answer) {
            setScore(prev => prev + 1);
        }
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedOption(null);
            setShowExplanation(false);
        } else {
            setGameStatus('finished');
        }
    };

    return (
        <main className="flex h-screen w-full bg-[#121212] text-white overflow-hidden font-sans">
            {/* Sidebar */}
            <div className="w-64 flex-shrink-0 border-r border-white/5 bg-[#18181b]">
                <Sidebar />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#121212]">
                {/* Header */}
                <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#18181b]">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <Brain size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tight">AI Quiz Generator</h1>
                            <p className="text-xs text-zinc-400 font-medium">Test your knowledge on any topic</p>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center">

                    {/* IDLE STATE: Generate Quiz */}
                    {gameStatus === 'idle' && (
                        <div className="w-full max-w-xl mt-20 text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="space-y-4">
                                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                                    What do you want to learn?
                                </h2>
                                <p className="text-zinc-400">Enter a topic, and I'll generate a custom 5-question quiz for you instantly.</p>
                            </div>

                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-25 group-focus-within:opacity-75 transition duration-1000 group-hover:opacity-75" />
                                <div className="relative flex gap-2 p-2 bg-[#1e1e1e] rounded-xl border border-white/10">
                                    <input
                                        type="text"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleGenerateQuiz()}
                                        placeholder="e.g. React Hooks, Python Data Science, Quantum Physics"
                                        className="flex-1 bg-transparent border-none text-white placeholder:text-zinc-600 focus:outline-none px-4"
                                        disabled={isLoading}
                                    />
                                    <button
                                        onClick={handleGenerateQuiz}
                                        disabled={isLoading || !topic.trim()}
                                        className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Generate"}
                                    </button>
                                </div>
                            </div>

                            {/* Suggestions */}
                            <div className="pt-8">
                                <p className="text-xs text-zinc-500 mb-4 uppercase tracking-widest">Popular Topics</p>
                                <div className="flex flex-wrap justify-center gap-3">
                                    {['JavaScript Basics', 'CSS Flexbox', 'Golang Concurrency', 'Machine Learning'].map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setTopic(t)}
                                            className="px-4 py-2 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-purple-500/30 text-sm text-zinc-300 transition-all"
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PLAYING STATE */}
                    {gameStatus === 'playing' && questions.length > 0 && (
                        <div className="w-full max-w-2xl mt-10 space-y-8 animate-in fade-in duration-500">
                            {/* Progress */}
                            <div className="flex items-center justify-between text-sm text-zinc-400">
                                <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                                <span className="font-mono text-purple-400">Score: {score}</span>
                            </div>

                            {/* Question Card */}
                            <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl p-8 shadow-2xl">
                                <h3 className="text-xl font-medium text-white mb-8 leading-relaxed">
                                    {questions[currentQuestionIndex].question}
                                </h3>

                                <div className="space-y-3">
                                    {questions[currentQuestionIndex].options.map((option, idx) => {
                                        const isSelected = selectedOption === idx;
                                        const isCorrect = idx === questions[currentQuestionIndex].answer;
                                        const showResult = selectedOption !== null;

                                        let styleClass = "border-white/10 hover:bg-white/5 text-zinc-200"; // Default

                                        if (showResult) {
                                            if (isCorrect) styleClass = "border-green-500/50 bg-green-500/10 text-green-400";
                                            else if (isSelected) styleClass = "border-red-500/50 bg-red-500/10 text-red-400";
                                            else styleClass = "border-white/5 opacity-50"; // Dim others
                                        } else if (isSelected) {
                                            styleClass = "border-purple-500 bg-purple-500/20 text-white";
                                        }

                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handleOptionSelect(idx)}
                                                disabled={selectedOption !== null}
                                                className={cn(
                                                    "w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between",
                                                    styleClass
                                                )}
                                            >
                                                <span>{option}</span>
                                                {showResult && isCorrect && <CheckCircle size={20} className="text-green-500" />}
                                                {showResult && isSelected && !isCorrect && <XCircle size={20} className="text-red-500" />}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Explanation & Next Button */}
                                {showExplanation && (
                                    <div className="mt-8 pt-6 border-t border-white/10 animate-in fade-in slide-in-from-top-2">
                                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                                            <p className="text-sm text-blue-200">
                                                <span className="font-semibold">Explanation:</span> {questions[currentQuestionIndex].explanation}
                                            </p>
                                        </div>
                                        <div className="flex justify-end">
                                            <button
                                                onClick={handleNextQuestion}
                                                className="px-6 py-2.5 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-colors flex items-center gap-2"
                                            >
                                                {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Quiz"}
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* FINISHED STATE */}
                    {gameStatus === 'finished' && (
                        <div className="w-full max-w-lg mt-20 text-center space-y-8 animate-in zoom-in duration-500">
                            <div className="w-24 h-24 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-orange-500/20">
                                <Trophy size={48} className="text-white" />
                            </div>

                            <div>
                                <h2 className="text-3xl font-bold text-white mb-2">Quiz Completed!</h2>
                                <p className="text-zinc-400">You scored <span className="text-white font-bold text-xl">{score}</span> out of <span className="text-white font-bold text-xl">{questions.length}</span></p>
                            </div>

                            <div className="p-6 bg-[#1e1e1e] rounded-2xl border border-white/10">
                                <p className="text-sm text-zinc-300 italic">
                                    "{score === questions.length ? "Perfect score! You're a master." : score > questions.length / 2 ? "Great job! Keep learning." : "Good effort! Try again to improve."}"
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    setGameStatus('idle');
                                    setTopic("");
                                }}
                                className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all flex items-center gap-2 mx-auto"
                            >
                                <RefreshCw size={18} />
                                Play Another Quiz
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </main>
    );
}
