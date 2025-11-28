// ========== STORAGE HELPERS ==========
const Storage = {
    get(key, defaultValue = []) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    },
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            return false;
        }
    },
    remove(key) {
        localStorage.removeItem(key);
    }
};

// ========== ESTADO GLOBAL ==========
let currentUser = null;

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    loadDashboard();
    initForms();
    loadUserProfile();
});

// ========== NAVEGAÇÃO ==========
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.getAttribute('data-page');
            switchPage(page);
        });
    });

    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = btn.getAttribute('data-action');
            handleQuickAction(action);
        });
    });

    document.querySelectorAll('.summary-card').forEach(card => {
        card.addEventListener('click', () => {
            const module = card.getAttribute('data-module');
            switchPage(module);
        });
    });
}

function switchPage(page) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-page="${page}"]`).classList.add('active');

    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });
    document.getElementById(page).classList.add('active');

    loadPageData(page);
}

function handleQuickAction(action) {
    switch (action) {
        case 'add-transaction':
            switchPage('finance');
            break;
        case 'log-workout':
            switchPage('fitness');
            break;
        case 'check-mood':
            switchPage('mental');
            break;
        case 'meditate':
            switchPage('mental');
            break;
    }
}

// ========== CARREGAMENTO DE DADOS ==========
function loadPageData(page) {
    switch (page) {
        case 'home':
            loadDashboard();
            break;
        case 'finance':
            loadTransactions();
            loadGoals();
            calculateBalance();
            break;
        case 'fitness':
            loadWorkouts();
            loadCalories();
            break;
        case 'mental':
            loadMoods();
            loadJournal();
            loadHabits();
            loadMeditations();
            break;
        case 'profile':
            loadUserProfile();
            loadAchievements();
            loadStats();
            break;
    }
}

function loadDashboard() {
    const transactions = Storage.get('transactions', []);
    const workouts = Storage.get('workouts', []);
    const moods = Storage.get('moods', []);
    const meditations = Storage.get('meditations', []);
    const profile = Storage.get('userProfile', null);

    const today = new Date().toISOString().split('T')[0];
    
    const todayTransactions = transactions.filter(t => t.createdAt?.split('T')[0] === today);
    const todayWorkouts = workouts.filter(w => w.completedAt?.split('T')[0] === today);
    const todayMoods = moods.filter(m => m.createdAt?.split('T')[0] === today);
    const todayMeditations = meditations.filter(m => m.completedAt?.split('T')[0] === today);

    document.getElementById('financeSummary').textContent = 
        `${todayTransactions.length} transações hoje`;
    document.getElementById('fitnessSummary').textContent = 
        `${todayWorkouts.length} treinos hoje`;
    document.getElementById('mentalSummary').textContent = 
        `${todayMoods.length + todayMeditations.length} atividades hoje`;

    if (profile) {
        updatePetDisplay(profile);
    }

    updateMotivationalMessage();
}

// ========== PERFIL E PET ==========
function loadUserProfile() {
    let profile = Storage.get('userProfile', null);
    
    if (!profile) {
        profile = {
            id: '1',
            petType: 'cat',
            petName: 'Barbaura',
            level: 1,
            xp: 0,
            totalXP: 0,
            achievements: [],
            customizations: [],
            createdAt: new Date().toISOString()
        };
        Storage.set('userProfile', profile);
    }
    
    currentUser = profile;
    updatePetDisplay(profile);
    updateProfileDisplay(profile);
}

function updatePetDisplay(profile) {
    const petImage = profile.petType === 'panda' 
        ? 'https://images.unsplash.com/photo-1525382455947-f319bc05fb35?w=200&h=200&fit=crop&crop=center'
        : 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&h=200&fit=crop&crop=center';
    const xpForNextLevel = profile.level * 100;
    const xpPercentage = (profile.xp / xpForNextLevel) * 100;

    const petAvatarEl = document.getElementById('petAvatar');
    if (petAvatarEl) {
        petAvatarEl.innerHTML = `<img src="${petImage}" alt="Pet" class="pet-avatar-img">`;
    }
    document.getElementById('petName').textContent = profile.petName || 'Barbaura';
    document.getElementById('petLevel').textContent = profile.level;
    document.getElementById('currentXP').textContent = profile.xp;
    document.getElementById('nextLevelXP').textContent = xpForNextLevel;
    document.getElementById('xpFill').style.width = `${xpPercentage}%`;

    const profilePetAvatar = document.getElementById('profilePetAvatar');
    if (profilePetAvatar) {
        profilePetAvatar.innerHTML = `<img src="${petImage}" alt="Pet" class="pet-avatar-large-img">`;
        document.getElementById('profilePetName').textContent = profile.petName || 'Barbaura';
        document.getElementById('profilePetLevel').textContent = profile.level;
        document.getElementById('profileTotalXP').textContent = profile.totalXP || 0;
    }
}

function updateProfileDisplay(profile) {
    if (document.getElementById('petTypeSelect')) {
        document.getElementById('petTypeSelect').value = profile.petType;
        document.getElementById('petTypeSelect').addEventListener('change', async (e) => {
            profile.petType = e.target.value;
            Storage.set('userProfile', profile);
            updatePetDisplay(profile);
        });
    }
}

function addXP(amount, action) {
    let profile = Storage.get('userProfile', null);
    if (!profile) {
        profile = {
            id: '1',
            petType: 'cat',
            petName: 'Barbaura',
            level: 1,
            xp: 0,
            totalXP: 0,
            achievements: [],
            customizations: []
        };
    }

    profile.xp += amount;
    profile.totalXP += amount;

    const xpForNextLevel = profile.level * 100;
    if (profile.xp >= xpForNextLevel) {
        profile.xp -= xpForNextLevel;
        profile.level += 1;
    }

    Storage.set('userProfile', profile);
    updatePetDisplay(profile);
    currentUser = profile;
    return profile;
}

// ========== MÓDULO FINANCEIRO ==========
function initForms() {
    const transactionForm = document.getElementById('transactionForm');
    if (transactionForm) {
        transactionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const transactions = Storage.get('transactions', []);
            const transaction = {
                id: Date.now().toString(),
                type: document.getElementById('transactionType').value,
                amount: parseFloat(document.getElementById('transactionAmount').value),
                category: document.getElementById('transactionCategory').value,
                description: document.getElementById('transactionDescription').value,
                createdAt: new Date().toISOString()
            };
            transactions.push(transaction);
            Storage.set('transactions', transactions);
            transactionForm.reset();
            loadTransactions();
            calculateBalance();
            addXP(20, 'transaction');
            showNotification('Transação adicionada! +20 XP');
        });
    }

    const goalForm = document.getElementById('goalForm');
    if (goalForm) {
        goalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const goals = Storage.get('finance-goals', []);
            const goal = {
                id: Date.now().toString(),
                name: document.getElementById('goalName').value,
                targetAmount: parseFloat(document.getElementById('goalAmount').value),
                currentAmount: 0,
                createdAt: new Date().toISOString()
            };
            goals.push(goal);
            Storage.set('finance-goals', goals);
            goalForm.reset();
            loadGoals();
            showNotification('Meta criada!');
        });
    }

    const workoutForm = document.getElementById('workoutForm');
    if (workoutForm) {
        workoutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const workouts = Storage.get('workouts', []);
            const workout = {
                id: Date.now().toString(),
                type: document.getElementById('workoutType').value,
                duration: parseInt(document.getElementById('workoutDuration').value),
                intensity: document.getElementById('workoutIntensity').value,
                completedAt: new Date().toISOString()
            };
            workouts.push(workout);
            Storage.set('workouts', workouts);
            workoutForm.reset();
            loadWorkouts();
            addXP(50, 'workout');
            showNotification('Treino registrado! +50 XP');
        });
    }

    const caloriesForm = document.getElementById('caloriesForm');
    if (caloriesForm) {
        caloriesForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const calories = Storage.get('calories', []);
            const entry = {
                id: Date.now().toString(),
                food: document.getElementById('foodName').value,
                calories: parseInt(document.getElementById('foodCalories').value),
                mealType: document.getElementById('mealType').value,
                createdAt: new Date().toISOString()
            };
            calories.push(entry);
            Storage.set('calories', calories);
            caloriesForm.reset();
            loadCalories();
            addXP(10, 'meal');
            showNotification('Refeição registrada! +10 XP');
        });
    }

    const moodForm = document.getElementById('moodForm');
    if (moodForm) {
        moodForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const moods = Storage.get('moods', []);
            const mood = {
                id: Date.now().toString(),
                emoji: document.getElementById('moodEmoji').value,
                rating: parseInt(document.getElementById('moodRating').value),
                notes: document.getElementById('moodNotes').value,
                createdAt: new Date().toISOString()
            };
            moods.push(mood);
            Storage.set('moods', moods);
            moodForm.reset();
            loadMoods();
            addXP(15, 'mood');
            showNotification('Humor registrado! +15 XP');
        });
    }

    const journalForm = document.getElementById('journalForm');
    if (journalForm) {
        journalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const journal = Storage.get('journal', []);
            const entry = {
                id: Date.now().toString(),
                content: document.getElementById('journalEntry').value,
                createdAt: new Date().toISOString()
            };
            journal.push(entry);
            Storage.set('journal', journal);
            journalForm.reset();
            loadJournal();
            showNotification('Entrada do diário salva!');
        });
    }

    const habitForm = document.getElementById('habitForm');
    if (habitForm) {
        habitForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const habits = Storage.get('habits', []);
            const habit = {
                id: Date.now().toString(),
                name: document.getElementById('habitName').value,
                completions: [],
                createdAt: new Date().toISOString()
            };
            habits.push(habit);
            Storage.set('habits', habits);
            habitForm.reset();
            loadHabits();
            showNotification('Hábito criado!');
        });
    }

    document.querySelectorAll('.meditation-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const duration = parseInt(btn.getAttribute('data-duration'));
            startMeditation(duration);
        });
    });
}

function loadTransactions() {
    const transactions = Storage.get('transactions', []);
    const list = document.getElementById('transactionsList');
    list.innerHTML = '';

    transactions.slice(-10).reverse().forEach(transaction => {
        const item = document.createElement('div');
        item.className = 'list-item';
        const amountClass = transaction.type === 'income' ? 'income' : 'expense';
        const amountSign = transaction.type === 'income' ? '+' : '-';
        const categoryImage = getCategoryImage(transaction.category);
        item.innerHTML = `
            <img src="${categoryImage}" alt="${transaction.category}" class="list-item-icon" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover; margin-right: 1rem;">
            <div class="list-item-content">
                <div class="list-item-title">${transaction.description}</div>
                <div class="list-item-subtitle">${transaction.category} • ${formatDate(transaction.createdAt)}</div>
            </div>
            <div class="list-item-amount ${amountClass}">${amountSign} R$ ${transaction.amount.toFixed(2)}</div>
            <button class="delete-btn" onclick="deleteTransaction('${transaction.id}')" title="Deletar">×</button>
        `;
        list.appendChild(item);
    });
}

function deleteTransaction(id) {
    const transactions = Storage.get('transactions', []);
    const filtered = transactions.filter(t => t.id !== id);
    Storage.set('transactions', filtered);
    loadTransactions();
    calculateBalance();
}

function calculateBalance() {
    const transactions = Storage.get('transactions', []);
    let balance = 0;
    transactions.forEach(t => {
        if (t.type === 'income') balance += t.amount;
        else balance -= t.amount;
    });
    document.getElementById('currentBalance').textContent = 
        `R$ ${balance.toFixed(2)}`;
}

function loadGoals() {
    const goals = Storage.get('finance-goals', []);
    const list = document.getElementById('goalsList');
    list.innerHTML = '';

    goals.forEach(goal => {
        const item = document.createElement('div');
        item.className = 'goal-item';
        const progress = (goal.currentAmount / goal.targetAmount) * 100;
        item.innerHTML = `
            <div class="goal-header">
                <span class="goal-name">${goal.name}</span>
                <span class="goal-amount">R$ ${goal.currentAmount.toFixed(2)} / R$ ${goal.targetAmount.toFixed(2)}</span>
            </div>
            <div class="goal-progress">
                <div class="goal-progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
            </div>
        `;
        list.appendChild(item);
    });
}

// ========== MÓDULO FÍSICO ==========
function loadWorkouts() {
    const workouts = Storage.get('workouts', []);
    const list = document.getElementById('workoutsList');
    list.innerHTML = '';

    workouts.slice(-10).reverse().forEach(workout => {
        const item = document.createElement('div');
        item.className = 'list-item';
        const workoutImage = getWorkoutImage(workout.type);
        item.innerHTML = `
            <img src="${workoutImage}" alt="${workout.type}" class="list-item-icon" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover; margin-right: 1rem;">
            <div class="list-item-content">
                <div class="list-item-title">${getWorkoutTypeName(workout.type)}</div>
                <div class="list-item-subtitle">${workout.duration} min • ${workout.intensity} • ${formatDate(workout.completedAt)}</div>
            </div>
        `;
        list.appendChild(item);
    });
}

function getWorkoutTypeName(type) {
    const names = {
        'hiit': 'HIIT',
        'forca': 'Força',
        'yoga': 'Yoga',
        'pilates': 'Pilates',
        'cardio': 'Cardio',
        'alongamento': 'Alongamento'
    };
    return names[type] || type;
}

function loadCalories() {
    const calories = Storage.get('calories', []);
    const list = document.getElementById('caloriesList');
    list.innerHTML = '';

    const today = new Date().toISOString().split('T')[0];
    const todayEntries = calories.filter(c => c.createdAt?.split('T')[0] === today);
    let totalCalories = 0;

    todayEntries.forEach(entry => {
        totalCalories += entry.calories;
        const item = document.createElement('div');
        item.className = 'list-item';
        const mealImage = getMealImage(entry.mealType);
        item.innerHTML = `
            <img src="${mealImage}" alt="${entry.mealType}" class="list-item-icon" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover; margin-right: 1rem;">
            <div class="list-item-content">
                <div class="list-item-title">${entry.food}</div>
                <div class="list-item-subtitle">${getMealTypeName(entry.mealType)}</div>
            </div>
            <div class="list-item-amount">${entry.calories} kcal</div>
        `;
        list.appendChild(item);
    });

    if (todayEntries.length > 0) {
        const totalItem = document.createElement('div');
        totalItem.className = 'list-item';
        totalItem.style.background = 'var(--purple-light)';
        totalItem.innerHTML = `
            <div class="list-item-content">
                <div class="list-item-title" style="font-weight: 700;">Total do Dia</div>
            </div>
            <div class="list-item-amount" style="font-size: 1.3rem;">${totalCalories} kcal</div>
        `;
        list.insertBefore(totalItem, list.firstChild);
    }
}

function getMealTypeName(type) {
    const names = {
        'cafe': 'Café da Manhã',
        'almoco': 'Almoço',
        'lanche': 'Lanche',
        'jantar': 'Jantar'
    };
    return names[type] || type;
}

// ========== MÓDULO MENTAL ==========
function loadMoods() {
    const moods = Storage.get('moods', []);
    const list = document.getElementById('moodsList');
    list.innerHTML = '';

    moods.slice(-10).reverse().forEach(mood => {
        const item = document.createElement('div');
        item.className = 'list-item';
        const moodImage = getMoodImage(mood.emoji);
        item.innerHTML = `
            <img src="${moodImage}" alt="Humor" class="list-item-icon" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover; margin-right: 1rem;">
            <div class="list-item-content">
                <div class="list-item-title">${mood.emoji} Nota: ${mood.rating}/10</div>
                <div class="list-item-subtitle">${mood.notes || 'Sem observações'} • ${formatDate(mood.createdAt)}</div>
            </div>
        `;
        list.appendChild(item);
    });
}

function loadJournal() {
    const journal = Storage.get('journal', []);
    const list = document.getElementById('journalList');
    list.innerHTML = '';

    journal.slice(-10).reverse().forEach(entry => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
            <div class="list-item-content">
                <div class="list-item-title">${formatDate(entry.createdAt)}</div>
                <div class="list-item-subtitle" style="white-space: pre-wrap;">${entry.content}</div>
            </div>
        `;
        list.appendChild(item);
    });
}

function loadHabits() {
    const habits = Storage.get('habits', []);
    const list = document.getElementById('habitsList');
    list.innerHTML = '';

    habits.forEach(habit => {
        const today = new Date().toISOString().split('T')[0];
        const completedToday = habit.completions?.some(c => c.date === today);
        const streak = calculateStreak(habit.completions || []);

        const item = document.createElement('div');
        item.className = 'habit-item';
        item.innerHTML = `
            <div>
                <span class="habit-name">${habit.name}</span>
                ${streak > 0 ? `<span class="habit-streak">${streak} dias seguidos</span>` : ''}
            </div>
            <button class="complete-habit-btn ${completedToday ? 'completed' : ''}" 
                    onclick="completeHabit('${habit.id}')" 
                    ${completedToday ? 'disabled' : ''}>
                ${completedToday ? 'Concluído' : 'Marcar'}
            </button>
        `;
        list.appendChild(item);
    });
}

function calculateStreak(completions) {
    if (!completions || completions.length === 0) return 0;
    
    const sorted = completions.sort((a, b) => new Date(b.date) - new Date(a.date));
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (let completion of sorted) {
        const completionDate = new Date(completion.date);
        const diffDays = Math.floor((currentDate - completionDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === streak) {
            streak++;
        } else {
            break;
        }
    }

    return streak;
}

function completeHabit(id) {
    const habits = Storage.get('habits', []);
    const habit = habits.find(h => h.id === id);
    if (habit) {
        if (!habit.completions) habit.completions = [];
        const today = new Date().toISOString().split('T')[0];
        habit.completions.push({
            date: today,
            completedAt: new Date().toISOString()
        });
        Storage.set('habits', habits);
        loadHabits();
        addXP(10, 'habit');
        showNotification('Hábito completado! +10 XP');
    }
}

function startMeditation(duration) {
    if (confirm(`Iniciar meditação de ${duration} minutos?`)) {
        const meditations = Storage.get('meditations', []);
        const meditation = {
            id: Date.now().toString(),
            duration: duration,
            type: 'guided',
            completedAt: new Date().toISOString()
        };
        meditations.push(meditation);
        Storage.set('meditations', meditations);
        addXP(30, 'meditation');
        showNotification(`Meditação de ${duration} min iniciada! +30 XP`);
        loadMeditations();
    }
}

function loadMeditations() {
    const meditations = Storage.get('meditations', []);
    const list = document.getElementById('meditationsList');
    list.innerHTML = '';

    meditations.slice(-5).reverse().forEach(meditation => {
        const item = document.createElement('div');
        item.className = 'list-item';
        const meditationImage = 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=40&h=40&fit=crop';
        item.innerHTML = `
            <img src="${meditationImage}" alt="Meditação" class="list-item-icon" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover; margin-right: 1rem;">
            <div class="list-item-content">
                <div class="list-item-title">Meditação de ${meditation.duration} min</div>
                <div class="list-item-subtitle">${formatDate(meditation.completedAt)}</div>
            </div>
        `;
        list.appendChild(item);
    });
}

// ========== PERFIL ==========
function loadAchievements() {
    const achievements = Storage.get('achievements', []);
    const list = document.getElementById('achievementsList');
    list.innerHTML = '';

    if (achievements.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: var(--purple-secondary);">Nenhuma conquista desbloqueada ainda. Continue progredindo!</p>';
    } else {
        achievements.forEach(achievement => {
            const item = document.createElement('div');
            item.className = 'achievement-item';
            const achievementImage = achievement.icon || 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=60&h=60&fit=crop';
            item.innerHTML = `
                <img src="${achievementImage}" alt="Conquista" class="achievement-icon">
                <div class="achievement-content">
                    <h4>${achievement.name}</h4>
                    <p>${achievement.description}</p>
                </div>
            `;
            list.appendChild(item);
        });
    }
}

function loadStats() {
    const transactions = Storage.get('transactions', []);
    const workouts = Storage.get('workouts', []);
    const moods = Storage.get('moods', []);
    const meditations = Storage.get('meditations', []);

    const list = document.getElementById('statsList');
    list.innerHTML = `
        <div class="stat-item">
            <div class="stat-value">${transactions.length}</div>
            <div class="stat-label">Transações</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${workouts.length}</div>
            <div class="stat-label">Treinos</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${moods.length}</div>
            <div class="stat-label">Check-ins</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${meditations.length}</div>
            <div class="stat-label">Meditações</div>
        </div>
    `;
}

// ========== UTILITÁRIOS ==========
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function updateMotivationalMessage() {
    const messages = [
        'Miau! Vamos começar sua jornada de autocuidado hoje?',
        'Cada pequeno passo conta! Continue assim!',
        'Você está fazendo um trabalho incrível!',
        'Lembre-se: autocuidado não é egoísmo, é necessidade!',
        'Seu futuro eu agradece pelas escolhas de hoje!'
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    document.getElementById('motivationalMessage').textContent = randomMessage;
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--purple-primary);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Adicionar animações CSS para notificações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Funções helper para imagens
function getCategoryImage(category) {
    const images = {
        'alimentacao': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=50&h=50&fit=crop',
        'transporte': 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=50&h=50&fit=crop',
        'saude': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=50&h=50&fit=crop',
        'lazer': 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=50&h=50&fit=crop',
        'outros': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=50&h=50&fit=crop'
    };
    return images[category] || images.outros;
}

function getWorkoutImage(type) {
    const images = {
        'hiit': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=50&h=50&fit=crop',
        'forca': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=50&h=50&fit=crop',
        'yoga': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=50&h=50&fit=crop',
        'pilates': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=50&h=50&fit=crop',
        'cardio': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=50&h=50&fit=crop',
        'alongamento': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=50&h=50&fit=crop'
    };
    return images[type] || images.hiit;
}

function getMealImage(type) {
    const images = {
        'cafe': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=50&h=50&fit=crop',
        'almoco': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=50&h=50&fit=crop',
        'lanche': 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=50&h=50&fit=crop',
        'jantar': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=50&h=50&fit=crop'
    };
    return images[type] || images.almoco;
}

function getMoodImage(emoji) {
    const moodMap = {
        '😊': 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=50&h=50&fit=crop',
        '😌': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=50&h=50&fit=crop',
        '😢': 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=50&h=50&fit=crop',
        '😰': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=50&h=50&fit=crop',
        '😴': 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=50&h=50&fit=crop',
        '😡': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=50&h=50&fit=crop',
        '🤗': 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=50&h=50&fit=crop',
        '😎': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop'
    };
    return moodMap[emoji] || moodMap['😌'];
}
