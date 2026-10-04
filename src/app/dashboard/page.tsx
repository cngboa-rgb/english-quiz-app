"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  getCurrentUser,
  logout,
  getProgress,
  UserProgress,
  getExtraVocab,
  addExtraVocab,
  clearExtraVocab,
  VocabItem,
} from "@/lib/storage";
import { getAllVocab } from "@/lib/quizGenerator";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<string | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [extraCount, setExtraCount] = useState(0);
  const [totalVocab, setTotalVocab] = useState(0);
  const [uploadMsg, setUploadMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshStats = () => {
    const extra = getExtraVocab();
    setExtraCount(extra.length);
    setTotalVocab(getAllVocab().length);
  };

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    setUser(u);
    setProgress(getProgress(u));
    refreshStats();
  }, [router]);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const parseCSV = (text: string): VocabItem[] => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    const header = lines[0].toLowerCase().split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const items: VocabItem[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      if (cols.length < 3) continue;

      const get = (key: string) => {
        const idx = header.indexOf(key);
        return idx >= 0 ? cols[idx] || "" : "";
      };

      const word = get("word") || cols[0];
      const meaning = get("meaning") || cols[2] || cols[1];
      if (!word || !meaning) continue;

      items.push({
        id: 0,
        word,
        phonetic: get("phonetic") || cols[1] || "",
        meaning,
        type: get("type") || "n",
        synonyms: (get("synonyms") || "").split("|").map((s) => s.trim()).filter(Boolean),
        antonyms: (get("antonyms") || "").split("|").map((s) => s.trim()).filter(Boolean),
        collocations: (get("collocations") || "").split("|").map((s) => s.trim()).filter(Boolean),
      });
    }
    return items;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMsg(null);

    try {
      const text = await file.text();
      let items: VocabItem[] = [];

      if (file.name.endsWith(".json")) {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          items = parsed
            .map((item: Record<string, unknown>) => ({
              id: 0,
              word: String(item.word || ""),
              phonetic: String(item.phonetic || ""),
              meaning: String(item.meaning || ""),
              type: String(item.type || "n"),
              synonyms: Array.isArray(item.synonyms) ? item.synonyms.map(String) : [],
              antonyms: Array.isArray(item.antonyms) ? item.antonyms.map(String) : [],
              collocations: Array.isArray(item.collocations) ? item.collocations.map(String) : [],
            }))
            .filter((v: VocabItem) => v.word && v.meaning);
        } else {
          throw new Error("File JSON phải là một mảng (array) các từ vựng");
        }
      } else if (file.name.endsWith(".csv")) {
        items = parseCSV(text);
      } else {
        throw new Error("Chỉ hỗ trợ file .json hoặc .csv");
      }

      if (items.length === 0) {
        throw new Error("Không tìm thấy từ vựng hợp lệ trong file");
      }

      const result = addExtraVocab(items);
      refreshStats();
      setUploadMsg({
        type: "success",
        text: `Đã thêm ${result.added} từ mới` + (result.skipped > 0 ? ` (bỏ qua ${result.skipped} từ trùng)` : ""),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Lỗi khi đọc file";
      setUploadMsg({
        type: "error",
        text: message,
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleClearExtra = () => {
    if (confirm("Bạn có chắc muốn xóa tất cả từ vựng đã upload không?")) {
      clearExtraVocab();
      refreshStats();
      setUploadMsg({ type: "success", text: "Đã xóa toàn bộ từ vựng đã upload" });
    }
  };

  if (!user || !progress) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalQuizzes = progress.results.length;
  const avgScore =
    totalQuizzes > 0
      ? Math.round(progress.results.reduce((s, r) => s + r.score, 0) / totalQuizzes)
      : 0;
  const bestScore = totalQuizzes > 0 ? Math.max(...progress.results.map((r) => r.score)) : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Học Từ Vựng • Life Stories</h1>
            <p className="text-sm text-slate-500">Xin chào, {user}</p>
          </div>
          <button onClick={handleLogout} className="text-sm text-slate-600 hover:text-red-600 transition">
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500 mb-1">Tổng số từ</p>
            <p className="text-2xl font-bold text-slate-800">{totalVocab}</p>
            {extraCount > 0 && (
              <p className="text-xs text-blue-600 mt-1">(+{extraCount} từ đã upload)</p>
            )}
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500 mb-1">Số bài đã làm</p>
            <p className="text-2xl font-bold text-blue-600">{totalQuizzes}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500 mb-1">Điểm trung bình</p>
            <p className="text-2xl font-bold text-emerald-600">{avgScore}%</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500 mb-1">Điểm cao nhất</p>
            <p className="text-2xl font-bold text-amber-600">{bestScore}%</p>
          </div>
        </div>

        {/* Upload section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Thêm từ vựng từ file</h2>
          <p className="text-sm text-slate-500 mb-4">
            Hỗ trợ file <strong>.json</strong> hoặc <strong>.csv</strong>. Từ mới sẽ được thêm vào ngân hàng và dùng để tạo quiz.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition">
              {uploading ? "Đang xử lý..." : "Chọn file để upload"}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>

            {extraCount > 0 && (
              <button
                onClick={handleClearExtra}
                className="px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition"
              >
                Xóa từ đã upload ({extraCount})
              </button>
            )}
          </div>

          {uploadMsg && (
            <div
              className={`mt-4 px-4 py-3 rounded-lg text-sm ${
                uploadMsg.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {uploadMsg.text}
            </div>
          )}

          <details className="mt-5">
            <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">
              Xem định dạng file mẫu
            </summary>
            <div className="mt-3 space-y-4 text-sm text-slate-600">
              <div>
                <p className="font-semibold mb-1">1. File JSON (khuyến nghị):</p>
                <pre className="bg-slate-100 p-3 rounded-lg overflow-x-auto text-xs">
{`[
  {
    "word": "resilient",
    "phonetic": "/rɪˈzɪliənt/",
    "meaning": "kiên cường/bền bỉ",
    "type": "adj",
    "synonyms": ["tough", "strong"],
    "antonyms": ["fragile", "weak"],
    "collocations": ["resilient spirit", "highly resilient"]
  }
]`}
                </pre>
              </div>
              <div>
                <p className="font-semibold mb-1">2. File CSV:</p>
                <pre className="bg-slate-100 p-3 rounded-lg overflow-x-auto text-xs">
{`word,phonetic,meaning,type,synonyms,antonyms,collocations
resilient,/rɪˈzɪliənt/,kiên cường/bền bỉ,adj,tough|strong,fragile|weak,resilient spirit|highly resilient
ambition,/æmˈbɪʃn/,tham vọng,n,aspiration|goal,,ambitious goal`}
                </pre>
                <p className="mt-1 text-xs text-slate-500">
                  • Các cột synonyms / antonyms / collocations dùng dấu <code>|</code> để ngăn cách nhiều giá trị.
                </p>
              </div>
            </div>
          </details>
        </div>

        {/* Start Quiz */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Bắt đầu làm quiz</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/quiz?count=10&types=all"
              className="block p-5 rounded-xl border-2 border-blue-100 hover:border-blue-400 hover:bg-blue-50 transition group"
            >
              <div className="text-3xl mb-2">📝</div>
              <h3 className="font-semibold text-slate-800 group-hover:text-blue-700">Quiz ngẫu nhiên 10 câu</h3>
              <p className="text-sm text-slate-500 mt-1">Trộn tất cả loại câu hỏi</p>
            </Link>
            <Link
              href="/quiz?count=15&types=meaning,word_from_meaning"
              className="block p-5 rounded-xl border-2 border-emerald-100 hover:border-emerald-400 hover:bg-emerald-50 transition group"
            >
              <div className="text-3xl mb-2">📖</div>
              <h3 className="font-semibold text-slate-800 group-hover:text-emerald-700">Nghĩa từ vựng (15 câu)</h3>
              <p className="text-sm text-slate-500 mt-1">Chọn nghĩa hoặc chọn từ</p>
            </Link>
            <Link
              href="/quiz?count=10&types=synonym,antonym"
              className="block p-5 rounded-xl border-2 border-purple-100 hover:border-purple-400 hover:bg-purple-50 transition group"
            >
              <div className="text-3xl mb-2">🔄</div>
              <h3 className="font-semibold text-slate-800 group-hover:text-purple-700">Đồng nghĩa / Trái nghĩa</h3>
              <p className="text-sm text-slate-500 mt-1">10 câu về CLO & OPP</p>
            </Link>
            <Link
              href="/quiz?count=10&types=collocation"
              className="block p-5 rounded-xl border-2 border-amber-100 hover:border-amber-400 hover:bg-amber-50 transition group"
            >
              <div className="text-3xl mb-2">🔗</div>
              <h3 className="font-semibold text-slate-800 group-hover:text-amber-700">Collocations</h3>
              <p className="text-sm text-slate-500 mt-1">Cụm từ đi kèm phổ biến</p>
            </Link>
            <Link
              href="/quiz?count=20&types=all"
              className="block p-5 rounded-xl border-2 border-rose-100 hover:border-rose-400 hover:bg-rose-50 transition group"
            >
              <div className="text-3xl mb-2">🔥</div>
              <h3 className="font-semibold text-slate-800 group-hover:text-rose-700">Thử thách 20 câu</h3>
              <p className="text-sm text-slate-500 mt-1">Kiểm tra toàn diện</p>
            </Link>
          </div>
        </div>

        {/* Recent results */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Lịch sử gần đây</h2>
          {progress.results.length === 0 ? (
            <p className="text-slate-500 text-center py-8">
              Bạn chưa làm bài nào. Hãy bắt đầu quiz đầu tiên!
            </p>
          ) : (
            <div className="space-y-3">
              {progress.results.slice(0, 10).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100"
                >
                  <div>
                    <p className="font-medium text-slate-800">
                      {r.type} • {r.totalQuestions} câu
                    </p>
                    <p className="text-sm text-slate-500">
                      {new Date(r.date).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-xl font-bold ${
                        r.score >= 80
                          ? "text-emerald-600"
                          : r.score >= 60
                          ? "text-amber-600"
                          : "text-red-500"
                      }`}
                    >
                      {r.score}%
                    </p>
                    <p className="text-sm text-slate-500">
                      {r.correct}/{r.totalQuestions} đúng
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
