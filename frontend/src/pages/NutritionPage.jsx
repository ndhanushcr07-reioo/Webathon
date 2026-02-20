import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';

export default function NutritionPage() {
    const [data, setData] = useState(null);
    const [dailyLog, setDailyLog] = useState({ items: [] });
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [manualFood, setManualFood] = useState({ name: '', calories: '', protein: '', carbs: '', fats: '' });
    const [logging, setLogging] = useState(false);

    const fetchAllData = useCallback(async () => {
        try {
            const [nutritionRes, logRes, summaryRes] = await Promise.all([
                api.get('/nutrition'),
                api.get('/nutrition/log/today'),
                api.get('/nutrition/summary')
            ]);
            setData(nutritionRes.data.data);
            setDailyLog(logRes.data.data);
            setSummary(summaryRes.data.data);
        } catch (err) {
            setError('Failed to load nutrition information.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const handleLogFood = async (e) => {
        e.preventDefault();
        setLogging(true);
        try {
            await api.post('/nutrition/log', {
                ...manualFood,
                calories: Number(manualFood.calories),
                protein: Number(manualFood.protein),
                carbs: Number(manualFood.carbs),
                fats: Number(manualFood.fats)
            });
            setManualFood({ name: '', calories: '', protein: '', carbs: '', fats: '' });
            await fetchAllData();
        } catch (err) {
            setError('Error logging food.');
        } finally {
            setLogging(false);
        }
    };

    const goalLabels = {
        weight_loss: '🔥 Weight Loss',
        muscle_gain: '💪 Muscle Gain',
        endurance: '🏃 Endurance',
        flexibility: '🧘 Flexibility',
        general_fitness: '⚡ General Fitness',
    };

    if (loading) return (
        <div className="page-shell">
            <Navbar />
            <div className="loading-screen"><div className="pulse-loader" /><p>Analysing your nutrition progress…</p></div>
        </div>
    );

    const getProgress = (current, target) => {
        const perc = Math.round((current / target) * 100) || 0;
        return Math.min(100, perc);
    };

    return (
        <div className="page-shell">
            <Navbar />
            <main className="nutrition-page">
                <div className="page-header">
                    <h1>🥗 Nutrition & Progress</h1>
                    <p>Personalised for <strong>{goalLabels[data?.goal] || data?.goal}</strong></p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <div className="nutrition-layout">
                    <div className="nutrition-main-col">
                        {/* Progress Analysis */}
                        {summary && (
                            <div className="nutrition-card progress-analysis">
                                <h2>📈 Daily Progress Analysis</h2>
                                <div className="progress-blocks">
                                    <div className="progress-block">
                                        <div className="pb-header">
                                            <span>🔥 Calories</span>
                                            <span>{summary.current.calories} / {summary.targets.calories} kcal</span>
                                        </div>
                                        <div className="pb-bar"><div className="pb-fill" style={{ width: `${getProgress(summary.current.calories, summary.targets.calories)}%`, background: 'var(--accent-cyan)' }} /></div>
                                    </div>
                                    <div className="progress-subs">
                                        <div className="ps-item">
                                            <span className="ps-label">Muscle (P)</span>
                                            <span className="ps-val">{summary.current.protein}g</span>
                                        </div>
                                        <div className="ps-item">
                                            <span className="ps-label">Energy (C)</span>
                                            <span className="ps-val">{summary.current.carbs}g</span>
                                        </div>
                                        <div className="ps-item">
                                            <span className="ps-label">Health (F)</span>
                                            <span className="ps-val">{summary.current.fats}g</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Daily Cart / Log */}
                        <div className="nutrition-card daily-cart">
                            <h2>🛒 Your Daily Food Cart</h2>
                            {dailyLog?.items?.length === 0 ? (
                                <p className="empty-msg">Your cart is empty. Start adding what you ate today!</p>
                            ) : (
                                <div className="cart-list">
                                    {dailyLog.items.map((item, i) => (
                                        <div key={i} className="cart-item">
                                            <div className="ci-info">
                                                <span className="ci-name">{item.name}</span>
                                                <span className="ci-macros">{item.calories} kcal | P: {item.protein}g C: {item.carbs}g F: {item.fats}g</span>
                                            </div>
                                            <span className="ci-icon">🥗</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Plan Details */}
                        <div className="foods-grid">
                            <div className="food-card">
                                <h3>🥩 Protein Sources</h3>
                                <ul className="food-list">
                                    {data?.recommendedFoods?.proteins?.map((f, i) => <li key={i}>✓ {f}</li>)}
                                </ul>
                            </div>
                            <div className="food-card">
                                <h3>🍚 Carb Sources</h3>
                                <ul className="food-list">
                                    {data?.recommendedFoods?.carbs?.map((f, i) => <li key={i}>✓ {f}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="nutrition-side-col">
                        {/* Add Food Form */}
                        <div className="nutrition-card add-food-card">
                            <h2>➕ Add to Cart</h2>
                            <form className="add-food-form" onSubmit={handleLogFood}>
                                <input
                                    type="text" placeholder="Food Name" required
                                    value={manualFood.name} onChange={e => setManualFood({ ...manualFood, name: e.target.value })}
                                />
                                <div className="form-row">
                                    <input
                                        type="number" placeholder="Kcal" required
                                        value={manualFood.calories} onChange={e => setManualFood({ ...manualFood, calories: e.target.value })}
                                    />
                                    <input
                                        type="number" placeholder="Prot (g)" required
                                        value={manualFood.protein} onChange={e => setManualFood({ ...manualFood, protein: e.target.value })}
                                    />
                                </div>
                                <div className="form-row">
                                    <input
                                        type="number" placeholder="Carb (g)" required
                                        value={manualFood.carbs} onChange={e => setManualFood({ ...manualFood, carbs: e.target.value })}
                                    />
                                    <input
                                        type="number" placeholder="Fat (g)" required
                                        value={manualFood.fats} onChange={e => setManualFood({ ...manualFood, fats: e.target.value })}
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary btn-full" disabled={logging}>
                                    {logging ? 'Adding...' : 'Add Food Item'}
                                </button>
                            </form>
                        </div>

                        <div className="nutrition-card hydration-card">
                            <h2>💧 Hydration</h2>
                            <p>{data?.hydration}</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
