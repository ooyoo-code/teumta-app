export default function ContactFooter() {
  return (
    <footer className="bg-black">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <h2 className="text-4xl sm:text-6xl font-black text-brand-gold">Contact</h2>
        <div className="mt-8 space-y-3 text-brand-gold text-base sm:text-lg">
          <p>
            <span className="text-white/60 mr-4">전화</span>1522-0000
          </p>
          <p>
            <span className="text-white/60 mr-4">이메일</span>hello@teumta.com
          </p>
        </div>
        <p className="mt-10 text-white/40 text-xs sm:text-sm">
          © {new Date().getFullYear()} 틈타. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
