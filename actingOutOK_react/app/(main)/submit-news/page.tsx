import { redirect } from "next/navigation";

export default function SubmitNewsPage() {
  redirect("/contact?type=news");
}
