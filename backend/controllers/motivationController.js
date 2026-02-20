const quotes = [
    { quote: "Every rep is a step closer to the best version of you.", author: "Adaptive Fitness AI" },
    { quote: "Pain is temporary. Pride is forever.", author: "Unknown" },
    { quote: "The only bad workout is the one that didn't happen.", author: "Unknown" },
    { quote: "Don't count the days. Make the days count.", author: "Muhammad Ali" },
    { quote: "Sweat is just fat crying.", author: "Unknown" },
    { quote: "Your body can stand almost anything. It's your mind you have to convince.", author: "Unknown" },
    { quote: "Strength doesn't come from what you can do. It comes from overcoming what you thought you couldn't.", author: "Rikki Rogers" },
    { quote: "The hardest lift is lifting your butt off the couch.", author: "Unknown" },
    { quote: "Fitness is not about being better than someone else. It's about being better than you used to be.", author: "Unknown" },
    { quote: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn" },
    { quote: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
    { quote: "Results happen over time, not overnight. Work hard, stay consistent, and be patient.", author: "Unknown" },
    { quote: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery" },
    { quote: "Once you see results, it becomes an addiction.", author: "Unknown" },
    { quote: "Push yourself because no one else is going to do it for you.", author: "Unknown" },
    { quote: "Success is usually found in those who don't know the meaning of failure.", author: "Unknown" },
    { quote: "Champions keep playing until they get it right.", author: "Billie Jean King" },
    { quote: "It never gets easier. You just get stronger.", author: "Unknown" },
    { quote: "Train insane or remain the same.", author: "Unknown" },
    { quote: "A one-hour workout is 4% of your day. No excuses.", author: "Unknown" },
];

// ─── GET RANDOM MOTIVATION ───────────────────────────────────
// GET /api/motivation
exports.getMotivation = (req, res) => {
    const random = quotes[Math.floor(Math.random() * quotes.length)];
    res.json({
        success: true,
        data: random,
    });
};

// GET /api/motivation/all
exports.getAllQuotes = (req, res) => {
    res.json({ success: true, data: quotes });
};
