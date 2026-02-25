// frontend/src/pages/auth/Registro.jsx 

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../../services/api";
import {
  Mail,
  Phone,
  CreditCard,
  MapPin,
  Lock,
  User as UserIcon,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";


// -----------------------------
// Helpers de validación / normalización
// -----------------------------
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// contraseña fuerte: 8+, 1 letra, 1 número, 1 símbolo, sin espacios
const passwordStrong = (pwd = "") => {
  if (!pwd) return "La contraseña es obligatoria.";
  if (pwd.length < 8) return "Debe tener mínimo 8 caracteres.";
  if (/\s/.test(pwd)) return "No puede contener espacios.";
  if (!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(pwd)) return "Debe incluir al menos una letra.";
  if (!/[0-9]/.test(pwd)) return "Debe incluir al menos un número.";
  if (!/[^A-Za-z0-9ÁÉÍÓÚáéíóúÑñ]/.test(pwd))
    return "Debe incluir al menos un símbolo (ej: ! @ # ?).";
  return "";
};

const cleanEmail = (s = "") => s.trim().toLowerCase().replace(/\s+/g, "");
const onlyDigits = (s = "") => (s || "").replace(/\D+/g, "");

// Teléfono Chile: aceptamos +56, espacios; guardamos limpio 9XXXXXXXX
const normalizePhoneCL = (raw = "") => {
  let d = onlyDigits(raw);
  if (d.length === 11 && d.startsWith("56")) d = d.slice(2);
  return d;
};

const phoneErrorCL = (raw = "") => {
  const d = normalizePhoneCL(raw);
  if (!d) return "El teléfono es obligatorio. Ej: 9 1234 5678";
  if (d.length !== 9) return "Debe tener 9 dígitos. Ej: 9 1234 5678";
  if (!d.startsWith("9")) return "Debe comenzar con 9. Ej: 9 1234 5678";
  return "";
};

const formatPhoneCL = (raw = "") => {
  const d = normalizePhoneCL(raw);
  if (d.length !== 9) return raw;
  return `${d[0]} ${d.slice(1, 5)} ${d.slice(5)}`;
};

// RUT: valida DV (módulo 11). Permite 12.345.678-5 o 12345678-5
const cleanRut = (rut = "") =>
  (rut || "").trim().replace(/\./g, "").replace(/\s+/g, "");

const rutDV = (cuerpo = "") => {
  let suma = 0;
  let mult = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i], 10) * mult;
    mult = mult === 7 ? 2 : mult + 1;
  }
  const resto = 11 - (suma % 11);
  if (resto === 11) return "0";
  if (resto === 10) return "K";
  return String(resto);
};

const validateRutCL = (rutRaw = "") => {
  const rut = cleanRut(rutRaw);
  if (!rut) return ""; // opcional
  if (!/^[0-9kK\-]+$/.test(rut)) return "RUT inválido. Ej: 12.345.678-5";

  if (!rut.includes("-")) return "Debe incluir guion. Ej: 12.345.678-5";
  const [cuerpoRaw, dvRaw] = rut.split("-");
  const cuerpo = onlyDigits(cuerpoRaw);
  const dv = (dvRaw || "").trim().toUpperCase();

  if (cuerpo.length < 7 || cuerpo.length > 8) return "RUT inválido. Ej: 12.345.678-5";
  if (!/^\d+$/.test(cuerpo)) return "RUT inválido. Ej: 12.345.678-5";
  if (!/^[0-9K]$/.test(dv)) return "DV inválido. Usa 0-9 o K.";

  const calc = rutDV(cuerpo);
  if (dv !== calc) return "RUT inválido. El dígito verificador no coincide.";
  return "";
};

const normalizeRutCL = (rutRaw = "") => {
  const rut = cleanRut(rutRaw);
  if (!rut) return "";
  const [cuerpoRaw, dvRaw] = rut.split("-");
  const cuerpo = onlyDigits(cuerpoRaw);
  const dv = (dvRaw || "").trim().toUpperCase();
  if (!cuerpo || !dv) return rutRaw;
  return `${cuerpo}-${dv}`;
};

// -----------------------------
// Componente principal
// -----------------------------
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
    confirm_password: "",
    acepta_comunicaciones: true,
  });

  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverMsg, setServerMsg] = useState("");
  const [serverOk, setServerOk] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordHint = useMemo(() => {
    const msg = passwordStrong(form.password);
    return msg ? msg : "Perfecto: cumple requisitos.";
  }, [form.password]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((f) => {
      // normalizaciones suaves en UI (sin molestar):
      if (name === "email") return { ...f, [name]: value };
      if (name === "telefono") return { ...f, [name]: value };
      if (name === "rut_dni") return { ...f, [name]: value };
      return { ...f, [name]: type === "checkbox" ? checked : value };
    });

    // limpia error del campo al escribir
    setErrors((err) => ({ ...err, [name]: undefined }));
    setServerMsg("");
    setServerOk(false);
  };

  const validate = () => {
    const e = {};

    // Nombre / apellido
    if (!form.first_name.trim()) e.first_name = "Nombre obligatorio.";
    else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]+$/.test(form.first_name.trim()))
      e.first_name = "Solo letras y espacios.";

    if (!form.last_name.trim()) e.last_name = "Apellido obligatorio.";
    else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]+$/.test(form.last_name.trim()))
      e.last_name = "Solo letras y espacios.";

    // Email
    const email = cleanEmail(form.email);
    if (!email) e.email = "Correo obligatorio. Ej: nombre@dominio.cl";
    else if (!emailRegex.test(email)) e.email = "Correo inválido. Ej: nombre@dominio.cl";

    // Teléfono (obligatorio por tu requisito)
    const telMsg = phoneErrorCL(form.telefono);
    if (telMsg) e.telefono = telMsg;

    // RUT (opcional, pero si viene: validar)
    const rutMsg = validateRutCL(form.rut_dni);
    if (rutMsg) e.rut_dni = rutMsg;

    // Password
    const pwdMsg = passwordStrong(form.password);
    if (pwdMsg) e.password = pwdMsg;

    // Confirmación
    if (!form.confirm_password) e.confirm_password = "Confirma tu contraseña.";
    else if (form.confirm_password !== form.password) e.confirm_password = "No coinciden.";

    // Password != email (extra UX)
    if (email && form.password && form.password.toLowerCase() === email.toLowerCase()) {
      e.password = "No puede ser igual a tu correo.";
    }

    return e;
  };

  const normalizePayload = () => ({
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    email: cleanEmail(form.email),
    telefono: normalizePhoneCL(form.telefono), // backend lo formatea y valida
    direccion: (form.direccion || "").trim(),
    rut_dni: normalizeRutCL(form.rut_dni), // backend valida DV también
    password: form.password,
    confirm_password: form.confirm_password, // ✅ clave (antes era password2)
    acepta_comunicaciones: !!form.acepta_comunicaciones,
  });

  const onSubmit = async (e) => {
    e.preventDefault();

    const eObj = validate();
    setErrors(eObj);
    if (Object.keys(eObj).length) {
      setServerMsg("Revisa los campos marcados.");
      setServerOk(false);
      return;
    }

    setLoading(true);
    setServerMsg("");
    setServerOk(false);

    try {
      await registerUser(normalizePayload());

      setServerMsg("Cuenta creada con éxito. Redirigiendo…");
      setServerOk(true);
      setTimeout(() => navigate("/cuenta-creada"), 900);
    } catch (err) {
      const data = err?.response?.data;

      // Backend puede devolver:
      // - { campo: ["msg"] }
      // - { detail: "..." }
      // - string / cualquier cosa
      if (data && typeof data === "object" && !Array.isArray(data)) {
        setErrors(data);
        setServerMsg("Corrige lo indicado y vuelve a intentar.");
        setServerOk(false);
      } else {
        setServerMsg(data?.detail || "No se pudo completar el registro.");
        setServerOk(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-slate-50 px-4 overflow-hidden flex items-center">


      <div className="mx-auto w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 py-6">

        {/* PANEL IZQUIERDO */}
        <div className="lg:col-span-6">
          <div className="h-full min-h-[520px] rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-2xl px-10 py-8 text-white relative overflow-hidden flex flex-col justify-center">
            <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_30%_20%,white,transparent_45%),radial-gradient(circle_at_80%_60%,white,transparent_50%)]" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium ring-1 ring-white/25">
                <CheckCircle2 className="w-4 h-4" />
                Registro seguro
              </div>

              <h2 className="mt-5 text-5xl font-extrabold tracking-tight">
                Crea tu cuenta
              </h2>
              <p className="mt-4 text-white/90 text-lg leading-relaxed">
                Accede a tus citas y mascotas en un entorno moderno, rápido y seguro.
              </p>
            </div>
          </div>
        </div>

        {/* FORM */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8">
            <h3 className="text-2xl font-semibold text-slate-900 mb-1">
              Tus datos
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              Completa el formulario. Los campos se validan antes de crear la cuenta.
            </p>

            {serverMsg && (
              <div
                className={`mb-5 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
                  serverOk
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-rose-200 bg-rose-50 text-rose-700"
                }`}
              >
                {serverOk ? (
                  <CheckCircle2 className="w-5 h-5 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 mt-0.5" />
                )}
                <div>{serverMsg}</div>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  icon={<UserIcon className="w-4 h-4" />}
                  label="Nombre"
                  name="first_name"
                  value={form.first_name}
                  onChange={onChange}
                  error={errors.first_name}
                  placeholder="Ej: Benjamín"
                />

                <Field
                  icon={<UserIcon className="w-4 h-4" />}
                  label="Apellido"
                  name="last_name"
                  value={form.last_name}
                  onChange={onChange}
                  error={errors.last_name}
                  placeholder="Ej: Pérez"
                />

                <Field
                  icon={<Mail className="w-4 h-4" />}
                  label="Correo"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={onChange}
                  error={errors.email}
                  placeholder="nombre@dominio.cl"
                  hint="Ej: nombre@dominio.cl"
                />

                <Field
                  icon={<Phone className="w-4 h-4" />}
                  label="Teléfono"
                  name="telefono"
                  value={form.telefono}
                  onChange={(e) => {
                    // opcional: autoformateo suave
                    const v = e.target.value;
                    setForm((f) => ({ ...f, telefono: v }));
                    setErrors((err) => ({ ...err, telefono: undefined }));
                    setServerMsg("");
                    setServerOk(false);
                  }}
                  onBlur={() => {
                    setForm((f) => ({ ...f, telefono: formatPhoneCL(f.telefono) }));
                  }}
                  error={errors.telefono}
                  placeholder="9 1234 5678"
                  hint="Formato: 9 1234 5678"
                />

                <Field
                  icon={<CreditCard className="w-4 h-4" />}
                  label="RUT (opcional)"
                  name="rut_dni"
                  value={form.rut_dni}
                  onChange={onChange}
                  error={errors.rut_dni}
                  placeholder="12.345.678-5"
                  hint="Ej: 12.345.678-5"
                />

                <Field
                  icon={<MapPin className="w-4 h-4" />}
                  label="Dirección (opcional)"
                  name="direccion"
                  value={form.direccion}
                  onChange={onChange}
                  error={errors.direccion}
                  className="md:col-span-2"
                  placeholder="Ej: Av. Ejemplo 123, Concepción"
                />

                <Field
                  icon={<Lock className="w-4 h-4" />}
                  label="Contraseña"
                  name="password"
                  type={showPwd ? "text" : "password"}
                  value={form.password}
                  onChange={onChange}
                  error={errors.password}
                  className="md:col-span-1"
                  rightAddon={
                    <button
                      type="button"
                      onClick={() => setShowPwd((s) => !s)}
                      className="inline-flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900"
                      tabIndex={-1}
                    >
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {showPwd ? "Ocultar" : "Ver"}
                    </button>
                  }
                  hint={passwordHint}
                  hintTone={passwordStrong(form.password) ? "warn" : "ok"}
                />

                <Field
                  icon={<Lock className="w-4 h-4" />}
                  label="Confirmar contraseña"
                  name="confirm_password"
                  type={showPwd2 ? "text" : "password"}
                  value={form.confirm_password}
                  onChange={onChange}
                  error={errors.confirm_password}
                  className="md:col-span-1"
                  rightAddon={
                    <button
                      type="button"
                      onClick={() => setShowPwd2((s) => !s)}
                      className="inline-flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900"
                      tabIndex={-1}
                    >
                      {showPwd2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {showPwd2 ? "Ocultar" : "Ver"}
                    </button>
                  }
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-600 select-none">
                <input
                  type="checkbox"
                  name="acepta_comunicaciones"
                  checked={form.acepta_comunicaciones}
                  onChange={onChange}
                  className="accent-emerald-500"
                />
                Acepto recibir recordatorios y comunicaciones.
              </label>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-xl font-medium shadow-md transition ${
                  loading
                    ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800"
                }`}
              >
                {loading ? "Registrando…" : "Crear cuenta"}
              </button>

              <p className="text-xs text-slate-500 text-center">
                Al registrarte aceptas nuestros{" "}
                <a className="underline text-blue-700" href="/terminos">
                  Términos
                </a>{" "}
                y{" "}
                <a className="underline text-blue-700" href="/privacidad">
                  Política de Privacidad
                </a>
                .
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------
// UI helpers
// -----------------------------
function Feature({ title, desc }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white/10 ring-1 ring-white/15 p-4">
      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-white/80" />
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-white/85">{desc}</div>
      </div>
    </div>
  );
}

function Field({
  icon,
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  type = "text",
  className = "",
  rightAddon,
  placeholder,
  hint,
  hintTone = "neutral",
}) {
  const errText = Array.isArray(error) ? error[0] : error;
  const hintClass =
    hintTone === "ok"
      ? "text-emerald-700"
      : hintTone === "warn"
      ? "text-amber-700"
      : "text-slate-500";

  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>

      <div
        className={`flex items-stretch gap-2 rounded-xl border bg-white px-3 py-2.5 text-sm transition ${
          errText
            ? "border-rose-300 ring-2 ring-rose-100"
            : "border-slate-300 focus-within:ring-2 focus-within:ring-blue-200 focus-within:border-blue-400"
        }`}
      >
        <div className="text-slate-400 flex items-center">{icon}</div>

        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className="w-full outline-none bg-transparent text-slate-900 placeholder:text-slate-400"
          autoComplete="off"
        />

        {rightAddon && <div className="self-center">{rightAddon}</div>}
      </div>

      {errText ? (
        <p className="mt-1 text-xs text-rose-600">{errText}</p>
      ) : hint ? (
        <p className={`mt-1 text-xs ${hintClass}`}>{hint}</p>
      ) : null}
    </div>
  );
}
