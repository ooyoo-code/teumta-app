import Image from "next/image";

const TIERS = [
  { label: "노랑", color: "#fdbf0e", image: "/images/wallet-yellow.png", desc: "이제 막 !\n틈타를 시작한 새싹" },
  { label: "초록", color: "#00bf63", image: "/images/wallet-green.png", desc: "몇 번의 매칭으로\n감을 잡은 중수" },
  { label: "파랑", color: "#5170ff", image: "/images/wallet-blue.png", desc: "틈만 나면 자연스럽게\n틈타는 습관러" },
  { label: "보라", color: "#8c52ff", image: "/images/wallet-purple.png", desc: "부르면 언제든 !\n달려가는 베테랑" },
  { label: "무지개", color: "#f8ad00", image: "/images/wallet-rainbow.png", desc: "틈타 고수 !\n전설의 무지개 지갑 !!" },
];

export default function WalletTiers() {
  return (
    <section className="bg-black">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24 text-center">
        <h2 className="text-3xl sm:text-5xl font-black text-white">
          너 (틈타 지갑) <span className="text-brand-gold">무슨색</span>이야?
        </h2>
        <div className="mt-14 grid grid-cols-2 sm:grid-cols-5 gap-8 sm:gap-6">
          {TIERS.map((tier) => (
            <div key={tier.label} className="flex flex-col items-center">
              <Image src={tier.image} alt={`${tier.label} 지갑`} width={180} height={180} className="w-20 sm:w-24 h-auto" />
              <p className="mt-4 font-bold text-lg" style={{ color: tier.color }}>
                {tier.label}
              </p>
              <p className="mt-2 text-sm text-brand-lime leading-relaxed whitespace-pre-line">
                {tier.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
