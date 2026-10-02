"use client";

import { Link } from "@/lib/router";
import { Github, Linkedin, Send } from "lucide-react";
import { useAppState } from "@/components/providers/AppStateProvider";

export function Footer() {
  const { settings } = useAppState();
  const language = settings.language;
  const text = {
    en: {
      about: "About",
      contacts: "Contacts",
      home: "Home",
      line: "Your personal center for tasks, goals and finances.",
      product: "Product",
      socials: "Socials",
    },
    ru: {
      about: "О нас",
      contacts: "Контакты",
      home: "Главная",
      line: "Ваш личный центр контроля задач, целей и финансов.",
      product: "Продукт",
      socials: "Соцсети",
    },
  }[language === "en" ? "en" : "ru"];

  return (
    <footer className="px-3 pb-6 sm:px-5">
      <div className="mx-auto grid max-w-[1400px] gap-6 rounded-[18px] bg-[#123c33] p-6 text-white shadow-sm shadow-emerald-950/10 sm:p-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <p className="text-2xl font-black">Planes</p>
          <p className="mt-3 max-w-md text-sm leading-6 text-emerald-50">
            {text.line}
          </p>
        </div>

        <div>
          <p className="text-xs font-black uppercase text-emerald-100">
            {text.product}
          </p>
          <div className="mt-3 flex flex-col gap-2 text-sm font-bold">
            <Link className="w-fit hover:text-lime-200" href="/">
              {text.home}
            </Link>
            <Link className="w-fit hover:text-lime-200" href="/about">
              {text.about}
            </Link>
            <Link className="w-fit hover:text-lime-200" href="/contacts">
              {text.contacts}
            </Link>
          </div>
        </div>

        <div>
          <p className="text-xs font-black uppercase text-emerald-100">
            {text.socials}
          </p>
          <div className="mt-3 flex gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
              <Send className="h-4 w-4" />
            </span>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
              <Github className="h-4 w-4" />
            </span>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
              <Linkedin className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
