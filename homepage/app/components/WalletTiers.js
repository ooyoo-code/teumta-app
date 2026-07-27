import CoinMascot from "./CoinMascot";

const TIERS = [
  { label: "노랑", color: "#fdbf0e", desc: "이제 막 !\n틈타를 시작한 새싹" },
  { label: "초록", color: "#00bf63", desc: "몇 번의 매칭으로\n감을 잡은 중수" },
  { label: "파랑", color: "#5170ff", desc: "틈만 나면 자연스럽게\n틈타는 습관러" },
  { label: "보라", color: "#8c52ff", desc: "부르면 언제든 !\n달려가는 베테랑" },
  { label: "무지개", color: null, rainbow: true, desc: "틈타 고수 !\n전설의 무지개 지갑 !!" },
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
              <CoinMascot color={tier.color} rainbow={tier.rainbow} size={88} />
              <p className="mt-4 font-bold text-lg" style={{ color: tier.rainbow ? "#f8ad00" : tier.color }}>
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
