import React, { useState, useEffect, useRef } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
} from "recharts";
import {
  Clock,
  Zap,
  Target,
  TrendingUp,
  Download,
  Eye,
  FileText,
  Award,
  Keyboard,
  Trophy,
  Flame,
  Star,
  Activity,
  BarChart3,
  Settings,
  RefreshCw,
  CheckCircle,
  XCircle,
  Calendar,
  Play,
} from "lucide-react";

const TypingProductivityAnalyzer = () => {
  const [currentView, setCurrentView] = useState("typing");
  const [typingText, setTypingText] = useState("");
  const [aiParagraph, setAiParagraph] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [typingSpeed, setTypingSpeed] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [startTime, setStartTime] = useState(null);
  const [errors, setErrors] = useState(0);
  const [sessions, setSessions] = useState([]);
  const [difficulty, setDifficulty] = useState("medium");
  const [streak, setStreak] = useState(0);
  const [totalWordsTyped, setTotalWordsTyped] = useState(0);
  const [currentWordCount, setCurrentWordCount] = useState(0);
  const [keystrokeErrors, setKeystrokeErrors] = useState({});
  const [recentKeystrokes, setRecentKeystrokes] = useState([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTestActive, setIsTestActive] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  const typingIndex = useRef(0);
  const intervalRef = useRef(null);
  const timerRef = useRef(null);
  const hasGenerated = useRef(false);

  const difficultySettings = {
    easy: {
      label: "Easy",
      description: "Simple words",
      color: "#22c55e",
      minWPM: 20,
      multiplier: 1,
    },
    medium: {
      label: "Medium",
      description: "Mixed vocabulary",
      color: "#3b82f6",
      minWPM: 40,
      multiplier: 1.5,
    },
    hard: {
      label: "Hard",
      description: "Complex text",
      color: "#f97316",
      minWPM: 60,
      multiplier: 2,
    },
    expert: {
      label: "Expert",
      description: "Technical terms",
      color: "#ef4444",
      minWPM: 80,
      multiplier: 3,
    },
  };

  const fallbackParagraphs = {
    easy: "The cat sat on the mat. It was a sunny day. Birds flew in the sky. The dog ran in the park. Children played with toys. Mom made a nice cake. Dad read his book. Life was good and simple.",
    medium:
      "Technology continues to reshape how we work and communicate in the modern world. Smartphones have become essential tools for daily tasks, from checking emails to managing schedules. The rapid pace of innovation brings both opportunities and challenges for businesses adapting to change.",
    hard: "Quantum entanglement demonstrates non-local correlations between particles; measurements on one instantaneously affect the other regardless of distance. This phenomenon challenges classical physics paradigms and enables revolutionary applications in cryptography and computing.",
    expert:
      "The epistemological ramifications of Gödel's incompleteness theorems (1931) fundamentally altered mathematical logic: any sufficiently complex axiomatic system contains propositions that are true but unprovable within that system.",
  };

  useEffect(() => {
    loadSessions();
    if (!hasGenerated.current) {
      hasGenerated.current = true;
      generateParagraph();
    }
  }, []);

  useEffect(() => {
    if (isTestActive && startTime) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTestActive, startTime]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const loadSessions = async () => {
    try {
      const result = await window.storage.get("typing_sessions");
      if (result?.value) {
        const data = JSON.parse(result.value);
        setSessions(data.sessions || []);
        setTotalWordsTyped(data.totalWords || 0);
        setStreak(calculateStreak(data.sessions || []));
      }
    } catch (e) {
      setSessions([]);
    }
  };
const saveSessions = (newSessions, newTotalWords) => {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      console.warn("localStorage not available");
      return false;
    }

    window.localStorage.setItem(
      "typing_sessions",
      JSON.stringify({
        sessions: newSessions,
        totalWords: newTotalWords,
        lastUpdated: new Date().toISOString(),
      })
    );
    return true;
  } catch (e) {
    console.error("Error saving sessions:", e);
    return false;
  }
};


  const calculateStreak = (sessionList) => {
    if (!sessionList?.length) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const uniqueDays = new Set();
    sessionList.forEach((s) => {
      const d = new Date(s.timestamp);
      d.setHours(0, 0, 0, 0);
      uniqueDays.add(d.getTime());
    });
    const sortedDays = Array.from(uniqueDays).sort((a, b) => b - a);
    let streak = 0;
    for (let i = 0; i < sortedDays.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      if (sortedDays.includes(expected.getTime())) streak++;
      else break;
    }
    return streak;
  };

  const generateParagraph = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 500,
          messages: [
            {
              role: "user",
              content: `Generate a ${difficulty} difficulty typing practice paragraph. ${
                difficulty === "easy"
                  ? "60-80 words, simple."
                  : difficulty === "medium"
                  ? "80-100 words, moderate."
                  : difficulty === "hard"
                  ? "100-120 words, complex."
                  : "120-150 words, technical."
              } Output only the paragraph.`,
            },
          ],
        }),
      });
      const data = await response.json();
      if (data.content?.[0]?.text) {
        const para = data.content[0].text.trim();
        setAiParagraph(para);
        startTypingEffect(para);
      } else throw new Error();
    } catch (e) {
      const para = fallbackParagraphs[difficulty];
      setAiParagraph(para);
      startTypingEffect(para);
    }
    setIsGenerating(false);
  };

  const startTypingEffect = (text) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setDisplayedText("");
    typingIndex.current = 0;
    intervalRef.current = setInterval(() => {
      if (typingIndex.current < text.length) {
        setDisplayedText(text.slice(0, typingIndex.current + 1));
        typingIndex.current++;
      } else clearInterval(intervalRef.current);
    }, 20);
  };

  const countWords = (text) =>
    !text?.trim()
      ? 0
      : text
          .trim()
          .split(/\s+/)
          .filter((w) => w.length > 0).length;
  const calculateWPM = (text, seconds) =>
    seconds <= 0 ? 0 : Math.round(countWords(text) / (seconds / 60));
  const formatTime = (s) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const handleTypingChange = (e) => {
    const value = e.target.value;
    const prevValue = typingText;
    setTypingText(value);

    if (!startTime && value.length > 0) {
      setStartTime(Date.now());
      setIsTestActive(true);
    }

    setCurrentWordCount(countWords(value));
    if (startTime)
      setTypingSpeed(calculateWPM(value, (Date.now() - startTime) / 1000));

    let errorCount = 0;
    const newKeystrokeErrors = { ...keystrokeErrors };
    const newRecentKeystrokes = [];

    for (let i = 0; i < value.length; i++) {
      const expected = aiParagraph[i],
        actual = value[i];
      if (expected !== undefined) {
        const isCorrect = actual === expected;
        if (!isCorrect) {
          errorCount++;
          const key = expected === " " ? "Space" : expected;
          newKeystrokeErrors[key] = (newKeystrokeErrors[key] || 0) + 1;
        }
        if (i >= prevValue.length || value[i] !== prevValue[i]) {
          newRecentKeystrokes.push({
            expected: expected === " " ? "␣" : expected,
            actual: actual === " " ? "␣" : actual,
            correct: isCorrect,
          });
        }
      }
    }

    setErrors(errorCount);
    setKeystrokeErrors(newKeystrokeErrors);
    if (newRecentKeystrokes.length > 0)
      setRecentKeystrokes((prev) =>
        [...prev, ...newRecentKeystrokes].slice(-25)
      );
    setAccuracy(
      Math.max(
        0,
        Math.round(
          ((Math.max(value.length, 1) - errorCount) /
            Math.max(value.length, 1)) *
            100
        )
      )
    );
  };

  const saveSession = async () => {
    if (typingText.length < 10) {
      setSaveStatus("Type at least 10 characters");
      setTimeout(() => setSaveStatus(""), 2000);
      return;
    }
    setSaveStatus("Saving...");
    const timeElapsed = startTime
      ? Math.floor((Date.now() - startTime) / 1000)
      : 0;
    const wordsTyped = countWords(typingText);
    const newSession = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      difficulty,
      wpm: calculateWPM(typingText, timeElapsed),
      accuracy,
      errors,
      duration: timeElapsed,
      wordsTyped,
      charsTyped: typingText.length,
      progress: Math.round((typingText.length / aiParagraph.length) * 100),
      completed: typingText.length >= aiParagraph.length * 0.95,
      keystrokeErrors: { ...keystrokeErrors },
      score: Math.round(
        calculateWPM(typingText, timeElapsed) *
          (accuracy / 100) *
          difficultySettings[difficulty].multiplier
      ),
    };
    const updatedSessions = [newSession, ...sessions].slice(0, 100);
    const newTotalWords = totalWordsTyped + wordsTyped;
    if (await saveSessions(updatedSessions, newTotalWords)) {
      setSessions(updatedSessions);
      setTotalWordsTyped(newTotalWords);
      setStreak(calculateStreak(updatedSessions));
      setSaveStatus("Saved!");
      setTimeout(() => {
        setSaveStatus("");
        resetTest(false);
      }, 1200);
    } else {
      setSaveStatus("Failed");
      setTimeout(() => setSaveStatus(""), 2000);
    }
  };

  const resetTest = (regenerate = true) => {
    setTypingText("");
    setStartTime(null);
    setElapsedTime(0);
    setTypingSpeed(0);
    setAccuracy(100);
    setErrors(0);
    setCurrentWordCount(0);
    setKeystrokeErrors({});
    setRecentKeystrokes([]);
    setIsTestActive(false);
    if (regenerate) generateParagraph();
  };

  const changeDifficulty = (d) => {
    if (!isTestActive) {
      setDifficulty(d);
      setTimeout(generateParagraph, 100);
    }
  };

  const getStats = () => {
    if (!sessions.length) return null;
    const t = sessions.length;
    return {
      totalSessions: t,
      avgWPM: Math.round(sessions.reduce((s, x) => s + x.wpm, 0) / t),
      avgAccuracy: Math.round(sessions.reduce((s, x) => s + x.accuracy, 0) / t),
      totalTime: sessions.reduce((s, x) => s + x.duration, 0),
      bestWPM: Math.max(...sessions.map((x) => x.wpm)),
      totalScore: sessions.reduce((s, x) => s + (x.score || 0), 0),
      completedCount: sessions.filter((x) => x.completed).length,
      improvement:
        t >= 2
          ? Math.round(
              ((sessions[0].wpm - sessions[t - 1].wpm) /
                Math.max(sessions[t - 1].wpm, 1)) *
                100
            )
          : 0,
    };
  };

  const stats = getStats();

  const getPerformanceData = () =>
    sessions
      .slice(0, 20)
      .reverse()
      .map((s, i) => ({
        session: `${i + 1}`,
        WPM: s.wpm,
        Accuracy: s.accuracy,
        Errors: s.errors,
      }));

  const getTimelineData = () => {
    const g = {};
    sessions.forEach((s) => {
      const d = s.date || new Date(s.timestamp).toLocaleDateString();
      if (!g[d]) g[d] = { date: d, sessions: 0, totalWPM: 0 };
      g[d].sessions++;
      g[d].totalWPM += s.wpm;
    });
    return Object.values(g)
      .map((x) => ({ ...x, avgWPM: Math.round(x.totalWPM / x.sessions) }))
      .slice(-10);
  };

  const getDifficultyData = () =>
    Object.keys(difficultySettings)
      .map((k) => ({
        name: difficultySettings[k].label,
        value: sessions.filter((s) => s.difficulty === k).length,
        color: difficultySettings[k].color,
      }))
      .filter((d) => d.value > 0);

  const getProblematicKeys = () => {
    const all = {};
    sessions.forEach((s) => {
      if (s.keystrokeErrors)
        Object.entries(s.keystrokeErrors).forEach(([k, c]) => {
          all[k] = (all[k] || 0) + c;
        });
    });
    return Object.entries(all)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([key, errors]) => ({ key, errors }));
  };

  const radarData = stats
    ? [
        { skill: "Speed", value: Math.min((stats.avgWPM / 80) * 100, 100) },
        { skill: "Accuracy", value: stats.avgAccuracy },
        {
          skill: "Consistency",
          value: Math.max(100 - Math.abs(stats.bestWPM - stats.avgWPM) * 2, 0),
        },
        {
          skill: "Practice",
          value: Math.min((stats.totalSessions / 20) * 100, 100),
        },
        {
          skill: "Completion",
          value:
            stats.totalSessions > 0
              ? (stats.completedCount / stats.totalSessions) * 100
              : 0,
        },
      ]
    : [];

  const renderHighlightedText = () => {
    if (!aiParagraph) return null;
    return (
      <div className="font-mono text-base leading-relaxed tracking-wide">
        {aiParagraph.split("").map((char, i) => {
          let cls = "text-gray-400";
          if (i < typingText.length)
            cls =
              typingText[i] === char
                ? "text-emerald-600"
                : "text-red-500 bg-red-100 rounded";
          else if (i === typingText.length)
            cls = "bg-blue-200 text-blue-800 rounded px-0.5";
          return (
            <span key={i} className={cls}>
              {char}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                <Keyboard className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-900">
                TypingPro
              </span>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-sm">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="font-medium text-gray-700">
                  {streak} day streak
                </span>
              </div>

              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setCurrentView("typing")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    currentView === "typing"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Practice
                </button>
                <button
                  onClick={() => setCurrentView("dashboard")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    currentView === "dashboard"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Analytics
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {currentView === "typing" && (
          <div className="space-y-6">
            {/* Difficulty */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Difficulty
                </h3>
                <span className="text-sm text-gray-500">
                  {totalWordsTyped.toLocaleString()} words typed
                </span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {Object.entries(difficultySettings).map(([key, s]) => (
                  <button
                    key={key}
                    onClick={() => changeDifficulty(key)}
                    disabled={isTestActive}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      difficulty === key
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    } ${isTestActive ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: s.color }}
                      ></div>
                      <span className="font-medium text-gray-900 text-sm">
                        {s.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{s.minWPM}+ WPM</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-6 gap-3">
              {[
                { label: "WPM", value: typingSpeed, color: "blue" },
                { label: "Accuracy", value: `${accuracy}%`, color: "emerald" },
                { label: "Errors", value: errors, color: "red" },
                {
                  label: "Time",
                  value: formatTime(elapsedTime),
                  color: "gray",
                },
                { label: "Words", value: currentWordCount, color: "purple" },
                {
                  label: "Progress",
                  value: `${
                    aiParagraph
                      ? Math.min(
                          100,
                          Math.round(
                            (typingText.length / aiParagraph.length) * 100
                          )
                        )
                      : 0
                  }%`,
                  color: "orange",
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg border border-gray-200 p-4"
                >
                  <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Keystrokes */}
            {recentKeystrokes.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500 mb-3">Recent Keystrokes</p>
                <div className="flex flex-wrap gap-1">
                  {recentKeystrokes.slice(-20).map((k, i) => (
                    <span
                      key={i}
                      className={`px-2 py-1 rounded text-xs font-mono ${
                        k.correct
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {k.correct ? k.actual : `${k.actual}→${k.expected}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Error Keys */}
            {Object.keys(keystrokeErrors).length > 0 && (
              <div className="bg-red-50 rounded-xl border border-red-200 p-4">
                <p className="text-xs text-red-600 mb-3 font-medium">
                  Problem Keys
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(keystrokeErrors)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([key, count], i) => (
                      <div
                        key={i}
                        className="bg-white border border-red-200 rounded-lg px-3 py-2 text-center"
                      >
                        <div className="text-lg font-mono font-semibold text-red-600">
                          {key}
                        </div>
                        <div className="text-xs text-red-500">{count}×</div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Typing Area */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-medium text-gray-900">Practice Text</h2>
                <button
                  onClick={() => !isTestActive && generateParagraph()}
                  disabled={isGenerating || isTestActive}
                  className="flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-1.5 ${
                      isGenerating ? "animate-spin" : ""
                    }`}
                  />
                  New Text
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-5 mb-5 min-h-[140px] border border-gray-100">
                {displayedText ? (
                  renderHighlightedText()
                ) : (
                  <p className="text-gray-400">Generating...</p>
                )}
              </div>

              <textarea
                value={typingText}
                onChange={handleTypingChange}
                placeholder="Start typing here..."
                className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={!aiParagraph || isGenerating}
              />

              {saveStatus && (
                <div
                  className={`mt-3 p-3 rounded-lg text-center text-sm font-medium ${
                    saveStatus === "Saved!"
                      ? "bg-emerald-50 text-emerald-700"
                      : saveStatus === "Failed"
                      ? "bg-red-50 text-red-700"
                      : "bg-blue-50 text-blue-700"
                  }`}
                >
                  {saveStatus}
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  onClick={saveSession}
                  disabled={typingText.length < 10}
                  className="flex-1 flex items-center justify-center px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Save Session
                </button>
                <button
                  onClick={() => resetTest(true)}
                  className="flex-1 flex items-center justify-center px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}

        {currentView === "dashboard" && (
          <div className="space-y-6">
            {stats ? (
              <>
                {/* Summary */}
                <div className="grid grid-cols-4 lg:grid-cols-8 gap-3">
                  {[
                    {
                      label: "Sessions",
                      value: stats.totalSessions,
                      icon: Trophy,
                    },
                    { label: "Avg WPM", value: stats.avgWPM, icon: Zap },
                    {
                      label: "Accuracy",
                      value: `${stats.avgAccuracy}%`,
                      icon: Target,
                    },
                    { label: "Best WPM", value: stats.bestWPM, icon: Award },
                    {
                      label: "Time",
                      value: `${Math.round(stats.totalTime / 60)}m`,
                      icon: Clock,
                    },
                    {
                      label: "Improve",
                      value: `${stats.improvement > 0 ? "+" : ""}${
                        stats.improvement
                      }%`,
                      icon: TrendingUp,
                    },
                    { label: "Score", value: stats.totalScore, icon: Star },
                    {
                      label: "Completed",
                      value: stats.completedCount,
                      icon: CheckCircle,
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-lg border border-gray-200 p-4"
                    >
                      <item.icon className="w-4 h-4 text-gray-400 mb-2" />
                      <p className="text-xs text-gray-500">{item.label}</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">
                      Performance Trend
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={getPerformanceData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="session"
                          stroke="#9ca3af"
                          fontSize={12}
                        />
                        <YAxis stroke="#9ca3af" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "8px",
                            border: "1px solid #e5e7eb",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="WPM"
                          stroke="#3b82f6"
                          fill="#dbeafe"
                        />
                        <Area
                          type="monotone"
                          dataKey="Accuracy"
                          stroke="#10b981"
                          fill="#d1fae5"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">
                      Daily Activity
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <ComposedChart data={getTimelineData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} />
                        <YAxis stroke="#9ca3af" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "8px",
                            border: "1px solid #e5e7eb",
                          }}
                        />
                        <Bar
                          dataKey="sessions"
                          fill="#e0e7ff"
                          name="Sessions"
                        />
                        <Line
                          type="monotone"
                          dataKey="avgWPM"
                          stroke="#6366f1"
                          strokeWidth={2}
                          name="Avg WPM"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">
                      Difficulty Split
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={getDifficultyData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {getDifficultyData().map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">
                      Completion Rate
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: "Completed",
                              value: stats.completedCount,
                              color: "#10b981",
                            },
                            {
                              name: "Partial",
                              value: stats.totalSessions - stats.completedCount,
                              color: "#f59e0b",
                            },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          <Cell fill="#10b981" />
                          <Cell fill="#f59e0b" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">
                      Skill Overview
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis
                          dataKey="skill"
                          stroke="#6b7280"
                          fontSize={11}
                        />
                        <PolarRadiusAxis
                          angle={90}
                          domain={[0, 100]}
                          stroke="#e5e7eb"
                          fontSize={10}
                        />
                        <Radar
                          name="Skills"
                          dataKey="value"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.3}
                        />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Error Trend */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">
                    Error Analysis
                  </h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={getPerformanceData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="session" stroke="#9ca3af" fontSize={12} />
                      <YAxis stroke="#9ca3af" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="Errors"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ fill: "#ef4444", r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="WPM"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: "#3b82f6", r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Problematic Keys */}
                {getProblematicKeys().length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">
                      Most Missed Keys (All Time)
                    </h3>
                    <div className="grid grid-cols-6 gap-3">
                      {getProblematicKeys().map((item, i) => (
                        <div
                          key={i}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center"
                        >
                          <div className="text-2xl font-mono font-bold text-gray-800 mb-1">
                            {item.key}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.errors} errors
                          </div>
                          <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-red-400 rounded-full transition-all"
                              style={{
                                width: `${Math.min(
                                  (item.errors /
                                    getProblematicKeys()[0].errors) *
                                    100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Session History */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">
                    Recent Sessions
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {[
                            "Date",
                            "Time",
                            "Level",
                            "WPM",
                            "Accuracy",
                            "Errors",
                            "Duration",
                            "Score",
                            "Status",
                          ].map((h) => (
                            <th
                              key={h}
                              className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {sessions.slice(0, 12).map((s, i) => (
                          <tr key={s.id} className="hover:bg-gray-50">
                            <td className="px-3 py-3 text-sm text-gray-700">
                              {s.date ||
                                new Date(s.timestamp).toLocaleDateString()}
                            </td>
                            <td className="px-3 py-3 text-sm text-gray-500">
                              {s.time ||
                                new Date(s.timestamp).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                            </td>
                            <td className="px-3 py-3">
                              <span
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white"
                                style={{
                                  backgroundColor:
                                    difficultySettings[s.difficulty || "medium"]
                                      .color,
                                }}
                              >
                                {(s.difficulty || "medium")
                                  .charAt(0)
                                  .toUpperCase() +
                                  (s.difficulty || "medium").slice(1)}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-sm font-semibold text-blue-600">
                              {s.wpm}
                            </td>
                            <td className="px-3 py-3 text-sm font-semibold text-emerald-600">
                              {s.accuracy}%
                            </td>
                            <td className="px-3 py-3 text-sm text-red-500">
                              {s.errors}
                            </td>
                            <td className="px-3 py-3 text-sm text-gray-500">
                              {s.duration}s
                            </td>
                            <td className="px-3 py-3 text-sm font-semibold text-amber-600">
                              {s.score || 0}
                            </td>
                            <td className="px-3 py-3">
                              {s.completed ? (
                                <span className="inline-flex items-center text-xs text-emerald-600">
                                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                  Done
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-xs text-amber-600">
                                  <Clock className="w-3.5 h-3.5 mr-1" />
                                  Partial
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Sessions Yet
                </h3>
                <p className="text-gray-500 mb-6">
                  Complete a typing test to see your analytics
                </p>
                <button
                  onClick={() => setCurrentView("typing")}
                  className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Practice
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default TypingProductivityAnalyzer;
