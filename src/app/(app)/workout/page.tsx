import { redirect } from "next/navigation";

export default function WorkoutIndex() {
  redirect("/workout/today");
}
