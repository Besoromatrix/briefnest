"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSignup(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setSuccess(false);

    if (password.length < 6) {
      setMessage(
        "A senha precisa ter pelo menos 6 caracteres."
      );
      return;
    }

    if (password !== confirmPassword) {
      setMessage("As senhas não são iguais.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) {
      console.error("Erro ao criar conta:", error);

      setMessage(
        error.message || "Não foi possível criar sua conta."
      );

      setLoading(false);
      return;
    }

    /*
      Se o Supabase estiver configurado para exigir
      confirmação de e-mail, session será null.
    */

    if (!data.session) {
      setSuccess(true);
      setMessage(
        "Conta criada! Verifique seu e-mail para confirmar a conta."
      );

      setLoading(false);
      return;
    }

    router.replace("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f1117] px-6 py-12 text-white">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <button
            onClick={() => router.push("/")}
            className="text-2xl font-bold text-white"
          >
            BriefNest
          </button>

          <p className="mt-3 text-gray-400">
            Crie sua conta gratuitamente.
          </p>
        </div>

        <div className="rounded-2xl border border-[#292e3a] bg-[#181b24] p-8">
          <h1 className="text-2xl font-bold">
            Criar conta
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            Comece a organizar suas comissões.
          </p>

          <form
            onSubmit={handleSignup}
            className="mt-8 space-y-5"
          >
            <div>
              <label
                htmlFor="signup-email"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                E-mail
              </label>

              <input
                id="signup-email"
                type="email"
                required
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="seu@email.com"
                className="w-full rounded-lg border border-[#343a48] bg-[#222632] px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div>
              <label
                htmlFor="signup-password"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Senha
              </label>

              <input
                id="signup-password"
                type="password"
                required
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Mínimo de 6 caracteres"
                className="w-full rounded-lg border border-[#343a48] bg-[#222632] px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Confirmar senha
              </label>

              <input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                placeholder="Digite a senha novamente"
                className="w-full rounded-lg border border-[#343a48] bg-[#222632] px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-purple-600 px-4 py-3 font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Criando conta..."
                : "Criar conta"}
            </button>
          </form>

          {message && (
            <div
              className={`mt-5 rounded-lg border px-4 py-3 text-center text-sm ${
                success
                  ? "border-green-500/30 bg-green-500/10 text-green-300"
                  : "border-red-500/30 bg-red-500/10 text-red-300"
              }`}
            >
              {message}
            </div>
          )}

          <p className="mt-6 text-center text-sm text-gray-400">
            Já possui uma conta?{" "}
            <button
              onClick={() => router.push("/login")}
              className="font-medium text-purple-400 underline hover:text-purple-300"
            >
              Entrar
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}