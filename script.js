const quizApp = {
    currentUser: null,
    currentQuestions: [],
    currentIdx: 0,
    userAnswers: [],
    wrongPool: [],
    isRetry: false,
    currentGenreName: "全問",

    // 画面切り替え
    showView: function(viewId) {
        const views = ['view-auth', 'view-dashboard', 'view-genres', 'view-quiz', 'view-result', 'view-final'];
        views.forEach(id => document.getElementById(id).classList.add('hidden'));
        document.getElementById(viewId).classList.remove('hidden');
    },

    // ログイン・登録処理
    handleAuth: function(mode) {
        const user = document.getElementById('auth-user').value;
        const pass = document.getElementById('auth-pass').value;
        const msg = document.getElementById('auth-msg');

        if(!user || !pass) { msg.innerText = "入力してください"; return; }

        let users = JSON.parse(localStorage.getItem('coffee_users') || '{}');

        if(mode === 'register') {
            if(users[user]) { msg.innerText = "既に存在するユーザー名です"; return; }
            users[user] = { password: pass, scores: {} };
            localStorage.setItem('coffee_users', JSON.stringify(users));
            alert("登録完了！ログインしてください");
        } else {
            if(users[user] && users[user].password === pass) {
                this.currentUser = user;
                this.showDashboard();
            } else {
                msg.innerText = "名またはパスワードが違います";
            }
        }
    },

    // ダッシュボード表示
    showDashboard: function() {
        this.showView('view-dashboard');
        document.getElementById('user-display').innerText = this.currentUser;
        
        const users = JSON.parse(localStorage.getItem('coffee_users'));
        const scores = users[this.currentUser].scores;
        const list = document.getElementById('progress-list');
        list.innerHTML = '';

        const genres = [...new Set(quizData.map(q => q.genre)), "全問ランダム"];
        genres.forEach(g => {
            const div = document.createElement('div');
            div.className = "flex justify-between text-sm py-1 border-b border-gray-50";
            const score = scores[g] !== undefined ? scores[g] + "点" : "未挑戦";
            div.innerHTML = `<span>${g}</span><span class="font-bold text-[#6F4E37]">${score}</span>`;
            list.appendChild(div);
        });
    },

    showGenreSelect: function() {
        this.showView('view-genres');
        const genres = [...new Set(quizData.map(q => q.genre))];
        const list = document.getElementById('genre-list');
        list.innerHTML = '';
        genres.forEach(g => {
            const btn = document.createElement('button');
            btn.className = "genre-btn";
            btn.innerText = g;
            btn.onclick = () => { this.currentGenreName = g; this.init(quizData.filter(q => q.genre === g), false); };
            list.appendChild(btn);
        });
    },

    startAll: function() {
        this.currentGenreName = "全問ランダム";
        this.init([...quizData], true);
    },

    init: function(questions, shuffle) {
        this.currentQuestions = questions;
        if(shuffle) {
            for (let i = this.currentQuestions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.currentQuestions[i], this.currentQuestions[j]] = [this.currentQuestions[j], this.currentQuestions[i]];
            }
        }
        this.currentIdx = 0;
        this.userAnswers = new Array(this.currentQuestions.length).fill(null);
        this.wrongPool = [];
        this.isRetry = false;
        this.renderQuestion();
        this.showView('view-quiz');
        
        const badge = document.getElementById('mode-badge');
        badge.innerText = this.currentGenreName;
        badge.className = "px-2 py-1 rounded text-[10px] bg-amber-100 text-amber-800";
    },

    renderQuestion: function() {
        const data = this.currentQuestions[this.currentIdx];
        document.getElementById('progress').innerText = `${this.currentIdx + 1} / ${this.currentQuestions.length}`;
        document.getElementById('question-text').innerText = data.q;
        document.getElementById('prev-btn').style.opacity = this.currentIdx === 0 ? 0.3 : 1;
        
        const choicesDiv = document.getElementById('choices');
        choicesDiv.innerHTML = '';
        data.a.forEach((choice, i) => {
            const btn = document.createElement('button');
            btn.className = "choice-btn";
            btn.innerText = choice;
            btn.onclick = () => this.check(i + 1);
            choicesDiv.appendChild(btn);
        });
    },

    check: function(selected) {
        const data = this.currentQuestions[this.currentIdx];
        const isCorrect = (selected === data.correct);
        if(!this.isRetry) this.userAnswers[this.currentIdx] = isCorrect;
        if(!isCorrect && !this.wrongPool.includes(data)) this.wrongPool.push(data);

        this.showView('view-result');
        document.getElementById('judgment-icon').innerText = isCorrect ? "〇" : "×";
        document.getElementById('explanation-text').innerText = data.exp;
        document.getElementById('next-btn-text').innerText = (this.currentIdx === this.currentQuestions.length - 1) ? "結果を見る" : "次の問題へ";
    },

    next: function() {
        if(this.currentIdx < this.currentQuestions.length - 1) {
            this.currentIdx++;
            this.renderQuestion();
            this.showView('view-quiz');
        } else {
            this.showFinal();
        }
    },

    prev: function() {
        if(this.currentIdx > 0) { this.currentIdx--; this.renderQuestion(); this.showView('view-quiz'); }
    },

    showFinal: function() {
        this.showView('view-final');
        if(!this.isRetry) {
            const score = Math.round((this.userAnswers.filter(a => a === true).length / this.currentQuestions.length) * 100);
            document.getElementById('score-val').innerText = score;
            
            // スコア保存
            let users = JSON.parse(localStorage.getItem('coffee_users'));
            const prevScore = users[this.currentUser].scores[this.currentGenreName] || 0;
            if(score > prevScore) {
                users[this.currentUser].scores[this.currentGenreName] = score;
                localStorage.setItem('coffee_users', JSON.stringify(users));
            }
        }
        document.getElementById('retry-area').classList.toggle('hidden', this.wrongPool.length === 0);
    },

    startRetry: function() {
        this.currentQuestions = [...this.wrongPool];
        this.wrongPool = [];
        this.isRetry = true;
        this.currentIdx = 0;
        this.renderQuestion();
        this.showView('view-quiz');
        document.getElementById('mode-badge').innerText = "弱点克服リトライ";
    }
};