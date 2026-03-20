// DOM Elements
const btnRefresh = document.getElementById('btn-refresh-data');
const syncStatus = document.getElementById('sync-status');
const btnMasterPrompt = document.getElementById('btn-master-prompt');

// Tab/View Elements
const cardGads = document.getElementById('card-gads');
const cardStripe = document.getElementById('card-stripe');
const cardGenerator = document.getElementById('card-generator');
const cardCompetitors = document.getElementById('card-competitors');

const viewEmpty = document.getElementById('view-empty');
const viewGads = document.getElementById('view-gads');
const viewStripe = document.getElementById('view-stripe');
const viewGenerator = document.getElementById('view-generator');
const viewCompetitors = document.getElementById('view-competitors');

// Container Elements
const genContainer = document.getElementById('generator-container');
const compContainer = document.getElementById('competitor-container');

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
        revenue: document.getElementById('stripe-revenue'),
        todayRevenue: document.getElementById('stripe-today-revenue'),
        todayPayments: document.getElementById('stripe-today-payments'),
        latestReceived: document.getElementById('stripe-latest-received'),
        mrr: document.getElementById('stripe-mrr'),
        churn: document.getElementById('stripe-churn'),
        customers: document.getElementById('stripe-customers'),
        activeSubs: document.getElementById('stripe-active-subs'),
        netVolume: document.getElementById('stripe-net-volume'),
        disputes: document.getElementById('stripe-disputes')
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
    [cardGads, cardStripe, cardGenerator, cardCompetitors].forEach(el => el.classList.remove('selected'));
    
    // Set active tab
    if (targetViewId === 'view-gads') cardGads.classList.add('selected');
    if (targetViewId === 'view-stripe') cardStripe.classList.add('selected');
    if (targetViewId === 'view-generator') cardGenerator.classList.add('selected');
    if (targetViewId === 'view-competitors') cardCompetitors.classList.add('selected');

    // Hide all views
    [viewEmpty, viewGads, viewStripe, viewGenerator, viewCompetitors].forEach(el => el.classList.add('hidden'));

    setTimeout(() => {
        const target = document.getElementById(targetViewId);
        if(target) target.classList.remove('hidden');
    }, 50);
};

cardGads.addEventListener('click', () => switchView('view-gads'));
cardStripe.addEventListener('click', () => switchView('view-stripe'));
cardGenerator.addEventListener('click', () => switchView('view-generator'));
cardCompetitors.addEventListener('click', () => switchView('view-competitors'));

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
        const todayRev = data.stripe.today_revenue || "--";
        const rev = data.stripe.revenue || "--";
        updateMetric(ui.stripe.todayRevSidebar, todayRev);
        updateMetric(ui.stripe.revenue, rev);
        updateMetric(ui.stripe.todayRevenue, todayRev);
        updateMetric(ui.stripe.todayPayments, data.stripe.today_payment_count);
        updateMetric(ui.stripe.latestReceived, data.stripe.latest_received_at);
        updateMetric(ui.stripe.mrr, data.stripe.mrr);
        updateMetric(ui.stripe.churn, data.stripe.churn);
        updateMetric(ui.stripe.customers, data.stripe.customers);
        updateMetric(ui.stripe.activeSubs, data.stripe.activeSubs || data.stripe.active_subs); 
        updateMetric(ui.stripe.netVolume, data.stripe.netVolume || data.stripe.net_volume);
        updateMetric(ui.stripe.disputes, data.stripe.disputes);
        ui.statusStripe.style.boxShadow = "0 0 15px #00f0ff";
        ui.statusStripe.style.backgroundColor = "#00f0ff";
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

btnMasterPrompt.addEventListener('click', () => {
    // Build a lightweight skeleton schema so the AI doesn't choke on a massive history array
    const skeleton = {
        g_ads: currentJSONData ? currentJSONData.g_ads : {},
        stripe: currentJSONData ? currentJSONData.stripe : {},
        generator: [{
            campaign_name: "Example Campaign",
            headlines_15: ["HL1", "HL2", "... (provide 15)"],
            long_headlines_10: ["LH1", "... (provide 10)"],
            descriptions_5: ["Desc1", "... (provide 5)"],
            search_themes_bulk: "keyword1, keyword2... (provide 50)",
            interests: "interest 1, interest 2... (provide 15)",
            images: { horizontal: ["url1"], vertical: ["url1"], square: ["url1"] }
        }],
        competitors: [{
            name: "Competitor Name",
            platform: "Ad Platform",
            headlines: ["Ad Headline 1", "Ad Headline 2"],
            image_url: "https://placehold.co/600x400"
        }]
    };

    const rawJson = JSON.stringify(skeleton, null, 2);
    const masterPrompt = `Here is the required JSON structure for my Mission Control dashboard:

\`\`\`json
${rawJson}
\`\`\`

Based on any fresh input, data, or context I provided you above, please do the following:
1. Update existing metrics inside "g_ads" or "stripe" to reflect my latest exact values (or zero them out if inactive).
2. Format my "g_ads.campaigns" array based on any active campaigns provided.
3. Replace the "generator" array with 10 highly-converting Google Ads campaign strategies for Seele AI. Each must exactly include: 15 distinct short headlines, 10 distinct long headlines, 5 descriptions, 50 bulk search themes, and 15 demographic/interests. Provide placeholder image links.
4. Replace the "competitors" array with intelligence on 3-5 direct competitors in the text-to-3d space, including their specific ad headlines and an image mockup link.

IMPORTANT: You must return ONLY ONE full, valid raw JSON object exactly matching the keys "g_ads", "stripe", "generator", and "competitors". Do not output markdown codeblock wrapping around the JSON, just raw text.`;

    navigator.clipboard.writeText(masterPrompt).then(() => {
        const ogHTML = btnMasterPrompt.innerHTML;
        btnMasterPrompt.innerHTML = 'Copied to Clipboard!';
        setTimeout(() => { btnMasterPrompt.innerHTML = ogHTML; }, 2500);
    });
});

window.addEventListener('DOMContentLoaded', fetchTelemetry);
