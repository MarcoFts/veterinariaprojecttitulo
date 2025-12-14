import { useEffect, useState } from "react";
import {
  Package,
  Plus,
  Trash2,
  AlertTriangle,
} from "lucide-react";

import {
  getProductos,
  eliminarProducto,
} from "../../services/api";

// MODALS (YA EXISTEN, NO LOS TOCO)
import ModalAgregarProducto from "../../components/modals/ModalAgregarProducto";
import ModalEliminarProducto from "../../components/modals/ModalEliminarProducto";

export default function AdminInventario() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ---------- MODALS ----------
  const [openAgregar, setOpenAgregar] = useState(false);
  const [productoEliminar, setProductoEliminar] = useState(null);

  // ---------------- CARGAR PRODUCTOS ----------------
  const cargarProductos = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await getProductos();
      setProductos(res?.data || []);
    } catch (e) {
      console.error("Error cargando productos:", e);
      setError("No se pudo cargar el inventario.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  // ---------------- ELIMINAR PRODUCTO ----------------
  const confirmarEliminar = async () => {
    if (!productoEliminar) return;

    try {
      await eliminarProducto(productoEliminar.id);
      setProductos((prev) =>
        prev.filter((p) => p.id !== productoEliminar.id)
      );
      setProductoEliminar(null);
    } catch (e) {
      console.error("Error eliminando producto:", e);
      alert("No se pudo eliminar el producto.");
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Inventario
          </h1>
          <p className="text-sm text-slate-600">
            Gestión de productos y stock del sistema.
          </p>
        </div>

        <button
          onClick={() => setOpenAgregar(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition"
        >
          <Plus className="h-4 w-4" />
          Nuevo producto
        </button>
      </div>

      {/* ESTADOS */}
      {loading && (
        <p className="text-sm text-slate-500">Cargando inventario...</p>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {!loading && productos.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
          No hay productos registrados en el sistema.
        </div>
      )}

      {/* TABLA */}
      {!loading && productos.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Producto
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Stock
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Stock mínimo
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Estado
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>

            <tbody>
              {productos.map((p) => {
                const stockBajo = p.stock <= p.stock_minimo;

                return (
                  <tr
                    key={p.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {p.nombre}
                    </td>

                    <td className="px-4 py-3">
                      {p.stock}
                    </td>

                    <td className="px-4 py-3">
                      {p.stock_minimo}
                    </td>

                    <td className="px-4 py-3">
                      {stockBajo ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                          <AlertTriangle className="h-4 w-4" />
                          Bajo
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-700">
                          OK
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setProductoEliminar(p)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= MODALS ================= */}

      {openAgregar && (
        <ModalAgregarProducto
          onClose={() => setOpenAgregar(false)}
          onCreated={() => {
            setOpenAgregar(false);
            cargarProductos(); // refleja cambios también en VetInventario
          }}
        />
      )}

      {productoEliminar && (
        <ModalEliminarProducto
          producto={productoEliminar}
          onClose={() => setProductoEliminar(null)}
          onConfirm={confirmarEliminar}
        />
      )}
    </div>
  );
}
