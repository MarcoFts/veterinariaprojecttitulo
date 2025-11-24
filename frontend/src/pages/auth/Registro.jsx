import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../../../services/api"; // ajusta si moviste api.js

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Registro() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    // Usuario / Cliente
    first_name: "",
    last_name: "",
    email: "",
    telefono: "",
    rut_dni: "",
    direccion: "",
    password: "",
    password2: "",
    acepta_comunicaciones: true,
  });

  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverMsg, setServerMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    setErrors((err) => ({ ...err, [name]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = "Obligatorio.";
    if (!form.last_name.trim()) e.last_name = "Obligatorio.";
    if (!form.email.trim()) e.email = "Obligatorio.";
    else if (!emailRegex.test(form.email)) e.email = "Email inválido.";
    if (!form.password) e.password = "Obligatorio.";
    else if (form.password.length < 8) e.password = "Mínimo 8 caracteres.";
    if (!form.password2) e.password2 = "Repite tu contraseña.";
    else if (form.password2 !== form.password) e.password2 = "No coinciden.";
    return e;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const eObj = validate();
    setErrors(eObj);
    if (Object.keys(eObj).length) return;

    setLoading(true);
    setServerMsg("");
    try {
      // solo datos de usuario/cliente
      await registerUser({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        password: form.password,
        password2: form.password2,
        telefono: form.telefono.trim(),
        direccion: form.direccion.trim(),
        rut_dni: form.rut_dni.trim(),
        acepta_comunicaciones: !!form.acepta_comunicaciones,
      });

      setServerMsg("✅ Registro exitoso. Redirigiendo a inicio de sesión…");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      const data = err?.response?.data;
      if (data && typeof data === "object" && !Array.isArray(data)) {
        setErrors(data);
        setServerMsg("Revisa los campos marcados.");
      } else {
        setServerMsg(data?.detail || "No se pudo completar el registro.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[78vh] bg-[#f2fffc]">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Panel izquierdo (visual) */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl bg-slate-300/70 aspect-[16/11] md:aspect-[16/10] flex flex-col justify-end p-8 shadow-inner">
              <h2 className="text-white text-4xl md:text-5xl font-extrabold drop-shadow-sm">Regístrate</h2>
              <p className="text-white/90 mt-2 text-lg">
                Crea tu cuenta para agendar y gestionar tus citas más rápido.
              </p>
            </div>
          </div>

          {/* Formulario (tarjeta) */}
          <div className="lg:col-span-6">
            <div className="bg-white/90 border border-slate-200 rounded-2xl shadow-lg p-6 md:p-7">
              <h3 className="text-xl font-semibold text-slate-800">Tus datos</h3>

              {serverMsg && (
                <div
                  className={`mt-3 mb-2 text-sm ${
                    serverMsg.startsWith("✅") ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {serverMsg}
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-6">
                {/* Datos personales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="Nombre"
                    name="first_name"
                    value={form.first_name}
                    onChange={onChange}
                    error={errors.first_name}
                  />
                  <Field
                    label="Apellido"
                    name="last_name"
                    value={form.last_name}
                    onChange={onChange}
                    error={errors.last_name}
                  />
                  <Field
                    label="Email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={onChange}
                    error={errors.email}
                  />
                  <Field
                    label="Teléfono"
                    name="telefono"
                    value={form.telefono}
                    onChange={onChange}
                    error={errors.telefono}
                  />
                  <Field
                    label="RUT / DNI (opcional)"
                    name="rut_dni"
                    value={form.rut_dni}
                    onChange={onChange}
                  />
                  <Field
                    label="Dirección (opcional)"
                    name="direccion"
                    value={form.direccion}
                    onChange={onChange}
                    className="md:col-span-2"
                  />

                  <Field
                    label="Contraseña (mín. 8)"
                    name="password"
                    type={showPwd ? "text" : "password"}
                    value={form.password}
                    onChange={onChange}
                    error={errors.password}
                    rightAddon={
                      <button
                        type="button"
                        onClick={() => setShowPwd((s) => !s)}
                        className="text-xs text-slate-500 hover:text-slate-700"
                      >
                        {showPwd ? "Ocultar" : "Ver"}
                      </button>
                    }
                  />
                  <Field
                    label="Confirmar contraseña"
                    name="password2"
                    type={showPwd2 ? "text" : "password"}
                    value={form.password2}
                    onChange={onChange}
                    error={errors.password2}
                    rightAddon={
                      <button
                        type="button"
                        onClick={() => setShowPwd2((s) => !s)}
                        className="text-xs text-slate-500 hover:text-slate-700"
                      >
                        {showPwd2 ? "Ocultar" : "Ver"}
                      </button>
                    }
                  />
                </div>

                {/* Comunicaciones */}
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    name="acepta_comunicaciones"
                    checked={form.acepta_comunicaciones}
                    onChange={onChange}
                    className="accent-emerald-500"
                  />
                  Acepto recibir recordatorios y comunicaciones.
                </label>

                {/* CTA */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 rounded-xl text-white text-base font-medium shadow-lg transition
                      ${
                        loading
                          ? "bg-emerald-300 cursor-not-allowed"
                          : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                      }`}
                  >
                    {loading ? "Registrando…" : "Registrar"}
                  </button>
                </div>

                <p className="text-xs text-slate-500 text-center">
                  Al registrarte aceptas nuestros{" "}
                  <a href="/terminos" className="underline">
                    Términos
                  </a>{" "}
                  y{" "}
                  <a href="/privacidad" className="underline">
                    Política de Privacidad
                  </a>
                  .
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Componentes de UI ---------- */

function Field({ label, name, value, onChange, error, type = "text", className = "", rightAddon }) {
  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm text-slate-600 mb-1">
        {label}
      </label>
      <div className="flex items-stretch gap-2">
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none bg-white
            ${error ? "border-rose-400 ring-2 ring-rose-100" : "border-slate-300 focus:ring-2 ring-emerald-100"}`}
          autoComplete="off"
        />
        {rightAddon ? <div className="self-center">{rightAddon}</div> : null}
      </div>
      {error && <p className="mt-1 text-xs text-rose-600">{Array.isArray(error) ? error[0] : error}</p>}
    </div>
  );
}
