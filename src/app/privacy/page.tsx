import Link from "next/link";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n/translations";

export async function generateMetadata() {
  const locale = await getLocale();
  return { title: `${t(locale, "privacy.title")} — Trek?` };
}

export default async function PrivacyPage() {
  const locale = await getLocale();

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5 p-4 pb-16">
      <div>
        <Link href="/" className="text-caption text-brand-text">
          &larr; {t(locale, "privacy.back")}
        </Link>
        <h1 className="mt-2 text-title-1 font-heading font-extrabold">{t(locale, "privacy.title")}</h1>
        <p className="text-caption text-muted-foreground">{t(locale, "privacy.updated")}</p>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-title-3 font-heading font-bold">{t(locale, "privacy.whoTitle")}</h2>
        <p className="text-body text-muted-foreground">{t(locale, "privacy.whoBody")}</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-title-3 font-heading font-bold">{t(locale, "privacy.dataTitle")}</h2>
        <ul className="list-disc space-y-1 pl-5 text-body text-muted-foreground">
          <li>{t(locale, "privacy.data1")}</li>
          <li>{t(locale, "privacy.data2")}</li>
          <li>{t(locale, "privacy.data3")}</li>
          <li>{t(locale, "privacy.data4")}</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-title-3 font-heading font-bold">{t(locale, "privacy.minTitle")}</h2>
        <p className="text-body text-muted-foreground">{t(locale, "privacy.minBody")}</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-title-3 font-heading font-bold">{t(locale, "privacy.neverTitle")}</h2>
        <ul className="list-disc space-y-1 pl-5 text-body text-muted-foreground">
          <li>{t(locale, "privacy.never1")}</li>
          <li>{t(locale, "privacy.never2")}</li>
          <li>{t(locale, "privacy.never3")}</li>
          <li>{t(locale, "privacy.never4")}</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-title-3 font-heading font-bold">{t(locale, "privacy.rightsTitle")}</h2>
        <p className="text-body text-muted-foreground">{t(locale, "privacy.rightsBody")}</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-title-3 font-heading font-bold">{t(locale, "privacy.contactTitle")}</h2>
        <p className="text-body text-muted-foreground">
          {t(locale, "privacy.contactBody")}{" "}
          <a href="mailto:privacy@trek.app" className="text-brand-text">
            privacy@trek.app
          </a>
          .
        </p>
      </section>
    </div>
  );
}
