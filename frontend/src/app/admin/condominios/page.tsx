"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
import type { Condominio } from "@/lib/types";

export default function CondominiosPage() {
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome: "", cnpj: "", total_unidades: 0, blocos: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    api
      .getCondominios()
      .then((d) => setCondominios(d.results || d))
      .finally(() => setLoading(false));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const blocos = form.blocos
        .split(",")
        .map((b) => b.trim())
        .filter(Boolean);
      await api.createCondominio({ ...form, blocos });
      setShowForm(false);
      setForm({ nome: "", cnpj: "", total_unidades: 0, blocos: "" });
      loadData();
    } catch {
      alert("Erro ao criar condomínio.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Condomínios</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Condomínio
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6 space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome
              </label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CNPJ
              </label>
              <input
                type="text"
                value={form.cnpj}
                onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                className="input-field"
                placeholder="00.000.000/0000-00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total de Unidades
              </label>
              <input
                type="number"
                value={form.total_unidades}
                onChange={(e) =>
                  setForm({
                    ...form,
                    total_unidades: parseInt(e.target.value) || 0,
                  })
                }
                className="input-field"
                min={1}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Blocos / Torres
            </label>
            <input
              type="text"
              value={form.blocos}
              onChange={(e) => setForm({ ...form, blocos: e.target.value })}
              className="input-field"
              placeholder="Ex: A, B, C ou Torre 1, Torre 2"
            />
            <p className="text-xs text-gray-400 mt-1">
              Separe os blocos por vírgula. Deixe vazio se não houver blocos.
            </p>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Salvando..." : "Salvar"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : condominios.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">Nenhum condomínio cadastrado.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {condominios.map((c) => (
            <div key={c.id} className="card">
              <h3 className="font-semibold text-lg">{c.nome}</h3>
              <p className="text-sm text-gray-500 mt-1">CNPJ: {c.cnpj}</p>
              <p className="text-sm text-gray-500">
                {c.total_unidades} unidade{c.total_unidades !== 1 ? "s" : ""}
              </p>
              {c.blocos && c.blocos.length > 0 && (
                <p className="text-sm text-gray-500">
                  Blocos: {c.blocos.join(", ")}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
