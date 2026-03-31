import { useState } from "react"
import PromptInput from "../components/PromptInput"
import ChartCard from "../components/ChartCard"
import InsightPanel from "../components/InsightPanel"
import { generateDashboard } from "../api/aiAssistantApi"
import type { DashboardResponse } from "../types/dashboard"

export default function DashboardPage() {

  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const handlePrompt = async (prompt: string) => {
    setData(null)

    setLoading(true)

    try {
      const res = await generateDashboard(prompt)
      setData(res)
    } catch (err) {
      alert("Error generating dashboard")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-10">

      {loading && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          role="dialog"
          aria-modal="true"
          aria-label="Generating report"
        >
          <div className="bg-white shadow rounded-lg px-6 py-4">
            <p className="text-lg font-semibold">Generating report . . .</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">

        <h1 className="text-3xl font-bold">
          AI POS Analytics
        </h1>

        <PromptInput
          onSubmit={handlePrompt}
          loading={loading}
        />

        {data && (

          <>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">

              {data.charts.map((chart, i) => (
                <ChartCard key={i} chart={chart} />
              ))}

            </div>

            <InsightPanel insight={data.insight} />
          </>
        )}

      </div>

    </div>
  )
}