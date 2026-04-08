"use client";

import { useState } from "react";
import Link from "next/link";
import { Vote, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.requestPasswordReset(email);
      setSent(true);
    } catch {
      // Always show success to avoid email enumeration
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 px-4">
        <div className="card w-full max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">E-mail Enviado</h1>
          <p className="text-gray-600 text-sm mb-6">
            Se o e-mail informado estiver cadastrado, você receberá um link para redefinir sua senha.
          </p>
          <Link href="/login" className="btn-primary w-full block text-center">
            Voltar ao Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 px-4">
      <div className="card w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-6">
          <Vote className="w-8 h-8 text-primary-600" />
          <span className="font-bold text-xl">Votação Online</span>
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">Recuperar Senha</h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Informe seu e-mail para receber o link de redefinição.
        </p>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-mail
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-10"
                required
                placeholder="seu@email.com"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Enviando..." : "Enviar Link de Recuperação"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link href="/login" className="text-primary-600 hover:underline flex items-center justify-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  );
}
