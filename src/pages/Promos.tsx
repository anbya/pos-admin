import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card } from "../components/ui/Card";
import Button from "../components/ui/Button";
import { PlusIcon, SquarePen, TrashIcon } from "lucide-react";

type Promo = {
  id?: number;
  created_at?: string;
  promo_name?: string | null;
  promo_type?: string | null;
  discount_percentage_value?: number | null;
  discount_amount_value?: number | null;
  minimum_order_value?: number | null;
  max_amount_discount?: number | null;
  merchant_id?: string | number;
};

type PromoForm = {
  promo_name: string;
  promo_type: string;
  discount_percentage_value: string;
  discount_amount_value: string;
  minimum_order_value: string;
  max_amount_discount: string;
};

const fallbackSupabaseUrl = "https://ieifmvklbaknwmarbiwe.supabase.co";
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? fallbackSupabaseUrl;
const SUPABASE_APIKEY = import.meta.env.VITE_SUPABASE_APIKEY;

const API_URL = `${supabaseUrl}/rest/v1/promo`;

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    apikey: SUPABASE_APIKEY,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  },
});

const toNullableNumber = (value: string) => {
  const v = value.trim();
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const Promos: React.FC = () => {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editPromo, setEditPromo] = useState<Promo | null>(null);

  const merchantId = import.meta.env.VITE_MERCHANT_ID;

  const [addForm, setAddForm] = useState<PromoForm>({
    promo_name: "",
    promo_type: "",
    discount_percentage_value: "",
    discount_amount_value: "",
    minimum_order_value: "",
    max_amount_discount: "",
  });

  const [editForm, setEditForm] = useState<PromoForm>({
    promo_name: "",
    promo_type: "",
    discount_percentage_value: "",
    discount_amount_value: "",
    minimum_order_value: "",
    max_amount_discount: "",
  });

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!merchantId) {
      // eslint-disable-next-line no-console
      console.warn("VITE_MERCHANT_ID is missing; Promos will not load correctly.");
    }
  }, [merchantId]);

  const fetchTotalPromos = async (searchQuery = "") => {
    try {
      const params: any = { select: "count" };
      if (merchantId) {
        params.merchant_id = `eq.${merchantId}`;
      }
      if (searchQuery.trim()) {
        params.promo_name = `ilike.%${searchQuery}%`;
      }
      const res = await axiosInstance.get("", { params });
      const dataCount = res.data[0]?.count ?? 0;
      setTotalPages(Math.max(1, Math.ceil(dataCount / pageSize)));
    } catch {
      setTotalPages(1);
    }
  };

  const fetchPromos = async (page = 1, limit = pageSize, searchQuery = "") => {
    const params: any = {
      select: "*",
      limit,
      offset: (page - 1) * limit,
      order: "id.asc",
    };

    if (merchantId) {
      params.merchant_id = `eq.${merchantId}`;
    }

    if (searchQuery.trim()) {
      params.promo_name = `ilike.%${searchQuery}%`;
    }

    try {
      const { data } = await axiosInstance.get("", { params });
      setPromos(data);
      await fetchTotalPromos(searchQuery);
    } catch {
      setPromos([]);
      setTotalPages(1);
    }
  };

  useEffect(() => {
    fetchPromos(currentPage, pageSize, search);
    // eslint-disable-next-line
  }, [currentPage, pageSize]);

  const handleSearch = async () => {
    await fetchPromos(1, pageSize, search);
    setCurrentPage(1);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantId) {
      alert("Missing VITE_MERCHANT_ID.");
      return;
    }

    try {
      const payload: Promo = {
        promo_name: addForm.promo_name.trim() ? addForm.promo_name.trim() : null,
        promo_type: addForm.promo_type.trim() ? addForm.promo_type.trim() : null,
        discount_percentage_value: toNullableNumber(addForm.discount_percentage_value),
        discount_amount_value: toNullableNumber(addForm.discount_amount_value),
        minimum_order_value: toNullableNumber(addForm.minimum_order_value),
        max_amount_discount: toNullableNumber(addForm.max_amount_discount),
        merchant_id: merchantId,
      };

      await axiosInstance.post("", [payload]);
      setShowAddModal(false);
      setAddForm({
        promo_name: "",
        promo_type: "",
        discount_percentage_value: "",
        discount_amount_value: "",
        minimum_order_value: "",
        max_amount_discount: "",
      });
      fetchPromos(currentPage, pageSize, search);
    } catch {
      alert("Failed to create promo.");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPromo?.id) return;
    if (!merchantId) {
      alert("Missing VITE_MERCHANT_ID.");
      return;
    }

    try {
      const payload: Promo = {
        promo_name: editForm.promo_name.trim() ? editForm.promo_name.trim() : null,
        promo_type: editForm.promo_type.trim() ? editForm.promo_type.trim() : null,
        discount_percentage_value: toNullableNumber(editForm.discount_percentage_value),
        discount_amount_value: toNullableNumber(editForm.discount_amount_value),
        minimum_order_value: toNullableNumber(editForm.minimum_order_value),
        max_amount_discount: toNullableNumber(editForm.max_amount_discount),
        merchant_id: merchantId,
      };

      await axiosInstance.patch("", payload, {
        params: {
          id: `eq.${editPromo.id}`,
          merchant_id: `eq.${merchantId}`,
        },
      });

      setShowEditModal(false);
      setEditPromo(null);
      fetchPromos(currentPage, pageSize, search);
    } catch {
      alert("Failed to update promo.");
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (!merchantId) {
      alert("Missing VITE_MERCHANT_ID.");
      return;
    }

    try {
      await axiosInstance.delete("", {
        params: {
          id: `eq.${id}`,
          merchant_id: `eq.${merchantId}`,
        },
      });
      fetchPromos(currentPage, pageSize, search);
    } catch {
      alert("Failed to delete promo.");
    }
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleEdit = (p: Promo) => {
    setEditPromo(p);
    setEditForm({
      promo_name: String(p.promo_name ?? ""),
      promo_type: String(p.promo_type ?? ""),
      discount_percentage_value: p.discount_percentage_value == null ? "" : String(p.discount_percentage_value),
      discount_amount_value: p.discount_amount_value == null ? "" : String(p.discount_amount_value),
      minimum_order_value: p.minimum_order_value == null ? "" : String(p.minimum_order_value),
      max_amount_discount: p.max_amount_discount == null ? "" : String(p.max_amount_discount),
    });
    setShowEditModal(true);
  };

  return (
    <div className="w-full px-4 sm:px-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Promos</h1>
          <p className="text-gray-500 mt-1">Manage your promos</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex items-center px-6 py-3 bg-[#009FC3] text-white font-semibold rounded-md text-base shadow-sm hover:bg-[#0086a8] transition"
            onClick={() => setShowAddModal(true)}
          >
            <PlusIcon className="h-5 w-5 mr-3" />
            Add Promo
          </button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden border border-gray-200 rounded-lg shadow-none mt-6">
        <div className="p-4 flex flex-col sm:flex-row gap-2 sm:gap-4 items-center">
          <div className="flex-1 w-full">
            <input
              type="text"
              placeholder="Search promos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-[#F5FBFD]">
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#009FC3]">PROMO NAME</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#009FC3]">TYPE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#009FC3]">DISCOUNT (%)</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#009FC3]">DISCOUNT (AMOUNT)</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#009FC3]">MIN ORDER</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#009FC3]">MAX DISCOUNT</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#009FC3]">CREATED AT</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {promos.map((p) => (
                <tr key={p.id} className="border-b last:border-b-0 hover:bg-[#F5FBFD] transition">
                  <td className="px-6 py-4 text-gray-700">{p.promo_name ?? ""}</td>
                  <td className="px-6 py-4 text-gray-700">{p.promo_type ?? ""}</td>
                  <td className="px-6 py-4 text-gray-700">{p.discount_percentage_value ?? ""}</td>
                  <td className="px-6 py-4 text-gray-700">{p.discount_amount_value ?? ""}</td>
                  <td className="px-6 py-4 text-gray-700">{p.minimum_order_value ?? ""}</td>
                  <td className="px-6 py-4 text-gray-700">{p.max_amount_discount ?? ""}</td>
                  <td className="px-6 py-4 text-gray-700">
                    {p.created_at ? new Date(p.created_at).toLocaleString() : ""}
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <button className="p-2 rounded hover:bg-gray-100" onClick={() => handleEdit(p)}>
                      <SquarePen className="h-5 w-5 text-gray-400" />
                    </button>
                    <button className="p-2 rounded hover:bg-red-100" onClick={() => handleDelete(p.id)}>
                      <TrashIcon className="h-5 w-5 text-red-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {promos.length === 0 && (
            <div className="text-center text-gray-500 py-8">No promos found.</div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <label className="mr-2 text-sm text-gray-600">Rows per page:</label>
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              {[1, 5, 10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowAddModal(false)}>
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">Add Promo</h2>
            <form className="space-y-4" onSubmit={handleAddSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Promo Name</label>
                <input
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={addForm.promo_name}
                  onChange={(e) => setAddForm({ ...addForm, promo_name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Promo Type</label>
                <input
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={addForm.promo_type}
                  onChange={(e) => setAddForm({ ...addForm, promo_type: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Discount (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={addForm.discount_percentage_value}
                    onChange={(e) => setAddForm({ ...addForm, discount_percentage_value: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Discount Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={addForm.discount_amount_value}
                    onChange={(e) => setAddForm({ ...addForm, discount_amount_value: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Minimum Order</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={addForm.minimum_order_value}
                    onChange={(e) => setAddForm({ ...addForm, minimum_order_value: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Discount</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={addForm.max_amount_discount}
                    onChange={(e) => setAddForm({ ...addForm, max_amount_discount: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="inline-flex items-center px-6 py-3 bg-[#ffffff] text-black font-semibold rounded-md text-base shadow-sm hover:bg-[#ededed] transition"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-6 py-3 bg-[#009FC3] text-white font-semibold rounded-md text-base shadow-sm hover:bg-[#0086a8] transition"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowEditModal(false)}>
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">Edit Promo</h2>
            <form className="space-y-4" onSubmit={handleEditSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Promo Name</label>
                <input
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={editForm.promo_name}
                  onChange={(e) => setEditForm({ ...editForm, promo_name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Promo Type</label>
                <input
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={editForm.promo_type}
                  onChange={(e) => setEditForm({ ...editForm, promo_type: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Discount (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={editForm.discount_percentage_value}
                    onChange={(e) => setEditForm({ ...editForm, discount_percentage_value: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Discount Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={editForm.discount_amount_value}
                    onChange={(e) => setEditForm({ ...editForm, discount_amount_value: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Minimum Order</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={editForm.minimum_order_value}
                    onChange={(e) => setEditForm({ ...editForm, minimum_order_value: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Discount</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={editForm.max_amount_discount}
                    onChange={(e) => setEditForm({ ...editForm, max_amount_discount: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="inline-flex items-center px-6 py-3 bg-[#ffffff] text-black font-semibold rounded-md text-base shadow-sm hover:bg-[#ededed] transition"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-6 py-3 bg-[#009FC3] text-white font-semibold rounded-md text-base shadow-sm hover:bg-[#0086a8] transition"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Promos;
