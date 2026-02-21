import { redirect } from "next/navigation";

export default function ReportIssuePage() {
  redirect("/contact?type=report_issue");
}
