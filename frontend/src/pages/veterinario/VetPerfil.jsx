// src/pages/veterinario/VetPerfil.jsx
import { useEffect, useRef, useState } from "react";
import LayoutVet from "../../components/layout/LayoutVet";
import { me, updateVetProfile } from "../../services/api";
import { Save } from "lucide-react";

import ModalPerfilSuccess from "../../components/modals/ModalPerfilSuccess";
import ModalPerfilError from "../../components/modals/ModalPerfilError";

export default function VetPerfil() {
  const [loading, setLoading] = useState(true);

  // USER
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");

  // VET
  const [telefono, setTelefono] = useState("");
  const [rut, setRut] = useState("");
  const [especialidad, setEspecialidad] = useState("");
  const [direccion, setDireccion] = useState("");
  const [nRegistro, setNRegistro] = useState("");
  const [exp, setExp] = useState("");
  const [bio, setBio] = useState("");
  const [duracion, setDuracion] = useState(30);
  const [vacunas, setVacunas] = useState(true);
  const [cirugias, setCirugias] = useState(false);

  const [saving, setSaving] = useState(false);

  // DATA INICIAL PARA DETECTAR CAMBIOS
  const initialDataRef = useRef(null);

  // MODALES
  const [successModal, setSuccessModal] = useState({
    open: false,
    message: "",
  });
  const [errorModal, setErrorModal] = useState({
    open: false,
    message: "",
  });

  // CARGA INICIAL
  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await me();
        const u = res.data;

        setFirst(u.first_name || "");
        setLast(u.last_name || "");
        setEmail(u.email || "");

        const vp = u.vet_profile || {};

        setTelefono(vp.telefono || "");
        setRut(vp.rut_dni || "");
        setEspecialidad(vp.especialidad || "");
        setDireccion(vp.direccion || "");
        setNRegistro(vp.n_registro || "");
        setExp(vp.anios_experiencia || "");
        setBio(vp.bio || "");
        setDuracion(vp.duracion_consulta_min || 30);
        setVacunas(vp.trabaja_con_vacunas ?? true);
        setCirugias(vp.trabaja_con_cirugias ?? false);

        initialDataRef.current = {
          first_name: u.first_name || "",
          last_name: u.last_name || "",
          email: u.email || "",
          telefono: vp.telefono || "",
          rut_dni: vp.rut_dni || "",
          especialidad: vp.especialidad || "",
          direccion: vp.direccion || "",
          n_registro: vp.n_registro || "",
          anios_experiencia: vp.anios_experiencia || "",
          bio: vp.bio || "",
          duracion_consulta_min: vp.duracion_consulta_min || 30,
          trabaja_con_vacunas: vp.trabaja_con_vacunas ?? true,
          trabaja_con_cirugias: vp.trabaja_con_cirugias ?? false,
        };
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, []);

  // GUARDAR
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      first_name: first,
      last_name: last,
      email,
      telefono,
      rut_dni: rut,
      especialidad,
      direccion,
      n_registro: nRegistro,
      anios_experiencia: exp,
      bio,
      duracion_consulta_min: duracion,
      trabaja_con_vacunas: vacunas,
      trabaja_con_cirugias: cirugias,
    };

    const original = initialDataRef.current || {};
    const sinCambios = Object.keys(payload).every(
      (k) => String(payload[k] ?? "") === String(original[k] ?? "")
    );

    if (sinCambios) {
      setSuccessModal({
        open: true,
        message: "No hay cambios por guardar.",
      });
      setSaving(false);
      return;
    }

    try {
      await updateVetProfile(payload);

      setSuccessModal({
        open: true,
        message: "Error de conexion con el servidor",
      });

      initialDataRef.current = { ...payload };
    } catch (err) {
      console.error(err);
      setErrorModal({
        open: true,
        message:
          err?.response?.data?.error ||
          "Error al guardar. Revisa los datos ingresados.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <LayoutVet>
        <div className="text-sm text-slate-600">Cargando datos...</div>
      </LayoutVet>
    );
  }

  return (
    <LayoutVet>
      {/* MODALES PERFIL (mismo estilo que inventario) */}
      <ModalPerfilSuccess
        open={successModal.open}
        message={successModal.message}
        onClose={() => setSuccessModal({ open: false, message: "" })}
      />

      <ModalPerfilError
        open={errorModal.open}
        message={errorModal.message}
        onClose={() => setErrorModal({ open: false, message: "" })}
      />

      {/* CONTENIDO */}
      <div className="space-y-10">
        {/* HEADER */}
        <header className="flex flex-col gap-1">
          <p className="text-xs font-semibold tracking-[0.25em] text-sky-600 uppercase">
            Vetyon · Perfil
          </p>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">
            Mi perfil profesional
          </h1>
          <p className="text-sm text-slate-600">
            Administra tus datos de acceso y tu información profesional.
          </p>
        </header>

        {/* FORMULARIO */}
        <form onSubmit={handleSave} className="space-y-10">
          {/* DATOS PERSONALES */}
          <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Datos personales
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-x-12">
              <div className="flex flex-col max-w-xs">
                <label className="text-xs font-medium text-slate-600">
                  Nombre
                </label>
                <input
                  className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm bg-slate-50 focus:ring-2 focus:ring-sky-300 outline-none w-full"
                  value={first}
                  onChange={(e) => setFirst(e.target.value)}
                />
              </div>

              <div className="flex flex-col max-w-xs">
                <label className="text-xs font-medium text-slate-600">
                  Apellido
                </label>
                <input
                  className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm bg-slate-50 focus:ring-2 focus:ring-sky-300 outline-none w-full"
                  value={last}
                  onChange={(e) => setLast(e.target.value)}
                />
              </div>

              <div className="flex flex-col max-w-xs">
                <label className="text-xs font-medium text-slate-600">
                  Correo
                </label>
                <input
                  className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm bg-slate-50 focus:ring-2 focus:ring-sky-300 outline-none w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* INFORMACIÓN PROFESIONAL */}
          <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Información profesional
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-x-12">
              <div className="flex flex-col max-w-xs">
                <label className="text-xs font-medium text-slate-600">
                  Teléfono
                </label>
                <input
                  className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm bg-slate-50 focus:ring-2 focus:ring-sky-300 outline-none w-full"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </div>

              <div className="flex flex-col max-w-xs">
                <label className="text-xs font-medium text-slate-600">
                  RUT / DNI
                </label>
                <input
                  className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm bg-slate-50 focus:ring-2 focus:ring-sky-300 outline-none w-full"
                  value={rut}
                  onChange={(e) => setRut(e.target.value)}
                />
              </div>

              <div className="flex flex-col max-w-xs">
                <label className="text-xs font-medium text-slate-600">
                  Especialidad
                </label>
                <input
                  className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm bg-slate-50 focus:ring-2 focus:ring-sky-300 outline-none w-full"
                  value={especialidad}
                  onChange={(e) => setEspecialidad(e.target.value)}
                />
              </div>

              <div className="flex flex-col max-w-xs">
                <label className="text-xs font-medium text-slate-600">
                  Dirección (opcional)
                </label>
                <input
                  className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm bg-slate-50 focus:ring-2 focus:ring-sky-300 outline-none w-full"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                />
              </div>

              <div className="flex flex-col max-w-xs">
                <label className="text-xs font-medium text-slate-600">
                  N° Registro Profesional (opcional)
                </label>
                <input
                  className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm bg-slate-50 focus:ring-2 focus:ring-sky-300 outline-none w-full"
                  value={nRegistro}
                  onChange={(e) => setNRegistro(e.target.value)}
                />
              </div>

              <div className="flex flex-col max-w-xs">
                <label className="text-xs font-medium text-slate-600">
                  Años de experiencia (opcional)
                </label>
                <input
                  type="number"
                  className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm bg-slate-50 focus:ring-2 focus:ring-sky-300 outline-none w-full"
                  value={exp}
                  onChange={(e) => setExp(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col w-full max-w-md mt-2">
              <label className="text-xs font-medium text-slate-600">
                Biografía (opcional)
              </label>
              <textarea
                rows={4}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm bg-slate-50 focus:ring-2 focus:ring-sky-300 outline-none w-full"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
          </section>

          {/* BOTÓN GUARDAR */}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 shadow-sm active:scale-[0.98] transition disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </div>
    </LayoutVet>
  );
}
