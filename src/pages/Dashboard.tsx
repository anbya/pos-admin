import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Card } from "../components/ui/Card";
import {
  ActivityIcon,
  AlertTriangleIcon,
  BadgePercentIcon,
  BarChartIcon,
  DollarSignIcon,
  PackageIcon,
  PercentIcon,
  ReceiptIcon,
  ShoppingBagIcon,
  TagIcon,
  WalletIcon,
  XCircleIcon,
} from "lucide-react";
import { Bar } from "react-chartjs-2";
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

type Receipt = {
  id?: number;
  created_at?: string;
  subtotal?: number | null;
  tax?: number | null;
  service_charge?: number | null;
  discount?: number | null;
  total?: number | null;
  total_payment?: number | null;
  merchant_id?: string | number;
};

type ReceiptDetailRow = {
  payment_type?: string | null;
  payment_value?: number | null;
  paid_value?: number | null;
  receipt?: {
    created_at?: string;
    merchant_id?: string | number;
  } | null;
};

type ProductRow = {
  id?: number;
  product_name?: string | null;
  status?: number | null;
  [key: string]: any;
};

type TransactionDetailRow = {
  product_id?: number | null;
  product?: {
    id?: number;
    product_name?: string | null;
    status?: number | null;
  } | null;
  transaction?: {
    merchant_id?: string | number;
    created_at?: string;
  } | null;
};

type ProductSalesSummary = {
  product_id: number;
  product_name: string;
  sold_count: number;
};

const fallbackSupabaseUrl = "https://ieifmvklbaknwmarbiwe.supabase.co";
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? fallbackSupabaseUrl;
const SUPABASE_APIKEY = import.meta.env.VITE_SUPABASE_APIKEY;

const receiptApi = axios.create({
  baseURL: `${supabaseUrl}/rest/v1/receipt`,
  headers: {
    apikey: SUPABASE_APIKEY,
    "Content-Type": "application/json",
  },
});

const receiptDetailApi = axios.create({
  baseURL: `${supabaseUrl}/rest/v1/receipt_detail`,
  headers: {
    apikey: SUPABASE_APIKEY,
    "Content-Type": "application/json",
  },
});

const productApi = axios.create({
  baseURL: `${supabaseUrl}/rest/v1/product`,
  headers: {
    apikey: SUPABASE_APIKEY,
    "Content-Type": "application/json",
  },
});

const transactionDetailApi = axios.create({
  baseURL: `${supabaseUrl}/rest/v1/transaction_detail`,
  headers: {
    apikey: SUPABASE_APIKEY,
    "Content-Type": "application/json",
  },
});

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const formatCurrency = (value: number) => {
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
  }
};

const formatPercent = (value: number) => {
  if (!Number.isFinite(value)) return "-";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
};

const toNumber = (value: any) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const startOfMonth = (d: Date) => {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
};

const addDays = (d: Date, days: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
};

const addMonths = (d: Date, months: number) => {
  const x = new Date(d);
  x.setMonth(x.getMonth() + months);
  return x;
};

const buildRangeParams = (opts: {
  select: string;
  order?: string;
  limit?: number;
  merchantId?: string | number;
  rangeCol: string;
  gteIso: string;
  ltIso: string;
  extra?: Record<string, string>;
}) => {
  const params = new URLSearchParams();
  params.set("select", opts.select);
  if (opts.order) params.set("order", opts.order);
  if (opts.limit != null) params.set("limit", String(opts.limit));
  if (opts.merchantId != null && String(opts.merchantId).trim()) {
    params.set("merchant_id", `eq.${opts.merchantId}`);
  }
  if (opts.extra) {
    for (const [k, v] of Object.entries(opts.extra)) {
      params.set(k, v);
    }
  }
  params.append(opts.rangeCol, `gte.${opts.gteIso}`);
  params.append(opts.rangeCol, `lt.${opts.ltIso}`);
  return params;
};

const KpiCard = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
}) => (
  <Card className="flex flex-col justify-between border border-gray-200 bg-white shadow-none rounded-lg p-6 min-h-[120px]">
    <div className="flex items-center justify-between">
      <span className="text-base font-semibold text-gray-700">{label}</span>
      <span>{icon}</span>
    </div>
    <div className="mt-4 text-2xl font-bold text-[#009FC3]">{value}</div>
  </Card>
);

const ChartCard = ({
  title,
  subtitle,
  data,
}: {
  title: string;
  subtitle?: string;
  data: any;
}) => {
  const options: any = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#6b7280", font: { size: 12 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: "#e5e7eb" },
        ticks: { color: "#6b7280", font: { size: 12 } },
      },
    },
  };

  return (
    <Card className="p-6">
      <div className="flex items-center mb-2">
        <BarChartIcon className="h-5 w-5 text-[#009FC3] mr-2" />
        <span className="font-semibold text-gray-700">{title}</span>
      </div>
      {subtitle && <div className="text-sm text-gray-500">{subtitle}</div>}
      <div className="mt-4">
        <Bar data={data} options={options} />
      </div>
    </Card>
  );
};

const SimpleTableCard = ({
  title,
  subtitle,
  columns,
  rows,
}: {
  title: string;
  subtitle?: string;
  columns: string[];
  rows: Array<Array<React.ReactNode>>;
}) => (
  <Card className="p-0 overflow-hidden border border-gray-200 rounded-lg shadow-none">
    <div className="px-6 pt-6 pb-2">
      <span className="text-lg font-bold text-gray-900">{title}</span>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead>
          <tr className="bg-[#F5FBFD]">
            {columns.map((c) => (
              <th key={c} className="px-6 py-3 text-left text-xs font-semibold text-[#009FC3]">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx} className="border-b last:border-b-0 hover:bg-[#F5FBFD] transition">
              {r.map((cell, i) => (
                <td key={i} className="px-6 py-4 text-sm text-gray-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <div className="text-center text-gray-500 py-8">No data found.</div>}
    </div>
  </Card>
);

const Dashboard: React.FC = () => {
  const merchantId = import.meta.env.VITE_MERCHANT_ID;
  const merchantIdValue = String(merchantId ?? "").trim();

  useEffect(() => {
    if (!merchantIdValue) {
      // eslint-disable-next-line no-console
      console.warn("VITE_MERCHANT_ID is missing; Dashboard will not load correctly.");
    }
  }, [merchantIdValue]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [receiptsToday, setReceiptsToday] = useState<Receipt[]>([]);
  const [receiptsLast30, setReceiptsLast30] = useState<Receipt[]>([]);
  const [receiptsLast12Months, setReceiptsLast12Months] = useState<Receipt[]>([]);

  const [paymentMonthRows, setPaymentMonthRows] = useState<ReceiptDetailRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [txDetailMonth, setTxDetailMonth] = useState<TransactionDetailRow[]>([]);

  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = startOfDay(addDays(now, 1));
  const monthStart = startOfMonth(now);
  const nextMonthStart = startOfMonth(addMonths(monthStart, 1));
  const prevMonthStart = startOfMonth(addMonths(monthStart, -1));
  const last30Start = startOfDay(addDays(now, -29));
  const last12MonthStart = startOfMonth(addMonths(monthStart, -11));

  useEffect(() => {
    const run = async () => {
      if (!merchantIdValue) {
        setError("Missing VITE_MERCHANT_ID.");
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const todayParams = buildRangeParams({
          select: "id,created_at,subtotal,tax,service_charge,discount,total,total_payment",
          order: "id.asc",
          limit: 10000,
          merchantId: merchantIdValue,
          rangeCol: "created_at",
          gteIso: todayStart.toISOString(),
          ltIso: tomorrowStart.toISOString(),
        });

        const last30Params = buildRangeParams({
          select: "id,created_at,subtotal,tax,service_charge,discount,total,total_payment",
          order: "id.asc",
          limit: 20000,
          merchantId: merchantIdValue,
          rangeCol: "created_at",
          gteIso: last30Start.toISOString(),
          ltIso: tomorrowStart.toISOString(),
        });

        const last12Params = buildRangeParams({
          select: "id,created_at,subtotal,tax,service_charge,discount,total,total_payment",
          order: "id.asc",
          limit: 50000,
          merchantId: merchantIdValue,
          rangeCol: "created_at",
          gteIso: last12MonthStart.toISOString(),
          ltIso: tomorrowStart.toISOString(),
        });

        const paymentMonthParams = new URLSearchParams();
        paymentMonthParams.set("select", "payment_type,payment_value,paid_value,receipt!inner(created_at,merchant_id)");
        paymentMonthParams.set("limit", "20000");
        paymentMonthParams.set("receipt.merchant_id", `eq.${merchantIdValue}`);
        paymentMonthParams.append("receipt.created_at", `gte.${monthStart.toISOString()}`);
        paymentMonthParams.append("receipt.created_at", `lt.${nextMonthStart.toISOString()}`);

        const productParams = new URLSearchParams();
        productParams.set("select", "*");
        productParams.set("order", "id.asc");
        productParams.set("limit", "20000");
        productParams.set("merchant_id", `eq.${merchantIdValue}`);

        const txDetailParams = new URLSearchParams();
        txDetailParams.set(
          "select",
          "product_id,product(id,product_name,status),transaction!inner(merchant_id,created_at)"
        );
        txDetailParams.set("limit", "50000");
        txDetailParams.set("transaction.merchant_id", `eq.${merchantIdValue}`);
        txDetailParams.append("transaction.created_at", `gte.${monthStart.toISOString()}`);
        txDetailParams.append("transaction.created_at", `lt.${nextMonthStart.toISOString()}`);

        const [todayRes, last30Res, last12Res, payRes, prodRes, txRes] = await Promise.all([
          receiptApi.get("", { params: todayParams }),
          receiptApi.get("", { params: last30Params }),
          receiptApi.get("", { params: last12Params }),
          receiptDetailApi.get("", { params: paymentMonthParams }),
          productApi.get("", { params: productParams }),
          transactionDetailApi.get("", { params: txDetailParams }),
        ]);

        setReceiptsToday(todayRes.data ?? []);
        setReceiptsLast30(last30Res.data ?? []);
        setReceiptsLast12Months(last12Res.data ?? []);
        setPaymentMonthRows(payRes.data ?? []);
        setProducts(prodRes.data ?? []);
        setTxDetailMonth(txRes.data ?? []);
      } catch {
        setError("Failed to load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchantIdValue]);

  const receiptsThisMonth = useMemo(() => {
    return receiptsLast12Months.filter((r) => {
      const t = r.created_at ? new Date(r.created_at).getTime() : 0;
      return t >= monthStart.getTime() && t < nextMonthStart.getTime();
    });
  }, [receiptsLast12Months, monthStart, nextMonthStart]);

  const receiptsPrevMonth = useMemo(() => {
    return receiptsLast12Months.filter((r) => {
      const t = r.created_at ? new Date(r.created_at).getTime() : 0;
      return t >= prevMonthStart.getTime() && t < monthStart.getTime();
    });
  }, [receiptsLast12Months, prevMonthStart, monthStart]);

  const sumSales = (rows: Receipt[]) =>
    rows.reduce((acc, r) => acc + toNumber(r.total ?? 0), 0);

  const sumTax = (rows: Receipt[]) => rows.reduce((acc, r) => acc + toNumber(r.tax ?? 0), 0);
  const sumDiscount = (rows: Receipt[]) =>
    rows.reduce((acc, r) => acc + toNumber(r.discount ?? 0), 0);  

  const totalSalesToday = sumSales(receiptsToday);
  const totalSalesMonth = sumSales(receiptsThisMonth);
  const totalSalesPrevMonth = sumSales(receiptsPrevMonth);
  const totalTransactionsMonth = receiptsThisMonth.length;
  const aov = totalTransactionsMonth > 0 ? totalSalesMonth / totalTransactionsMonth : 0;
  const momPct =
    totalSalesPrevMonth > 0
      ? ((totalSalesMonth - totalSalesPrevMonth) / totalSalesPrevMonth) * 100
      : 0;

  const totalDiscountMonth = sumDiscount(receiptsThisMonth);
  const totalTaxMonth = sumTax(receiptsThisMonth);
  const netRevenueMonth =
    receiptsThisMonth.reduce(
      (acc, r) =>
        acc +
        (toNumber(r.total ?? 0) - toNumber(r.tax ?? 0) - toNumber(r.service_charge ?? 0)),
      0
    );

  const hourlySalesData = useMemo(() => {
    const buckets = Array.from({ length: 24 }, () => 0);
    for (const r of receiptsToday) {
      if (!r.created_at) continue;
      const d = new Date(r.created_at);
      const hour = d.getHours();
      buckets[hour] += toNumber(r.total ?? 0);
    }
    return buckets;
  }, [receiptsToday]);

  const dailySalesLast30 = useMemo(() => {
    const days: { label: string; value: number }[] = [];
    for (let i = 0; i < 30; i++) {
      const day = addDays(last30Start, i);
      const label = day.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit" });
      days.push({ label, value: 0 });
    }

    for (const r of receiptsLast30) {
      if (!r.created_at) continue;
      const d = startOfDay(new Date(r.created_at));
      const idx = Math.floor((d.getTime() - last30Start.getTime()) / (24 * 3600 * 1000));
      if (idx >= 0 && idx < 30) {
        days[idx].value += toNumber(r.total ?? 0);
      }
    }

    return days;
  }, [receiptsLast30, last30Start]);

  const dailySalesLast7 = useMemo(() => {
    return dailySalesLast30.slice(-7);
  }, [dailySalesLast30]);

  const monthlySalesLast12 = useMemo(() => {
    const months: { label: string; value: number; start: Date; end: Date }[] = [];
    for (let i = 0; i < 12; i++) {
      const mStart = startOfMonth(addMonths(monthStart, -11 + i));
      const mEnd = startOfMonth(addMonths(mStart, 1));
      const label = mStart.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
      months.push({ label, value: 0, start: mStart, end: mEnd });
    }

    for (const r of receiptsLast12Months) {
      if (!r.created_at) continue;
      const t = new Date(r.created_at).getTime();
      const bucket = months.find((m) => t >= m.start.getTime() && t < m.end.getTime());
      if (bucket) {
        bucket.value += toNumber(r.total ?? 0);
      }
    }

    return months;
  }, [receiptsLast12Months, monthStart]);

  const paymentTotals = useMemo(() => {
    const totals: Record<string, number> = {
      Cash: 0,
      QRIS: 0,
      "Debit Card": 0,
      "E-wallet": 0,
      Other: 0,
    };

    const normalize = (t?: string | null) => (t ?? "").trim().toUpperCase();

    for (const row of paymentMonthRows) {
      const t = normalize(row.payment_type);
      const amount = toNumber(row.paid_value ?? row.payment_value ?? 0);
      if (!t) {
        totals.Other += amount;
        continue;
      }
      if (t.includes("CASH")) totals.Cash += amount;
      else if (t.includes("QRIS")) totals.QRIS += amount;
      else if (t.includes("DEBIT")) totals["Debit Card"] += amount;
      else if (t.includes("EWALLET") || t.includes("E-WALLET") || t.includes("E_WALLET")) totals["E-wallet"] += amount;
      else totals.Other += amount;
    }

    return totals;
  }, [paymentMonthRows]);

  const productCounts = useMemo(() => {
    const active = products.filter((p) => toNumber(p.status ?? 1) === 1);

    const getStock = (p: any) => {
      const candidates = ["stock", "current_stock", "qty", "quantity", "qty_on_hand"];
      for (const k of candidates) {
        if (p[k] != null && p[k] !== "") return toNumber(p[k]);
      }
      return null;
    };

    const getMinStock = (p: any) => {
      const candidates = ["min_stock", "minimum_stock", "reorder_point", "low_stock_threshold"];
      for (const k of candidates) {
        if (p[k] != null && p[k] !== "") return toNumber(p[k]);
      }
      return null;
    };

    let outOfStock = 0;
    let lowStock = 0;

    for (const p of active) {
      const stock = getStock(p);
      const minStock = getMinStock(p);
      if (stock == null) continue;
      if (stock <= 0) outOfStock += 1;
      else if (minStock != null && stock <= minStock) lowStock += 1;
    }

    return {
      activeCount: active.length,
      lowStockCount: lowStock,
      outOfStockCount: outOfStock,
      stockSupported: active.some((p: any) => getStock(p) != null),
    };
  }, [products]);

  const productSales = useMemo(() => {
    const soldMap = new Map<number, number>();
    const nameMap = new Map<number, string>();

    for (const row of txDetailMonth) {
      const pid = row.product_id != null ? Number(row.product_id) : null;
      if (!pid) continue;
      soldMap.set(pid, (soldMap.get(pid) ?? 0) + 1);
      const nm = row.product?.product_name ?? null;
      if (nm && !nameMap.has(pid)) nameMap.set(pid, nm);
    }

    const summaries: ProductSalesSummary[] = Array.from(soldMap.entries()).map(([pid, count]) => ({
      product_id: pid,
      product_name: nameMap.get(pid) ?? `Product #${pid}`,
      sold_count: count,
    }));

    summaries.sort((a, b) => b.sold_count - a.sold_count);

    const activeProducts = products.filter((p) => p.id != null && toNumber(p.status ?? 1) === 1);
    const activeIds = new Set(activeProducts.map((p) => Number(p.id)));
    const soldIds = new Set(summaries.map((s) => s.product_id));
    const slowMoving = Array.from(activeIds)
      .filter((id) => !soldIds.has(id))
      .slice(0, 10)
      .map((id) => {
        const p = activeProducts.find((x) => Number(x.id) === id);
        return {
          product_id: id,
          product_name: String(p?.product_name ?? `Product #${id}`),
        };
      });

    return {
      top5: summaries.slice(0, 5),
      slowMovingCount: Array.from(activeIds).filter((id) => !soldIds.has(id)).length,
      slowMovingList: slowMoving,
    };
  }, [txDetailMonth, products]);

  const kpis = useMemo(() => {
    return [
      {
        label: "Total Penjualan Hari Ini",
        value: formatCurrency(totalSalesToday),
        icon: <DollarSignIcon className="h-6 w-6 text-[#009FC3]" />,
      },
      {
        label: "Total Penjualan Bulan Ini",
        value: formatCurrency(totalSalesMonth),
        icon: <ShoppingBagIcon className="h-6 w-6 text-[#009FC3]" />,
      },
      {
        label: "Total Transaksi (Bulan Ini)",
        value: totalTransactionsMonth.toLocaleString("id-ID"),
        icon: <ReceiptIcon className="h-6 w-6 text-[#009FC3]" />,
      },
      {
        label: "Rata-rata Nilai Transaksi (AOV)",
        value: formatCurrency(aov),
        icon: <ActivityIcon className="h-6 w-6 text-[#009FC3]" />,
      },
      {
        label: "MoM Penjualan",
        value: formatPercent(momPct),
        icon: <PercentIcon className="h-6 w-6 text-[#009FC3]" />,
      },
      {
        label: "Total Diskon (Bulan Ini)",
        value: formatCurrency(totalDiscountMonth),
        icon: <TagIcon className="h-6 w-6 text-[#009FC3]" />,
      },
      {
        label: "Total Pajak (Bulan Ini)",
        value: formatCurrency(totalTaxMonth),
        icon: <BadgePercentIcon className="h-6 w-6 text-[#009FC3]" />,
      },
      {
        label: "Net Revenue (Bulan Ini)",
        value: formatCurrency(netRevenueMonth),
        icon: <WalletIcon className="h-6 w-6 text-[#009FC3]" />,
      },
    ];
  }, [
    totalSalesToday,
    totalSalesMonth,
    totalTransactionsMonth,
    aov,
    momPct,
    totalDiscountMonth,
    totalTaxMonth,
    netRevenueMonth,
  ]);

  const salesPerHourChart = {
    labels: Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")),
    datasets: [
      {
        label: "Sales",
        data: hourlySalesData,
        backgroundColor: "#009FC3",
        borderRadius: 6,
        maxBarThickness: 24,
      },
    ],
  };

  const salesDaily7Chart = {
    labels: dailySalesLast7.map((d) => d.label),
    datasets: [
      {
        label: "Sales",
        data: dailySalesLast7.map((d) => d.value),
        backgroundColor: "#009FC3",
        borderRadius: 6,
        maxBarThickness: 32,
      },
    ],
  };

  const salesDaily30Chart = {
    labels: dailySalesLast30.map((d) => d.label),
    datasets: [
      {
        label: "Sales",
        data: dailySalesLast30.map((d) => d.value),
        backgroundColor: "#009FC3",
        borderRadius: 6,
        maxBarThickness: 18,
      },
    ],
  };

  const salesMonthlyChart = {
    labels: monthlySalesLast12.map((m) => m.label),
    datasets: [
      {
        label: "Sales",
        data: monthlySalesLast12.map((m) => m.value),
        backgroundColor: "#009FC3",
        borderRadius: 6,
        maxBarThickness: 32,
      },
    ],
  };

  const paymentChart = {
    labels: Object.keys(paymentTotals),
    datasets: [
      {
        label: "Total",
        data: Object.values(paymentTotals),
        backgroundColor: "#009FC3",
        borderRadius: 6,
        maxBarThickness: 48,
      },
    ],
  };

  return (
    <div className="p-4 sm:p-8 bg-gray-50">
      {error && (
        <Card className="p-4 mb-6 border border-red-200 bg-white shadow-none rounded-lg">
          <div className="text-sm text-red-700">{error}</div>
        </Card>
      )}

      {isLoading && (
        <Card className="p-4 mb-6 border border-gray-200 bg-white shadow-none rounded-lg">
          <div className="text-sm text-gray-600">Loading dashboard…</div>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ChartCard title="Penjualan per Jam (Hari Ini)" subtitle="Cocok untuk resto/kafe" data={salesPerHourChart} />
        <ChartCard title="Penjualan Harian (7 Hari Terakhir)" data={salesDaily7Chart} />
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8">
        <ChartCard title="Penjualan Harian (30 Hari Terakhir)" data={salesDaily30Chart} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ChartCard title="Penjualan Bulanan (12 Bulan Terakhir)" data={salesMonthlyChart} />
        <ChartCard title="Summary Pembayaran (Bulan Ini)" subtitle="Total nominal per metode" data={paymentChart} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <KpiCard
          label="Jumlah Produk Aktif"
          value={productCounts.activeCount.toLocaleString("id-ID")}
          icon={<PackageIcon className="h-6 w-6 text-[#009FC3]" />}
        />
        <KpiCard
          label="Produk Stok Menipis"
          value={productCounts.stockSupported ? productCounts.lowStockCount.toLocaleString("id-ID") : "-"}
          icon={<AlertTriangleIcon className="h-6 w-6 text-[#009FC3]" />}
        />
        <KpiCard
          label="Produk Habis"
          value={productCounts.stockSupported ? productCounts.outOfStockCount.toLocaleString("id-ID") : "-"}
          icon={<XCircleIcon className="h-6 w-6 text-[#009FC3]" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleTableCard
          title="Top Produk Paling Sering Terjual"
          subtitle="Bulan ini (berdasarkan transaction_detail)"
          columns={["Produk", "Terjual"]}
          rows={productSales.top5.map((p) => [p.product_name, p.sold_count.toLocaleString("id-ID")])}
        />
        <SimpleTableCard
          title="Produk Tidak Laku (Slow Moving)"
          subtitle={`Bulan ini: ${productSales.slowMovingCount.toLocaleString("id-ID")} produk tidak terjual`}
          columns={["Produk"]}
          rows={productSales.slowMovingList.map((p) => [p.product_name])}
        />
      </div>
    </div>
  );
};

export default Dashboard;