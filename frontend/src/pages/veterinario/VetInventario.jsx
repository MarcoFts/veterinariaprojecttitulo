// frontend/src/pages/veterinario/VetInventario.jsx
import { useEffect, useState } from "react";
import LayoutVet from "../../components/layout/LayoutVet";
import {
  Box,
  Plus,
  RefreshCw,
  AlertTriangle,
  Pencil,
  Trash2,
  ArrowUpCircle,
} from "lucide-react";

import {
  getProductos,
} from "../../services/api";

// Modales de inventario (ya creados por ti)
import ModalAgregarProducto from "../../components/modals/ModalAgregarProducto";
import ModalEditarProducto from "../../components/modals/ModalEditarProducto";
import ModalEliminarProducto from "../../components/modals/ModalEliminarProducto";
import ModalAgregarStock from "../../components/modals/ModalAgregarStock";

export default function VetInventario() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [modalAgregarOpen, setModalAgregarOpen] = useState(false);
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [modalEliminarOpen, setModalEliminarOpen] = useState(false);
  const [modalStockOpen, setModalStockOpen] = useState(false);

  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  const loadProductos = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getProductos();
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setProductos(data);
    } catch (err) {
      console.error("Error cargando productos:", err);
      setError("No se pudieron cargar los productos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProductos();
  }, []);

  const abrirAgregar = () => {
    setProductoSeleccionado(null);
    setModalAgregarOpen(true);
  };

  const abrirEditar = (producto) => {
    setProductoSeleccionado(producto);
    setModalEditarOpen(true);
  };

  const abrirEliminar = (producto) => {
    setProductoSeleccionado(producto);
    setModalEliminarOpen(true);
  };

  const abrirStock = (producto) => {
    setProductoSeleccionado(producto);
    setModalStockOpen(true);
  };

  // callbacks de los modales
  const handleProductoCreado = (nuevo) => {
    setProductos((prev) => [nuevo, ...prev]);
  };

  const handleProductoActualizado = (actualizado) => {
    setProductos((prev) =>
      prev.map((p) => (p.id === actualizado.id ? actualizado : p))
    );
  };

  const handleProductoEliminado = (idEliminado) => {
    setProductos((prev) => prev.filter((p) => p.id !== idEliminado));
  };

  const handleStockActualizado = (productoActualizado) => {
    setProductos((prev) =>
      prev.map((p) =>
        p.id === productoActualizado.id ? productoActualizado : p
      )
    );
  };

  const hayAlertas = (p) => p.alerta_stock || p.alerta_vencimiento;

  return (
    <LayoutVet>
      <div className="space-y-6">
        {/* HEADER */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-2xl bg-sky-100 flex items-center justify-center">
                <Box className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <h1 className="text-base md:text-lg font-semibold text-slate-900">
                  Inventario de productos
                </h1>
                <p className="text-xs text-slate-500">
                  Gestión de insumos, medicamentos y stock disponible.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadProductos}
              disabled={loading}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Actualizar
            </button>

            <button
              onClick={abrirAgregar}
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-700 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Nuevo producto
            </button>
          </div>
        </header>

        {/* ALERTA GENERAL */}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* RESUMEN ALERTAS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-500">Total productos</p>
              <p className="text-lg font-semibold text-slate-900">
                {productos.length}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-amber-700">Stock bajo</p>
              <p className="text-lg font-semibold text-amber-800">
                {productos.filter((p) => p.alerta_stock).length}
              </p>
            </div>
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>

          <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-orange-700">Por vencer</p>
              <p className="text-lg font-semibold text-orange-800">
                {productos.filter((p) => p.alerta_vencimiento).length}
              </p>
            </div>
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </div>
        </section>

        {/* TABLA / LISTA DE PRODUCTOS */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-700">
              Lista de productos
            </p>
            {loading && (
              <p className="text-[11px] text-slate-400">Cargando...</p>
            )}
          </div>

          {productos.length === 0 && !loading ? (
            <div className="px-4 py-6 text-center text-xs text-slate-500">
              No hay productos registrados. Agrega el primero para comenzar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="px-4 py-2 text-left font-medium text-slate-500">
                      Producto
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-slate-500">
                      Código
                    </th>
                    <th className="px-4 py-2 text-center font-medium text-slate-500">
                      Stock
                    </th>
                    <th className="px-4 py-2 text-center font-medium text-slate-500">
                      Stock mínimo
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-slate-500">
                      Vencimiento
                    </th>
                    <th className="px-4 py-2 text-center font-medium text-slate-500">
                      Estado
                    </th>
                    <th className="px-4 py-2 text-right font-medium text-slate-500">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-slate-50 hover:bg-slate-50/60"
                    >
                      <td className="px-4 py-2 align-middle">
                        <p className="text-xs font-medium text-slate-900">
                          {p.nombre}
                        </p>
                      </td>
                      <td className="px-4 py-2 align-middle text-slate-600">
                        {p.codigo || "-"}
                      </td>
                      <td className="px-4 py-2 align-middle text-center">
                        <span className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-800">
                          {p.stock ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-2 align-middle text-center text-slate-600">
                        {p.stock_minimo ?? 0}
                      </td>
                      <td className="px-4 py-2 align-middle text-slate-600">
                        {p.fecha_vencimiento || "-"}
                      </td>
                      <td className="px-4 py-2 align-middle text-center">
                        {hayAlertas(p) ? (
                          <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-600 border border-rose-200">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Revisar
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 border border-emerald-200">
                            OK
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 align-middle">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => abrirStock(p)}
                            className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-700 hover:bg-sky-100"
                          >
                            <ArrowUpCircle className="h-3.5 w-3.5" />
                            Stock
                          </button>
                          <button
                            onClick={() => abrirEditar(p)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Editar
                          </button>
                          <button
                            onClick={() => abrirEliminar(p)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* MODALES */}
      <ModalAgregarProducto
        open={modalAgregarOpen}
        onClose={() => setModalAgregarOpen(false)}
        onCreated={handleProductoCreado}
      />

      <ModalEditarProducto
        open={modalEditarOpen}
        producto={productoSeleccionado}
        onClose={() => setModalEditarOpen(false)}
        onUpdated={handleProductoActualizado}
      />

      <ModalEliminarProducto
        open={modalEliminarOpen}
        producto={productoSeleccionado}
        onClose={() => setModalEliminarOpen(false)}
        onDeleted={handleProductoEliminado}
      />

      <ModalAgregarStock
        open={modalStockOpen}
        producto={productoSeleccionado}
        onClose={() => setModalStockOpen(false)}
        onUpdated={handleStockActualizado}
      />
    </LayoutVet>
  );
}
