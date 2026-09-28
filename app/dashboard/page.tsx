"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Briefing = {
  id: string;
  title: string;
  description: string | null;
  public_slug: string;
  created_at: string;
};

export default function DashboardPage() {
  const router = useRouter();

  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function carregarDashboard() {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      setUserEmail(user.email || "");

      const { data, error: briefingError } = await supabase
        .from("briefings")
        .select(
          "id, title, description, public_slug, created_at"
        )
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (briefingError) {
        console.error("Erro ao carregar briefings:", {
          code: briefingError.code,
          message: briefingError.message,
          details: briefingError.details,
          hint: briefingError.hint,
        });

        setError(
          "Não foi possível carregar seus briefings."
        );

        setLoading(false);
        return;
      }

      setBriefings(data || []);
      setLoading(false);
    }

    carregarDashboard();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();

    router.replace("/login");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0f1117] text-white">
        <p className="text-gray-400">
          Carregando seu dashboard...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0f1117] text-white">
      {/* HEADER */}
      <header className="border-b border-[#252936] bg-[#11141b]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-xl font-bold text-white"
          >
            BriefNest
          </button>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-gray-400 sm:block">
              {userEmail}
            </span>

            <button
              onClick={handleLogout}
              className="rounded-lg border border-[#343a48] px-4 py-2 text-sm text-gray-300 transition hover:bg-[#20242e] hover:text-white"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* CONTEÚDO */}
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 text-sm font-medium text-purple-400">
              DASHBOARD
            </p>

            <h1 className="text-3xl font-bold text-white">
              Seus briefings
            </h1>

            <p className="mt-2 text-gray-400">
              Crie e organize os briefings das suas comissões.
            </p>
          </div>

          <button
            onClick={() =>
              router.push("/dashboard/briefing/novo")
            }
            className="rounded-lg bg-purple-600 px-5 py-3 font-semibold text-white transition hover:bg-purple-500"
          >
            + Novo briefing
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {briefings.length === 0 ? (
          <section className="rounded-2xl border border-[#292e3a] bg-[#181b24] p-12 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10 text-3xl">
              📝
            </div>

            <h2 className="text-xl font-semibold text-white">
              Você ainda não possui briefings
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-400">
              Crie seu primeiro briefing para começar a coletar
              as informações dos seus clientes de forma organizada.
            </p>

            <button
              onClick={() =>
                router.push("/dashboard/briefing/novo")
              }
              className="mt-6 rounded-lg bg-purple-600 px-5 py-3 font-semibold text-white transition hover:bg-purple-500"
            >
              Criar primeiro briefing
            </button>
          </section>
        ) : (
          <section>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {briefings.map((briefing) => (
                <button
                  key={briefing.id}
                  onClick={() =>
                    router.push(
                      `/dashboard/briefing/${briefing.id}`
                    )
                  }
                  className="group rounded-2xl border border-[#292e3a] bg-[#181b24] p-6 text-left transition hover:border-purple-500/50 hover:bg-[#1c202a]"
                >
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-lg">
                      📝
                    </div>

                    <span className="text-xs text-gray-500">
                      {new Date(
                        briefing.created_at
                      ).toLocaleDateString("pt-BR")}
                    </span>
                  </div>

                  <h2 className="text-lg font-semibold text-white group-hover:text-purple-300">
                    {briefing.title}
                  </h2>

                  {briefing.description ? (
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-400">
                      {briefing.description}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-gray-500">
                      Sem descrição.
                    </p>
                  )}

                  <div className="mt-6 text-sm font-medium text-purple-400">
                    Abrir briefing →
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}