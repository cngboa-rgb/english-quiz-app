import { vocabList } from "@/data/vocab";
import { getExtraVocab, VocabItem } from "@/lib/storage";

export type QuestionType = "meaning" | "synonym" | "antonym" | "collocation" | "word_from_meaning";

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  wordId: number;
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickRandom<T>(arr: T[], count: number): T[] {
  return shuffle(arr).slice(0, count);
}

/** Lấy toàn bộ từ vựng: gốc + đã upload */
export function getAllVocab(): VocabItem[] {
  const extra = typeof window !== "undefined" ? getExtraVocab() : [];
  // Tránh trùng word
  const baseWords = new Set(vocabList.map((v) => v.word.toLowerCase()));
  const uniqueExtra = extra.filter((v) => !baseWords.has(v.word.toLowerCase()));
  return [...vocabList, ...uniqueExtra];
}

function generateMeaningQuestion(item: VocabItem, all: VocabItem[]): Question {
  const wrongs = pickRandom(
    all.filter((v) => v.id !== item.id).map((v) => v.meaning),
    3
  );
  const options = shuffle([item.meaning, ...wrongs]);
  const correctIndex = options.indexOf(item.meaning);
  return {
    id: `m-${item.id}-${Date.now()}`,
    type: "meaning",
    question: `Từ "${item.word}" (${item.phonetic}) có nghĩa là gì?`,
    options,
    correctIndex,
    explanation: `"${item.word}" nghĩa là: ${item.meaning}`,
    wordId: item.id,
  };
}

function generateWordFromMeaningQuestion(item: VocabItem, all: VocabItem[]): Question {
  const wrongs = pickRandom(
    all.filter((v) => v.id !== item.id).map((v) => v.word),
    3
  );
  const options = shuffle([item.word, ...wrongs]);
  const correctIndex = options.indexOf(item.word);
  return {
    id: `wm-${item.id}-${Date.now()}`,
    type: "word_from_meaning",
    question: `Từ nào có nghĩa là "${item.meaning}"?`,
    options,
    correctIndex,
    explanation: `Đáp án đúng là "${item.word}" (${item.phonetic})`,
    wordId: item.id,
  };
}

function generateSynonymQuestion(item: VocabItem, all: VocabItem[]): Question | null {
  if (!item.synonyms || item.synonyms.length === 0) return null;
  const correct = item.synonyms[0];
  const wrongPool = all
    .filter((v) => v.id !== item.id && !item.synonyms.includes(v.word))
    .map((v) => v.word)
    .concat(
      all.flatMap((v) => v.synonyms || []).filter((s) => !item.synonyms.includes(s))
    );
  const wrongs = pickRandom(wrongPool, 3);
  if (wrongs.length < 3) return null;
  const options = shuffle([correct, ...wrongs.slice(0, 3)]);
  const correctIndex = options.indexOf(correct);
  return {
    id: `s-${item.id}-${Date.now()}`,
    type: "synonym",
    question: `Từ đồng nghĩa với "${item.word}" là gì?`,
    options,
    correctIndex,
    explanation: `Đồng nghĩa của "${item.word}": ${item.synonyms.join(", ")}`,
    wordId: item.id,
  };
}

function generateAntonymQuestion(item: VocabItem, all: VocabItem[]): Question | null {
  if (!item.antonyms || item.antonyms.length === 0) return null;
  const correct = item.antonyms[0];
  const wrongs = pickRandom(
    all
      .filter((v) => v.id !== item.id && !(item.antonyms || []).includes(v.word))
      .map((v) => v.word),
    3
  );
  if (wrongs.length < 3) return null;
  const options = shuffle([correct, ...wrongs.slice(0, 3)]);
  const correctIndex = options.indexOf(correct);
  return {
    id: `a-${item.id}-${Date.now()}`,
    type: "antonym",
    question: `Từ trái nghĩa với "${item.word}" là gì?`,
    options,
    correctIndex,
    explanation: `Trái nghĩa của "${item.word}": ${item.antonyms.join(", ")}`,
    wordId: item.id,
  };
}

function generateCollocationQuestion(item: VocabItem, all: VocabItem[]): Question | null {
  if (!item.collocations || item.collocations.length === 0) return null;
  const correct = item.collocations[0];
  const wrongs = pickRandom(
    all
      .filter((v) => v.id !== item.id)
      .flatMap((v) => v.collocations || [])
      .filter((c) => c !== correct),
    3
  );
  if (wrongs.length < 3) return null;
  const options = shuffle([correct, ...wrongs.slice(0, 3)]);
  const correctIndex = options.indexOf(correct);
  return {
    id: `c-${item.id}-${Date.now()}`,
    type: "collocation",
    question: `Cụm từ nào thường đi với "${item.word}"?`,
    options,
    correctIndex,
    explanation: `Collocation phổ biến: ${item.collocations.join(", ")}`,
    wordId: item.id,
  };
}

export function generateQuiz(
  count: number = 10,
  types: QuestionType[] = ["meaning", "word_from_meaning", "synonym", "antonym", "collocation"]
): Question[] {
  const allVocab = getAllVocab();
  const questions: Question[] = [];
  const usedIds = new Set<number>();
  const shuffled = shuffle(allVocab);

  for (const item of shuffled) {
    if (questions.length >= count) break;
    if (usedIds.has(item.id)) continue;

    const availableGenerators: (() => Question | null)[] = [];
    if (types.includes("meaning")) availableGenerators.push(() => generateMeaningQuestion(item, allVocab));
    if (types.includes("word_from_meaning")) availableGenerators.push(() => generateWordFromMeaningQuestion(item, allVocab));
    if (types.includes("synonym")) availableGenerators.push(() => generateSynonymQuestion(item, allVocab));
    if (types.includes("antonym")) availableGenerators.push(() => generateAntonymQuestion(item, allVocab));
    if (types.includes("collocation")) availableGenerators.push(() => generateCollocationQuestion(item, allVocab));

    const gens = shuffle(availableGenerators);
    for (const gen of gens) {
      const q = gen();
      if (q) {
        questions.push(q);
        usedIds.add(item.id);
        break;
      }
    }
  }

  // Nếu thiếu, fill bằng meaning
  while (questions.length < count && shuffled.length > 0) {
    const item = shuffled[questions.length % shuffled.length];
    questions.push(generateMeaningQuestion(item, allVocab));
  }

  return questions.slice(0, count);
}
