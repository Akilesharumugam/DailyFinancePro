import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";

export default async function Home() {
  redirect((await getViewer()) ? "/dashboard" : "/login");
}
