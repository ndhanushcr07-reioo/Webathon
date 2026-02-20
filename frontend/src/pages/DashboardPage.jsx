import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, PointElement, LineElement,
    Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import api from '../api/axios';
import Navbar from '../components/Navbar';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function DashboardPage() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const [summary, setSummary] = useState(null);
    const [charts, setCharts] = useState(null);
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [s, c, q] = await Promise.all([
                    api.get('/progress/summary'),
                    api.get('/progress/charts'),
                    api.get('/motivation'),
                ]);
                setSummary(s.data.data);
                setCharts(c.data.data);
                setQuote(q.data.data);
            } catch (err) {
                console.error('Dashboard fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    const accuracyChartData = {
        labels: charts?.dates || [],
        datasets: [
            {
                label: 'Accuracy %',
                data: charts?.accuracyTrend || [],
                borderColor: '#00f5ff',
                backgroundColor: 'rgba(0, 245, 255, 0.08)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#ff4d6d',
                pointRadius: 5,
            },
        ],
    };

    const repsChartData = {
        labels: charts?.dates || [],
        datasets: [
            {
                label: 'Reps',
                data: charts?.repsTrend || [],
                borderColor: '#a855f7',
                backgroundColor: 'rgba(168, 85, 247, 0.08)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#f59e0b',
                pointRadius: 5,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { labels: { color: '#e2e8f0' } },
            tooltip: { backgroundColor: '#1e293b', titleColor: '#00f5ff', bodyColor: '#e2e8f0' },
        },
        scales: {
            x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        },
    };

    if (loading) {
        return (
            <div className="page-shell">
                <Navbar />
                <div className="loading-screen"><div className="pulse-loader" /><p>Loading your stats…</p></div>
            </div>
        );
    }

    return (
        <div className="page-shell">
            <Navbar />
            <main className="dashboard">
                {/* Header */}
                <div className="dashboard-header">
                    <div>
                        <h1>Welcome back, {user.name?.split(' ')[0]} 👋</h1>
                        <p className="subtitle">Here's your fitness summary</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => navigate('/workout')}>
                        🏃 Start Workout
                    </button>
                </div>

                {/* Motivational Quote */}
                {quote && (
                    <div className="quote-card">
                        <p className="quote-text">"{quote.quote}"</p>
                        <p className="quote-author">— {quote.author}</p>
                    </div>
                )}

                {/* Stat Cards */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">🔥</div>
                        <div className="stat-value">{summary?.consistencyStreak ?? 0}</div>
                        <div className="stat-label">Day Streak</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">🎯</div>
                        <div className="stat-value">{summary?.averageAccuracy ?? 0}%</div>
                        <div className="stat-label">Avg Accuracy</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">🏆</div>
                        <div className="stat-value">{summary?.bestSessionScore ?? 0}%</div>
                        <div className="stat-label">Best Score</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">💪</div>
                        <div className="stat-value">{summary?.totalWorkoutsCompleted ?? 0}</div>
                        <div className="stat-label">Total Workouts</div>
                    </div>
                </div>

                {/* Charts */}
                {charts?.dates?.length > 0 ? (
                    <div className="charts-grid">
                        <div className="chart-card">
                            <h3>📈 Accuracy Trend</h3>
                            <Line data={accuracyChartData} options={chartOptions} />
                        </div>
                        <div className="chart-card">
                            <h3>💪 Reps Trend</h3>
                            <Line data={repsChartData} options={chartOptions} />
                        </div>
                    </div>
                ) : (
                    <div className="empty-charts">
                        <p>📊 No workout data yet. Complete your first session to see your progress charts!</p>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="quick-actions">
                    <button className="quick-btn" onClick={() => navigate('/workout')}>🏋️ Start Workout</button>
                    <button className="quick-btn" onClick={() => navigate('/nutrition')}>🥗 View Nutrition</button>
                </div>
            </main>
        </div>
    );
}
