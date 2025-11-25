import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../../services/api";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Registro() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
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

      setServerMsg("✅ Cuenta creada con éxito. Redirigiendo…");
      setTimeout(() => navigate("/cuenta-creada"), 900);

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
    <div className="min-h-screen bg-[#e8f4ff] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* PANEL IZQUIERDO – DISEÑO PREMIUM */}
        <div className="lg:col-span-6 flex items-center">
          <div className="w-full h-full rounded-3xl bg-gradient-to-br from-blue-500/30 to-blue-700/30 backdrop-blur-xl shadow-xl p-10 flex flex-col justify-center">
            <h2 className="text-white text-5xl font-extrabold drop-shadow-md">
              Regístrate
            </h2>
            <p className="text-white/90 text-lg mt-4 leading-relaxed">
              Crea tu cuenta y gestiona tus citas & mascotas en un entorno moderno, rápido y seguro.
            </p>
          </div>
        </div>

        {/* PANEL DERECHO – FORMULARIO */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8">
            
            <h3 className="text-2xl font-semibold text-slate-800 mb-2">
              Tus datos
            </h3>

            {serverMsg && (
              <div
                className={`mt-2 mb-4 text-sm ${
                  serverMsg.startsWith("✅")
                    ? "text-emerald-600"
                    : "text-rose-600"
                }`}
              >
                {serverMsg}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-6">
              
              {/* CAMPOS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Nombre" name="first_name" value={form.first_name} onChange={onChange} error={errors.first_name}/>
                <Field label="Apellido" name="last_name" value={form.last_name} onChange={onChange} error={errors.last_name}/>
                <Field label="Email" name="email" type="email" value={form.email} onChange={onChange} error={errors.email}/>
                <Field label="Teléfono" name="telefono" value={form.telefono} onChange={onChange} error={errors.telefono}/>
                <Field label="RUT / DNI (opcional)" name="rut_dni" value={form.rut_dni} onChange={onChange}/>
                <Field label="Dirección (opcional)" name="direccion" value={form.direccion} onChange={onChange} className="md:col-span-2"/>

                <Field
                  label="Contraseña (mín. 8)"
                  name="password"
                  type={showPwd ? "text" : "password"}
                  value={form.password}
                  onChange={onChange}
                  error={errors.password}
                  rightAddon={
                    <button type="button" onClick={() => setShowPwd((s) => !s)} className="text-xs text-blue-600 hover:text-blue-700">
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
                    <button type="button" onClick={() => setShowPwd2((s) => !s)} className="text-xs text-blue-600 hover:text-blue-700">
                      {showPwd2 ? "Ocultar" : "Ver"}
                    </button>
                  }
                />
              </div>

              {/* CHECKBOX */}
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

              {/* BOTÓN */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 text-white rounded-xl font-medium shadow-md transition ${
                  loading
                    ? "bg-blue-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800"
                }`}
              >
                {loading ? "Registrando…" : "Registrar"}
              </button>

              <p className="text-xs text-slate-500 text-center">
                Al registrarte aceptas nuestros{" "}
                <a className="underline text-blue-600" href="/terminos">Términos</a>{" "}
                y{" "}
                <a className="underline text-blue-600" href="/privacidad">Política de Privacidad</a>.
              </p>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- COMPONENTE FIELD PREMIUM ---------- */

function Field({ label, name, value, onChange, error, type = "text", className = "", rightAddon }) {
  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>

      <div className="flex items-stretch gap-2">
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          className={`w-full rounded-xl border px-4 py-2.5 text-sm bg-white 
            ${error 
              ? "border-rose-400 ring-2 ring-rose-100" 
              : "border-slate-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
            }`}
          autoComplete="off"
        />

        {rightAddon && <div className="self-center">{rightAddon}</div>}
      </div>

      {error && <p className="mt-1 text-xs text-rose-600">{Array.isArray(error) ? error[0] : error}</p>}
    </div>
  );
}
