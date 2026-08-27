import Image from "next/image";

export function HeroSection({
  eyebrow,
  title,
  subtitle,
  image,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  image: string;
}) {
  return (
    <section className="relative h-[58vh] min-h-[420px] max-h-[720px] w-full sm:h-[64vh] lg:h-[75vh]">
      <Image
        src={image}
        alt=""
        fill
        priority
        sizes="(min-width: 768px) calc(100vw - 256px), 100vw"
        className="object-cover object-[50%_40%] sm:object-[50%_32%] lg:object-[50%_28%]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" />

      <div className="relative flex h-full flex-col justify-end px-6 pb-10 sm:px-10 sm:pb-14 lg:px-14 lg:pb-20">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-sidebar-ink/80">
          {eyebrow}
        </p>
        <h1 className="mt-3 max-w-2xl font-[family-name:var(--font-display)] text-4xl font-semibold text-sidebar-ink sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        <p className="mt-4 max-w-lg text-base text-sidebar-ink/85 sm:text-lg">{subtitle}</p>
      </div>
    </section>
  );
}
