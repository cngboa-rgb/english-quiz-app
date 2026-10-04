# Ứng dụng Học Từ Vựng Tiếng Anh - Life Stories

Web app học từ vựng tiếng Anh từ tài liệu **Life Stories**, chạy **hoàn toàn local** trên máy bạn.

## Tính năng

- Đăng ký / Đăng nhập (lưu trên trình duyệt)
- Lưu tiến trình & lịch sử làm bài
- **Upload file từ vựng mới** (JSON hoặc CSV) → tự động thêm vào ngân hàng từ và tạo quiz
- Quiz đa dạng: nghĩa từ, đồng nghĩa, trái nghĩa, collocation...
- Giao diện hoàn toàn tiếng Việt
- Không cần internet sau khi cài

## Cách chạy trên Windows

1. Cài Node.js LTS từ https://nodejs.org
2. Mở terminal trong thư mục `english-quiz-app`
3. Chạy:
   ```bash
   npm install
   npm run dev
   ```
4. Mở trình duyệt: http://localhost:3000

## Cách thêm từ vựng mới bằng Upload

1. Vào trang Dashboard
2. Kéo xuống phần **Thêm từ vựng từ file**
3. Chọn file `.json` hoặc `.csv`
4. Web sẽ tự thêm từ mới (bỏ qua từ trùng)

### Định dạng file JSON (khuyến nghị)
```json
[
  {
    "word": "resilient",
    "phonetic": "/rɪˈzɪliənt/",
    "meaning": "kiên cường/bền bỉ",
    "type": "adj",
    "synonyms": ["tough", "strong"],
    "antonyms": ["fragile", "weak"],
    "collocations": ["resilient spirit", "highly resilient"]
  }
]
```

### Định dạng file CSV
```csv
word,phonetic,meaning,type,synonyms,antonyms,collocations
resilient,/rɪˈzɪliənt/,kiên cường/bền bỉ,adj,tough|strong,fragile|weak,resilient spirit|highly resilient
```

- Dùng dấu `|` để ngăn cách nhiều synonyms / antonyms / collocations.

## Cấu trúc chính

- `src/data/vocab.ts` — Từ vựng gốc
- `src/lib/storage.ts` — User, tiến trình, từ vựng đã upload
- `src/lib/quizGenerator.ts` — Tạo câu hỏi từ toàn bộ từ vựng (gốc + upload)
- `src/app/dashboard` — Trang chính + upload
- `src/app/quiz` — Làm quiz

Chúc bạn học tốt!
