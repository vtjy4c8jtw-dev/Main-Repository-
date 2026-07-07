import React, { useCallback, useEffect, useState } from 'react';
import StatTile from '../components/StatTile';
import WeeklyVolumeChart from '../components/charts/WeeklyVolumeChart';
import PaceTrendChart from '../components/charts/PaceTrendChart';
import HrZoneDonut from '../components/charts/HrZoneDonut';
import TrainingLoadChart from '../components/charts/TrainingLoadChart';
import ActivityTable from '../components/ActivityTable';
import GoalForm from '../components/GoalForm';
import TrainingPlanView from '../components/TrainingPlanView';
import { getAthlete, getActivities, getAnalysis, getTrainingPlan, createTrainingPlan } from '../api/client';
import { formatDistance, formatPace } from '../utils/format';

export default function Dashboard() {
  const [athlete, setAthlete] = useState(null);
  const [activities, setActivities] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const unit = athlete?.measurement_preference === 'feet' ? 'mi' : 'km';

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [a, acts, an] = await Promise.all([getAthlete(), getActivities(120), getAnalysis(120)]);
        if (cancelled) return;
        setAthlete(a);
        setActivities(acts.activities);
        setAnalysis(an);
        try {
          const existingPlan = await getTrainingPlan();
          if (!cancelled) setPlan(existingPlan);
        } catch {
          // no plan yet — that's fine
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleGenerate = useCallback(async (payload) => {
    setGenerating(true);
    try {
      const generated = await createTrainingPlan(payload);
      setPlan(generated);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }, []);

  if (loading) {
    return <div className="empty-state">Loading your Strava data…</div>;
  }
  if (error) {
    return <div className="empty-state">Couldn't load data: {error}</div>;
  }
  if (!analysis) {
    return <div className="empty-state">No data available.</div>;
  }

  const lastWeek = analysis.weeklySummaries[analysis.weeklySummaries.length - 1];
  const prevWeek = analysis.weeklySummaries[analysis.weeklySummaries.length - 2];
  const weekOverWeekPct =
    lastWeek && prevWeek && prevWeek.distanceKm
      ? Math.round(((lastWeek.distanceKm - prevWeek.distanceKm) / prevWeek.distanceKm) * 100)
      : null;

  return (
    <div>
      <div className="stat-grid">
        <StatTile
          label="This week"
          value={formatDistance((lastWeek?.distance) || 0, unit)}
          sub={weekOverWeekPct != null ? `${weekOverWeekPct >= 0 ? '+' : ''}${weekOverWeekPct}% vs last week` : null}
        />
        <StatTile
          label="4-week avg / week"
          value={`${unit === 'mi' ? (analysis.currentFitness.avgWeeklyKm * 0.621371).toFixed(1) : analysis.currentFitness.avgWeeklyKm} ${unit}`}
        />
        <StatTile
          label="Longest recent run"
          value={`${unit === 'mi' ? (analysis.currentFitness.longestRunKm * 0.621371).toFixed(1) : analysis.currentFitness.longestRunKm} ${unit}`}
        />
        <StatTile label="Runs / week" value={analysis.currentFitness.runDaysPerWeek} />
        <StatTile label="Consistency (28d)" value={`${analysis.consistency.percent}%`} sub={`${analysis.consistency.runDays} run days`} />
        <StatTile
          label="Recent avg pace"
          value={lastWeek ? formatPace(lastWeek.avgPaceSecPerKm, unit) : '--'}
        />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Weekly distance</div>
          <WeeklyVolumeChart weeks={analysis.weeklySummaries} unit={unit} />
        </div>
        <div className="card">
          <div className="card-title">Heart rate zones (recent runs)</div>
          <HrZoneDonut zones={analysis.hrZoneDistribution.zones} runsWithHr={analysis.hrZoneDistribution.runsWithHr} />
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Pace trend</div>
          <PaceTrendChart weeks={analysis.weeklySummaries} unit={unit} />
        </div>
        <div className="card">
          <div className="card-title">Training load (ACWR)</div>
          <TrainingLoadChart series={analysis.trainingLoad.series} />
        </div>
      </div>

      <div className="card">
        <div className="card-title">Recent activities</div>
        <ActivityTable activities={activities} unit={unit} />
      </div>

      <div className="card">
        <div className="card-title">Training plan</div>
        <GoalForm onGenerate={handleGenerate} generating={generating} />
        {plan && (
          <div style={{ marginTop: 16 }}>
            <TrainingPlanView plan={plan} />
          </div>
        )}
      </div>
    </div>
  );
}
