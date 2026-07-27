const STEPS = [
  {
    title: "시간과 장소만 입력하세요",
    desc: "근무 가능한 시간, 위치, 희망 업종만 알려주면 끝",
  },
  {
    title: "AI가 1초 만에 찾아드려요",
    desc: "지금 맞는 자리가 있으면 즉시 매칭, 없으면 뜨는 즉시 자동으로 연결",
  },
  {
    title: "면접 없이 바로 확정, 바로 근무",
    desc: "이력서도 면접도 없이 매칭되면 그대로 출근하면 끝!",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-brand-yellow">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-5xl font-black text-black">
            AI 실시간 매칭, 이렇게 작동해요
          </h2>
          <p className="mt-3 text-base sm:text-xl text-brand-orange font-medium">
            복잡한 절차 없이 딱 3단계면 충분해요
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="rounded-3xl bg-brand-cream border-2 border-brand-orange px-6 py-8 text-center flex flex-col items-center"
            >
              <div className="w-14 h-14 rounded-full bg-brand-orange text-white text-2xl font-bold flex items-center justify-center">
                {i + 1}
              </div>
              <h3 className="mt-5 text-xl font-bold text-black">{step.title}</h3>
              <p className="mt-3 text-sm sm:text-base text-neutral-600 leading-relaxed whitespace-pre-line">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
