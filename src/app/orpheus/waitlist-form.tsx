"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, LoaderCircle, LockKeyhole, Send } from "lucide-react";

type FormState = "idle" | "loading" | "success" | "error";

export function WaitlistForm({ language = "pt" }: { language?: "pt" | "en" }) {
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setState("loading");
    const form = new FormData(formElement);
    const email = String(form.get("email") ?? "");
    try {
      const response = await fetch("https://cipher-protocolo-orpheus.norcrj.chatgpt.site/api/waitlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const payload = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) throw new Error(payload.error || (language === "pt" ? "Não foi possível concluir o cadastro." : "We could not complete your registration."));
      setMessage(language === "pt" ? (payload.message || "Sinal confirmado. Você está na lista.") : "Signal confirmed. You are on the list.");
      setState("success");
      formElement.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : (language === "pt" ? "Não foi possível concluir o cadastro." : "We could not complete your registration."));
      setState("error");
    }
  }

  return (
    <form className="waitlist-form" onSubmit={submit}>
      <label htmlFor="email">{language === "pt" ? "Seu e-mail" : "Your email"}</label>
      <div className="input-row"><input id="email" name="email" type="email" inputMode="email" autoComplete="email" placeholder="email@example.com" required aria-describedby="privacy-note form-status" /><button type="submit" disabled={state === "loading"}>{state === "loading" ? <LoaderCircle className="spin" size={17} /> : <Send size={17} />}{language === "pt" ? "Confirmar acesso" : "Join the list"}</button></div>
      <p id="privacy-note" className="privacy-note"><LockKeyhole size={12} /> {language === "pt" ? "Usaremos seu e-mail apenas para comunicações sobre CIPHER e ORPHEUS." : "We will only use your email for CIPHER and ORPHEUS updates."}</p>
      <div id="form-status" className={`form-status ${state}`} aria-live="polite">{state === "success" && <CheckCircle2 size={16} />}{message}</div>
    </form>
  );
}
