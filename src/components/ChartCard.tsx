import ReactECharts from "echarts-for-react"
import type { ChartItem } from "../types/dashboard"

type Props = {
  chart: ChartItem
}

export default function ChartCard({ chart }: Props) {

  const normalizeEChartsOption = (option: any) => {
    if (!option || typeof option !== "object") return option

    const rawSeries = option.series
    if (!rawSeries) return option

    const seriesArray = Array.isArray(rawSeries) ? rawSeries : [rawSeries]
    let changed = false

    const normalizedSeries = seriesArray.map((series: any) => {
      if (!series || typeof series !== "object") return series
      if (series.type !== "pie") return series
      if (!Array.isArray(series.data)) return series

      const normalizedData = series.data.map((point: any, index: number) => {
        if (point == null) return point

        if (typeof point === "number") {
          changed = true
          return { name: `Item ${index + 1}`, value: point }
        }

        if (typeof point === "string") {
          const parsed = Number(point)
          changed = true
          return { name: point, value: Number.isFinite(parsed) ? parsed : 0 }
        }

        if (typeof point !== "object") return point

        const hasValue = (point as any).value != null
        const inferredValue = hasValue
          ? (point as any).value
          : typeof (point as any).name === "number"
            ? (point as any).name
            : undefined

        const normalizedName = typeof (point as any).name === "string"
          ? (point as any).name
          : `Item ${index + 1}`

        if (!hasValue && inferredValue !== undefined) changed = true

        return {
          ...point,
          name: normalizedName,
          value: inferredValue ?? (point as any).value ?? 0,
        }
      })

      if (!changed) return series

      return {
        ...series,
        data: normalizedData,
      }
    })

    if (!changed) return option

    return {
      ...option,
      series: Array.isArray(rawSeries) ? normalizedSeries : normalizedSeries[0],
    }
  }

  const option = normalizeEChartsOption(chart.option)

  return (
    <div className="bg-white shadow rounded-lg p-4">

      <h3 className="font-semibold text-lg mb-3">
        {chart.title}
      </h3>

      <ReactECharts
        option={option}
        style={{ height: 350 }}
      />

    </div>
  )
}