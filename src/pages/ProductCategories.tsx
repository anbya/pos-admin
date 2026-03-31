import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card } from "../components/ui/Card";
import Button from "../components/ui/Button";
import { PlusIcon, SquarePen, TrashIcon } from "lucide-react";

type ProductCategory = {
  id?: number;
  created_at?: string;
  product_category_name: string;
  merchant_id?: string | number;
  status?: number;
};

type ProductCategoryForm = {
  product_category_name: string;
  status?: number;
};

const fallbackSupabaseUrl = "https://ieifmvklbaknwmarbiwe.supabase.co";
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? fallbackSupabaseUrl;
const SUPABASE_APIKEY = import.meta.env.VITE_SUPABASE_APIKEY;

const API_URL = `${supabaseUrl}/rest/v1/product_category`;

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    apikey: SUPABASE_APIKEY,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  },
});

const ProductCategories: React.FC = () => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCategory, setEditCategory] = useState<ProductCategory | null>(null);

  const merchantId = import.meta.env.VITE_MERCHANT_ID;

  const [addForm, setAddForm] = useState<ProductCategoryForm>({
    product_category_name: "",
    status: 1,
  });
  const [editForm, setEditForm] = useState<ProductCategoryForm>({
    product_category_name: "",
    status: 1,
  });

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!merchantId) {
      // eslint-disable-next-line no-console
      console.warn("VITE_MERCHANT_ID is missing; Product Categories will not load correctly.");
    }
  }, [merchantId]);

  const fetchTotalCategories = async (searchQuery = "") => {
    try {
      const params: any = { select: "count" };
      if (merchantId) {
        params.merchant_id = `eq.${merchantId}`;
      }
      if (searchQuery.trim()) {
        params.product_category_name = `ilike.%${searchQuery}%`;
      }
      const res = await axiosInstance.get("", { params });
      const dataCount = res.data[0]?.count ?? 0;
      setTotalPages(Math.max(1, Math.ceil(dataCount / pageSize)));
    } catch {
      setTotalPages(1);
    }
  };

  const fetchCategories = async (page = 1, limit = pageSize, searchQuery = "") => {
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
      params.product_category_name = `ilike.%${searchQuery}%`;
    }

    try {
      const { data } = await axiosInstance.get("", { params });
      setCategories(data);
      await fetchTotalCategories(searchQuery);
    } catch {
      setCategories([]);
      setTotalPages(1);
    }
  };

  useEffect(() => {
    fetchCategories(currentPage, pageSize, search);
    // eslint-disable-next-line
  }, [currentPage, pageSize]);

  const handleSearch = async () => {
    await fetchCategories(1, pageSize, search);
    setCurrentPage(1);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantId) {
      alert("Missing VITE_MERCHANT_ID.");
      return;
    }
    try {
      const payload: ProductCategory = {
        ...addForm,
        merchant_id: merchantId,
      };
      await axiosInstance.post("", [payload]);
      setShowAddModal(false);
      setAddForm({ product_category_name: "", status: 1 });
      fetchCategories(currentPage, pageSize, search);
    } catch {
      alert("Failed to create product category.");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCategory?.id) return;
    if (!merchantId) {
      alert("Missing VITE_MERCHANT_ID.");
      return;
    }

    try {
      const payload: ProductCategory = {
        ...editForm,
        merchant_id: merchantId,
      };
      await axiosInstance.patch("", payload, {
        params: {
          id: `eq.${editCategory.id}`,
          merchant_id: `eq.${merchantId}`,
        },
      });
      setShowEditModal(false);
      setEditCategory(null);
      fetchCategories(currentPage, pageSize, search);
    } catch {
      alert("Failed to update product category.");
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
      fetchCategories(currentPage, pageSize, search);
    } catch {
      alert("Failed to delete product category.");
    }
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleEdit = (cat: ProductCategory) => {
    setEditCategory(cat);
    setEditForm({
      product_category_name: cat.product_category_name,
      status: cat.status ?? 1,
    });
    setShowEditModal(true);
  };

  return (
    <div className="w-full px-4 sm:px-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Categories</h1>
          <p className="text-gray-500 mt-1">Manage your product categories</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex items-center px-6 py-3 bg-[#009FC3] text-white font-semibold rounded-md text-base shadow-sm hover:bg-[#0086a8] transition"
            onClick={() => setShowAddModal(true)}
          >
            <PlusIcon className="h-5 w-5 mr-3" />
            Add Category
          </button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden border border-gray-200 rounded-lg shadow-none mt-6">
        <div className="p-4 flex flex-col sm:flex-row gap-2 sm:gap-4 items-center">
          <div className="flex-1 w-full">
            <input
              type="text"
              placeholder="Search categories..."
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
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#009FC3]">STATUS</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#009FC3]">CREATED AT</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr
                  key={cat.id}
                  className="border-b last:border-b-0 hover:bg-[#F5FBFD] transition"
                >
                  <td className="px-6 py-4 text-gray-700">{cat.product_category_name}</td>
                  <td className="px-6 py-4 text-gray-700">{(cat.status ?? 1) === 1 ? "Active" : "Inactive"}</td>
                  <td className="px-6 py-4 text-gray-700">
                    {cat.created_at ? new Date(cat.created_at).toLocaleString() : ""}
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <button className="p-2 rounded hover:bg-gray-100" onClick={() => handleEdit(cat)}>
                      <SquarePen className="h-5 w-5 text-gray-400" />
                    </button>
                    <button
                      className="p-2 rounded hover:bg-red-100"
                      onClick={() => handleDelete(cat.id)}
                    >
                      <TrashIcon className="h-5 w-5 text-red-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {categories.length === 0 && (
            <div className="text-center text-gray-500 py-8">No categories found.</div>
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
            <h2 className="text-xl font-bold mb-4">Add Category</h2>
            <form className="space-y-4" onSubmit={handleAddSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={addForm.product_category_name}
                  onChange={(e) =>
                    setAddForm({ ...addForm, product_category_name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={addForm.status ?? 1}
                  onChange={(e) => setAddForm({ ...addForm, status: Number(e.target.value) })}
                  required
                >
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
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

      {showEditModal && editCategory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">Edit Category</h2>
            <form className="space-y-4" onSubmit={handleEditSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={editForm.product_category_name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, product_category_name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={editForm.status ?? 1}
                  onChange={(e) => setEditForm({ ...editForm, status: Number(e.target.value) })}
                  required
                >
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
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

export default ProductCategories;
