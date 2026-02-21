import { redirect } from "next/navigation";

export default function SubmitResourcePage() {
  redirect("/contact?type=resource");
}
