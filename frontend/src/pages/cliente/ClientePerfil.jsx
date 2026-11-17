// src/pages/cliente/ClientePerfil.jsx
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/es";
dayjs.locale("es");

import LayoutCliente from "../../components/layout/LayoutCliente";
import MfaProfileSection from "../../components/mfa/MfaProfileSection";
import {
  getClientePerfil,
  updateClientePerfil,
} from "../../services/api";

export default function ClientePerfil() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    telefono: "",
    direccion: "",
    rut_dni: "",
    acepta_comunicaciones: true,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // cargar datos
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const resp = await getClientePerfil();
        setForm((prev) => ({
          ...prev,
          ...resp.data,
        }));
      } catch (err) {
        console.error(err);
        const detail =
          err?.response?.data?.detail ||
          "No se pudo cargar tu perfil. Intenta nuevamente.";
        setError(detail);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const resp = await updateClientePerfil(form);
      setForm((prev) => ({
        ...prev,
        ...resp.data,
      }));
      setSuccess("Tus datos se han actualizado correctamente.");
    } catch (err) {
      console.error(err);
      const data = err?.response?.data || {};
      if (typeof data === "string") {
        setError(data);
      } else if (data.detail) {
        setError(data.detail);
      } else {
        // errores de campos -> los mostramos juntos
        const msg =
          Object.values(data).join(" | ") ||
          "No se pudo guardar tu perfil. Revisa los datos.";
        setError(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <LayoutCliente>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Título */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Mi perfil
            </h1>
            <p className="text-sm text-slate-500">
              Actualiza tus datos personales y de contacto. Estos datos se usan
              para las reservas, recordatorios y documentación de tu mascota.
            </p>
          </div>
          <div className="text-xs text-slate-400">
            Última actualización: {dayjs().format("DD-MM-YYYY")}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-3 py-2 rounded-md">
            {success}
          </div>
        )}

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-5"
        >
          {/* Datos personales */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-800">
              Datos personales
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  disabled={loading || saving}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Apellido
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  disabled={loading || saving}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                disabled={loading || saving}
                required
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Usaremos este correo para confirmar tus reservas y enviar
                recordatorios de citas.
              </p>
            </div>
          </section>

          {/* Datos de contacto */}
          <section className="space-y-3 pt-3 border-t border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">
              Datos de contacto
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  disabled={loading || saving}
                  placeholder="+56 9 1234 5678"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  RUT / DNI
                </label>
                <input
                  type="text"
                  name="rut_dni"
                  value={form.rut_dni}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  disabled={loading || saving}
                  placeholder="Ej: 12.345.678-9"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Dirección
              </label>
              <input
                type="text"
                name="direccion"
                value={form.direccion}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                disabled={loading || saving}
                placeholder="Calle, número, comuna / ciudad"
              />
            </div>
          </section>

          {/* Preferencias */}
          <section className="space-y-3 pt-3 border-t border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">
              Preferencias de comunicación
            </h2>

            <label className="inline-flex items-start gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="acepta_comunicaciones"
                checked={!!form.acepta_comunicaciones}
                onChange={handleChange}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                disabled={loading || saving}
              />
              <span>
                Acepto recibir recordatorios y comunicaciones de la clínica
                sobre mis citas y el cuidado de mis mascotas.
              </span>
            </label>
          </section>

          {/* Botones */}
          <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-medium bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-60"
              disabled={loading || saving}
            >
              {saving ? "Guardando cambios..." : "Guardar cambios"}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <MfaProfileSection />
        </div>
      </div>
    </LayoutCliente>
  );
}
