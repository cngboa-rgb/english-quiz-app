import { redirect } from "next/navigation";

export default function Home() {
  // Chuyển thẳng sang trang đăng nhập (server-side, ổn định trên Vercel)
  redirect("/login");
}
