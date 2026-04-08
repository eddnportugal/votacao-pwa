"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { AssembleiaListItem, Resultado } from "@/lib/types";

export default function ResultadosPage() {
  const [assembleias, setAssembleias] = useState<AssembleiaListItem[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getAssembleias().then((d) => {
      const items = d.results || d;
      setAssembleias(items);
      const aberta = items.find((a: AssembleiaListItem) => a.status === "aberta");
      if (aberta) setSelected(aberta.id);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    api
      .getResultados(selected)
      .then(setResultados)
      .finally(() => setLoading(false));
  }, [selected]);

  // Auto-refresh every 5 seconds when assembly is open
  useEffect(() => {
    if (!selected) return;
    const current = assembleias.find((a) => a.id === selected);
    if (current?.status !== "aberta") return;

    const interval = setInterval(() => {
      api.getResultados(selected).then(setResultados);
    }, 5000);

    return () => clearInterval(interval);
  }, [selected, assembleias]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Resultados</h1>

      <div className="mb-6">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="input-field w-80"
        >
          <option value="">Selecione uma assembleia...</option>
          {assembleias.map((a) => (
            <option key={a.id} value={a.id}>
              {a.titulo} ({a.status})
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-gray-500">Carregando resultados...</p>}

      {!loading && resultados.length > 0 && (
        <div className="space-y-6">
          {resultados.map((r) => (
            <div key={r.questao_id} className="card">
              <h3 className="font-semibold text-lg mb-1">{r.questao_titulo}</h3>
              <p className="text-sm text-gray-500 mb-4">
                {r.total_votos} de {r.total_votantes} votos (
                {r.percentual_participacao}%)
              </p>

              <div className="space-y-3">
                {r.opcoes.map((opcao) => {
                  const pct =
                    r.total_votos > 0
                      ? Math.round((opcao.votos / r.total_votos) * 100)
                      : 0;
                  return (
                    <div key={opcao.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{opcao.texto}</span>
                        <span className="text-gray-500">
                          {opcao.votos} voto{opcao.votos !== 1 ? "s" : ""} ({pct}
                          %)
                        </span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && selected && resultados.length === 0 && (
        <div className="card text-center py-8">
          <p className="text-gray-500">Nenhum voto registrado ainda.</p>
        </div>
      )}
    </div>
  );
}
