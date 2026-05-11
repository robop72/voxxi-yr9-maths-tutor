import ChatInterface from "@/components/ChatInterface";

const currentStudent = {
  name: "Sam",
  purchased_subjects: ["English", "Maths", "Science"],
};

export default function Home() {
  return (
    <main className="h-full">
      <ChatInterface purchasedSubjects={currentStudent.purchased_subjects} />
    </main>
  );
}
