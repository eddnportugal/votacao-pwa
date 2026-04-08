"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Send, UserCheck, UserX, Link2, Check } from "lucide-react";
import { api } from "@/lib/api";
import type { Eleitor, Condominio } from "@/lib/types";

export default function EleitoresPage() {
  const [eleitores, setEleitores] = useState<Eleitor[]>([]);
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [filtroCondominio, setFiltroCondominio] = useState("");
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleCopyLink(eleitorId: string) {
    try {
      const res = await api.enviarConvite(eleitorId);
      const link = `${window.location.origin}/cadastro/${res.token}`;
      await navigator.clipboard.writeText(link);
      setCopiedId(eleitorId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      alert("Erro ao gerar link de convite.");
    }
  }

  useEffect(() => {
    Promise.all([
      api.getEleitores().then((d) => setEleitores(d.results || d)),
      api.getCondominios().then((d) => setCondominios(d.results || d)),
    ]).finally(() => setLoading(false));
  }, []);

  const filtered = filtroCondominio
    ? eleitores.filter((e) => e.condominio === filtroCondominio)
    : eleitores;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Eleitores</h1>
        <Link
          href="/admin/eleitores/novo"
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Eleitor
        </Link>
      </div>

      {condominios.length > 1 && (
        <div className="mb-4">
          <select
            value={filtroCondominio}
            onChange={(e) => setFiltroCondominio(e.target.value)}
            className="input-field w-64"
          >
            <option value="">Todos os condomínios</option>
            {condominios.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">Nenhum eleitor cadastrado.</p>
        </div>
      ) : (
        <div className="card overflow-hidden !p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3 font-medium">Nome</th>
                <th className="text-left px-4 py-3 font-medium">Apto</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">
                  Email
                </th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="text-center px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{e.nome}</td>
                  <td className="px-4 py-3">{e.apartamento}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-500">
                    {e.email}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {e.cadastro_completo ? (
                      <span className="inline-flex items-center gap-1 text-green-700 text-xs font-medium bg-green-50 px-2 py-0.5 rounded-full">
                        <UserCheck className="w-3 h-3" /> Completo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-700 text-xs font-medium bg-amber-50 px-2 py-0.5 rounded-full">
                        <UserX className="w-3 h-3" /> Pendente
                        <span
                          title="O eleitor ainda não completou o cadastro. Envie o convite para que ele cadastre sua biometria facial ou WebAuthn."
                          className="cursor-help inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-200 text-amber-800 font-bold text-xs hover:bg-amber-300 transition-colors ml-1"
                        >
                          ?
                        </span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {!e.cadastro_completo && (
                      <button
                        onClick={() => handleCopyLink(e.id)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-800 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors"
                        title="Copiar link de cadastro"
                      >
                        {copiedId === e.id ? (
                          <>
                            <Check className="w-4 h-4 text-green-600" />
                            <span className="text-green-600">Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Link2 className="w-4 h-4" />
                            Copiar Link
                          </>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
