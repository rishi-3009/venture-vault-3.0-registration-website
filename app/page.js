import Hero from "@/components/Hero";
import RegistrationForm from "@/components/RegistrationForm";

export default function Home() {
  return (
    <main>
      <Hero />
      <section
        id="register"
        className="relative overflow-hidden bg-vv-black px-5 py-16 md:py-24"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(245, 166, 35, 0.08) 0%, rgba(122, 62, 0, 0.04) 40%, transparent 70%)",
          }}
        />
        <h2 className="relative mx-auto mb-8 max-w-[480px] text-center font-display text-[28px] leading-[1.2] text-vv-text md:text-[36px]">
          Register Your Team
        </h2>
        <div className="relative">
          <RegistrationForm />
        </div>
      </section>
    </main>
  );
}
