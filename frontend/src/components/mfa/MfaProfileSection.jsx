import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  Laptop,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import {
  mfaEnrollConfirm,
  mfaEnrollStart,
  mfaRegenerateRecovery,
  mfaRevokeDevice,
  mfaStatus,
} from "../../services/api";

export default function MfaProfileSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Enrolamiento desde perfil
  const [enrolling, setEnrolling] = useState(false);
  const [enrollData, setEnrollData] = useState(null);
  const [showManual, setShowManual] = useState(false);
  const [enrollCode, setEnrollCode] = useState("");

  // Códigos de respaldo
  const [regenPassword, setRegenPassword] = useState("");
  const [newCodes, setNewCodes] = useState(null);
  const [copied, setCopied] = useState(false);

  const loadStatus = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await mfaStatus();
      setData(res.data);
    } catch {
      setError("No se pudo cargar el estado de doble factor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleStartEnroll = async () => {
    setError("");
    setMessage("");
    setEnrolling(true);
    try {
      const res = await mfaEnrollStart(null);
      setEnrollData(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail || "No se pudo iniciar el enrolamiento.");
      setEnrolling(false);
    }
  };

  const handleConfirmEnroll = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await mfaEnrollConfirm(null, enrollCode);
      setEnrolling(false);
      setEnrollData(null);
      setEnrollCode("");
      setNewCodes(res.data.recovery_codes || []);
      setMessage("Doble factor activado correctamente.");
      await loadStatus();
    } catch (err) {
      setError(err?.response?.data?.detail || "Código TOTP inválido.");
    }
  };

  const handleRegenerate = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const res = await mfaRegenerateRecovery(regenPassword);
      setNewCodes(res.data.recovery_codes || []);
      setRegenPassword("");
      setMessage("Nuevos códigos de respaldo generados. Los anteriores fueron invalidados.");
      await loadStatus();
    } catch (err) {
      setError(err?.response?.data?.detail || "No se pudieron regenerar los códigos.");
    }
  };

  const handleRevokeDevice = async (id) => {
    setError("");
    try {
      await mfaRevokeDevice(id);
      setMessage("Dispositivo de confianza revocado.");
      await loadStatus();
    } catch {
      setError("No se pudo revocar el dispositivo.");
    }
  };

  const handleCopy = async () => {
    if (!newCodes) return;
    try {
      await navigator.clipboard.writeText(newCodes.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Seguridad y Doble Factor (OTP)
            </h2>
            <p className="text-xs text-slate-500">
              Administra tu autenticador TOTP, códigos de respaldo y dispositivos de confianza.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
          {error}
        </div>
      )}
      {message && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          {message}
        </div>
      )}

      {loading || !data ? (
        <p className="text-sm text-slate-500">Cargando estado MFA...</p>
      ) : (
        <>
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500">Estado 2FA</p>
              <p className="font-semibold text-slate-900">
                {data.activo ? "Activo" : data.mfa_state === "S0" ? "Sin exigencia" : "Pendiente"}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500">Activado el</p>
              <p className="font-semibold text-slate-900">
                {data.fecha_activacion ? new Date(data.fecha_activacion).toLocaleString() : "—"}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500">Códigos de respaldo</p>
              <p className="font-semibold text-slate-900">
                {data.recovery_codes_remaining} disponibles
              </p>
            </div>
          </div>

          {!data.activo && !enrolling && (
            <button
              type="button"
              onClick={handleStartEnroll}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium"
            >
              Configurar doble factor (QR)
            </button>
          )}

          {enrolling && enrollData && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex flex-col items-center">
                <QRCodeSVG value={enrollData.otpauth_uri} size={160} includeMargin />
                <button
                  type="button"
                  onClick={() => setShowManual((v) => !v)}
                  className="mt-2 inline-flex items-center gap-1 text-xs text-sky-700 hover:underline"
                >
                  {showManual ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showManual ? "Ocultar clave manual" : "Ver clave manual"}
                </button>
                {showManual && (
                  <p className="mt-2 p-2 bg-white border border-slate-200 rounded font-mono text-xs break-all">
                    {enrollData.manual_key}
                  </p>
                )}
              </div>
              <form onSubmit={handleConfirmEnroll} className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={enrollCode}
                  onChange={(e) => setEnrollCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="Código de 6 dígitos"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono text-center"
                />
                <button
                  type="submit"
                  disabled={enrollCode.length < 6}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium disabled:opacity-50"
                >
                  Confirmar
                </button>
              </form>
            </div>
          )}

          {newCodes && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
              <p className="text-xs font-semibold text-amber-900">
                Guarda tus nuevos códigos de respaldo (se muestran una sola vez):
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs text-center">
                {newCodes.map((c) => (
                  <div key={c} className="bg-white py-1 px-2 rounded border border-amber-200">
                    {c}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-xs font-medium text-amber-900"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copiados" : "Copiar"}
                </button>
                <button
                  type="button"
                  onClick={() => setNewCodes(null)}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-medium"
                >
                  Ya los guardé
                </button>
              </div>
            </div>
          )}

          {data.activo && (
            <form onSubmit={handleRegenerate} className="pt-2 border-t border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                <RefreshCw className="w-4 h-4 text-slate-600" />
                <span>Regenerar códigos de respaldo</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="password"
                  value={regenPassword}
                  onChange={(e) => setRegenPassword(e.target.value)}
                  placeholder="Confirma tu contraseña actual"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
                <button
                  type="submit"
                  disabled={!regenPassword}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium disabled:opacity-50"
                >
                  Regenerar
                </button>
              </div>
            </form>
          )}

          <div className="pt-2 border-t border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
              <Laptop className="w-4 h-4 text-slate-600" />
              <span>Dispositivos de confianza (12 horas)</span>
            </div>
            {data.trusted_devices.length === 0 ? (
              <p className="text-xs text-slate-500">No hay dispositivos registrados.</p>
            ) : (
              <div className="divide-y divide-slate-200">
                {data.trusted_devices.map((dev) => (
                  <div key={dev.id} className="py-2 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 truncate">{dev.device_label}</p>
                      <p className="text-slate-500">
                        Expira: {new Date(dev.fecha_expiracion).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full font-medium ${
                          dev.is_valid
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {dev.revocado ? "Revocado" : dev.is_valid ? "Activo" : "Expirado"}
                      </span>
                      {dev.is_valid && (
                        <button
                          type="button"
                          onClick={() => handleRevokeDevice(dev.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Revocar dispositivo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
