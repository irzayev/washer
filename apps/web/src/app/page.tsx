import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-white p-6">
      <div className="max-w-xl w-full text-center space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-1.5 text-sm font-medium text-brand-700">
          eDetailing CRM
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Управляйте автомойкой как профессионал
        </h1>
        <p className="text-gray-600">
          Клиенты, заказы, склад, бонусы, аналитика — в одной платформе.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/login" className="btn-primary">Войти в CRM</Link>
          <a href="/api/docs" className="btn-secondary" target="_blank" rel="noreferrer">API Docs</a>
        </div>
      </div>
    </main>
  );
}
