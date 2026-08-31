import { HashRouter, Routes, Route } from "react-router-dom";
import { useWorksData } from "@/lib/useWorksData";
import { Layout } from "@/components/Layout";
import { MinistryOverview } from "@/pages/MinistryOverview";
import { StateView } from "@/pages/StateView";
import { DistrictView } from "@/pages/DistrictView";
import { MPView } from "@/pages/MPView";
import { WorksRegister } from "@/pages/WorksRegister";
import { AlertsFeed } from "@/pages/AlertsFeed";
import { WorkDetail } from "@/pages/WorkDetail";
import { Database, AlertCircle, Loader2 } from "lucide-react";

function EmptyState({ onSeed, seeding }: { onSeed: () => void; seeding: boolean }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="rounded-full bg-slate-100 p-4">
        <Database className="h-8 w-8 text-slate-400" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-slate-700">No works data yet</h2>
      <p className="mt-1 max-w-md text-sm text-slate-500">
        The database is empty. Generate the synthetic demo dataset (~285 works across 16 states) to populate the dashboards and run anomaly detection.
      </p>
      <button
        onClick={onSeed}
        disabled={seeding}
        className="mt-4 inline-flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-500 disabled:opacity-50"
      >
        {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
        {seeding ? "Generating..." : "Generate Synthetic Dataset"}
      </button>
    </div>
  );
}

function App() {
  const data = useWorksData();
  const hasData = data.rows.length > 0;

  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout onSeed={data.seedNow} seeding={data.seeding} alertCount={data.alerts.length} storage={data.storage} />}>
          <Route
            path="/"
            element={
              data.loading ? <Loading /> :
              data.error ? <ErrorBanner msg={data.error} /> :
              !hasData ? <EmptyState onSeed={data.seedNow} seeding={data.seeding} /> :
              <MinistryOverview works={data.works} />
            }
          />
          <Route path="/state" element={data.loading ? <Loading /> : !hasData ? <EmptyState onSeed={data.seedNow} seeding={data.seeding} /> : <StateView works={data.works} />} />
          <Route path="/district" element={data.loading ? <Loading /> : !hasData ? <EmptyState onSeed={data.seedNow} seeding={data.seeding} /> : <DistrictView works={data.works} onReview={data.updateReviewState} />} />
          <Route path="/mp" element={data.loading ? <Loading /> : !hasData ? <EmptyState onSeed={data.seedNow} seeding={data.seeding} /> : <MPView works={data.works} />} />
          <Route path="/register" element={data.loading ? <Loading /> : !hasData ? <EmptyState onSeed={data.seedNow} seeding={data.seeding} /> : <WorksRegister works={data.works} />} />
          <Route path="/alerts" element={data.loading ? <Loading /> : !hasData ? <EmptyState onSeed={data.seedNow} seeding={data.seeding} /> : <AlertsFeed alerts={data.alerts} works={data.works} />} />
          <Route path="/works/:id" element={data.loading ? <Loading /> : !hasData ? <EmptyState onSeed={data.seedNow} seeding={data.seeding} /> : <WorkDetail works={data.works} onReview={data.updateReviewState} />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      <span className="ml-2 text-sm text-slate-500">Loading works…</span>
    </div>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <div className="flex items-center gap-2 font-semibold"><AlertCircle className="h-4 w-4" /> Something went wrong</div>
      <p className="mt-1 text-red-600">{msg}</p>
    </div>
  );
}

export default App;
