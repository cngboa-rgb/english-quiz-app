"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, saveUser, getCurrentUser } from "@/lib/storage";
import { useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (getCurrentUser()) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!username.trim() || !password.trim()) {
      setError("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu");
      return;
    }

    if (isRegister) {
      const ok = saveUser({
        username: username.trim(),
        password,
        createdAt: new Date().toISOString(),
      });
      if (ok) {
        setSuccess("Đăng ký thành công! Hãy đăng nhập.");
        setIsRegister(false);
        setPassword("");
      } else {
        setError("Tên đăng nhập đã tồn tại");
      }
    } else {
      const ok = login(username.trim(), password);
      if (ok) {
        router.push("/dashboard");
      } else {
        setError("Sai tên đăng nhập hoặc mật khẩu");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Học Từ Vựng Tiếng Anh
          </h1>
          <p className="text-slate-500">Life Stories • Chạy hoàn toàn local</p>
        </div>

        <div className="flex mb-6 bg-slate-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError("");
              setSuccess("");
            }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
              !isRegister
                ? "bg-white shadow text-blue-600"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError("");
              setSuccess("");
            }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
              isRegister
                ? "bg-white shadow text-blue-600"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            Đăng ký
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tên đăng nhập
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="Nhập tên đăng nhập"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="Nhập mật khẩu"
              autoComplete={isRegister ? "new-password" : "current-password"}
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 text-green-600 text-sm px-4 py-2 rounded-lg">
              {success}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition"
          >
            {isRegister ? "Đăng ký" : "Đăng nhập"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Dữ liệu được lưu trên trình duyệt của bạn (localStorage). Không gửi đi đâu cả.
        </p>
      </div>
    </div>
  );
}
