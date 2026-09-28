"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verificarSessao() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.replace("/dashboard");
        return;
      }

      setLoading(false);
    }

    verificarSessao();
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0f1117] text-white">
        <p className="text-gray-400">Carregando BriefNest...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0f1117] text-white">
      {/* HEADER */}
      <header className="border-b border-[#252936] bg-[#11141b]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <button
            onClick={() => router.push("/")}
            className="text-xl font-bold text-white"
          >
            BriefNest
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/login")}
              className="rounded-lg px-4 py-2 text-sm text-gray-300 transition hover:bg-[#181b24] hover:text-white"
            >
              Entrar
            </button>

            <button
              onClick={() => router.push("/signup")}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-500"
            >
              Criar conta
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-sm text-purple-300">
            Organização de comissões para artistas
          </div>

          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            Organize suas comissões sem se perder nas mensagens.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-400">
            O BriefNest ajuda artistas a coletarem e organizarem as
            informações de uma comissão em um único briefing, reduzindo a
            necessidade de procurar detalhes em conversas antigas.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => router.push("/signup")}
              className="rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-500"
            >
              Começar gratuitamente
            </button>

            <button
              onClick={() => router.push("/login")}
              className="rounded-lg border border-[#343a48] bg-[#181b24] px-6 py-3 font-semibold text-gray-200 transition hover:bg-[#20242e]"
            >
              Já tenho uma conta
            </button>
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section className="border-t border-[#252936] bg-[#11141b]">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-16 md:grid-cols-3">
          <div className="rounded-2xl border border-[#292e3a] bg-[#181b24] p-6">
            <div className="mb-4 text-2xl">📝</div>

            <h2 className="text-lg font-semibold text-white">
              Perguntas organizadas
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-400">
              Crie perguntas específicas para entender exatamente o que o
              cliente deseja.
            </p>
          </div>

          <div className="rounded-2xl border border-[#292e3a] bg-[#181b24] p-6">
            <div className="mb-4 text-2xl">📂</div>

            <h2 className="text-lg font-semibold text-white">
              Tudo em um lugar
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-400">
              Evite depender de várias mensagens espalhadas pelo WhatsApp ou
              outras plataformas.
            </p>
          </div>

          <div className="rounded-2xl border border-[#292e3a] bg-[#181b24] p-6">
            <div className="mb-4 text-2xl">🎨</div>

            <h2 className="text-lg font-semibold text-white">
              Feito para artistas
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-400">
              O produto é focado no processo de encomendas e comissões
              artísticas.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#252936]">
        <div className="mx-auto max-w-6xl px-6 py-6 text-center text-sm text-gray-500">
          BriefNest — organização simples para comissões artísticas.
        </div>
      </footer>
    </main>
  );
}