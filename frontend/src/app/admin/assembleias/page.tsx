"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Calendar, Users, ChevronRight, Trash2, Square } from "lucide-react";
import { api } from "@/lib/api";
import type { AssembleiaListItem } from "@/lib/types";
import { clsx } from "clsx";

const statusMap = {
  rascunho: { label: "Rascunho", class: "bg-gray-100 text-gray-700" },
  aberta: { label: "Aberta", class: "bg-green-100 text-green-700" },
  encerrada: { label: "Encerrada", class: "bg-red-100 text-red-700" },
};

export default function AssembleiasPage() {
  const [assembleias, setAssembleias] = useState<AssembleiaListItem[]>([]);
  const [loading, setLoading] = useState(true);

  function loadAssembleias() {
    api
      .getAssembleias()
      .then((data) => setAssembleias(data.results || data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadAssembleias();
  }, []);

  async function handleDelete(e: React.MouseEvent, id: string, titulo: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Excluir a assembleia "${titulo}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await api.deleteAssembleia(id);
      setAssembleias((prev) => prev.filter((a) => a.id !== id));
    } catch {
      alert("Erro ao excluir assembleia.");
    }
  }

  async function handleEncerrar(e: React.MouseEvent, id: string, titulo: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`ATENÇÃO: Encerrar a votação "${titulo}" IMEDIATAMENTE?\n\nNenhum eleitor poderá mais votar após esta ação.`)) return;
    if (!confirm("Confirmar encerramento? Clique OK para encerrar agora.")) return;
    try {
      await api.encerrarAssembleia(id);
      loadAssembleias();
    } catch {
      alert("Erro ao encerrar assembleia.");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Assembleias</h1>
        <Link href="/admin/assembleias/nova" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nova Assembleia
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : assembleias.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">Nenhuma assembleia cadastrada.</p>
          <Link href="/admin/assembleias/nova" className="btn-primary">
            Criar Primeira Assembleia
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {assembleias.map((a) => {
            const st = statusMap[a.status];
            return (
              <Link
                key={a.id}
                href={`/admin/assembleias/${a.id}`}
                className="card flex items-center justify-between hover:shadow-md transition-shadow group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{a.titulo}</h3>
                    <span
                      className={clsx(
                        "text-xs font-medium px-2 py-0.5 rounded-full",
                        st.class
                      )}
                    >
                      {st.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(a.data_inicio).toLocaleDateString("pt-BR")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {a.total_votantes} votante{a.total_votantes !== 1 ? "s" : ""}
                    </span>
                    <span>{a.total_questoes} questão(ões)</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {a.status === "aberta" && (
                    <button
                      onClick={(e) => handleEncerrar(e, a.id, a.titulo)}
                      className="text-gray-300 hover:text-red-500 p-1.5 rounded hover:bg-red-50 transition-colors"
                      title="Encerrar votação"
                    >
                      <Square className="w-4 h-4" />
                    </button>
                  )}
                  {a.status !== "aberta" && (
                    <button
                      onClick={(e) => handleDelete(e, a.id, a.titulo)}
                      className="text-gray-300 hover:text-red-500 p-1.5 rounded hover:bg-red-50 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
