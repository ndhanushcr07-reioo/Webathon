const User = require('../models/User');
const NutritionLog = require('../models/NutritionLog');

// ─── NUTRITION ENGINE ────────────────────────────────────────
// GET /api/nutrition
exports.getNutrition = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('goal dietType budgetLevel');
        const goal = req.query.goal || user?.goal || 'general_fitness';
        const dietType = req.query.dietType || user?.dietType || 'any';
        const budgetLevel = req.query.budgetLevel || user?.budgetLevel || 'medium';

        const nutritionData = getNutritionPlan(goal, dietType, budgetLevel);

        res.json({
            success: true,
            data: {
                goal,
                dietType,
                budgetLevel,
                ...nutritionData,
            },
        });
    } catch (err) {
        console.error('Nutrition error:', err);
        res.status(500).json({ success: false, message: 'Server error fetching nutrition.' });
    }
};

// ─── NUTRITION LOGGING ───────────────────────────────────────
// POST /api/nutrition/log
exports.logFood = async (req, res) => {
    try {
        const { name, calories, protein, carbs, fats } = req.body;
        const userId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let log = await NutritionLog.findOne({
            userId,
            date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
        });

        if (!log) {
            log = new NutritionLog({ userId, date: today, items: [] });
        }

        log.items.push({ name, calories, protein, carbs, fats });
        await log.save();

        res.status(201).json({ success: true, message: 'Food logged successfully.', data: log });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error logging food.' });
    }
};

// GET /api/nutrition/log/today
exports.getDailyLog = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const log = await NutritionLog.findOne({
            userId: req.user.id,
            date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
        });

        res.json({ success: true, data: log || { items: [] } });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error fetching daily log.' });
    }
};

// GET /api/nutrition/summary
exports.getNutritionSummary = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const log = await NutritionLog.findOne({
            userId: req.user.id,
            date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
        });

        const goalPlan = getNutritionPlan(user.goal, user.dietType, user.budgetLevel);

        // Basic parser for calories (e.g., "1500–1800 kcal" -> 1650)
        const targetCalRaw = goalPlan.macroTargets.calories.split('–')[0].replace(/\D/g, '');
        const targetCalories = parseInt(targetCalRaw) || 2000;

        const summary = (log?.items || []).reduce((acc, item) => {
            acc.calories += item.calories || 0;
            acc.protein += item.protein || 0;
            acc.carbs += item.carbs || 0;
            acc.fats += item.fats || 0;
            return acc;
        }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

        res.json({
            success: true,
            data: {
                current: summary,
                targets: {
                    calories: targetCalories,
                    protein: goalPlan.macroTargets.protein,
                    carbs: goalPlan.macroTargets.carbs,
                    fats: goalPlan.macroTargets.fat
                }
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error fetching nutrition summary.' });
    }
};

// ─── NUTRITION ENGINE LOGIC ──────────────────────────────────
function getNutritionPlan(goal, dietType, budgetLevel) {
    const foodDatabase = {
        // Protein sources
        protein: {
            veg: {
                low: ['Lentils (dal)', 'Chickpeas', 'Paneer (homemade)', 'Eggs', 'Rajma (kidney beans)', 'Tofu'],
                medium: ['Greek yogurt', 'Cottage cheese (paneer)', 'Whey protein', 'Quinoa', 'Soy chunks'],
                high: ['Whey isolate protein', 'Hemp seeds', 'Tempeh', 'Edamame', 'Chia seeds'],
            },
            non_veg: {
                low: ['Eggs', 'Chicken breast', 'Canned tuna', 'Sardines', 'Chicken thighs'],
                medium: ['Salmon', 'Turkey breast', 'Lean ground beef', 'Shrimp', 'Greek yogurt'],
                high: ['Grass-fed beef', 'Wild salmon', 'Protein powder', 'Bison', 'Oysters'],
            },
            vegan: {
                low: ['Lentils', 'Black beans', 'Tofu', 'Tempeh', 'Peas'],
                medium: ['Edamame', 'Seitan', 'Hemp seeds', 'Quinoa', 'Soy protein'],
                high: ['Pea protein powder', 'Spirulina', 'Hemp protein', 'Brown rice protein'],
            },
            keto: {
                low: ['Eggs', 'Canned sardines', 'Chicken thighs', 'Ground beef'],
                medium: ['Salmon', 'Bacon', 'Cheese', 'Pork loin'],
                high: ['Grass-fed beef', 'Wild-caught salmon', 'Brie cheese', 'Prosciutto'],
            },
            any: {
                low: ['Eggs', 'Lentils', 'Chicken breast', 'Chickpeas', 'Tuna'],
                medium: ['Salmon', 'Greek yogurt', 'Paneer', 'Turkey', 'Whey protein'],
                high: ['Protein isolate', 'Grass-fed beef', 'Hemp seeds', 'Edamame'],
            },
        },
        // Carbs
        carbs: {
            low: ['Brown rice', 'Oats', 'Sweet potato', 'Banana', 'Whole wheat bread'],
            medium: ['Quinoa', 'Basmati rice', 'Multigrain bread', 'Barley', 'Buckwheat'],
            high: ['Organic oats', 'Purple sweet potato', 'Amaranth', 'Millet'],
            keto: ['Cauliflower rice', 'Zucchini noodles', 'Berries (small qty)', 'Avocado'],
        },
        // Healthy fats
        fats: {
            low: ['Peanut butter', 'Sunflower seeds', 'Groundnuts', 'Coconut oil'],
            medium: ['Almonds', 'Walnuts', 'Olive oil', 'Flaxseeds', 'Avocado'],
            high: ['Macadamia nuts', 'Extra virgin olive oil', 'MCT oil', 'Ghee (grass-fed)'],
        },
    };

    // Goal-based macro targets
    const macroTargets = {
        weight_loss: { calories: '1500–1800 kcal', protein: '40%', carbs: '30%', fat: '30%' },
        muscle_gain: { calories: '2500–3000 kcal', protein: '35%', carbs: '45%', fat: '20%' },
        endurance: { calories: '2000–2500 kcal', protein: '25%', carbs: '55%', fat: '20%' },
        flexibility: { calories: '1800–2200 kcal', protein: '30%', carbs: '45%', fat: '25%' },
        general_fitness: { calories: '2000–2200 kcal', protein: '30%', carbs: '45%', fat: '25%' },
    };

    // Meal timing
    const mealTiming = {
        weight_loss: 'Eat in a 8-hour window (intermittent fasting). Largest meal post-workout.',
        muscle_gain: 'Eat every 3-4 hours. Protein within 30 min post-workout.',
        endurance: 'Carb-load the night before long sessions. Electrolytes during workout.',
        general_fitness: '3 balanced meals + 2 snacks. Protein with every meal.',
        flexibility: '5–6 small meals. Anti-inflammatory foods like turmeric and ginger.',
    };

    const safeDietType = ['veg', 'non_veg', 'vegan', 'keto', 'any'].includes(dietType) ? dietType : 'any';
    const safeBudget = ['low', 'medium', 'high'].includes(budgetLevel) ? budgetLevel : 'medium';
    const safeGoal = macroTargets[goal] ? goal : 'general_fitness';

    const carbKey = safeDietType === 'keto' ? 'keto' : safeBudget;

    return {
        macroTargets: macroTargets[safeGoal],
        mealTiming: mealTiming[safeGoal],
        recommendedFoods: {
            proteins: foodDatabase.protein[safeDietType]?.[safeBudget] || foodDatabase.protein.any[safeBudget],
            carbs: foodDatabase.carbs[carbKey] || foodDatabase.carbs[safeBudget],
            fats: foodDatabase.fats[safeBudget],
        },
        hydration: 'Drink 2.5–3.5 litres of water daily. Add electrolytes on workout days.',
        supplements: budgetLevel === 'high'
            ? ['Creatine monohydrate', 'Vitamin D3', 'Omega-3 fish oil', 'Magnesium glycinate']
            : budgetLevel === 'medium'
                ? ['Creatine monohydrate', 'Multivitamin', 'Whey protein']
                : ['Multivitamin', 'Vitamin D (sunlight)', 'Budget whey protein'],
    };
}
