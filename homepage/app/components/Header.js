import Image from "next/image";

const DEMO_URL = "https://ooyoo-code.github.io/teumta-app/seeker/?reset";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-brand-yellow/90 backdrop-blur border-b border-black/10">
      <div className="mx-auto max-w-6xl px-5 py-3 flex items-center justify-between">
        <Image src="/images/wordmark.png" alt="틈타" width={96} height={48} className="h-8 w-auto sm:h-9" priority />
        <a
          href={DEMO_URL}
          className="rounded-full bg-brand-orange text-white text-sm sm:text-base font-bold px-4 py-2 sm:px-5 sm:py-2.5 hover:brightness-95 transition"
        >
          데모 보러가기
        </a>
      </div>
    </header>
  );
}
