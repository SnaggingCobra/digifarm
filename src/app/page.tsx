import Link from "next/link";

const featureCards = [
  ["🌱", "Crop Management", "Track crops, varieties, planting dates and harvest schedules."],
  ["💰", "Expense Tracking", "Record seeds, fertilizer, labor, equipment and other expenses."],
  ["💧", "Irrigation", "Keep track of irrigation activities and water usage."],
  ["📦", "Inventory", "Manage seeds, fertilizer, pesticides, tools and farm supplies."],
  ["🌾", "Harvest", "Record harvest quantities, sales and revenue."],
  ["📊", "Farm Analytics", "Understand your farm performance with useful dashboards and charts."],
] as const;

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f6f8f3] text-[#172015]">
      <header className="border-b border-[#dfe6d8] bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-xl font-bold text-white">
              DF
            </div>
            <div>
              <h1 className="text-xl font-bold">DigiFarm</h1>
              <p className="text-xs text-gray-600">Your trusted partner in digital agriculture</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-gray-600 transition hover:text-green-700">
              Features
            </a>
            <a href="#about" className="text-sm text-gray-600 transition hover:text-green-700">
              About
            </a>
            <Link
              href="/register"
              className="rounded-lg bg-green-600 px-7 py-2.5 text-sm font-medium text-white transition hover:bg-green-700"
            >
              Register
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-12 md:grid-cols-2 md:py-28">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-800">
            Built for modern farmers
          </div>

          <h2 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight md:text-5xl">
            Manage Your Farms.
            <span className="mt-2 block text-green-600">Grow smarter</span>
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600">
            We help farmers plan, track, and improve every step of production with simple digital tools.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/register"
              className="rounded-xl bg-green-600 px-6 py-3.5 font-semibold text-white shadow-sm transition hover:bg-green-700"
            >
              Create Farmer Account
            </Link>

            <a
              href="#features"
              className="rounded-xl border border-gray-300 bg-white px-6 py-3.5 font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Explore Features
            </a>
          </div>

          <div className="mt-8 flex flex-wrap gap-6 text-sm text-gray-500">
            <span>Simple to use</span>
            <span>Secure and reliable</span>
            <span>Trusted by farmers</span>
          </div>
        </div>

        <div className="rounded-3xl border border-[#dfe6d8] bg-white p-5 shadow-xl">
          <div className="rounded-2xl bg-[#f5f8f2] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Good Morning</p>
                <h3 className="mt-1 text-2xl font-bold">Farmer&apos;s Dashboard</h3>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-700">
                Farmer
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">Active Crops</p>
                <p className="mt-2 text-3xl font-bold text-green-700">8</p>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">Farm Size</p>
                <p className="mt-2 text-3xl font-bold">4.5</p>
                <p className="mt-2 text-sm font-medium text-gray-600">Hectares</p>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">Expenses</p>
                <p className="mt-2 text-2xl font-bold">Rs. 45K</p>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">Revenue</p>
                <p className="mt-2 text-2xl font-bold text-green-700">Rs. 1.2M</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Crop Overview</p>
                <span className="text-sm text-green-600">View all</span>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Rice</span>
                    <span className="text-green-600">Growing</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-gray-100">
                    <div className="h-2 w-3/4 rounded-full bg-green-600" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm">
                    <span>Maize</span>
                    <span className="text-green-600">Growing</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-gray-100">
                    <div className="h-2 w-1/2 rounded-full bg-green-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-semibold text-green-600">Everything in one place</p>
            <h2 className="mt-3 text-4xl font-bold">Tools to manage your farm</h2>
            <p className="mt-4 text-lg text-gray-600">
              Keep your farm information organized and easy to understand.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featureCards.map(([icon, title, description]) => (
              <div
                key={title}
                className="rounded-2xl border border-gray-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-2xl">
                  {icon}
                </div>
                <h3 className="mt-5 text-xl font-bold">{title}</h3>
                <p className="mt-2 leading-7 text-gray-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="bg-[#f6f8f3] py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="font-semibold text-green-600">About DigiFarm</p>
          <h2 className="mt-3 text-4xl font-bold">Technology for better farming</h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            DigiFarm is a digital farm management platform designed to make everyday record keeping easier,
            more organized, and more useful for farmers.
          </p>

          <div className="mt-10">
            <Link
              href="/register"
              className="rounded-xl bg-green-600 px-7 py-3.5 font-semibold text-white transition hover:bg-green-700"
            >
              Start Using DigiFarm
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm text-gray-500 md:flex-row md:items-center md:justify-between">
          <p>© 2026 DigiFarm. Built for farmers.</p>
          <p>🌱 Grow smarter with DigiFarm</p>
        </div>
      </footer>
    </main>
  );
}