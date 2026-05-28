import Link from 'next/link';

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">Washer — личный кабинет</h1>
        <p className="mt-2 text-gray-600">Онлайн-запись, история услуг и бонусный баланс.</p>
        <nav className="mt-8 flex flex-wrap gap-3">
          <Link href="/book" className="rounded-lg bg-brand-600 px-5 py-2.5 text-white font-medium hover:bg-brand-700">
            Записаться
          </Link>
          <Link href="/history" className="rounded-lg border border-gray-200 px-5 py-2.5 font-medium hover:bg-gray-50">
            Моя история
          </Link>
          <Link href="/bonuses" className="rounded-lg border border-gray-200 px-5 py-2.5 font-medium hover:bg-gray-50">
            Бонусы
          </Link>
        </nav>
      </div>
    </main>
  );
}
