import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card } from "../components/ui/Card";
import Button from "../components/ui/Button";
import { PlusIcon, SquarePen, TrashIcon } from "lucide-react";

type Item = {
  id?: number;
  created_at?: string;
  item_name: string;
  merchant_id?: string | number;
};

type ItemForm = {
  item_name: string;
};

const fallbackSupabaseUrl = "https://ieifmvklbaknwmarbiwe.supabase.co";
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? fallbackSupabaseUrl;
const SUPABASE_APIKEY = import.meta.env.VITE_SUPABASE_APIKEY;

const API_URL = `${supabaseUrl}/rest/v1/item`;

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    apikey: SUPABASE_APIKEY,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  },
});

const Items: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);

  const merchantId = import.meta.env.VITE_MERCHANT_ID;

  const [addForm, setAddForm] = useState<ItemForm>({ item_name: "" });
  const [editForm, setEditForm] = useState<ItemForm>({ item_name: "" });

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!merchantId) {
      // eslint-disable-next-line no-console
      console.warn("VITE_MERCHANT_ID is missing; Items will not load correctly.");
    }
  }, [merchantId]);

  const fetchTotalItems = async (searchQuery = "") => {
    try {
      const params: any = { select: "count" };
      if (merchantId) {
        params.merchant_id = `eq.${merchantId}`;
      }
      if (searchQuery.trim()) {
        params.item_name = `ilike.%${searchQuery}%`;
      }
      const res = await axiosInstance.get("", { params });
      const dataCount = res.data[0]?.count ?? 0;
      setTotalPages(Math.max(1, Math.ceil(dataCount / pageSize)));
    } catch {
      setTotalPages(1);
    }
  };

  const fetchItems = async (page = 1, limit = pageSize, searchQuery = "") => {
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
      params.item_name = `ilike.%${searchQuery}%`;
    }

    try {
      const { data } = await axiosInstance.get("", { params });
      setItems(data);
      await fetchTotalItems(searchQuery);
    } catch {
      setItems([]);
      setTotalPages(1);
    }
  };

  useEffect(() => {
    fetchItems(currentPage, pageSize, search);
    // eslint-disable-next-line
  }, [currentPage, pageSize]);

  const handleSearch = async () => {
    await fetchItems(1, pageSize, search);
    setCurrentPage(1);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantId) {
      alert("Missing VITE_MERCHANT_ID.");
      return;
    }

    try {
      const payload: Item = {
        ...addForm,
        merchant_id: merchantId,
      };
      await axiosInstance.post("", [payload]);
      setShowAddModal(false);
      setAddForm({ item_name: "" });
      fetchItems(currentPage, pageSize, search);
    } catch {
      alert("Failed to create item.");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem?.id) return;
    if (!merchantId) {
      alert("Missing VITE_MERCHANT_ID.");
      return;
    }

    try {
      const payload: Item = {
        ...editForm,
        merchant_id: merchantId,
      };
      await axiosInstance.patch("", payload, {
        params: {
          id: `eq.${editItem.id}`,
          merchant_id: `eq.${merchantId}`,
        },
      });
      setShowEditModal(false);
      setEditItem(null);
      fetchItems(currentPage, pageSize, search);
    } catch {
      alert("Failed to update item.");
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
      fetchItems(currentPage, pageSize, search);
    } catch {
      alert("Failed to delete item.");
    }
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleEdit = (item: Item) => {
    setEditItem(item);
    setEditForm({
      item_name: item.item_name,
    });
    setShowEditModal(true);
  };

  return (
    <div className="w-full px-4 sm:px-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Items</h1>
          <p className="text-gray-500 mt-1">Manage your items</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex items-center px-6 py-3 bg-[#009FC3] text-white font-semibold rounded-md text-base shadow-sm hover:bg-[#0086a8] transition"
            onClick={() => setShowAddModal(true)}
          >
            <PlusIcon className="h-5 w-5 mr-3" />
            Add Item
          </button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden border border-gray-200 rounded-lg shadow-none mt-6">
        <div className="p-4 flex flex-col sm:flex-row gap-2 sm:gap-4 items-center">
          <div className="flex-1 w-full">
            <input
              type="text"
              placeholder="Search items..."
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
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#009FC3]">NAME</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#009FC3]">CREATED AT</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b last:border-b-0 hover:bg-[#F5FBFD] transition">
                  <td className="px-6 py-4 text-gray-700">{item.item_name}</td>
                  <td className="px-6 py-4 text-gray-700">
                    {item.created_at ? new Date(item.created_at).toLocaleString() : ""}
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <button className="p-2 rounded hover:bg-gray-100" onClick={() => handleEdit(item)}>
                      <SquarePen className="h-5 w-5 text-gray-400" />
                    </button>
                    <button className="p-2 rounded hover:bg-red-100" onClick={() => handleDelete(item.id)}>
                      <TrashIcon className="h-5 w-5 text-red-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {items.length === 0 && (
            <div className="text-center text-gray-500 py-8">No items found.</div>
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">Add Item</h2>
            <form className="space-y-4" onSubmit={handleAddSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={addForm.item_name}
                  onChange={(e) => setAddForm({ ...addForm, item_name: e.target.value })}
                  required
                />
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

      {showEditModal && editItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">Edit Item</h2>
            <form className="space-y-4" onSubmit={handleEditSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={editForm.item_name}
                  onChange={(e) => setEditForm({ ...editForm, item_name: e.target.value })}
                  required
                />
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

export default Items;
