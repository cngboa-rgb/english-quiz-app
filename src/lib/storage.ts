export interface User {
  username: string;
  password: string;
  createdAt: string;
}

export interface QuizResult {
  id: string;
  date: string;
  type: string;
  totalQuestions: number;
  correct: number;
  score: number;
  details?: Record<string, unknown>[];
}

export interface UserProgress {
  username: string;
  results: QuizResult[];
  learnedWords: number[];
}

export interface VocabItem {
  id: number;
  word: string;
  phonetic: string;
  meaning: string;
  type: string;
  synonyms: string[];
  antonyms: string[];
  collocations: string[];
}

const USERS_KEY = "english_quiz_users";
const PROGRESS_KEY = "english_quiz_progress";
const CURRENT_USER_KEY = "english_quiz_current_user";
const EXTRA_VOCAB_KEY = "english_quiz_extra_vocab";

export function getUsers(): User[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveUser(user: User): boolean {
  const users = getUsers();
  if (users.find((u) => u.username === user.username)) {
    return false;
  }
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return true;
}

export function login(username: string, password: string): boolean {
  const users = getUsers();
  const user = users.find((u) => u.username === username && u.password === password);
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, username);
    return true;
  }
  return false;
}

export function logout() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function getCurrentUser(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CURRENT_USER_KEY);
}

export function getProgress(username: string): UserProgress {
  if (typeof window === "undefined") return { username, results: [], learnedWords: [] };
  const data = localStorage.getItem(PROGRESS_KEY);
  const all: UserProgress[] = data ? JSON.parse(data) : [];
  let progress = all.find((p) => p.username === username);
  if (!progress) {
    progress = { username, results: [], learnedWords: [] };
  }
  return progress;
}

export function saveProgress(progress: UserProgress) {
  if (typeof window === "undefined") return;
  const data = localStorage.getItem(PROGRESS_KEY);
  const all: UserProgress[] = data ? JSON.parse(data) : [];
  const idx = all.findIndex((p) => p.username === progress.username);
  if (idx >= 0) {
    all[idx] = progress;
  } else {
    all.push(progress);
  }
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
}

export function addResult(username: string, result: QuizResult) {
  const progress = getProgress(username);
  progress.results.unshift(result);
  if (progress.results.length > 50) progress.results = progress.results.slice(0, 50);
  saveProgress(progress);
}

// ========== EXTRA VOCAB (uploaded by user) ==========

export function getExtraVocab(): VocabItem[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(EXTRA_VOCAB_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveExtraVocab(items: VocabItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(EXTRA_VOCAB_KEY, JSON.stringify(items));
}

export function addExtraVocab(newItems: VocabItem[]): { added: number; skipped: number } {
  const existing = getExtraVocab();
  const existingWords = new Set(existing.map((v) => v.word.toLowerCase().trim()));
  
  let added = 0;
  let skipped = 0;
  
  let maxId = existing.length > 0 ? Math.max(...existing.map((v) => v.id)) : 1000;
  
  for (const item of newItems) {
    const key = item.word.toLowerCase().trim();
    if (existingWords.has(key)) {
      skipped++;
      continue;
    }
    maxId += 1;
    existing.push({
      ...item,
      id: maxId,
      synonyms: item.synonyms || [],
      antonyms: item.antonyms || [],
      collocations: item.collocations || [],
    });
    existingWords.add(key);
    added++;
  }
  
  saveExtraVocab(existing);
  return { added, skipped };
}

export function clearExtraVocab() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(EXTRA_VOCAB_KEY);
}
