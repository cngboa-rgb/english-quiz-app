"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getCurrentUser,
  addResult,
  QuizResult,
} from "@/lib/storage";
import { generateQuiz, Question, QuestionType } from "@/lib/quizGenerator";
import Link from "next/link";

function QuizContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    setUser(u);

    const count = parseInt(searchParams.get("count") || "10", 10);
    const typesParam = searchParams.get("types") || "all";
    let types: QuestionType[] = [
      "meaning",
      "word_from_meaning",
      "synonym",
      "antonym",
      "collocation",
    ];
    if (typesParam !== "all") {
      types = typesParam.split(",") as QuestionType[];
    }

    const qs = generateQuiz(count, types);
    setQuestions(qs);
    setAnswers(new Array(qs.length).fill(null));
  }, [router, searchParams]);

  const handleSelect = (idx: number) => {
    if (showResult) return;
    setSelected(idx);
  };

  const handleNext = () => {
    if (selected === null) return;

    const newAnswers = [...answers];
    newAnswers[current] = selected;
    setAnswers(newAnswers);
    setShowResult(true);
  };

  const handleContinue = () => {
    if (current + 1 >= questions.length) {
      // Tính số câu đúng (bao gồm câu hiện tại)
      let finalCorrect = 0;
      for (let i = 0; i < questions.length; i++) {
        const userAnswer = i === current ? selected : answers[i];
        if (userAnswer === questions[i].correctIndex) {
          finalCorrect += 1;
        }
      }

      const finalScore = Math.round((finalCorrect / questions.length) * 100);
      setScore(finalScore);

      if (user) {
        const result: QuizResult = {
          id: `quiz-${Date.now()}`,
          date: new Date().toISOString(),
          type: searchParams.get("types") || "all",
          totalQuestions: questions.length,
          correct: finalCorrect,
          score: finalScore,
        };
        addResult(user, result);
      }

      setFinished(true);
    } else {
      setCurrent(current + 1);
      setSelected(null);
      setShowResult(false);
    }
  };

  if (!user || questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">
            {score >= 80 ? "🎉" : score >= 60 ? "👍" : "💪"}
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Hoàn thành!
          </h2>
          <p className="text-5xl font-bold mb-2 text-blue-600">{score}%</p>
          <p className="text-slate-600 mb-6">
            Bạn trả lời đúng{" "}
            {Math.round((score / 100) * questions.length)}/{questions.length}{" "}
            câu
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/dashboard"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition"
            >
              Về trang chủ
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="w-full border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-3 rounded-lg transition"
            >
              Làm lại quiz này
            </button>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const isCorrect = selected === q.correctIndex;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-800">
            ← Quay lại
          </Link>
          <span className="text-sm font-medium text-slate-600">
            Câu {current + 1} / {questions.length}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{
              width: `${((current + (showResult ? 1 : 0)) / questions.length) * 100}%`,
            }}
          />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="mb-2">
            <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
              {q.type === "meaning" && "Nghĩa của từ"}
              {q.type === "word_from_meaning" && "Chọn từ theo nghĩa"}
              {q.type === "synonym" && "Đồng nghĩa"}
              {q.type === "antonym" && "Trái nghĩa"}
              {q.type === "collocation" && "Collocation"}
            </span>
          </div>

          <h2 className="text-xl font-semibold text-slate-800 mb-6 leading-relaxed">
            {q.question}
          </h2>

          <div className="space-y-3">
            {q.options.map((opt, idx) => {
              let cls =
                "w-full text-left px-4 py-3.5 rounded-xl border-2 transition font-medium ";
              if (!showResult) {
                cls +=
                  selected === idx
                    ? "border-blue-500 bg-blue-50 text-blue-800"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700";
              } else {
                if (idx === q.correctIndex) {
                  cls += "border-emerald-500 bg-emerald-50 text-emerald-800";
                } else if (idx === selected && idx !== q.correctIndex) {
                  cls += "border-red-400 bg-red-50 text-red-700";
                } else {
                  cls += "border-slate-200 text-slate-500";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  disabled={showResult}
                  className={cls}
                >
                  <span className="inline-block w-7 h-7 rounded-full bg-slate-200 text-slate-600 text-sm font-semibold mr-3 text-center leading-7">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>

          {showResult && (
            <div
              className={`mt-5 p-4 rounded-xl text-sm ${
                isCorrect
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-amber-50 text-amber-800 border border-amber-200"
              }`}
            >
              <p className="font-semibold mb-1">
                {isCorrect ? "Chính xác! 🎉" : "Chưa đúng rồi"}
              </p>
              <p>{q.explanation}</p>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            {!showResult ? (
              <button
                onClick={handleNext}
                disabled={selected === null}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition"
              >
                Kiểm tra
              </button>
            ) : (
              <button
                onClick={handleContinue}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
              >
                {current + 1 >= questions.length ? "Xem kết quả" : "Câu tiếp theo"}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <QuizContent />
    </Suspense>
  );
}
