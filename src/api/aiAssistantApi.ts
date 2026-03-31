import axios from "axios"
import type { DashboardResponse } from "../types/dashboard"

export async function generateDashboard(
  prompt: string
): Promise<DashboardResponse> {

  const res = await axios.post(
    "https://vzwlrxcghcghfatxgasx.supabase.co/functions/v1/pos-ai-assistant",
    { question: prompt }
  )

  return res.data
}