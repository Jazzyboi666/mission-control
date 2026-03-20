// DOM Elements
const btnRefresh = document.getElementById('btn-refresh-data');
const syncStatus = document.getElementById('sync-status');
const btnTranslate = document.getElementById('btn-translate');

// Tab/View Elements
const cardGads = document.getElementById('card-gads');
const cardStripe = document.getElementById('card-stripe');
const cardGenerator = document.getElementById('card-generator');
const cardCompetitors = document.getElementById('card-competitors');
const cardArchived = document.getElementById('card-archived');
const cardTrends = document.getElementById('card-trends');

const viewEmpty = document.getElementById('view-empty');
const viewGads = document.getElementById('view-gads');
const viewStripe = document.getElementById('view-stripe');
const viewGenerator = document.getElementById('view-generator');
const viewCompetitors = document.getElementById('view-competitors');
const viewArchived = document.getElementById('view-archived');
const viewTrends = document.getElementById('view-trends');

// Container Elements
const genContainer = document.getElementById('generator-container');
const compContainer = document.getElementById('competitor-container');
const revCampaignsList = document.getElementById('revenue-campaigns-list');
const archivedContainer = document.getElementById('archived-memory-container');
const trendsContainer = document.getElementById('trends-container');

// Element Refs for Data
const ui = {
    gads: {
        spend: document.getElementById('gads-spend'),
        clicks: document.getElementById('gads-clicks'),
        ctr: document.getElementById('gads-ctr'),
        cpc: document.getElementById('gads-cpc'),
        roas: document.getElementById('gads-roas-display'),
        cpa: document.getElementById('gads-cpa-display'),
        accountsList: document.getElementById('gads-accounts-list'),
        campaignsList: document.getElementById('gads-campaigns-list')
    },
    stripe: {
        todayRevSidebar: document.getElementById('stripe-today-rev-sidebar'),
        todayRevenue: document.getElementById('stripe-today-revenue')
    },
    heroTitle: document.getElementById('hero-title'),
    heroSubtitle: document.getElementById('hero-subtitle'),
    decorativeGrid: document.querySelector('.decorative-grid'),
    statusGads: document.querySelector('.status-indicator:not(.stripe-status)'),
    statusStripe: document.querySelector('.stripe-status')
};

let dataInjected = false;
let currentJSONData = null;

// --- VIEW NAVIGATION / TABS ---
const switchView = (targetViewId) => {
    // Reset all tabs
    [cardGads, cardStripe, cardGenerator, cardCompetitors, cardArchived, cardTrends].forEach(el => el.classList.remove('selected'));
    
    // Set active tab
    if (targetViewId === 'view-gads') cardGads.classList.add('selected');
    if (targetViewId === 'view-stripe') cardStripe.classList.add('selected');
    if (targetViewId === 'view-generator') cardGenerator.classList.add('selected');
    if (targetViewId === 'view-competitors') cardCompetitors.classList.add('selected');
    if (targetViewId === 'view-archived') cardArchived.classList.add('selected');
    if (targetViewId === 'view-trends') cardTrends.classList.add('selected');

    // Hide all views
    [viewEmpty, viewGads, viewStripe, viewGenerator, viewCompetitors, viewArchived, viewTrends].forEach(el => el.classList.add('hidden'));

    setTimeout(() => {
        const target = document.getElementById(targetViewId);
        if(target) target.classList.remove('hidden');
    }, 50);
};

cardGads.addEventListener('click', () => switchView('view-gads'));
cardStripe.addEventListener('click', () => switchView('view-stripe'));
cardGenerator.addEventListener('click', () => switchView('view-generator'));
cardCompetitors.addEventListener('click', () => switchView('view-competitors'));
cardArchived.addEventListener('click', () => switchView('view-archived'));
cardTrends.addEventListener('click', () => switchView('view-trends'));

// --- PROMPT COPYING ---
const bindPromptBtn = (btnId, textId) => {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('click', () => {
        const text = document.getElementById(textId).innerText;
        navigator.clipboard.writeText(text).then(() => {
            const og = btn.innerHTML;
            btn.innerHTML = 'Copied to Clipboard!';
            setTimeout(() => { btn.innerHTML = og; }, 2000);
        });
    });
};
bindPromptBtn('btn-copy-gen-prompt', 'gen-prompt-text');
bindPromptBtn('btn-copy-comp-prompt', 'comp-prompt-text');

// --- UI UPDATER ---
const updateMetric = (el, value) => {
    if (!el || value === undefined) return;
    if (el.id === 'gads-roas-display') el.innerText = 'ROAS: ' + value;
    else if (el.id === 'gads-cpa-display') el.innerText = 'CPA: ' + value;
    else if (el.id === 'stripe-latest-received') el.innerText = 'Latest Ping: ' + value;
    else el.innerText = value;
    el.classList.remove('metric-update');
    void el.offsetWidth;
    el.classList.add('metric-update');
};

const applyDataToUI = (data) => {
    if (data.g_ads) {
        if (data.g_ads.campaigns && Array.isArray(data.g_ads.campaigns) && data.g_ads.campaigns.length === 0) {
            data.g_ads.spend = "$0.00";
            data.g_ads.clicks = "0";
            data.g_ads.ctr = "0.0%";
            data.g_ads.cpc = "$0.00";
            data.g_ads.roas = "0.0x";
            data.g_ads.cpa = "$0.00";
        }
        updateMetric(ui.gads.spend, data.g_ads.spend);
        updateMetric(ui.gads.clicks, data.g_ads.clicks);
        updateMetric(ui.gads.ctr, data.g_ads.ctr);
        updateMetric(ui.gads.cpc, data.g_ads.cpc);
        updateMetric(ui.gads.roas, data.g_ads.roas);
        updateMetric(ui.gads.cpa, data.g_ads.cpa);

        if (data.g_ads.accounts && Array.isArray(data.g_ads.accounts)) {
            ui.gads.accountsList.innerHTML = '';
            data.g_ads.accounts.forEach(acc => {
                const li = document.createElement('li');
                li.className = 'account-item swipe-up';
                li.innerHTML = `<span class="account-id">ID: ${acc.account_id}</span><span class="account-label">${acc.label}</span>`;
                ui.gads.accountsList.appendChild(li);
            });
        }
        
        if (data.g_ads.campaigns && Array.isArray(data.g_ads.campaigns)) {
            ui.gads.campaignsList.innerHTML = '';
            if (data.g_ads.campaigns.length === 0) {
                ui.gads.campaignsList.innerHTML = '<div class="campaign-item empty-state" style="justify-content:center; color: var(--text-secondary);">No active campaigns today.</div>';
            }
            data.g_ads.campaigns.forEach(cmp => {
                const div = document.createElement('div');
                div.className = 'campaign-item swipe-up';
                div.innerHTML = `
                    <div class="campaign-main">
                        <span class="campaign-name">${cmp.name}</span>
                        <span class="campaign-status">${cmp.status}</span>
                    </div>
                    <div class="campaign-metrics">
                        <div class="c-metric"><span class="c-label">Spend</span><span class="c-value">${cmp.spend || '--'}</span></div>
                        <div class="c-metric"><span class="c-label">CPA</span><span class="c-value stripe-color">${cmp.cpa || cmp.roas || '--'}</span></div>
                    </div>
                `;
                ui.gads.campaignsList.appendChild(div);
            });
        }
        ui.statusGads.style.boxShadow = "0 0 15px #00f0ff";
        ui.statusGads.style.backgroundColor = "#00f0ff";
    }

    if (data.stripe) {
        // We use last 21h enabled campaign revenue for the sidebar
        const revValue = "$" + (data.stripe.last_21h_enabled_google_campaign_revenue_usd || 0).toFixed(2);
        updateMetric(ui.stripe.todayRevSidebar, revValue);
        updateMetric(ui.stripe.todayRevenue, revValue);
        
        ui.statusStripe.style.boxShadow = "0 0 15px #00f0ff";
        ui.statusStripe.style.backgroundColor = "#00f0ff";
    }

    if (data.g_ads && data.g_ads.campaigns) {
        // Filter campaigns with positive revenue
        const profCamps = data.g_ads.campaigns.filter(c => c.attributed_revenue_last_21h_usd > 0);
        revCampaignsList.innerHTML = '';
        if (profCamps.length === 0) {
            revCampaignsList.innerHTML = '<div class="campaign-item empty-state" style="justify-content:center; color: var(--text-secondary);">No profitable campaigns today.</div>';
        } else {
            profCamps.forEach(cmp => {
                const div = document.createElement('div');
                div.className = 'campaign-item swipe-up';
                div.innerHTML = `
                    <div class="campaign-main">
                        <span class="campaign-name">${cmp.campaign_name}</span>
                        <span class="campaign-status" style="color:#00ffaa; border-color:#00ffaa;">PROFIT</span>
                    </div>
                    <div class="campaign-metrics">
                        <div class="c-metric"><span class="c-label">Revenue Generated</span><span class="c-value stripe-color">$${cmp.attributed_revenue_last_21h_usd}</span></div>
                    </div>
                `;
                revCampaignsList.appendChild(div);
            });
        }
    }

    if (data.generator && Array.isArray(data.generator)) {
        genContainer.innerHTML = '';
        data.generator.forEach(gen => {
            const hItems = (gen.headlines_15 || []).map(h=>`<li>${h}</li>`).join('');
            const lhItems = (gen.long_headlines_10 || []).map(h=>`<li>${h}</li>`).join('');
            const descItems = (gen.descriptions_5 || []).map(h=>`<li>${h}</li>`).join('');
            
            // Build Image block
            let hor = '', ver = '', sq = '';
            if(gen.images) {
                if(gen.images.horizontal) hor = gen.images.horizontal.map(url => `<img src="${url}" alt="Horizontal Ad">`).join('');
                if(gen.images.vertical) ver = gen.images.vertical.map(url => `<img src="${url}" alt="Vertical Ad">`).join('');
                if(gen.images.square) sq = gen.images.square.map(url => `<img src="${url}" alt="Square Ad">`).join('');
            }

            const card = document.createElement('div');
            card.className = 'gen-card swipe-up';
            card.innerHTML = `
                <h3>[AD STRUCTURE] ${gen.campaign_name}</h3>
                <div class="gen-grid">
                    <div class="gen-box"><h4>15 Short Headlines</h4><ul>${hItems}</ul></div>
                    <div class="gen-box"><h4>10 Long Headlines</h4><ul>${lhItems}</ul></div>
                    <div class="gen-box"><h4>5 Descriptions</h4><ul>${descItems}</ul></div>
                    <div class="gen-box">
                        <h4>Bulk Search Themes (50)</h4>
                        <p>${gen.search_themes_bulk || '--'}</p>
                        <br>
                        <h4>Geo/Demographic Interests</h4>
                        <p>${gen.interests || '--'}</p>
                    </div>
                </div>
                <div class="gen-grid">
                    <div class="gen-box" style="grid-column: 1 / -1;">
                        <h4>Generated Base Creatives</h4>
                        <p style="margin-bottom:0.5rem; color:var(--text-secondary);">Horizontal (1.91:1)</p><div class="img-row">${hor}</div>
                        <p style="margin-top:1rem; margin-bottom:0.5rem; color:var(--text-secondary);">Vertical (9:16)</p><div class="img-row">${ver}</div>
                        <p style="margin-top:1rem; margin-bottom:0.5rem; color:var(--text-secondary);">Square (1:1)</p><div class="img-row">${sq}</div>
                    </div>
                </div>
            `;
            genContainer.appendChild(card);
        });
    }

    if (data.competitors && Array.isArray(data.competitors)) {
        compContainer.innerHTML = '';
        data.competitors.forEach(comp => {
            const heads = (comp.headlines || []).map(h=>`<li>${h}</li>`).join('');
            const card = document.createElement('div');
            card.className = 'comp-card swipe-up';
            card.innerHTML = `
                <div style="flex: 1;">
                    <h3>${comp.name}</h3>
                    <div class="comp-platform">${comp.platform || 'Google / FB'}</div>
                    <div style="margin-bottom: 1rem;">
                        <span class="mc-label" style="display:block; margin-bottom:0.5rem;">Ad Headlines</span>
                        <ul class="comp-headlines">${heads}</ul>
                    </div>
                </div>
                <div>
                    <span class="mc-label" style="display:block; margin-bottom:0.5rem;">Ad Creative Snapshot</span>
                    <img src="${comp.image_url}" class="comp-ad-img" alt="Ad">
                </div>
            `;
            compContainer.appendChild(card);
        });
    }

    if (data.archived_memory) {
        archivedContainer.innerHTML = data.archived_memory;
    } else {
        archivedContainer.innerHTML = `No archived items found in data.json under "archived_memory".`;
    }

    if (data.todays_trends) {
        let trendsHtml = '';
        trendsHtml += `<div style="margin-bottom: 1.5rem;">`;
        if (data.todays_trends.topics) {
            trendsHtml += `<h4 style="color:#fff; margin-bottom:0.5rem;">🔥 Daily Trending Topics</h4>`;
            trendsHtml += `<ul style="list-style:disc; margin-left: 1.5rem; margin-bottom: 1rem;">`;
            data.todays_trends.topics.forEach(t => trendsHtml += `<li>${t}</li>`);
            trendsHtml += `</ul>`;
        }
        if (data.todays_trends.suggested_angle) {
            trendsHtml += `<h4 style="color:#00ffaa; margin-bottom:0.5rem;">🎯 Suggested Campaign Angle</h4>`;
            trendsHtml += `<div style="background: rgba(0, 255, 170, 0.05); border: 1px solid rgba(0, 255, 170, 0.2); padding: 1rem; border-radius: 8px;">`;
            trendsHtml += `<p><strong>Headline:</strong> ${data.todays_trends.suggested_angle.headline}</p>`;
            trendsHtml += `<p style="margin-top:0.5rem;"><strong>Angle Strategy:</strong> ${data.todays_trends.suggested_angle.description}</p>`;
            trendsHtml += `</div>`;
        }
        trendsHtml += `</div>`;
        trendsContainer.innerHTML = trendsHtml;
    } else {
        trendsContainer.innerHTML = `No trends found in data.json under "todays_trends".`;
    }

    const now = new Date();
    syncStatus.textContent = `Live Telemetry Synced: ${now.toLocaleTimeString()}`;
    syncStatus.style.color = "var(--primary-color)";
    ui.heroTitle.textContent = "System Online";
    ui.heroTitle.style.background = "linear-gradient(180deg, #00f0ff 0%, #0050ff 100%)";
    if (ui.heroTitle.style.webkitBackgroundClip) ui.heroTitle.style.webkitBackgroundClip = "text";
    if (ui.heroTitle.style.webkitTextFillColor) ui.heroTitle.style.webkitTextFillColor = "transparent";
    ui.heroSubtitle.textContent = "Telemetry actively monitored and synchronized.";
    Array.from(ui.decorativeGrid.children).forEach((cell, i) => {
        setTimeout(() => cell.classList.add('active-cell'), i * 200);
    });

    if (!dataInjected) {
        dataInjected = true;
        switchView('view-gads');
    }
};

// --- DATA FETCHING ---
const fetchTelemetry = async () => {
    try {
        syncStatus.textContent = "Scanning data.json...";
        syncStatus.style.color = "var(--text-secondary)";
        const res = await fetch('data.json?t=' + new Date().getTime());
        if (!res.ok) throw new Error("Could not find data.json");
        const data = await res.json();
        currentJSONData = data;
        applyDataToUI(data);
    } catch (err) {
        console.error(err);
        syncStatus.textContent = "Error: " + err.message;
        syncStatus.style.color = "#ff4d4f";
    }
};

btnRefresh.addEventListener('click', () => {
    btnRefresh.classList.add('metric-update');
    setTimeout(() => btnRefresh.classList.remove('metric-update'), 500);
    fetchTelemetry();
});

window.googleTranslateElementInit = function() {
    new google.translate.TranslateElement({
        pageLanguage: 'en', 
        includedLanguages: 'zh-CN', 
        autoDisplay: false
    }, 'google_translate_element');
};

btnTranslate.addEventListener('click', () => {
    // Inject script if not present
    if (!document.getElementById('gtranslate-script')) {
        const script = document.createElement('script');
        script.id = 'gtranslate-script';
        script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        document.body.appendChild(script);
        
        btnTranslate.innerHTML = '正在翻译 / Translating...';
        
        let attempts = 0;
        const checkExist = setInterval(function() {
            const select = document.querySelector('.goog-te-combo');
            if (select) {
                clearInterval(checkExist);
                select.value = 'zh-CN';
                select.dispatchEvent(new Event('change'));
                btnTranslate.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> 已翻译 / Translated';
            }
            attempts++;
            if (attempts > 50) clearInterval(checkExist); // Timeout after 5s
        }, 100);
    } else {
        const select = document.querySelector('.goog-te-combo');
        if (select) {
            select.value = 'zh-CN';
            select.dispatchEvent(new Event('change'));
        }
    }
});

window.addEventListener('DOMContentLoaded', fetchTelemetry);
