import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const goals = [
    { value: 'weight_loss', label: '🔥 Weight Loss', desc: 'Burn fat and get lean' },
    { value: 'muscle_gain', label: '💪 Muscle Gain', desc: 'Build strength and size' },
    { value: 'endurance', label: '🏃 Endurance', desc: 'Improve stamina and cardio' },
    { value: 'flexibility', label: '🧘 Flexibility', desc: 'Stretch and recover' },
    { value: 'general_fitness', label: '⚡ General Fitness', desc: 'Stay fit and healthy' },
];

const dietTypes = [
    { value: 'veg', label: '🥗 Vegetarian' },
    { value: 'non_veg', label: '🍗 Non-Vegetarian' },
    { value: 'vegan', label: '🌱 Vegan' },
    { value: 'keto', label: '🥑 Keto' },
    { value: 'any', label: '🍽 Any Diet' },
];

const budgets = [
    { value: 'low', label: '💰 Budget-Friendly', desc: 'Affordable options' },
    { value: 'medium', label: '💳 Moderate', desc: 'Balanced options' },
    { value: 'high', label: '💎 Premium', desc: 'Top quality foods' },
];

export default function ProfileSetupPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ goal: '', dietType: '', budgetLevel: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.goal || !form.dietType || !form.budgetLevel) {
            return setError('Please complete all selections.');
        }
        setLoading(true);
        try {
            const { data } = await api.put('/auth/profile', form);
            localStorage.setItem('user', JSON.stringify(data.data));
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save profile.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="setup-container">
            <div className="setup-card">
                <div className="setup-header">
                    <h1>🎯 Set Up Your Profile</h1>
                    <p>Help us personalise your fitness journey</p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    {/* Goal Selection */}
                    <div className="setup-section">
                        <h3>What's your primary goal?</h3>
                        <div className="option-grid">
                            {goals.map((g) => (
                                <button
                                    key={g.value}
                                    type="button"
                                    className={`option-card ${form.goal === g.value ? 'selected' : ''}`}
                                    onClick={() => setForm({ ...form, goal: g.value })}
                                >
                                    <span className="option-label">{g.label}</span>
                                    <span className="option-desc">{g.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Diet Type */}
                    <div className="setup-section">
                        <h3>Your diet preference?</h3>
                        <div className="option-row">
                            {dietTypes.map((d) => (
                                <button
                                    key={d.value}
                                    type="button"
                                    className={`option-pill ${form.dietType === d.value ? 'selected' : ''}`}
                                    onClick={() => setForm({ ...form, dietType: d.value })}
                                >
                                    {d.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Budget Level */}
                    <div className="setup-section">
                        <h3>Your nutrition budget?</h3>
                        <div className="option-grid three-col">
                            {budgets.map((b) => (
                                <button
                                    key={b.value}
                                    type="button"
                                    className={`option-card ${form.budgetLevel === b.value ? 'selected' : ''}`}
                                    onClick={() => setForm({ ...form, budgetLevel: b.value })}
                                >
                                    <span className="option-label">{b.label}</span>
                                    <span className="option-desc">{b.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? <span className="spinner" /> : 'Start My Journey 🚀'}
                    </button>
                </form>
            </div>
        </div>
    );
}
