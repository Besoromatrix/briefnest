"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../lib/supabase/client";

type Briefing = {
  id: string;
  title: string;
  description: string | null;
  public_slug: string;
};

type Question = {
  id: string;
  briefing_id: string;
  question: string;
  type: string;
  options: string[] | null;
};

export default function PublicBriefingPage() {
  const params = useParams();

  const slug =
    typeof params.slug === "string"
      ? params.slug
      : Array.isArray(params.slug)
        ? params.slug[0]
        : "";

  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregarBriefing() {
      if (!slug) {
        if (!ativo) return;

        setError("Link de briefing inválido.");
        setLoading(false);
        return;
      }

      try {
        /*
         * 1. CARREGAR BRIEFING PELO SLUG PÚBLICO
         */
        const {
          data: briefingData,
          error: briefingError,
        } = await supabase
          .from("briefings")
          .select("id, title, description, public_slug")
          .eq("public_slug", slug)
          .maybeSingle();

        if (!ativo) return;

        if (briefingError) {
          console.error(
            "Erro ao carregar briefing público:",
            briefingError.message,
            briefingError.details,
            briefingError.hint,
            briefingError.code
          );

          setError(
            briefingError.message ||
              "Não foi possível carregar este briefing."
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

        /*
         * 2. CARREGAR PERGUNTAS DO BRIEFING
         */
        const {
          data: questionsData,
          error: questionsError,
        } = await supabase
          .from("briefing_questions")
          .select(
            "id, briefing_id, question, type, options"
          )
          .eq("briefing_id", briefingData.id)
          .order("id", { ascending: true });

        if (!ativo) return;

        if (questionsError) {
          console.error(
            "Erro ao carregar perguntas públicas:",
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
        setLoading(false);
      } catch (err) {
        if (!ativo) return;

        console.error(
          "Erro inesperado na página pública:",
          err
        );

        setError(
          "Ocorreu um erro ao carregar o briefing."
        );

        setLoading(false);
      }
    }

    carregarBriefing();

    return () => {
      ativo = false;
    };
  }, [slug]);

  /*
   * ALTERAR UMA RESPOSTA
   */
  function atualizarResposta(
    questionId: string,
    value: string
  ) {
    setAnswers((current) => ({
      ...current,
      [questionId]: value,
    }));
  }

  /*
   * ENVIAR RESPOSTAS
   *
   * A tabela briefing_responses usa:
   *
   * briefing_id
   * answers
   *
   * Não usamos question_id, answer ou created_at.
   */
  async function enviarFormulario(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!briefing) {
      setError("Briefing não encontrado.");
      return;
    }

    setError("");
    setSuccess(false);

    /*
     * Verificar se todas as perguntas foram respondidas.
     */
    for (const question of questions) {
      const resposta = answers[question.id];

      if (!resposta || !resposta.trim()) {
        setError(
          `Responda à pergunta: "${question.question}"`
        );

        return;
      }
    }

    setSending(true);

    /*
     * O objeto answers fica assim:
     *
     * {
     *   "id-da-pergunta-1": "resposta",
     *   "id-da-pergunta-2": "outra resposta"
     * }
     *
     * Esse objeto é salvo diretamente na coluna
     * briefing_responses.answers.
     */
    const { error: insertError } = await supabase
      .from("briefing_responses")
      .insert({
        briefing_id: briefing.id,
        answers: answers,
      });

    if (insertError) {
      console.error(
        "Erro ao enviar respostas:",
        insertError.message,
        insertError.details,
        insertError.hint,
        insertError.code
      );

      setError(
        insertError.message ||
          "Não foi possível enviar suas respostas."
      );

      setSending(false);
      return;
    }

    setSuccess(true);
    setSending(false);
  }

  /*
   * TELA DE CARREGAMENTO
   */
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0f1117] px-6 text-white">
        <div className="rounded-2xl border border-[#2a2f3b] bg-[#181b24] px-8 py-6">
          <p className="text-gray-400">
            Carregando briefing...
          </p>
        </div>
      </main>
    );
  }

  /*
   * BRIEFING NÃO ENCONTRADO
   */
  if (!briefing) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0f1117] px-6 text-white">
        <div className="w-full max-w-md rounded-2xl border border-[#2a2f3b] bg-[#181b24] p-8 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-purple-400">
            BriefNest
          </p>

          <h1 className="text-2xl font-bold">
            Briefing não encontrado
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-400">
            {error ||
              "Este link pode estar incorreto ou o briefing não existe mais."}
          </p>
        </div>
      </main>
    );
  }

  /*
   * RESPOSTAS ENVIADAS
   */
  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0f1117] px-6 text-white">
        <div className="w-full max-w-lg rounded-2xl border border-[#2a2f3b] bg-[#181b24] p-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-purple-600/20 text-2xl text-purple-400">
            ✓
          </div>

          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-purple-400">
            BriefNest
          </p>

          <h1 className="text-2xl font-bold">
            Respostas enviadas!
          </h1>

          <p className="mt-3 text-gray-400">
            Suas respostas foram enviadas com sucesso.
          </p>
        </div>
      </main>
    );
  }

  /*
   * PÁGINA PRINCIPAL
   */
  return (
    <main className="min-h-screen bg-[#0f1117] px-6 py-10 text-white">
      <div className="mx-auto max-w-2xl">

        {/* CABEÇALHO */}
        <div className="mb-8 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-purple-400">
            BriefNest
          </p>

          <h1 className="text-3xl font-bold">
            {briefing.title}
          </h1>

          {briefing.description && (
            <p className="mx-auto mt-3 max-w-xl text-gray-400">
              {briefing.description}
            </p>
          )}
        </div>

        {/* ERRO */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* SEM PERGUNTAS */}
        {questions.length === 0 ? (
          <section className="rounded-2xl border border-[#2a2f3b] bg-[#181b24] p-8 text-center">
            <h2 className="text-xl font-semibold">
              Este briefing ainda não possui perguntas.
            </h2>

            <p className="mt-3 text-sm text-gray-400">
              O responsável pelo briefing ainda não adicionou
              nenhuma pergunta.
            </p>
          </section>
        ) : (
          <form onSubmit={enviarFormulario}>
            <div className="space-y-6">
              {questions.map((question, index) => (
                <section
                  key={question.id}
                  className="rounded-2xl border border-[#2a2f3b] bg-[#181b24] p-6"
                >
                  <label
                    htmlFor={`question-${question.id}`}
                    className="block"
                  >
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-purple-400">
                      Pergunta {index + 1}
                    </span>

                    <span className="block text-base font-medium text-white">
                      {question.question}
                    </span>
                  </label>

                  {/* RESPOSTA LONGA */}
                  {question.type === "long" ? (
                    <textarea
                      id={`question-${question.id}`}
                      value={answers[question.id] || ""}
                      onChange={(event) =>
                        atualizarResposta(
                          question.id,
                          event.target.value
                        )
                      }
                      rows={5}
                      className="mt-4 w-full resize-y rounded-lg border border-[#343a49] bg-[#222632] px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-purple-600"
                      placeholder="Digite sua resposta..."
                    />

                  /* SELEÇÃO */
                  ) : question.type === "select" ? (
                    <select
                      id={`question-${question.id}`}
                      value={answers[question.id] || ""}
                      onChange={(event) =>
                        atualizarResposta(
                          question.id,
                          event.target.value
                        )
                      }
                      className="mt-4 w-full rounded-lg border border-[#343a49] bg-[#222632] px-4 py-3 text-white outline-none focus:border-purple-600"
                    >
                      <option value="">
                        Selecione uma opção
                      </option>

                      {(question.options || []).map(
                        (option) => (
                          <option
                            key={option}
                            value={option}
                          >
                            {option}
                          </option>
                        )
                      )}
                    </select>

                  /* TEXTO CURTO */
                  ) : (
                    <input
                      id={`question-${question.id}`}
                      type="text"
                      value={answers[question.id] || ""}
                      onChange={(event) =>
                        atualizarResposta(
                          question.id,
                          event.target.value
                        )
                      }
                      className="mt-4 w-full rounded-lg border border-[#343a49] bg-[#222632] px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-purple-600"
                      placeholder="Digite sua resposta..."
                    />
                  )}
                </section>
              ))}
            </div>

            <button
              type="submit"
              disabled={sending}
              className="mt-6 w-full rounded-lg bg-purple-600 px-5 py-4 font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending
                ? "Enviando..."
                : "Enviar respostas"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}