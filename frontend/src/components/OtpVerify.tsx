"use client";

import { useState, useRef, useEffect } from "react";
import { Mail, Loader2, CheckCircle, AlertTriangle, RotateCcw } from "lucide-react";
import { api } from "@/lib/api";

type Status = "idle" | "sending" | "awaiting-code" | "verifying" | "success" | "error";

interface OtpVerifyProps {
  eleitorId: string;
  assembleiaId: string;
  onSuccess: (token: string) => void;
}

export default function OtpVerify({
  eleitorId,
  assembleiaId,
  onSuccess,
}: OtpVerifyProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [emailMasked, setEmailMasked] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input when code entry appears
  useEffect(() => {
    if (status === "awaiting-code") {
      inputRefs.current[0]?.focus();
    }
  }, [status]);

  async function handleSendOtp() {
    setError("");
    setStatus("sending");
    try {
      const result = await api.otpSend(eleitorId, assembleiaId);
      setEmailMasked(result.email_masked);
      setCode(["", "", "", "", "", ""]);
      setStatus("awaiting-code");
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Erro ao enviar código.";
      setError(msg);
      setStatus("error");
    }
  }

  async function handleVerify(fullCode: string) {
    setError("");
    setStatus("verifying");
    try {
      const result = await api.otpVerify(eleitorId, assembleiaId, fullCode);
      setStatus("success");
      setTimeout(() => onSuccess(result.token), 1000);
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Código inválido ou expirado.";
      setError(msg);
      setStatus("awaiting-code");
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  }

  function handleDigitChange(index: number, value: string) {
    // Only digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits filled
    if (digit && index === 5) {
      const fullCode = newCode.join("");
      if (fullCode.length === 6) {
        handleVerify(fullCode);
      }
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split("");
      setCode(newCode);
      inputRefs.current[5]?.focus();
      handleVerify(pasted);
    }
  }

  if (status === "success") {
    return (
      <div className="text-center space-y-4">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
        <h3 className="font-semibold text-lg">Identidade Confirmada</h3>
      </div>
    );
  }

  if (status === "idle" || status === "sending" || status === "error") {
    return (
      <div className="text-center space-y-4">
        <Mail className="w-12 h-12 text-primary-600 mx-auto" />
        <h3 className="font-semibold text-lg">Verificação por E-mail</h3>
        <p className="text-sm text-gray-500">
          Enviaremos um código de 6 dígitos para o e-mail cadastrado.
        </p>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        <button
          onClick={handleSendOtp}
          disabled={status === "sending"}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {status === "sending" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Mail className="w-4 h-4" />
              Enviar Código
            </>
          )}
        </button>
      </div>
    );
  }

  // awaiting-code or verifying
  return (
    <div className="text-center space-y-4">
      <Mail className="w-12 h-12 text-primary-600 mx-auto" />
      <h3 className="font-semibold text-lg">Digite o Código</h3>
      <p className="text-sm text-gray-500">
        Enviado para <span className="font-medium">{emailMasked}</span>
      </p>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      <div className="flex justify-center gap-2" onPaste={handlePaste}>
        {code.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleDigitChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            disabled={status === "verifying"}
            className="w-11 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none transition-colors disabled:opacity-50"
          />
        ))}
      </div>

      {status === "verifying" && (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Verificando...
        </div>
      )}

      <button
        onClick={handleSendOtp}
        disabled={status === "verifying"}
        className="text-sm text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1 mx-auto"
      >
        <RotateCcw className="w-3 h-3" />
        Reenviar código
      </button>
    </div>
  );
}
