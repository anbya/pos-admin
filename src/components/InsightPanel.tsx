type Props = {
  insight?: string
}

export default function InsightPanel({ insight = '' }: Props) {

  return (
    <div className="bg-white shadow rounded-lg p-6">

      <h2 className="text-xl font-semibold mb-4">
        AI Insight
      </h2>

      <pre className="whitespace-pre-wrap text-sm">
        {insight}
      </pre>

    </div>
  )
}