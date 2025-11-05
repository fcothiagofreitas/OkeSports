export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          🏃 Okê Sports
        </h1>
        <p className="text-center text-lg mb-4">
          Plataforma de Inscrições para Eventos Esportivos
        </p>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 mt-8">
          <h2 className="text-2xl font-semibold mb-4">✅ Setup Completo!</h2>
          <ul className="space-y-2">
            <li>✅ Next.js 14 + TypeScript</li>
            <li>✅ Tailwind CSS</li>
            <li>✅ Prisma ORM + PostgreSQL</li>
            <li>✅ Estrutura de pastas configurada</li>
            <li>✅ ESLint + Prettier</li>
          </ul>
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded border-l-4 border-yellow-400">
            <p className="text-sm">
              <strong>Próximos passos:</strong>
            </p>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
              <li>Copie <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">.env.example</code> para <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">.env</code></li>
              <li>Configure as variáveis de ambiente</li>
              <li>Execute <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">npx prisma generate</code></li>
              <li>Execute <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">npx prisma db push</code></li>
            </ol>
          </div>
        </div>
      </div>
    </main>
  );
}
