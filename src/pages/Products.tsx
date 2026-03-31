import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Card } from "../components/ui/Card";
import Button from "../components/ui/Button";
import { PlusIcon, SquarePen, TrashIcon } from "lucide-react";

type ProductCategory = {
  id?: number;
  product_category_name: string;
};

type Product = {
  id?: number;
  created_at?: string;
  product_name: string;
  price?: number | null;
  product_category_id?: number | null;
  merchant_id?: string | number;
  status?: number;
  product_category?: ProductCategory | null;
};

type Item = {
  id?: number;
  item_name: string;
};

type SelectedItem = {
  item_id: number;
  item_name: string;
  qty: number;
};

type ProductForm = {
  product_name: string;
  price?: number | null;
  product_category_id?: number | null;
  status?: number;
};

const fallbackSupabaseUrl = "https://ieifmvklbaknwmarbiwe.supabase.co";
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? fallbackSupabaseUrl;
const SUPABASE_APIKEY = import.meta.env.VITE_SUPABASE_APIKEY;

const productApi = axios.create({
  baseURL: `${supabaseUrl}/rest/v1/product`,
  headers: {
    apikey: SUPABASE_APIKEY,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  },
});

const productDetailApi = axios.create({
  baseURL: `${supabaseUrl}/rest/v1/product_detail`,
  headers: {
    apikey: SUPABASE_APIKEY,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  },
});

const productCategoryApi = axios.create({
  baseURL: `${supabaseUrl}/rest/v1/product_category`,
  headers: {
    apikey: SUPABASE_APIKEY,
    "Content-Type": "application/json",
  },
});

const itemApi = axios.create({
  baseURL: `${supabaseUrl}/rest/v1/item`,
  headers: {
    apikey: SUPABASE_APIKEY,
    "Content-Type": "application/json",
  },
});

const Products: React.FC = () => {
  const merchantId = import.meta.env.VITE_MERCHANT_ID;

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const [addForm, setAddForm] = useState<ProductForm>({
    product_name: "",
    price: null,
    product_category_id: null,
    status: 1,
  });
  const [editForm, setEditForm] = useState<ProductForm>({
    product_name: "",
    price: null,
    product_category_id: null,
    status: 1,
  });

  const [addSelectedItems, setAddSelectedItems] = useState<SelectedItem[]>([]);
  const [editSelectedItems, setEditSelectedItems] = useState<SelectedItem[]>([]);

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!merchantId) {
      // eslint-disable-next-line no-console
      console.warn("VITE_MERCHANT_ID is missing; Products will not load correctly.");
    }
  }, [merchantId]);

  const itemNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const item of items) {
      if (item.id != null) map.set(item.id, item.item_name);
    }
    return map;
  }, [items]);

  const fetchCategories = async () => {
    try {
      const params: any = {
        select: "id,product_category_name",
        order: "id.asc",
      };
      if (merchantId) {
        params.merchant_id = `eq.${merchantId}`;
      }
      const { data } = await productCategoryApi.get("", { params });
      setCategories(data);
    } catch {
      setCategories([]);
    }
  };

  const fetchItems = async () => {
    try {
      const params: any = {
        select: "id,item_name",
        order: "id.asc",
      };
      if (merchantId) {
        params.merchant_id = `eq.${merchantId}`;
      }
      const { data } = await itemApi.get("", { params });
      setItems(data);
    } catch {
      setItems([]);
    }
  };

  const fetchTotalProducts = async (searchQuery = "") => {
    try {
      const params: any = { select: "count" };
      if (merchantId) {
        params.merchant_id = `eq.${merchantId}`;
      }
      if (searchQuery.trim()) {
        params.product_name = `ilike.%${searchQuery}%`;
      }
      const res = await productApi.get("", { params });
      const dataCount = res.data[0]?.count ?? 0;
      setTotalPages(Math.max(1, Math.ceil(dataCount / pageSize)));
    } catch {
      setTotalPages(1);
    }
  };

  const fetchProducts = async (page = 1, limit = pageSize, searchQuery = "") => {
    const params: any = {
      select: "*,product_category(id,product_category_name)",
      limit,
      offset: (page - 1) * limit,
      order: "id.asc",
    };

    if (merchantId) {
      params.merchant_id = `eq.${merchantId}`;
    }

    if (searchQuery.trim()) {
      params.product_name = `ilike.%${searchQuery}%`;
    }

    try {
      const { data } = await productApi.get("", { params });
      setProducts(data);
      await fetchTotalProducts(searchQuery);
    } catch {
      setProducts([]);
      setTotalPages(1);
    }
  };

  useEffect(() => {
    fetchProducts(currentPage, pageSize, search);
    // eslint-disable-next-line
  }, [currentPage, pageSize]);

  useEffect(() => {
    fetchCategories();
    fetchItems();
    // eslint-disable-next-line
  }, []);

  const handleSearch = async () => {
    await fetchProducts(1, pageSize, search);
    setCurrentPage(1);
  };

  const resetAdd = () => {
    setAddForm({ product_name: "", price: null, product_category_id: null, status: 1 });
    setAddSelectedItems([]);
  };

  const validateSelectedItems = (selected: SelectedItem[]) => {
    if (!selected.length) {
      alert("Please select at least one item for this product.");
      return false;
    }
    if (selected.some((x) => !x.qty || x.qty < 1)) {
      alert("Qty must be at least 1.");
      return false;
    }
    return true;
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantId) {
      alert("Missing VITE_MERCHANT_ID.");
      return;
    }
    if (!validateSelectedItems(addSelectedItems)) return;
    if (!addForm.product_category_id) {
      alert("Please select a product category.");
      return;
    }

    try {
      const productPayload: Product = {
        ...addForm,
        merchant_id: merchantId,
      };

      const res = await productApi.post("", [productPayload]);
      const inserted: Product | undefined = res.data?.[0];
      const productId = inserted?.id;

      if (!productId) {
        alert("Failed to create product (missing ID).");
        return;
      }

      const detailPayload = addSelectedItems.map((x) => ({
        product_id: productId,
        item_id: x.item_id,
        qty: x.qty,
        merchant_id: merchantId,
      }));

      await productDetailApi.post("", detailPayload);

      setShowAddModal(false);
      resetAdd();
      fetchProducts(currentPage, pageSize, search);
    } catch {
      alert("Failed to create product.");
    }
  };

  const fetchProductDetailsForEdit = async (productId: number) => {
    try {
      const params: any = {
        select: "id,item_id,qty,item(id,item_name)",
        order: "id.asc",
        product_id: `eq.${productId}`,
      };
      if (merchantId) {
        params.merchant_id = `eq.${merchantId}`;
      }

      const { data } = await productDetailApi.get("", { params });

      const selected: SelectedItem[] = (data ?? [])
        .filter((row: any) => row.item_id != null)
        .map((row: any) => {
          const itemId = Number(row.item_id);
          const itemName =
            row.item?.item_name ?? itemNameById.get(itemId) ?? `Item #${itemId}`;
          const qty = Number(row.qty ?? 1);
          return {
            item_id: itemId,
            item_name: itemName,
            qty: qty < 1 ? 1 : qty,
          };
        });

      setEditSelectedItems(selected);
    } catch {
      setEditSelectedItems([]);
    }
  };

  const handleEdit = async (p: Product) => {
    setEditProduct(p);
    setEditForm({
      product_name: p.product_name,
      price: p.price ?? null,
      product_category_id: p.product_category_id ?? null,
      status: p.status ?? 1,
    });
    setShowEditModal(true);

    if (p.id != null) {
      await fetchProductDetailsForEdit(p.id);
    } else {
      setEditSelectedItems([]);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct?.id) return;
    if (!merchantId) {
      alert("Missing VITE_MERCHANT_ID.");
      return;
    }
    if (!validateSelectedItems(editSelectedItems)) return;
    if (!editForm.product_category_id) {
      alert("Please select a product category.");
      return;
    }

    try {
      const payload: Product = {
        ...editForm,
        merchant_id: merchantId,
      };

      await productApi.patch("", payload, {
        params: {
          id: `eq.${editProduct.id}`,
          merchant_id: `eq.${merchantId}`,
        },
      });

      await productDetailApi.delete("", {
        params: {
          product_id: `eq.${editProduct.id}`,
          merchant_id: `eq.${merchantId}`,
        },
      });

      const detailPayload = editSelectedItems.map((x) => ({
        product_id: editProduct.id,
        item_id: x.item_id,
        qty: x.qty,
        merchant_id: merchantId,
      }));

      await productDetailApi.post("", detailPayload);

      setShowEditModal(false);
      setEditProduct(null);
      fetchProducts(currentPage, pageSize, search);
    } catch {
      alert("Failed to update product.");
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (!merchantId) {
      alert("Missing VITE_MERCHANT_ID.");
      return;
    }

    try {
      await productDetailApi.delete("", {
        params: {
          product_id: `eq.${id}`,
          merchant_id: `eq.${merchantId}`,
        },
      });

      await productApi.delete("", {
        params: {
          id: `eq.${id}`,
          merchant_id: `eq.${merchantId}`,
        },
      });

      fetchProducts(currentPage, pageSize, search);
    } catch {
      alert("Failed to delete product.");
    }
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const addToSelected = (selected: SelectedItem[], setSelected: (v: SelectedItem[]) => void, item: Item) => {
    if (item.id == null) return;
    const itemId = Number(item.id);
    if (selected.some((x) => x.item_id === itemId)) return;
    setSelected([...selected, { item_id: itemId, item_name: item.item_name, qty: 1 }]);
  };

  const removeFromSelected = (selected: SelectedItem[], setSelected: (v: SelectedItem[]) => void, itemId: number) => {
    setSelected(selected.filter((x) => x.item_id !== itemId));
  };

  const updateQty = (selected: SelectedItem[], setSelected: (v: SelectedItem[]) => void, itemId: number, qty: number) => {
    setSelected(
      selected.map((x) => (x.item_id === itemId ? { ...x, qty: qty < 1 ? 1 : qty } : x))
    );
  };

  const availableItemsForAdd = useMemo(() => {
    const selectedIds = new Set(addSelectedItems.map((x) => x.item_id));
    return items.filter((x) => x.id != null && !selectedIds.has(Number(x.id)));
  }, [items, addSelectedItems]);

  const availableItemsForEdit = useMemo(() => {
    const selectedIds = new Set(editSelectedItems.map((x) => x.item_id));
    return items.filter((x) => x.id != null && !selectedIds.has(Number(x.id)));
  }, [items, editSelectedItems]);

  const formatPrice = (value?: number | null) => {
    if (value == null) return "";
    const n = Number(value);
    if (Number.isNaN(n)) return "";
    return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const renderItemPicker = (
    available: Item[],
    selected: SelectedItem[],
    setSelected: (v: SelectedItem[]) => void
  ) => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-md overflow-hidden">
          <div className="px-4 py-2 bg-[#F5FBFD] text-sm font-semibold text-[#009FC3]">Available Items</div>
          <div className="max-h-64 overflow-y-auto">
            {available.length === 0 ? (
              <div className="px-4 py-4 text-sm text-gray-500">No items available.</div>
            ) : (
              available.map((it) => (
                <div key={it.id} className="px-4 py-2 flex items-center justify-between border-b last:border-b-0">
                  <div className="text-sm text-gray-700">{it.item_name}</div>
                  <button
                    type="button"
                    className="px-3 py-1 text-sm font-semibold rounded-md bg-[#009FC3] text-white hover:bg-[#0086a8] transition"
                    onClick={() => addToSelected(selected, setSelected, it)}
                  >
                    Add
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border border-gray-200 rounded-md overflow-hidden">
          <div className="px-4 py-2 bg-[#F5FBFD] text-sm font-semibold text-[#009FC3]">Selected Items</div>
          <div className="max-h-64 overflow-y-auto">
            {selected.length === 0 ? (
              <div className="px-4 py-4 text-sm text-gray-500">No items selected.</div>
            ) : (
              selected.map((it) => (
                <div key={it.item_id} className="px-4 py-2 flex items-center justify-between border-b last:border-b-0 gap-3">
                  <div className="flex-1 text-sm text-gray-700">{it.item_name}</div>
                  <input
                    type="number"
                    min={1}
                    className="w-20 border border-gray-300 rounded-md px-2 py-1 text-sm"
                    value={it.qty}
                    onChange={(e) => updateQty(selected, setSelected, it.item_id, Number(e.target.value))}
                    aria-label="qty"
                  />
                  <button
                    type="button"
                    className="px-3 py-1 text-sm font-semibold rounded-md bg-white border border-gray-300 hover:bg-gray-50 transition"
                    onClick={() => removeFromSelected(selected, setSelected, it.item_id)}
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full px-4 sm:px-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-1">Manage your products</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex items-center px-6 py-3 bg-[#009FC3] text-white font-semibold rounded-md text-base shadow-sm hover:bg-[#0086a8] transition"
            onClick={() => {
              resetAdd();
              setShowAddModal(true);
            }}
          >
            <PlusIcon className="h-5 w-5 mr-3" />
            Add Product
          </button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden border border-gray-200 rounded-lg shadow-none mt-6">
        <div className="p-4 flex flex-col sm:flex-row gap-2 sm:gap-4 items-center">
          <div className="flex-1 w-full">
            <input
              type="text"
              placeholder="Search products..."
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
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#009FC3]">CATEGORY</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#009FC3]">PRICE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#009FC3]">STATUS</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#009FC3]">CREATED AT</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b last:border-b-0 hover:bg-[#F5FBFD] transition">
                  <td className="px-6 py-4 text-gray-700">{p.product_name}</td>
                  <td className="px-6 py-4 text-gray-700">{p.product_category?.product_category_name ?? "-"}</td>
                  <td className="px-6 py-4 text-gray-700">{formatPrice(p.price)}</td>
                  <td className="px-6 py-4 text-gray-700">{(p.status ?? 1) === 1 ? "Active" : "Inactive"}</td>
                  <td className="px-6 py-4 text-gray-700">{p.created_at ? new Date(p.created_at).toLocaleString() : ""}</td>
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

          {products.length === 0 && (
            <div className="text-center text-gray-500 py-8">No products found.</div>
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
            className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">Add Product</h2>
            <form className="space-y-4" onSubmit={handleAddSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Product Name</label>
                  <input
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={addForm.product_name}
                    onChange={(e) => setAddForm({ ...addForm, product_name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={addForm.product_category_id ?? ""}
                    onChange={(e) =>
                      setAddForm({
                        ...addForm,
                        product_category_id: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.product_category_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={addForm.price ?? ""}
                    onChange={(e) =>
                      setAddForm({
                        ...addForm,
                        price: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
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
              </div>

              {renderItemPicker(availableItemsForAdd, addSelectedItems, setAddSelectedItems)}

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

      {showEditModal && editProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowEditModal(false)}>
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">Edit Product</h2>
            <form className="space-y-4" onSubmit={handleEditSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Product Name</label>
                  <input
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={editForm.product_name}
                    onChange={(e) => setEditForm({ ...editForm, product_name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={editForm.product_category_id ?? ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        product_category_id: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.product_category_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={editForm.price ?? ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        price: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
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
              </div>

              {renderItemPicker(availableItemsForEdit, editSelectedItems, setEditSelectedItems)}

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

export default Products;
