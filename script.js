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

})();