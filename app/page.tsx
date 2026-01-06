import { CharacterForm } from "@/components/character-form";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-700 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            ⚔️ RPG Character Builder
          </h1>
          <p className="text-slate-300 text-lg">
            Create your character. Begin an epic journey.
          </p>
        </div>

        {/* form */}
        <CharacterForm />

        {/* footer */}
        <footer className="text-center text-slate-400 text-sm mt-8">
          使用 Next.js + Shadcn UI 建立
        </footer>
      </div>
    </main>
  )
}