import Hero from "@/components/Hero";
import RegisterHeading from "@/components/RegisterHeading";
import RegistrationForm from "@/components/RegistrationForm";
import UndergroundPipes from "@/components/UndergroundPipes";

export default function Home() {
  return (
    <main>
      <Hero />
      <section
        id="register"
        className="relative overflow-hidden bg-black px-5 pt-[112px] pb-[200px] md:pt-[136px] md:pb-[136px]"
      >
        {/* Mario "underground level" frame: teal brick ceiling on top, teal
            block floor at the bottom (tiles defined in globals.css). */}
        <div aria-hidden="true" className="underground-ceiling pointer-events-none absolute inset-x-0 top-0 h-[48px]" />
        <div aria-hidden="true" className="underground-floor pointer-events-none absolute inset-x-0 bottom-0 h-[48px]" />
        <UndergroundPipes />
        <RegisterHeading />
        <h2 className="relative mx-auto mb-8 max-w-[480px] text-center font-pixel text-[18px] leading-[1.5] text-vv-text uppercase md:text-[26px]">
          Register Your Team
        </h2>
        <div className="relative">
          <RegistrationForm />
        </div>
      </section>
    </main>
  );
}
