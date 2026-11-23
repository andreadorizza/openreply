"use client";

import { useState, useTransition } from "react";
import { setLocale } from "@/lib/i18n/actions";
import { useI18n } from "@/lib/i18n/provider";

function LanguageOptions() {
  return (
    <>
      <option value="en" lang="en">
        English
      </option>
      <option value="zh-TW" lang="zh-TW">
        繁體中文
      </option>
      <option value="pt-BR" lang="pt-BR">
        Português (Brasil)
      </option>
      <option value="ru" lang="ru">
        Русский
      </option>
      <option value="es" lang="es">
        Español
      </option>
    </>
  );
}

export default function LanguageSwitcher({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { locale, t } = useI18n();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  if (compact) {
    // Same select and same behavior, drawn as a short code ("EN") with a small
    // arrow. The native select sits invisibly on top so the full language
    // names still show in the picker.
    return (
      <div className="pointer-events-auto relative z-10 inline-block">
        <label className="relative inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-sm font-medium text-muted transition-colors hover:text-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent">
          <span className="sr-only">{t("Language")}</span>
          <span aria-hidden="true">{locale.split("-")[0].toUpperCase()}</span>
          <svg
            viewBox="0 0 256 256"
            fill="currentColor"
            aria-hidden="true"
            className="h-3 w-3"
          >
            <path d="M216.49,104.49l-80,80a12,12,0,0,1-17,0l-80-80a12,12,0,0,1,17-17L128,159l71.51-71.52a12,12,0,0,1,17,17Z" />
          </svg>
          <select
            value={locale}
            disabled={pending}
            aria-busy={pending}
            onChange={(event) => {
              const nextLocale = event.target.value;
              setFailed(false);
              startTransition(async () => {
                try {
                  await setLocale(nextLocale);
                } catch {
                  setFailed(true);
                }
              });
            }}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-default"
          >
            <LanguageOptions />
          </select>
        </label>
        {failed && (
          <p role="alert" className="text-xs text-error">
            {t("Could not change language. Please try again.")}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <label className="inline-flex items-center gap-2 text-sm text-muted">
        <span>{t("Language")}</span>
        <select
          value={locale}
          disabled={pending}
          aria-busy={pending}
          onChange={(event) => {
            const nextLocale = event.target.value;
            setFailed(false);
            startTransition(async () => {
              try {
                await setLocale(nextLocale);
              } catch {
                setFailed(true);
              }
            });
          }}
          className="min-h-9 rounded border border-border bg-surface px-2 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
        >
          <LanguageOptions />
        </select>
      </label>
      {failed && (
        <p role="alert" className="text-xs text-error">
          {t("Could not change language. Please try again.")}
        </p>
      )}
    </div>
  );
}
