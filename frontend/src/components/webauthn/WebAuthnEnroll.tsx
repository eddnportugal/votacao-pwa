"use client";

import { useState } from "react";
import { Fingerprint, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import {
  isWebAuthnSupported,
  isPlatformAuthenticatorAvailable,
  registerCredential,
} from "@/lib/webauthn";

type Status = "idle" | "checking" | "registering" | "success" | "error" | "unsupported";

interface WebAuthnEnrollProps {
  eleitorId: string;
  onSuccess: () => void;
  onSkip?: () => void;
}

export default function WebAuthnEnroll({
  eleitorId,
  onSuccess,
  onSkip,
}: WebAuthnEnrollProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function handleEnroll() {
    setError("");

    // 1. Check support
    setStatus("checking");
    if (!isWebAuthnSupported()) {
      setStatus("unsupported");
      return;
    }

    const hasPlatform = await isPlatformAuthenticatorAvailable();
    if (!hasPlatform) {
      // Not a hard blocker — external keys still work, but warn the user
      console.warn("[WebAuthn] No platform authenticator — external key needed");
    }

    try {
      // 2. Get registration options from server
      setStatus("registering");
      const serverOptions = await api.webauthnRegisterOptions(eleitorId);

      // 3. Browser creates the credential (user taps fingerprint / face / PIN)
      const credential = await registerCredential(serverOptions);

      // 4. Send credential to server for verification + storage
      await api.webauthnRegisterVerify(eleitorId, credential);

      setStatus("success");
      setTimeout(onSuccess, 1500);
    } catch (err: any) {
      console.error("[WebAuthn] Enrollment failed:", err);
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Erro no cadastro WebAuthn";
      setError(msg);
      setStatus("error");
    }
  }

  if (status === "unsupported") {
    return (
      <div className="text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="font-semibold text-lg">WebAuthn não suportado</h3>
        <p className="text-sm text-gray-500">
          Seu navegador não suporta autenticação biométrica via WebAuthn.
          Use um navegador mais recente (Chrome, Safari, Firefox).
        </p>
        {onSkip && (
          <button onClick={onSkip} className="btn-secondary">
            Continuar sem WebAuthn
          </button>
        )}
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="text-center space-y-4">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
        <h3 className="font-semibold text-lg">WebAuthn Cadastrado!</h3>
        <p className="text-sm text-gray-500">
          Sua digital / Face ID / PIN foi registrado com segurança.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4">
      <Fingerprint className="w-12 h-12 text-primary-600 mx-auto" />
      <h3 className="font-semibold text-lg">Cadastrar Digital / PIN</h3>
      <p className="text-sm text-gray-500">
        Toque no botão abaixo para registrar a biometria do seu dispositivo.
        A chave privada fica armazenada no seu celular — nunca sai do aparelho.
      </p>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      <button
        onClick={handleEnroll}
        disabled={status === "checking" || status === "registering"}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {status === "checking" || status === "registering" ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {status === "checking"
              ? "Verificando suporte..."
              : "Aguardando biometria..."}
          </>
        ) : (
          <>
            <Fingerprint className="w-4 h-4" />
            Cadastrar Biometria
          </>
        )}
      </button>

      {onSkip && status === "idle" && (
        <button onClick={onSkip} className="text-sm text-gray-400 hover:text-gray-600">
          Pular por agora
        </button>
      )}
    </div>
  );
}
