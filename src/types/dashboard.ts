export type ChartItem = {
  title: string
  option: any
}

export type DashboardResponse = {
  charts: ChartItem[]
  insight: string
}