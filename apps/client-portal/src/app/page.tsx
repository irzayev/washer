export default function Home() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">Личный кабинет клиента</h1>
        <p className="mt-2 text-gray-600">
          История посещений, бонусы, онлайн-запись, статус автомобиля.
        </p>
        <p className="mt-6 text-sm text-gray-500">
          Этот портал — Phase 3 проекта. На текущий момент реализован MVP админ-CRM.
        </p>
      </div>
    </main>
  );
}
