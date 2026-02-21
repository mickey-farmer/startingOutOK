import { redirect } from "next/navigation";

export default function SubmitCastingPage() {
  redirect("/contact?type=casting_call");
}
