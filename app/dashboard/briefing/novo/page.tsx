"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function NovoBriefingPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function verificarUsuario() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setLoading(false);
    }

    verificarUsuario();
  }, [router]);

  async function criarBriefing(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!title.trim()) {
      setError("Digite um nome para o briefing.");
      return;
    }

    setCreating(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError(
        "Sua sessão expirou. Faça login novamente."
      );

      setCreating(false);
      router.replace("/login");
      return;
    }

    /*
     * A coluna public_slug é NOT NULL no banco.
     * Por isso o código cria automaticamente um slug.
     */

    const slugBase = title
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const publicSlug = `${slugBase || "briefing"}-${Date.now()}`;

    const { data, error: insertError } = await supabase
      .from("briefings")
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        public_slug: publicSlug,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Erro ao criar briefing:", {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
      });

      setError(
        insertError.message ||
          "Não foi possível criar o briefing."
      );

      setCreating(false);
      return;
    }

    if (!data?.id) {
      setError(
        "O briefing foi criado, mas não foi possível obter o ID."
      );

      setCreating(false);
      return;
    }

    router.push(`/dashboard/briefing/${data.id}`);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0f1117] text-white">
        <p className="text-gray-400">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0f1117] text-white">
      {/* HEADER */}
      <header className="border-b border-[#252936] bg-[#11141b]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-xl font-bold text-white"
          >
            BriefNest
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-gray-400 transition hover:text-white"
          >
            ← Voltar
          </button>
        </div>
      </header>

      {/* CONTEÚDO */}
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-purple-400">
            NOVO BRIEFING
          </p>

          <h1 className="text-3xl font-bold text-white">
            Crie um novo briefing
          </h1>

          <p className="mt-3 text-gray-400">
            Comece criando o briefing que será usado para coletar
            as informações do seu cliente.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <form
          onSubmit={criarBriefing}
          className="rounded-2xl border border-[#292e3a] bg-[#181b24] p-7"
        >
          {/* TÍTULO */}
          <div className="mb-6">
            <label
              htmlFor="title"
              className="mb-2 block text-sm font-medium text-gray-200"
            >
              Nome do briefing
            </label>

            <input
              id="title"
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="Ex: Comissão de personagem"
              maxLength={100}
              required
              className="w-full rounded-lg border border-[#343a48] bg-[#222632] px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />

            <p className="mt-2 text-xs text-gray-500">
              Escolha um nome para identificar facilmente este
              briefing.
            </p>
          </div>

          {/* DESCRIÇÃO */}
          <div className="mb-8">
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-medium text-gray-200"
            >
              Descrição
              <span className="ml-2 text-xs font-normal text-gray-500">
                opcional
              </span>
            </label>

            <textarea
              id="description"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Ex: Briefing para encomendas de personagens e ilustrações."
              rows={5}
              maxLength={500}
              className="w-full resize-none rounded-lg border border-[#343a48] bg-[#222632] px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />

            <p className="mt-2 text-xs text-gray-500">
              Explique brevemente para que este briefing será
              utilizado.
            </p>
          </div>

          {/* BOTÕES */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              disabled={creating}
              className="rounded-lg border border-[#343a48] px-5 py-3 font-medium text-gray-300 transition hover:bg-[#222632] hover:text-white disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-purple-600 px-5 py-3 font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating
                ? "Criando briefing..."
                : "Criar briefing"}
            </button>
          </div>
        </form>

        <div className="mt-6 rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5">
          <h2 className="font-semibold text-white">
            O que acontece depois?
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-400">
            Depois de criar o briefing, você poderá adicionar as
            perguntas que seu cliente deverá responder. Essas
            perguntas serão usadas para organizar as informações
            da comissão.
          </p>
        </div>
      </div>
    </main>
  );
}