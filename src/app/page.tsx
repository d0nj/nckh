import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";

export default async function HomePage() {
  const session = await getServerSession();
  
  if (!session) {
    redirect("/login");
  }

  // Students go to portal, everyone else goes to dashboard
  if (session.user.role === "student") {
    redirect("/portal");
  } else {
    redirect("/dashboard");
  }
}
