import Image from "next/image";

export default function Hero() {
  return (
    <section className="bg-brand-yellow">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24 flex flex-col-reverse sm:flex-row items-center gap-10 sm:gap-6">
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-black">
            틈만 나면, 틈타 !
          </h1>
          <p className="mt-3 text-lg sm:text-2xl font-medium text-brand-orange">
            비는 시간에 AI가 딱 맞는 알바를 찾아드려요
          </p>
        </div>
        <div className="flex-1 flex justify-center">
          <Image
            src="/images/hero-mascot.png"
            alt="틈타 마스코트"
            width={545}
            height={540}
            className="w-56 sm:w-80 h-auto"
            priority
          />
        </div>
      </div>
    </section>
  );
}
