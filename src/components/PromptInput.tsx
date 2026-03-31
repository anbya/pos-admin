import { useState } from "react"

type Props = {
  onSubmit: (prompt: string) => void
  loading: boolean
}

export default function PromptInput({ onSubmit, loading }: Props) {

  const [prompt, setPrompt] = useState("")

  const handleSubmit = () => {
    if (!prompt.trim()) return
    onSubmit(prompt)
  }

  return (
    <div className="bg-white shadow p-4 rounded-lg flex gap-3">

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Contoh: Buat laporan penjualan bulan ini"
        className="flex-1 border rounded px-3 py-2"
        rows={2}
      />

      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Generating..." : "Generate"}
      </button>

    </div>
  )
}