/* MedGlobal — shared behaviour */
(function () {
    "use strict";

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- Mobile nav ---------- */
    var toggle = document.querySelector('.nav-toggle');
    var links = document.querySelector('.nav-links');
    if (toggle && links) {
        toggle.addEventListener('click', function () {
            var open = links.classList.toggle('open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        links.querySelectorAll('a').forEach(function (a) {
            a.addEventListener('click', function () { links.classList.remove('open'); });
        });
    }

    var productMenuToggle = document.querySelector('.nav-dropdown-toggle');
    if (productMenuToggle) {
        var productMenu = productMenuToggle.closest('.nav-item');
        productMenuToggle.addEventListener('click', function (event) {
            event.stopPropagation();
            var isOpen = productMenu.classList.toggle('open');
            productMenuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
        document.addEventListener('click', function (event) {
            if (!productMenu.contains(event.target)) {
                productMenu.classList.remove('open');
                productMenuToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    /* ---------- Active nav link ---------- */
    var here = (location.pathname.split('/').pop() || 'index.html');
    document.querySelectorAll('.nav-links a').forEach(function (a) {
        var target = a.getAttribute('href');
        if (target === here || (here === '' && target === 'index.html')) {
            a.classList.add('active');
        }
    });

    /* ---------- Scroll reveal ---------- */
    var revealEls = document.querySelectorAll('.reveal');
    if (reduceMotion || !('IntersectionObserver' in window)) {
        revealEls.forEach(function (el) { el.classList.add('in'); });
    } else {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
        revealEls.forEach(function (el) { io.observe(el); });
    }

    /* ---------- Counter animation ---------- */
    var counters = document.querySelectorAll('[data-counter]');
    function animateCounter(el) {
        var target = parseFloat(el.getAttribute('data-counter'));
        var suffix = el.getAttribute('data-suffix') || '';
        var decimals = el.getAttribute('data-decimals') ? parseInt(el.getAttribute('data-decimals'), 10) : 0;
        if (reduceMotion) { el.textContent = target.toFixed(decimals) + suffix; return; }
        var start = null, duration = 1100;
        function step(ts) {
            if (!start) start = ts;
            var progress = Math.min((ts - start) / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            var val = target * eased;
            el.textContent = val.toFixed(decimals) + suffix;
            if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }
    if (counters.length) {
        if (!('IntersectionObserver' in window)) {
            counters.forEach(animateCounter);
        } else {
            var cio = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) { animateCounter(entry.target); cio.unobserve(entry.target); }
                });
            }, { threshold: 0.5 });
            counters.forEach(function (el) { cio.observe(el); });
        }
    }

    /* ---------- Generic tabs (data-tabs / data-tab-target) ---------- */
    document.querySelectorAll('[data-tabs]').forEach(function (tabGroup) {
        var buttons = tabGroup.querySelectorAll('[data-tab-target]');
        var panelWrap = document.querySelector(tabGroup.getAttribute('data-tabs'));
        buttons.forEach(function (btn) {
            btn.addEventListener('click', function () {
                buttons.forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                var target = btn.getAttribute('data-tab-target');
                if (panelWrap) {
                    panelWrap.querySelectorAll('[data-tab-panel]').forEach(function (p) {
                        p.classList.toggle('active', p.getAttribute('data-tab-panel') === target);
                    });
                }
            });
        });
    });

    /* ---------- External Google Forms ---------- */
    /* Each form's base viewform URL plus a map of our field names to that
       form's entry.<id> parameters. Only fields the form actually has are
       listed, so a value simply isn't sent for fields we don't collect
       (location, website, city/state, dropdown-only fields, etc.) — the
       person fills those in on the Google Form itself. */
    var GOOGLE_FORMS = {
        contact: {
            base: 'https://docs.google.com/forms/d/e/1FAIpQLSd9qJ1Ed6nCB7joxnhn6yilCQGFtAI80DlvcCnmiBHBMeSCaw/viewform',
            entries: {
                name: 'entry.804101570',
                organization: 'entry.484972136',
                email: 'entry.439085705',
                phone: 'entry.794103179',
                stakeholder: 'entry.1024906265',
                message: 'entry.198507384'
            }
        },
        partner: {
            base: 'https://docs.google.com/forms/d/e/1FAIpQLScseoKz9Hv0pXZxXHhDNOiHD3NbDVz31eHxZSf0npGBq7dYhQ/viewform',
            entries: {
                name: 'entry.650390910',
                organization: 'entry.945059082',
                email: 'entry.1186013098',
                phone: 'entry.1025317698',
                stakeholder: 'entry.859573507',
                message: 'entry.1427894038'
            }
        },
        investor: {
            base: 'https://docs.google.com/forms/d/e/1FAIpQLSeWHgMDsZzLKZFAa4CNm2f1B10B7My4jZQj85q9o2km01Uyzg/viewform',
            entries: {
                name: 'entry.1303399956',
                organization: 'entry.297606814',
                email: 'entry.1146719570',
                phone: 'entry.46630257',
                message: 'entry.411773852'
            }
        }
    };

    function buildPrefillUrl(formKey, data) {
        var cfg = GOOGLE_FORMS[formKey];
        if (!cfg) return '#';
        var params = ['usp=pp_url'];
        Object.keys(cfg.entries).forEach(function (field) {
            var val = data[field];
            if (val) params.push(cfg.entries[field] + '=' + encodeURIComponent(val));
        });
        return cfg.base + '?' + params.join('&');
    }

    function openExternalForm(url) {
        window.open(url, '_blank', 'noopener,noreferrer');
    }

    /* ---------- Contact form validation ---------- */
    var form = document.getElementById('contact-form');
    if (form) {
        var stakeholderOpts = document.querySelectorAll('.stakeholder-opt');
        var stakeholderInput = document.getElementById('stakeholder-type');
        var googleFormSubmit = document.getElementById('google-form-submit');

        stakeholderOpts.forEach(function (opt) {
            opt.addEventListener('click', function () {
                stakeholderOpts.forEach(function (o) { o.classList.remove('selected'); o.setAttribute('aria-pressed', 'false'); });
                opt.classList.add('selected');
                opt.setAttribute('aria-pressed', 'true');
                if (stakeholderInput) stakeholderInput.value = opt.getAttribute('data-value');
                var field = opt.closest('.form-field');
                if (field) field.classList.remove('invalid');

                if (googleFormSubmit) {
                    var type = opt.getAttribute('data-value');
                    googleFormSubmit.textContent = type === 'Investor'
                        ? 'Open Investor Form ↗'
                        : (type === 'Other' ? 'Open Contact Form ↗' : 'Open Partner Form ↗');
                }
            });
        });

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var valid = true;

            function markField(id, condition) {
                var field = document.getElementById(id).closest('.form-field');
                if (!condition) { field.classList.add('invalid'); valid = false; }
                else { field.classList.remove('invalid'); }
            }

            var name = document.getElementById('c-name').value.trim();
            var org = document.getElementById('c-org').value.trim();
            var email = document.getElementById('c-email').value.trim();
            var phone = document.getElementById('c-phone').value.trim();
            var message = document.getElementById('c-message').value.trim();
            var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            markField('c-name', name.length > 1);
            markField('c-org', org.length > 1);
            markField('c-email', emailPattern.test(email));
            markField('c-message', message.length > 9);

            if (!stakeholderInput.value) {
                document.querySelector('.stakeholder-grid').closest('.form-field, div').classList.add('invalid');
                document.getElementById('stakeholder-error').style.display = 'block';
                valid = false;
            } else {
                document.getElementById('stakeholder-error').style.display = 'none';
            }

            if (!valid) { return; }

            var selectedStakeholder = stakeholderInput ? stakeholderInput.value : '';
            var formKey;

            if (selectedStakeholder === 'Investor') {
                formKey = 'investor';
            } else if (selectedStakeholder === 'Government / Institution' ||
                       selectedStakeholder === 'Hospital' ||
                       selectedStakeholder === 'Pharmaceutical Company' ||
                       selectedStakeholder === 'Technology Partner') {
                formKey = 'partner';
            } else {
                formKey = 'contact';
            }

            var prefillData = {
                name: name,
                organization: org,
                email: email,
                phone: phone,
                stakeholder: selectedStakeholder,
                message: message
            };

            var formUrl = buildPrefillUrl(formKey, prefillData);
            openExternalForm(formUrl);

            var successBox = document.getElementById('form-success');
            if (successBox) successBox.classList.add('show');
        });
    }


    /* ---------- Product demos ---------- */
    var discoveryForm = document.getElementById('discovery-form');
    if (discoveryForm) {
        var discoveryQuery = document.getElementById('discovery-query');
        var discoveryMode = document.getElementById('discovery-mode');
        var discoveryResult = document.getElementById('discovery-result');
        discoveryForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var q = discoveryQuery.value.trim() || 'Medicine';
            var mode = discoveryMode.value;
            discoveryResult.innerHTML = '<div class="result-heading"><span>Results for “' + q.replace(/</g,'&lt;') + '”</span><small>Illustrative data · ' + mode + ' search</small></div><div class="compare-row"><div class="compare-card"><span class="tag">MATCH</span><div class="med-name">' + q.replace(/</g,'&lt;') + '</div><div class="med-comp">Reference listing</div><div class="price">Compare</div></div><div class="compare-card generic"><span class="tag">ALTERNATIVE</span><div class="med-name">Generic option</div><div class="med-comp">Composition-based result</div><div class="price">Available</div><div class="save">View nearby options</div></div></div><div class="demo-status"><span class="stock-pill in">Search complete</span><span>Prototype result</span><span>Compare →</span></div>';
        });
    }

    var rxFile = document.getElementById('rx-file');
    var rxName = document.getElementById('rx-file-name');
    if (rxFile) rxFile.addEventListener('change', function () { if (rxFile.files[0]) rxName.textContent = rxFile.files[0].name; });

    var rxForm = document.getElementById('rx-form');
    if (rxForm) {
        rxForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var steps = document.querySelectorAll('#rx-steps .rx-step');
            var result = document.getElementById('rx-result');
            if (!rxFile.files.length) { result.textContent = 'Please choose a sample prescription first. This prototype does not upload files to a server.'; return; }
            steps.forEach(function (x) { x.classList.remove('active'); });
            steps[0].classList.add('active'); result.textContent = 'Capturing prescription…';
            setTimeout(function(){ steps[1].classList.add('active'); result.textContent = 'Analyzing prescription structure and extracting medicine names…'; }, reduceMotion ? 0 : 650);
            setTimeout(function(){ steps[2].classList.add('active'); result.innerHTML = '<strong style="color:#fff">Prototype analysis complete.</strong> Example workflow: medicine recognition → safety checks → generic conversion → cost/availability review. No clinical recommendation is generated by this demo.'; }, reduceMotion ? 0 : 1300);
        });
    }

    var refreshOS = document.getElementById('refresh-os');
    if (refreshOS) {
        refreshOS.addEventListener('click', function () {
            var activePanel = document.querySelector('#os-panels .subtab-panel.active');
            if (!activePanel) return;
            var values = activePanel.querySelectorAll('.dash-tile .v');
            values.forEach(function (v, i) {
                if (v.textContent.indexOf('%') > -1) v.textContent = (96 + Math.random() * 3).toFixed(1) + '%';
                else if (/^\d/.test(v.textContent)) v.textContent = String(Math.max(1, parseInt(v.textContent,10) + Math.floor(Math.random()*5)-2));
            });
            var note = refreshOS.dataset;
            refreshOS.textContent = 'Updated just now ✓';
            setTimeout(function(){ refreshOS.textContent = 'Refresh demo data ↻'; }, 1800);
        });
    }

    /* ---------- MedSaarthi Assistant: local knowledge chatbot ---------- */
    var assistantKnowledge = [
        { keys: ['hello', 'hi', 'hey', 'good morning', 'good evening'], reply: 'Hello. I am the MedSaarthi Assistant. I can help you explore the platform, products, medicine discovery, prescription intelligence and healthcare ecosystem.' },
        { keys: ['what is medsaarthi', 'what does medsaarthi', 'about medsaarthi', 'who are you'], reply: 'MedSaarthi is building India\'s digital infrastructure for affordable generic medicines. Its vision is to connect patients, doctors, pharmacies, distributors and government through one secure digital ecosystem that improves medicine discovery, trust and access.' },
        { keys: ['mission', 'purpose', 'vision', 'why medsaarthi'], reply: 'MedSaarthi\'s vision is: One Platform. One Connected Ecosystem. Accessible Medicines for Every Citizen. Its purpose is to empower every citizen through Access, Trust, Technology, Transparency and Healthcare.' },
        { keys: ['problem', 'healthcare reality', 'silos', 'challenge'], reply: 'India has strong medicine production capacity, but discovery, prescribing and supply often operate in silos. MedSaarthi focuses on making medicines more discoverable, trusted and accessible.' },
        { keys: ['why generic', 'generics', 'affordable medicine', 'cheaper medicine', 'low cost medicine'], reply: 'MedSaarthi aims to make affordable generic medicines easier to discover and trust by connecting medicine information, price comparison, equivalence evidence and access points.' },
        { keys: ['discover medicine', 'medicine discovery', 'search medicine', 'find medicine', 'search by brand', 'composition search'], reply: 'The Generic Medicine Discovery Platform is designed to search by brand, disease or composition; compare prices; find generic and Jan Aushadhi equivalents; view medicine information; and locate nearby pharmacies.' },
        { keys: ['jan aushadhi'], reply: 'The platform is designed to include Jan Aushadhi listings and equivalents, alongside brand and generic medicine discovery.' },
        { keys: ['price comparison', 'compare price', 'prices'], reply: 'Medicine discovery is designed to support price comparison and show transparent pricing concepts. I cannot provide live prices from this chat.' },
        { keys: ['pharmacy availability', 'pharmacy stock', 'check stock', 'available at pharmacy', 'nearby pharmacy'], reply: 'The National Medicine Availability Map is designed to show distance, stock status and price across pharmacies, distributors, hospitals and Jan Aushadhi outlets. I cannot check live stock or reserve a medicine from this chat.' },
        { keys: ['availability map', 'medicine map', 'national medicine'], reply: 'The National Medicine Availability Map is a concept for one navigable layer across hospitals, retail pharmacies, distributors and Jan Aushadhi outlets. It is intended to support search, stock flags, transparent pricing, reservation and navigation.' },
        { keys: ['ai prescription', 'prescription intelligence', 'prescription system'], reply: 'AI Prescription Intelligence is designed to support prescription OCR, handwriting and regional-script recognition, drug interaction alerts, duplicate detection, safety checks and brand-to-generic conversion. It prioritizes clinical appropriateness and cost-efficiency.' },
        { keys: ['ocr', 'handwriting', 'regional script', 'mixed input'], reply: 'The prescription intelligence product is designed for robust OCR, handwriting recognition, regional scripts and mixed input.' },
        { keys: ['drug interaction', 'interaction alert', 'duplicate detection', 'safety check'], reply: 'The prescription intelligence product is designed to support drug interaction alerts, duplicate detection and safety checks. It does not replace a qualified healthcare professional.' },
        { keys: ['brand to generic', 'generic conversion', 'equivalent medicine'], reply: 'The product is designed to automate brand-to-generic conversion and present affordable, clinically equivalent options. The chatbot cannot recommend a medicine for an individual.' },
        { keys: ['operating system', 'medicine operating system', 'mos'], reply: 'The Generic Medicine Operating System brings together manufacturer dashboards, hospital procurement, inventory intelligence, government analytics, distributor visibility and pharmacy management with role-based access and auditability.' },
        { keys: ['manufacturer', 'production schedule', 'batch traceability'], reply: 'Manufacturer tools are described as including production schedules, batch traceability and dispatch planning.' },
        { keys: ['hospital procurement', 'tender', 'framework agreement'], reply: 'Hospital procurement is described as including framework agreements, centralized tender feeds and stock optimization.' },
        { keys: ['inventory intelligence', 'demand forecasting', 'expiry risk', 'safety stock'], reply: 'Inventory Intelligence is designed around demand forecasting, safety stock recommendations and expiry-risk mitigation.' },
        { keys: ['government analytics', 'government help', 'help government', 'policy insight', 'procurement insight'], reply: 'Government capabilities are described as aggregated, anonymized insights for policy, procurement and Jan Aushadhi expansion planning, with privacy-by-design, audit trails and regulatory alignment.' },
        { keys: ['distributor', 'logistics', 'eta tracking', 'priority routing'], reply: 'The distributor network is described as providing logistics visibility, ETA tracking and priority routing to underserved areas.' },
        { keys: ['pharmacy management', 'pharmacy tools', 'expiry alerts', 'point of sale'], reply: 'Pharmacy management is described as including inventory, expiry alerts, shelf-level analytics and point-of-sale integration.' },
        { keys: ['platform architecture', 'platform core', 'integration layer'], reply: 'The platform is organized around a Platform Core, Integration Layer and Governance. It includes a master medicine index, identity and consent services, real-time APIs and analytics.' },
        { keys: ['api', 'apis', 'integration', 'connect systems'], reply: 'Secure APIs are part of the vision for connecting hospitals, pharmacies, manufacturers and government systems with standardized medicine data and permissioned access.' },
        { keys: ['privacy', 'data sovereignty', 'audit trail', 'governance', 'regulatory'], reply: 'MedSaarthi emphasizes privacy-by-design, data sovereignty, audit trails, permissioned access, secure data exchange and regulatory alignment.' },
        { keys: ['who does medsaarthi connect', 'stakeholders', 'ecosystem', 'connect patients', 'partners'], reply: 'The ecosystem connects patients, doctors, hospitals, pharmacies, manufacturers, distributors, government, healthcare institutions, technology companies, investors and international partners.' },
        { keys: ['for hospitals', 'hospital partnership'], reply: 'Hospitals are part of the connected ecosystem, with described opportunities around clinical partnerships, patient care initiatives, research collaboration and procurement.' },
        { keys: ['for pharmacies', 'pharmacy partnership'], reply: 'Pharmacies can be part of the inventory and availability ecosystem, with tools described for inventory, expiry alerts, shelf analytics and point-of-sale integration.' },
        { keys: ['for manufacturers', 'pharmaceutical manufacturer'], reply: 'Manufacturers are supported through a manufacturer network and tools described for production schedules, batch traceability, dispatch planning and product collaboration.' },
        { keys: ['for government', 'government'], reply: 'MedSaarthi describes government value through policy collaboration, regulatory alignment, public health initiatives, aggregated analytics and procurement insights.' },
        { keys: ['technology company', 'technology companies'], reply: 'Technology companies are described as potential partners for digital transformation, innovation solutions and technology partnerships.' },
        { keys: ['investor', 'investment', 'capital partner'], reply: 'Investors are described as part of the ecosystem through the investment community, capital partnerships and growth funding.' },
        { keys: ['healthcare institution', 'academic partnership'], reply: 'Healthcare institutions are described as potential partners for academic partnerships, training programs and knowledge exchange.' },
        { keys: ['international partner', 'global outreach', 'cross border'], reply: 'International partners are described through global outreach, international collaboration and cross-border initiatives.' },
        { keys: ['cci india', 'who is cci'], reply: 'The material highlights CCI India\'s national credibility and institutional trust, healthcare industry partnerships, pharmaceutical ecosystem access, policy collaboration capabilities and technology partnership network.' },
        { keys: ['implementation', 'roadmap', 'phases', 'timeline', 'launch date'], reply: 'The implementation roadmap is described at a high level as progressing from foundation toward national scale and global expansion across four phases. Specific timelines are not available in my knowledge base.' },
        { keys: ['revenue', 'business model', 'revenue model'], reply: 'The pitch deck presents five revenue streams: Enterprise Platform Subscription, Government Contracts, B2B Procurement Fees, Medicine Intelligence and Sponsored Healthcare Programs. These are model figures, not guarantees.' },
        { keys: ['funding', 'seed', '2.5m', 'capital allocation'], reply: 'The material describes a US $2.5M Seed Deployment for building the first repeatable operating model. Categories include medicine data and AI infrastructure, partner onboarding, pilots, platform development, trust infrastructure, cybersecurity, operations and legal.' },
        { keys: ['customer growth', '250 customers', '7000', 'projections', 'targets'], reply: 'The pitch deck models Y5 targets of 250 enterprise platform customers, 7 government deployments, 70 medicine intelligence customers, 6,000 procurement buyers and 15 sponsored programs. These are projections, not current verified counts.' },
        { keys: ['contact', 'email', 'phone', 'address', 'location'], reply: 'Contact details: 13, Institutional Area, Lodhi Road, New Delhi 110003; globalexpressgroup@gmail.com; 96505 60277; 99101 96123.' },
        { keys: ['can you prescribe', 'prescribe me', 'medical advice', 'what medicine should', 'diagnose', 'dosage', 'increase my medicine', 'stop my medicine'], reply: 'I can explain MedSaarthi\'s healthcare platform and its prescription-intelligence capabilities, but I can\'t provide personal medical advice or prescribe medicines. Please consult a qualified healthcare professional.' },
        { keys: ['thank', 'thanks'], reply: 'You\'re welcome. I can help you explore MedSaarthi\'s platform, products, medicine discovery and healthcare ecosystem.' },
        { keys: ['bye', 'goodbye'], reply: 'Goodbye. The MedSaarthi Assistant is here whenever you want to explore the platform.' }
    ];

    var assistantQuickActions = ['What is MedSaarthi?', 'How does medicine discovery work?', 'Explore the products', 'AI Prescription Intelligence', 'How does it help pharmacies?', 'How does it help government?'];
    var assistantFallback = 'I don\'t have that information in my current MedSaarthi knowledge base. I can help with MedSaarthi\'s platform, products, medicine discovery, AI prescription intelligence, healthcare ecosystem, stakeholders, or business model.';
    var assistantMedical = /\b(pain|fever|cold|cough|symptom|disease|diagnos|dose|dosage|tablet for|medicine for|pregnan|side effect|blood pressure|diabetes)\b/i;

    function assistantReply(message) {
        var normalized = message.toLowerCase().replace(/[^a-z0-9$ ]/g, ' ');
        if (assistantMedical.test(message) && !/platform|prescription intelligence|medicine discovery/i.test(message)) return 'I can explain MedSaarthi\'s healthcare platform and its prescription-intelligence capabilities, but I can\'t provide personal medical advice or prescribe medicines. Please consult a qualified healthcare professional.';
        var best = null;
        var bestScore = 0;
        assistantKnowledge.forEach(function (intent) {
            var score = intent.keys.reduce(function (total, key) { return total + (normalized.indexOf(key) > -1 ? (key.length > 7 ? 3 : 1) : 0); }, 0);
            if (score > bestScore) { best = intent; bestScore = score; }
        });
        return best ? best.reply : assistantFallback;
    }

    function initAssistant() {
        if (document.getElementById('ms-chatbot-launcher')) return;
        var shell = document.createElement('div');
        shell.className = 'ms-chatbot';
        shell.innerHTML = '<button class="ms-chatbot-launcher" id="ms-chatbot-launcher" type="button" aria-label="Open MedSaarthi Assistant" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.8 8.8 0 0 1-3.2-.6L4 20l1.5-3.3A7.3 7.3 0 0 1 4.5 12 7.5 7.5 0 1 1 20 11.5Z"/><path d="M9 12h.01M12 12h.01M15 12h.01"/></svg></button><section class="ms-chatbot-panel" id="ms-chatbot-panel" aria-label="MedSaarthi Assistant" aria-hidden="true"><header class="ms-chatbot-header"><div class="ms-chatbot-identity"><span class="ms-chatbot-status"></span><div><strong>MedSaarthi Assistant</strong><span>Your guide to affordable medicine access</span></div></div><div class="ms-chatbot-header-actions"><button type="button" class="ms-chatbot-icon-btn" id="ms-chatbot-clear" aria-label="Clear chat" title="Clear chat">↺</button><button type="button" class="ms-chatbot-icon-btn" id="ms-chatbot-close" aria-label="Close chat" title="Close chat">×</button></div></header><div class="ms-chatbot-messages" id="ms-chatbot-messages" role="log" aria-live="polite"></div><form class="ms-chatbot-form" id="ms-chatbot-form"><textarea id="ms-chatbot-input" rows="1" placeholder="Ask about MedSaarthi..." aria-label="Message MedSaarthi Assistant"></textarea><button type="submit" aria-label="Send message"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 4 16 8-16 8 3-8-3-8Zm3 8h8"/></svg></button></form></section>';
        document.body.appendChild(shell);
        var launcher = document.getElementById('ms-chatbot-launcher');
        var panel = document.getElementById('ms-chatbot-panel');
        var messages = document.getElementById('ms-chatbot-messages');
        var form = document.getElementById('ms-chatbot-form');
        var input = document.getElementById('ms-chatbot-input');
        var clear = document.getElementById('ms-chatbot-clear');
        var close = document.getElementById('ms-chatbot-close');

        function addMessage(text, who) {
            var item = document.createElement('div');
            item.className = 'ms-chatbot-message ' + who;
            item.textContent = text;
            messages.appendChild(item);
            messages.scrollTop = messages.scrollHeight;
        }
        function quickActions() {
            var wrap = document.createElement('div');
            wrap.className = 'ms-chatbot-quick-actions';
            assistantQuickActions.forEach(function (question) {
                var chip = document.createElement('button');
                chip.type = 'button'; chip.textContent = question;
                chip.addEventListener('click', function () { send(question); });
                wrap.appendChild(chip);
            });
            messages.appendChild(wrap);
        }
        function welcome() {
            messages.innerHTML = '';
            addMessage('Hello! I\'m the MedSaarthi Assistant.\n\nI can help you understand our platform, products, medicine discovery system, AI prescription intelligence, healthcare ecosystem, and how MedSaarthi connects patients, doctors, pharmacies, distributors and government.\n\nWhat would you like to know?', 'assistant');
            var label = document.createElement('p'); label.className = 'ms-chatbot-prompt'; label.textContent = 'What can I help you explore?'; messages.appendChild(label); quickActions();
        }
        function send(text) {
            if (!text.trim()) return;
            addMessage(text.trim(), 'user'); input.value = ''; input.style.height = 'auto';
            var typing = document.createElement('div'); typing.className = 'ms-chatbot-typing'; typing.innerHTML = '<i></i><i></i><i></i>'; messages.appendChild(typing); messages.scrollTop = messages.scrollHeight;
            window.setTimeout(function () { typing.remove(); addMessage(assistantReply(text), 'assistant'); }, reduceMotion ? 0 : 420);
        }
        function openChat() { panel.classList.add('open'); panel.setAttribute('aria-hidden', 'false'); launcher.setAttribute('aria-expanded', 'true'); input.focus(); }
        function closeChat() { panel.classList.remove('open'); panel.setAttribute('aria-hidden', 'true'); launcher.setAttribute('aria-expanded', 'false'); launcher.focus(); }
        launcher.addEventListener('click', openChat); close.addEventListener('click', closeChat); clear.addEventListener('click', welcome);
        form.addEventListener('submit', function (event) { event.preventDefault(); send(input.value); });
        input.addEventListener('input', function () { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 120) + 'px'; });
        input.addEventListener('keydown', function (event) { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); } });
        document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && panel.classList.contains('open')) closeChat(); });
        welcome();
    }

    initAssistant();

})();