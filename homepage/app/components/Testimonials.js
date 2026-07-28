import Image from "next/image";

const REVIEWS = [
  { name: "민준", quote: "이력서도 면접도 없이 1시간 만에 매칭됐어요.\n이게 진짜 되네요,,," },
  { name: "서연", quote: "퇴근하고 남는 2시간,\n틈타로 용돈벌이가 됐어요." },
  { name: "하늘", quote: "면접 스트레스 없이 바로 일할 수 있어서\n취준 중에도 부담 없어요." },
];

export default function Testimonials() {
  return (
    <section className="bg-black">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
        <div className="flex flex-col sm:flex-row items-center gap-10 sm:gap-16 mb-12">
          <Image
            src="/images/magnifier-mascot.png"
            alt="리뷰 확인 중인 틈타 마스코트"
            width={520}
            height={440}
            className="w-40 sm:w-56 h-auto"
          />
          <h2 className="text-3xl sm:text-5xl font-black text-brand-lime text-center sm:text-left">
            리뷰로 검증된
            <br />
            압도적 편리함
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {REVIEWS.map((review) => (
            <div
              key={review.name}
              className="rounded-2xl bg-brand-lime border border-[#fbd156] px-6 py-5"
            >
              <p className="font-bold text-black text-lg mb-2">{review.name}</p>
              <p className="text-black text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {review.quote}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
