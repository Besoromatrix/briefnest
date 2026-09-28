"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Question = {
  id: string;
  briefing_id: string;
  question: string;
  type: string;
  options: string[] | null;
};

type Briefing = {
  id: string;
  title: string;
  description: string | null;
  public_slug: string;
};

type BriefingResponse = {
  id: string;
  briefing_id: string;
  answers: Record<string, string> | null;
};

export default function BriefingPage() {
  const params = useParams();
  const router = useRouter();

  const briefingId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : "";

  const [briefing, setBriefing] =
    useState<Briefing | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<
    BriefingResponse[]
  >([]);

  const [newQuestion, setNewQuestion] = useState("");
  const [newType, setNewType] = useState("text");

  const [loading, setLoading] = useState(true);
  const [loadingResponses, setLoadingResponses] =
    useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const idInvalido =
    !briefingId || briefingId === "undefined";

  const carregarRespostas = useCallback(async () => {
    if (idInvalido) return;

    setLoadingResponses(true);

    const {
      data,
      error: responsesError,
    } = await supabase
      .from("briefing_responses")
      .select("id, briefing_id, answers")
      .eq("briefing_id", briefingId);

    if (responsesError) {
      console.error(
        "Erro ao carregar respostas:",
        responsesError.message,
        responsesError.details,
        responsesError.hint,
        responsesError.code
      );

      setError(
        responsesError.message ||
          "Não foi possível carregar as respostas."
      );

      setLoadingResponses(false);
      return;
    }

    setResponses(
      (data ?? []) as BriefingResponse[]
    );

    setLoadingResponses(false);
  }, [briefingId, idInvalido]);

  useEffect(() => {
    if (idInvalido) {
      return;
    }

    let ativo = true;

    async function iniciar() {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (!ativo) return;

        if (userError || !user) {
          router.replace("/login");
          return;
        }

        const {
          data: briefingData,
          error: briefingError,
        } = await supabase
          .from("briefings")
          .select(
            "id, title, description, public_slug"
          )
          .eq("id", briefingId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (!ativo) return;

        if (briefingError) {
          console.error(
            "Erro ao carregar briefing:",
            briefingError.message,
            briefingError.details,
            briefingError.hint,
            briefingError.code
          );

          setError(
            briefingError.message ||
              "Não foi possível carregar o briefing."
          );

          setLoading(false);
          return;
        }

        if (!briefingData) {
          setError("Briefing não encontrado.");
          setLoading(false);
          return;
        }

        setBriefing(briefingData);

        const {
          data: questionsData,
          error: questionsError,
        } = await supabase
          .from("briefing_questions")
          .select(
            "id, briefing_id, question, type, options"
          )
          .eq("briefing_id", briefingId)
          .order("id", { ascending: true });

        if (!ativo) return;

        if (questionsError) {
          console.error(
            "Erro ao carregar perguntas:",
            questionsError.message,
            questionsError.details,
            questionsError.hint,
            questionsError.code
          );

          setError(
            questionsError.message ||
              "Não foi possível carregar as perguntas."
          );

          setLoading(false);
          return;
        }

        setQuestions(questionsData ?? []);

        await carregarRespostas();

        if (!ativo) return;

        setLoading(false);
      } catch (err) {
        if (!ativo) return;

        console.error(
          "Erro inesperado ao carregar briefing:",
          err
        );

        setError(
          "Ocorreu um erro ao carregar o briefing."
        );

        setLoading(false);
      }
    }

    iniciar();

    return () => {
      ativo = false;
    };
  }, [
    briefingId,
    idInvalido,
    router,
    carregarRespostas,
  ]);

  async function adicionarPergunta() {
    if (!briefingId || idInvalido) {
      setError("ID do briefing inválido.");
      return;
    }

    if (!newQuestion.trim()) {
      setError(
        "Digite uma pergunta antes de adicionar."
      );
      return;
    }

    setAdding(true);
    setError("");

    let options: string[] | null = null;

    if (newType === "select") {
      options = ["Opção 1", "Opção 2"];
    }

    const {
      data,
      error: insertError,
    } = await supabase
      .from("briefing_questions")
      .insert({
        briefing_id: briefingId,
        question: newQuestion.trim(),
        type: newType,
        options,
      })
      .select(
        "id, briefing_id, question, type, options"
      )
      .single();

    if (insertError) {
      console.error(
        "Erro ao adicionar pergunta:",
        insertError.message,
        insertError.details,
        insertError.hint,
        insertError.code
      );

      setError(
        insertError.message ||
          "Não foi possível adicionar a pergunta."
      );

      setAdding(false);
      return;
    }

    if (data) {
      setQuestions((current) => [
        ...current,
        data,
      ]);
    }

    setNewQuestion("");
    setNewType("text");
    setAdding(false);
  }

  async function removerPergunta(id: string) {
    setError("");

    const {
      error: deleteError,
    } = await supabase
      .from("briefing_questions")
      .delete()
      .eq("id", id)
      .eq("briefing_id", briefingId);

    if (deleteError) {
      console.error(
        "Erro ao remover pergunta:",
        deleteError.message,
        deleteError.details,
        deleteError.hint,
        deleteError.code
      );

      setError(
        deleteError.message ||
          "Não foi possível remover a pergunta."
      );

      return;
    }

    setQuestions((current) =>
      current.filter(
        (question) => question.id !== id
      )
    );
  }

  async function copiarLink() {
    if (!briefing?.public_slug) {
      setError(
        "Este briefing ainda não possui um link público."
      );
      return;
    }

    const link = `${window.location.origin}/public/${briefing.public_slug}`;

    try {
      await navigator.clipboard.writeText(link);
      setError("");
      alert("Link público copiado!");
    } catch (err) {
      console.error(
        "Erro ao copiar link:",
        err
      );

      setError(
        "Não foi possível copiar o link."
      );
    }
  }

  function obterResposta(
    response: BriefingResponse,
    questionId: string
  ) {
    if (!response.answers) {
      return "";
    }

    return response.answers[questionId] ?? "";
  }

  if (idInvalido) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0f1117] px-6 text-white">
        <div className="w-full max-w-md rounded-2xl border border-[#2a2f3b] bg-[#181b24] p-8 text-center">
          <h1 className="mb-3 text-2xl font-bold">
            ID do briefing inválido
          </h1>

          <button
            type="button"
            onClick={() =>
              router.push("/dashboard")
            }
            className="w-full rounded-lg bg-purple-600 px-4 py-3 font-semibold text-white transition hover:bg-purple-700"
          >
            Voltar para o dashboard
          </button>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0f1117] text-white">
        <div className="rounded-xl border border-[#2a2f3b] bg-[#181b24] px-6 py-5">
          <p className="text-gray-400">
            Carregando briefing...
          </p>
        </div>
      </main>
    );
  }

  if (!briefing) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0f1117] px-6 text-white">
        <div className="w-full max-w-md rounded-2xl border border-[#2a2f3b] bg-[#181b24] p-8 text-center">
          <h1 className="mb-3 text-2xl font-bold">
            Não foi possível carregar
          </h1>

          <p className="mb-6 text-sm text-gray-400">
            {error ||
              "O briefing não foi encontrado."}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push("/dashboard")
            }
            className="w-full rounded-lg bg-purple-600 px-4 py-3 font-semibold text-white transition hover:bg-purple-700"
          >
            Voltar para o dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0f1117] text-white">
      <div className="mx-auto max-w-5xl px-6 py-10">

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() =>
                router.push("/dashboard")
              }
              className="mb-4 text-sm text-gray-400 transition hover:text-white"
            >
              ← Voltar para o dashboard
            </button>

            <h1 className="text-3xl font-bold">
              {briefing.title}
            </h1>

            {briefing.description && (
              <p className="mt-2 max-w-2xl text-gray-400">
                {briefing.description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={copiarLink}
            className="rounded-lg border border-[#343a49] bg-[#222632] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2a2f3b]"
          >
            Copiar link público
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <section className="mb-8 rounded-2xl border border-[#2a2f3b] bg-[#181b24] p-6">
          <h2 className="mb-2 text-xl font-semibold">
            Informações do briefing
          </h2>

          <p className="text-sm text-gray-400">
            Adicione as perguntas que seus clientes deverão
            responder antes de você começar uma comissão.
          </p>

          <div className="mt-4 rounded-lg border border-[#2a2f3b] bg-[#222632] p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Slug público
            </p>

            <p className="mt-1 break-all text-sm text-gray-300">
              {briefing.public_slug}
            </p>
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-[#2a2f3b] bg-[#181b24] p-6">
          <h2 className="mb-2 text-xl font-semibold">
            Adicionar pergunta
          </h2>

          <p className="mb-6 text-sm text-gray-400">
            Crie as perguntas que ajudarão você a entender
            melhor o pedido do cliente.
          </p>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="question"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Pergunta
              </label>

              <input
                id="question"
                type="text"
                value={newQuestion}
                onChange={(event) =>
                  setNewQuestion(
                    event.target.value
                  )
                }
                placeholder="Ex.: Qual personagem você gostaria que eu desenhasse?"
                className="w-full rounded-lg border border-[#343a49] bg-[#222632] px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-purple-600"
              />
            </div>

            <div>
              <label
                htmlFor="type"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Tipo de resposta
              </label>

              <select
                id="type"
                value={newType}
                onChange={(event) =>
                  setNewType(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-[#343a49] bg-[#222632] px-4 py-3 text-white outline-none focus:border-purple-600"
              >
                <option value="text">
                  Texto curto
                </option>

                <option value="long">
                  Texto longo
                </option>

                <option value="select">
                  Seleção
                </option>
              </select>
            </div>

            <button
              type="button"
              onClick={adicionarPergunta}
              disabled={adding}
              className="w-full rounded-lg bg-purple-600 px-4 py-3 font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {adding
                ? "Adicionando..."
                : "Adicionar pergunta"}
            </button>
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-[#2a2f3b] bg-[#181b24] p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">
              Perguntas do briefing
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              {questions.length === 0
                ? "Nenhuma pergunta adicionada ainda."
                : `${questions.length} ${
                    questions.length === 1
                      ? "pergunta"
                      : "perguntas"
                  } adicionada${
                    questions.length === 1
                      ? ""
                      : "s"
                  }.`}
            </p>
          </div>

          {questions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#343a49] bg-[#222632] p-8 text-center">
              <p className="text-gray-400">
                Comece adicionando a primeira pergunta.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map(
                (question, index) => (
                  <div
                    key={question.id}
                    className="rounded-xl border border-[#2a2f3b] bg-[#222632] p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-purple-400">
                          Pergunta {index + 1}
                        </p>

                        <p className="text-base font-medium text-white">
                          {question.question}
                        </p>

                        <p className="mt-2 text-xs text-gray-500">
                          Tipo:{" "}
                          {question.type ===
                          "text"
                            ? "Texto curto"
                            : question.type ===
                                "long"
                              ? "Texto longo"
                              : "Seleção"}
                        </p>

                        {question.type ===
                          "select" &&
                          question.options &&
                          question.options
                            .length > 0 && (
                            <div className="mt-3 space-y-1">
                              {question.options.map(
                                (option) => (
                                  <p
                                    key={option}
                                    className="text-sm text-gray-400"
                                  >
                                    • {option}
                                  </p>
                                )
                              )}
                            </div>
                          )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removerPergunta(
                            question.id
                          )
                        }
                        className="shrink-0 rounded-lg border border-red-900/60 px-4 py-2 text-sm text-red-400 transition hover:bg-red-950/30 hover:text-red-300"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        <section className="mb-8 rounded-2xl border border-[#2a2f3b] bg-[#181b24] p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Respostas recebidas
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                Cada envio do cliente aparece como uma resposta
                completa.
              </p>
            </div>

            <button
              type="button"
              onClick={carregarRespostas}
              disabled={loadingResponses}
              className="rounded-lg border border-[#343a49] bg-[#222632] px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-[#2a2f3b] hover:text-white disabled:opacity-50"
            >
              {loadingResponses
                ? "Atualizando..."
                : "Atualizar respostas"}
            </button>
          </div>

          {loadingResponses ? (
            <div className="rounded-xl border border-dashed border-[#343a49] bg-[#222632] p-8 text-center">
              <p className="text-gray-400">
                Carregando respostas...
              </p>
            </div>
          ) : responses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#343a49] bg-[#222632] p-8 text-center">
              <p className="text-gray-300">
                Nenhuma resposta recebida ainda.
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Compartilhe o link público do briefing com seu
                cliente.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {responses.map(
                (response, responseIndex) => (
                  <div
                    key={response.id}
                    className="rounded-xl border border-[#2a2f3b] bg-[#222632] p-5"
                  >
                    <div className="mb-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-purple-400">
                        Envio {responseIndex + 1}
                      </p>
                    </div>

                    <div className="space-y-4">
                      {questions.map(
                        (question) => {
                          const resposta =
                            obterResposta(
                              response,
                              question.id
                            );

                          return (
                            <div
                              key={
                                question.id
                              }
                            >
                              <p className="text-sm font-medium text-gray-300">
                                {
                                  question.question
                                }
                              </p>

                              <div className="mt-2 rounded-lg border border-[#343a49] bg-[#181b24] p-4">
                                <p className="whitespace-pre-wrap text-sm leading-6 text-gray-200">
                                  {resposta ||
                                    "Nenhuma resposta informada."}
                                </p>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-purple-900/40 bg-purple-950/20 p-6">
          <h2 className="text-lg font-semibold text-white">
            Link público
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-400">
            Envie este link para o cliente preencher o briefing.
            Ele não precisa acessar o dashboard para responder.
          </p>

          <div className="mt-4 rounded-lg border border-purple-900/40 bg-[#181b24] p-4">
            <p className="text-sm text-gray-400">
              Link do briefing:
            </p>

            <p className="mt-1 break-all text-sm text-purple-400">
              {typeof window !== "undefined"
                ? `${window.location.origin}/public/${briefing.public_slug}`
                : `/public/${briefing.public_slug}`}
            </p>

            <button
              type="button"
              onClick={copiarLink}
              className="mt-4 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
            >
              Copiar link
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}