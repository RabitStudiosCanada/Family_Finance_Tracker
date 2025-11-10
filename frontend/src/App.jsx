const features = [
  'Express API with Jest testing harness',
  'React + Vite frontend configured with Tailwind CSS',
  'Shared linting, formatting, and commit hooks'
];

export default function App() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Family Finance Tracker
          </p>
          <h1 className="mt-2 text-4xl font-bold">Developer Experience Starter</h1>
          <p className="mt-4 text-lg text-slate-600">
            This scaffold provides a productive baseline for building the Family Finance Tracker
            platform with a modern frontend and backend toolkit.
          </p>
        </header>
        <ul className="grid gap-4 sm:grid-cols-3">
          {features.map((feature) => (
            <li
              key={feature}
              className="rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-sm"
            >
              {feature}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
