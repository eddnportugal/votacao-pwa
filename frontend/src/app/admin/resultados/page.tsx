"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { api } from "@/lib/api";
import type { AssembleiaListItem, Resultado } from "@/lib/types";

export default function ResultadosPage() {
  const [assembleias, setAssembleias] = useState<AssembleiaListItem[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  function csvValue(value: string | number | boolean | null | undefined) {
    const text = value == null ? "" : String(value);
    return `"${text.replaceAll('"', '""')}"`;
  }

  async function exportarRelatorioDetalhado() {
    if (!selected) return;
    setExporting(true);

    try {
      const relatorio = await api.getRelatorioVotos(selected);
      const header = [
        "Nome",
        "Bloco",
        "Apartamento",
        "Perfil",
        "Por procuração",
        "Questão",
        "Opção escolhida",
        "Tipo da autenticação",
        "IP",
        "Aparelho/Navegador",
        "User-Agent",
        "Data e horário",
        "Hash do voto",
      ];
      const rows = relatorio.votos.map((voto) => [
        voto.eleitor_nome,
        voto.bloco,
        voto.apartamento,
        voto.perfil,
        voto.por_procuracao ? "Sim" : "Não",
        voto.questao_titulo,
        voto.opcao_texto,
        voto.tipo_autenticacao,
        voto.ip_address,
        voto.device_info,
        voto.user_agent,
        new Date(voto.timestamp).toLocaleString("pt-BR"),
        voto.hash_voto,
      ]);
      const csv = [header, ...rows]
        .map((row) => row.map((value) => csvValue(value)).join(";"))
        .join("\r\n");
      const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `relatorio-votos-${relatorio.assembleia_titulo.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert("Erro ao exportar relatório detalhado.");
    } finally {
      setExporting(false);
    }
  }

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
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
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

          <button
            onClick={exportarRelatorioDetalhado}
            disabled={!selected || exporting}
            className="btn-secondary inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exporting ? "Gerando relatório..." : "Exportar Relatório Detalhado"}
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          O relatório detalhado inclui nome, bloco, apartamento, perfil, IP, autenticação, data/hora e aparelho inferido pelo navegador no momento do voto.
        </p>
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
