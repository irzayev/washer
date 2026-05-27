export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100">Настройки</h1>
        <p className="text-sm text-gray-500">Настройки филиалов, услуг, пользователей</p>
      </div>
      <div className="card">
        <p className="text-sm text-gray-600 dark:text-zinc-400">
          Раздел настроек будет реализован в следующих итерациях: услуги, категории, пользователи и
          роли, бонусные правила, шаблоны уведомлений, интеграции.
        </p>
      </div>
    </div>
  );
}
