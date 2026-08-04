import Dashboard from '@/components/Dashboard';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { loadDeploys, loadIncidents } from '@/lib/data';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function Home() {
  const deploys = loadDeploys();
  const incidents = loadIncidents();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-6 pt-10">
          <h1 className="font-semibold text-2xl text-einstein">
            Métricas de qualidade das entregas
          </h1>
          <p className="mt-2 text-neutral-600">
            Painel do front-end do time de pacientes no Portal Einstein: DRE,
            CFR, MTTR e False Alarm por deploy.
          </p>
        </div>
        <Dashboard
          asOf={today()}
          deploys={deploys}
          incidents={incidents}
        />
      </main>
      <Footer />
    </div>
  );
}
