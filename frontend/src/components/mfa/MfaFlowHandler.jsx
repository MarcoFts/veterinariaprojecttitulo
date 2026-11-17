import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Copy,
  Eye,
  EyeOff,
  HelpCircle,
  QrCode,
  Smartphone,
} from "lucide-react";
import {
  mfaEnrollConfirm,
  mfaEnrollPostpone,
  mfaEnrollStart,
  mfaVerify,
} from "../../services/api";

/**
 * Maneja los estados MFA de MEJ-02 (S1 en gracia con Posponer 5s, S2 obligatorio,
 * S4 verificación TOTP/código de respaldo y despliegue único de códigos de respaldo).
 */
export default function MfaFlowHandler({ challenge, onAuthenticated, onCancel }) {
  const [step, setStep] = useState(
    challenge.status === "MFA_ENROLL_REQUIRED" ? "enroll" : "verify"
  );
  const [mfaToken, setMfaToken] = useState(challenge.mfa_token);
  const [canPostpone, setCanPostpone] = useState(Boolean(challenge.can_postpone));
  const [deadline, setDeadline] = useState(challenge.deadline || null);

  const [code, setCode] = useState("");
  const [rememberDevice, setRememberDevice] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const [enrollData, setEnrollData] = useState(null);
  const [showManualKey, setShowManualKey] = useState(false);
  const [showPostponeNotice, setShowPostponeNotice] = useState(false);
  const [postponeSeconds, setPostponeSeconds] = useState(5);

  const [recoveryCodes, setRecoveryCodes] = useState(null);
  const [pendingSession, setPendingSession] = useState(null);
  const [copied, setCopied] = useState(false);
  const [savedChecked, setSavedChecked] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const startedTokenRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (step !== "enroll" || !mfaToken) return;
    if (startedTokenRef.current === mfaToken) return;
    startedTokenRef.current = mfaToken;

    setLoading(true);
    setError("");
    mfaEnrollStart(mfaToken)
      .then((res) => {
        if (mountedRef.current) setEnrollData(res.data);
      })
      .catch((err) => {
        if (mountedRef.current) {
          setError(err?.response?.data?.detail || "No se pudo iniciar el enrolamiento.");
        }
      })
      .finally(() => {
        if (mountedRef.current) setLoading(false);
      });
  }, [step, mfaToken]);

  useEffect(() => {
    if (step !== "codes" || savedChecked) return;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [step, savedChecked]);

  useEffect(() => {
    if (!showHelpModal && !showPostponeNotice) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        if (showHelpModal) setShowHelpModal(false);
        if (showPostponeNotice) setShowPostponeNotice(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showHelpModal, showPostponeNotice]);

  useEffect(() => {
    if (!showPostponeNotice) return;
    setPostponeSeconds(5);
    const timer = setInterval(() => {
      setPostponeSeconds((s) => {
        if (s <= 1) {
          clearInterval(timer);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [showPostponeNotice]);

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");

    const cleaned = code.replace(/[\s-]/g, "").toUpperCase();
    if (cleaned.length !== 6) {
      setError("Ingresa el código de 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await mfaVerify(mfaToken, cleaned, rememberDevice);
      if (data.status === "MFA_ENROLL_REQUIRED") {
        setMfaToken(data.mfa_token);
        setCanPostpone(false);
        setDeadline(null);
        setCode("");
        setStep("enroll");
        return;
      }
      onAuthenticated(data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Código incorrecto o expirado.");
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollConfirm = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");

    const cleaned = code.replace(/[\s-]/g, "");
    if (cleaned.length !== 6) {
      setError("Ingresa el código de 6 dígitos de tu aplicación.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await mfaEnrollConfirm(mfaToken, cleaned);
      setRecoveryCodes(data.recovery_codes || []);
      setPendingSession(data);
      setStep("codes");
    } catch (err) {
      setError(err?.response?.data?.detail || "Código TOTP inválido. Verifica la hora de tu teléfono.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPostpone = async () => {
    if (loading || postponeSeconds > 0) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await mfaEnrollPostpone(mfaToken);
      onAuthenticated(data);
    } catch (err) {
      setShowPostponeNotice(false);
      setError(err?.response?.data?.detail || "No es posible posponer el enrolamiento.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCodes = async () => {
    if (!recoveryCodes) return;
    try {
      await navigator.clipboard.writeText(recoveryCodes.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8 space-y-5">
        {step !== "codes" && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/* PASO S4: VERIFICAR CÓDIGO TOTP O DE RESPALDO */}
        {step === "verify" && (
          <form onSubmit={handleVerifySubmit} className="space-y-4">
            <div className="text-center space-y-1">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-sky-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Código de un solo uso</h2>
              <p className="text-xs text-slate-500">
                Ingresa el código de 6 dígitos de tu autenticador o un código de respaldo.
              </p>
            </div>

            <div>
              <label htmlFor="mfa-code" className="block text-sm font-medium text-slate-700 mb-1">
                Código de verificación
              </label>
              <input
                id="mfa-code"
                type="text"
                maxLength={7}
                autoFocus
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Código de 6 caracteres"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-center font-mono text-lg tracking-widest bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span>Recordar este dispositivo durante 12 horas</span>
            </label>

            <button
              type="submit"
              disabled={loading || code.replace(/[\s-]/g, "").length < 6}
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm disabled:opacity-50"
            >
              {loading ? "Verificando..." : "Ingresar"}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 hover:underline"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                ¿Perdiste tu dispositivo móvil?
              </button>
            </div>
          </form>
        )}

        {/* PASO S1 / S2: ENROLAMIENTO CON QR + POSPONER (SI S1) */}
        {step === "enroll" && (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center">
                <QrCode className="w-6 h-6 text-teal-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Aviso de seguridad — Enrolar MFA</h2>
              <p className="text-xs text-slate-500">
                1. Instala Google Authenticator, Microsoft Authenticator o Contraseñas de Apple.
                2. Escanea este QR y confirma con el código de 6 dígitos.
              </p>
            </div>

            {enrollData ? (
              <div className="flex flex-col items-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <QRCodeSVG value={enrollData.otpauth_uri} size={176} includeMargin />
                <button
                  type="button"
                  onClick={() => setShowManualKey((v) => !v)}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-sky-700 hover:underline"
                >
                  {showManualKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showManualKey ? "Ocultar clave manual" : "¿No puedes escanear el código? Ver clave manual"}
                </button>
                {showManualKey && (
                  <div className="mt-2 p-2 bg-white rounded-lg border border-slate-200 font-mono text-xs break-all select-all">
                    {enrollData.manual_key}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-sm text-slate-500 py-6">Generando código QR...</p>
            )}

            <form onSubmit={handleEnrollConfirm} className="space-y-3">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="XXX-XXX"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-center font-mono text-lg tracking-widest bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <div className="flex gap-2">
                {canPostpone && (
                  <button
                    type="button"
                    onClick={() => setShowPostponeNotice(true)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
                  >
                    Posponer
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading || code.length < 6}
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium disabled:opacity-50"
                >
                  {loading ? "Confirmando..." : "Confirmar"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* PASO CÓDIGOS DE RESPALDO (MOSTRADOS UNA SOLA VEZ) */}
        {step === "codes" && recoveryCodes && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p className="font-semibold">Autenticación multifactor activada.</p>
                <p>
                  Estos 10 códigos son de un solo uso y <strong>no se volverán a mostrar</strong>.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-sm text-center">
              {recoveryCodes.map((c) => (
                <div key={c} className="bg-white py-1 rounded border border-slate-200">
                  {c}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleCopyCodes}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copiados" : "Copiar códigos"}
            </button>

            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={savedChecked}
                onChange={(e) => setSavedChecked(e.target.checked)}
                className="rounded border-slate-300 text-teal-600"
              />
              <span>Ya guardé estos códigos en un lugar seguro</span>
            </label>

            <button
              type="button"
              disabled={!savedChecked}
              onClick={() => onAuthenticated(pendingSession)}
              className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium disabled:opacity-50"
            >
              Cerrar y entrar
            </button>
          </div>
        )}
      </div>

      {/* MODAL AYUDA RECUPERACIÓN */}
      {showHelpModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mfa-help-title"
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-3 shadow-xl">
            <h3 id="mfa-help-title" className="font-bold text-slate-900">
              Recuperar acceso a tu cuenta
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Si perdiste tu dispositivo móvil, ingresa uno de los <strong>códigos de respaldo de 6 caracteres</strong>{" "}
              en el campo «Código de verificación». Cada código es de un solo uso y te pedirá vincular un nuevo dispositivo.
              Si no tienes códigos, solicita un reinicio al administrador.
            </p>
            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2 rounded-xl bg-slate-900 text-white text-sm font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MODAL POSPONER CON BARRA DE 5 SEGUNDOS (MEJ-02 S1) */}
      {showPostponeNotice && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mfa-postpone-title"
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <h3 id="mfa-postpone-title" className="font-bold text-slate-900">
              Atención
            </h3>
            <p className="text-sm text-slate-600">
              La autenticación multifactor debe completarse antes del{" "}
              <strong>{deadline ? new Date(deadline).toLocaleDateString() : "fin del período de gracia"}</strong>.
              Si no puedes enrolar tu dispositivo, comunícate con tu administrador.
            </p>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-2 transition-all duration-1000"
                style={{ width: `${((5 - postponeSeconds) / 5) * 100}%` }}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowPostponeNotice(false)}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-700"
              >
                Volver
              </button>
              <button
                type="button"
                disabled={postponeSeconds > 0 || loading}
                onClick={handleConfirmPostpone}
                className="flex-1 py-2 rounded-xl bg-amber-600 text-white text-sm font-medium disabled:opacity-50"
              >
                {postponeSeconds > 0 ? `Entendido (${postponeSeconds}s)` : "Entendido"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
