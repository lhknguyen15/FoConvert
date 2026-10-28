type ComingSoonPageProps = {
  onBack: () => void
}

export default function ComingSoonPage({ onBack }: ComingSoonPageProps) {
  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <button type="button" onClick={onBack} className="flex cursor-pointer items-center" aria-label="Về trang chủ FoConvert">
            <img src="/logoFoConvert.svg" alt="FoConvert" className="h-11 w-auto" />
          </button>
          <span className="rounded-full bg-secondary-soft px-3 py-1 text-xs font-semibold text-primary">Đang phát triển</span>
        </div>
      </header>

      <section className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/60 sm:p-12">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-secondary-soft text-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-8" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m5-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.16em] text-secondary">FoConvert</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-primary">Chức năng đang được phát triển</h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-slate-600">
            Tính năng tài khoản sẽ sớm được cập nhật. Bạn vẫn có thể sử dụng chức năng chuyển đổi PDF sang Word ngay bây giờ.
          </p>
          <button type="button" onClick={onBack} className="mt-8 cursor-pointer rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover">
            Quay lại trang chính
          </button>
        </div>
      </section>

      <footer className="bg-primary px-5 py-5 text-center text-xs text-secondary-soft/70">
        © 2026 FoConvert. All rights reserved.
      </footer>
    </main>
  )
}
