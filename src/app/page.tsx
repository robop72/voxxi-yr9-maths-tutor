import ChatInterface from "@/components/ChatInterface";

const currentStudent = {
  name: "Sam",
  year_level: "Year 9",
  purchased_subjects: ["Maths", "Science", "Digital Literacy"],
};

export default function Home() {
  return (
    <main className="h-full">
      <ChatInterface
        yearLevel={currentStudent.year_level}
        purchasedSubjects={currentStudent.purchased_subjects}
      />
    </main>
  );
}
