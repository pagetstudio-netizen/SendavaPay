/* SendavaPay Widget v2.0 — Paiement intégré chez le marchand */
(function (window, document) {
  'use strict';

  var BASE_URL = (function () {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].src;
      if (src && src.indexOf('/sdk/sendavapay.js') !== -1) {
        try { var u = new URL(src); return u.protocol + '//' + u.host; } catch (e) {}
      }
    }
    return 'https://sendavapay.com';
  })();

  var PREFIXES = {
    CI: '+225', BJ: '+229', TG: '+228', BF: '+226',
    SN: '+221', CM: '+237', ML: '+223', GN: '+224',
    COG: '+242', COD: '+243', CG: '+242',
  };

  var FLAGS = {
    TG: '🇹🇬', BJ: '🇧🇯', SN: '🇸🇳', CI: '🇨🇮', ML: '🇲🇱',
    BF: '🇧🇫', GN: '🇬🇳', CM: '🇨🇲', CG: '🇨🇬', COD: '🇨🇩',
  };

  var OPERATOR_COLORS = {
    MTN: '#ffcc00', Moov: '#009fe3', Orange: '#ff7900',
    TMoney: '#e30613', Wave: '#00cfff', Airtel: '#e30613',
    Vodacom: '#e60000', Flooz: '#009fe3',
  };

  var state = {
    token: null, reference: null, transaction: null,
    countries: [], services: [],
    selectedCountry: null, selectedService: null, phone: '',
    payId: null, orderId: null,
    interval: null, attempts: 0, maxAttempts: 40,
    onSuccess: null, onFailed: null, theme: 'light',
    step: 'loading',
  };

  function apiFetch(method, url, body) {
    var opts = {
      method: method, mode: 'cors', credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) opts.body = JSON.stringify(body);
    return fetch(url, opts).then(function (r) { return r.json(); });
  }

  function fmt(amount, currency) {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' ' + (currency || 'XOF');
  }

  var CSS = [
    '#spw-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}',
    '#spw-modal{background:#fff;border-radius:16px;width:100%;max-width:420px;box-shadow:0 20px 60px rgba(0,0,0,.25);overflow:hidden;display:flex;flex-direction:column;max-height:90vh}',
    '#spw-modal.dark{background:#1e1e2e;color:#e2e8f0}',
    '#spw-header{background:linear-gradient(135deg,#1a56db,#0e3fa8);color:#fff;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}',
    '#spw-header .spw-brand{display:flex;align-items:center;gap:8px;font-weight:700;font-size:15px}',
    '#spw-header .spw-secure{font-size:11px;opacity:.8;margin-top:2px}',
    '#spw-close{background:rgba(255,255,255,.2);border:none;color:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;flex-shrink:0}',
    '#spw-close:hover{background:rgba(255,255,255,.3)}',
    '#spw-body{padding:20px;overflow-y:auto;flex:1}',
    '.spw-info-box{background:#f0f7ff;border:1px solid #c7dff7;border-radius:10px;padding:14px;margin-bottom:18px;display:flex;align-items:center;gap:12px}',
    '.dark .spw-info-box{background:#1e3a5f;border-color:#2563eb}',
    '.spw-info-box .spw-amount{font-size:22px;font-weight:800;color:#1a56db}',
    '.dark .spw-info-box .spw-amount{color:#60a5fa}',
    '.spw-info-box .spw-merchant{font-size:12px;color:#64748b;margin-bottom:2px}',
    '.dark .spw-info-box .spw-merchant{color:#94a3b8}',
    '.spw-label{font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}',
    '.dark .spw-label{color:#94a3b8}',
    '.spw-field{margin-bottom:14px}',
    '.spw-select{width:100%;padding:10px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;background:#fff;cursor:pointer;outline:none}',
    '.spw-select:focus{border-color:#1a56db}',
    '.dark .spw-select{background:#2d2d3f;border-color:#3f3f5f;color:#e2e8f0}',
    '.spw-operators{display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:8px;margin-bottom:14px}',
    '.spw-op{border:2px solid #e2e8f0;border-radius:10px;padding:8px 4px;cursor:pointer;text-align:center;transition:.15s;background:#fff}',
    '.spw-op:hover{border-color:#1a56db;background:#f0f7ff}',
    '.spw-op.selected{border-color:#1a56db;background:#eff6ff}',
    '.dark .spw-op{background:#2d2d3f;border-color:#3f3f5f;color:#e2e8f0}',
    '.dark .spw-op.selected{border-color:#3b82f6;background:#1e3a5f}',
    '.spw-op-icon{width:36px;height:36px;border-radius:50%;margin:0 auto 4px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#fff}',
    '.spw-op-name{font-size:11px;font-weight:600}',
    '.spw-phone-wrap{display:flex;gap:8px}',
    '.spw-prefix{padding:10px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;background:#f8fafc;flex-shrink:0;color:#64748b}',
    '.dark .spw-prefix{background:#2d2d3f;border-color:#3f3f5f;color:#94a3b8}',
    '.spw-phone-input{flex:1;padding:10px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;outline:none}',
    '.spw-phone-input:focus{border-color:#1a56db}',
    '.dark .spw-phone-input{background:#2d2d3f;border-color:#3f3f5f;color:#e2e8f0}',
    '.spw-btn{width:100%;padding:13px;background:#1a56db;color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;margin-top:4px;transition:.15s}',
    '.spw-btn:hover:not(:disabled){background:#1648c0}',
    '.spw-btn:disabled{opacity:.6;cursor:not-allowed}',
    '.spw-btn.secondary{background:#f1f5f9;color:#334155}',
    '.dark .spw-btn.secondary{background:#2d2d3f;color:#e2e8f0}',
    '.spw-footer{text-align:center;font-size:11px;color:#94a3b8;margin-top:14px}',
    '.spw-center{text-align:center;padding:20px 0}',
    '.spw-spinner{width:48px;height:48px;border:4px solid #e2e8f0;border-top-color:#1a56db;border-radius:50%;animation:spw-spin 1s linear infinite;margin:0 auto 16px}',
    '.dark .spw-spinner{border-color:#3f3f5f;border-top-color:#3b82f6}',
    '@keyframes spw-spin{to{transform:rotate(360deg)}}',
    '.spw-icon-circle{width:64px;height:64px;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:28px}',
    '.spw-icon-circle.success{background:#dcfce7}',
    '.spw-icon-circle.error{background:#fee2e2}',
    '.spw-title{font-size:18px;font-weight:700;margin-bottom:8px}',
    '.spw-sub{font-size:14px;color:#64748b;margin-bottom:16px}',
    '.dark .spw-sub{color:#94a3b8}',
    '.spw-ref-box{background:#f8fafc;border-radius:8px;padding:12px;font-family:monospace;font-size:13px;word-break:break-all;color:#334155}',
    '.dark .spw-ref-box{background:#2d2d3f;color:#e2e8f0}',
    '.spw-otp-input{width:100%;padding:14px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:20px;text-align:center;letter-spacing:6px;outline:none;font-weight:700}',
    '.spw-otp-input:focus{border-color:#1a56db}',
    '.dark .spw-otp-input{background:#2d2d3f;border-color:#3f3f5f;color:#e2e8f0}',
    '.spw-alert{padding:10px 14px;border-radius:8px;font-size:13px;margin-bottom:12px}',
    '.spw-alert.warning{background:#fef3c7;color:#92400e;border:1px solid #fde68a}',
    '.spw-wave-link{display:block;width:100%;padding:12px;background:#00cfff;color:#fff;border-radius:10px;text-align:center;font-weight:700;text-decoration:none;margin-bottom:10px;font-size:14px}',
  ].join('');

  function injectStyles() {
    if (document.getElementById('spw-styles')) return;
    var s = document.createElement('style');
    s.id = 'spw-styles'; s.textContent = CSS;
    document.head.appendChild(s);
  }

  function getOverlay() { return document.getElementById('spw-overlay'); }
  function getBody() { return document.getElementById('spw-body'); }

  function showModal() {
    injectStyles();
    if (getOverlay()) return;
    var overlay = document.createElement('div');
    overlay.id = 'spw-overlay';
    overlay.innerHTML = [
      '<div id="spw-modal"' + (state.theme === 'dark' ? ' class="dark"' : '') + '>',
      '<div id="spw-header">',
      '<div><div class="spw-brand">🔒 SendavaPay</div><div class="spw-secure">Paiement 100% sécurisé</div></div>',
      '<button id="spw-close" onclick="SendavaPay.close()">✕</button>',
      '</div>',
      '<div id="spw-body"><div class="spw-center"><div class="spw-spinner"></div><p>Chargement…</p></div></div>',
      '</div>',
    ].join('');
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) SendavaPay.close(); });
  }

  function closeModal() {
    stopPolling();
    var el = getOverlay();
    if (el) el.parentNode.removeChild(el);
  }

  function setBody(html) {
    var b = getBody();
    if (b) b.innerHTML = html;
  }

  function stopPolling() {
    if (state.interval) { clearInterval(state.interval); state.interval = null; }
  }

  function operatorCard(svc) {
    var color = OPERATOR_COLORS[svc.operator] || '#6366f1';
    var initials = svc.operator.substring(0, 2).toUpperCase();
    var sel = state.selectedService && state.selectedService.id === svc.id;
    return [
      '<div class="spw-op' + (sel ? ' selected' : '') + '" data-svcid="' + svc.id + '" onclick="window.__spwSelectOp(' + svc.id + ')">',
      '<div class="spw-op-icon" style="background:' + color + '">' + initials + '</div>',
      '<div class="spw-op-name">' + svc.operator + '</div>',
      '</div>',
    ].join('');
  }

  function renderPaymentStep() {
    var t = state.transaction;
    var prefix = PREFIXES[state.selectedService ? state.selectedService.countryCode : state.selectedCountry] || '';
    var countries = state.countries.map(function (c) {
      return '<option value="' + c.code + '"' + (c.code === state.selectedCountry ? ' selected' : '') + '>' + (FLAGS[c.code] || '') + ' ' + c.name + '</option>';
    }).join('');
    var ops = state.services.map(operatorCard).join('');
    var html = [
      '<div class="spw-info-box">',
      '<div>',
      '<div class="spw-merchant">Paiement à ' + (t ? escHtml(t.ownerName || 'Marchand') : '') + '</div>',
      '<div class="spw-amount">' + (t ? fmt(t.amount, t.currency) : '') + '</div>',
      '</div>',
      '</div>',
      '<div class="spw-field">',
      '<div class="spw-label">Pays</div>',
      '<select class="spw-select" onchange="window.__spwChangeCountry(this.value)">' + countries + '</select>',
      '</div>',
      '<div class="spw-field">',
      '<div class="spw-label">Opérateur</div>',
      ops ? '<div class="spw-operators">' + ops + '</div>' : '<p style="color:#94a3b8;font-size:13px">Aucun opérateur disponible pour ce pays.</p>',
      '</div>',
      '<div class="spw-field">',
      '<div class="spw-label">Numéro de téléphone</div>',
      '<div class="spw-phone-wrap">',
      '<div class="spw-prefix">' + prefix + '</div>',
      '<input class="spw-phone-input" type="tel" id="spw-phone" placeholder="XX XX XX XX" value="' + escHtml(state.phone) + '" oninput="window.__spwPhone(this.value)" />',
      '</div>',
      '</div>',
      '<button class="spw-btn" id="spw-pay-btn" onclick="window.__spwSubmit()" disabled>',
      'Payer ' + (t ? fmt(t.amount, t.currency) : '') + '</button>',
      '<div class="spw-footer">🔒 Paiement sécurisé · Données chiffrées</div>',
    ].join('');
    setBody(html);
    updatePayBtn();
  }

  function renderLoading(msg) {
    setBody('<div class="spw-center"><div class="spw-spinner"></div><p>' + escHtml(msg || 'Chargement…') + '</p></div>');
  }

  function renderProcessing(msg, waveUrl) {
    var extra = waveUrl
      ? '<a class="spw-wave-link" href="' + escHtml(waveUrl) + '" target="_blank" rel="noopener">Ouvrir Wave pour confirmer →</a>'
      : '<p class="spw-sub">Confirmez le paiement sur votre téléphone.</p>';
    setBody([
      '<div class="spw-center">',
      '<div class="spw-spinner"></div>',
      '<p class="spw-title">Vérification en cours…</p>',
      extra,
      '<p style="font-size:12px;color:#94a3b8">Vérification automatique toutes les 3 s</p>',
      '</div>',
    ].join(''));
  }

  function renderOtp() {
    setBody([
      '<div class="spw-center">',
      '<div class="spw-icon-circle" style="background:#eff6ff;font-size:24px">📩</div>',
      '<p class="spw-title">Code OTP requis</p>',
      '<p class="spw-sub">Entrez le code reçu par SMS pour valider le paiement Orange Money.</p>',
      '</div>',
      '<div class="spw-field">',
      '<input class="spw-otp-input" id="spw-otp" type="number" placeholder="_ _ _ _ _ _" maxlength="6" />',
      '</div>',
      '<button class="spw-btn" onclick="window.__spwOtp()">Confirmer le code</button>',
    ].join(''));
  }

  function renderSuccess(reference) {
    var t = state.transaction;
    setBody([
      '<div class="spw-center">',
      '<div class="spw-icon-circle success">✅</div>',
      '<p class="spw-title" style="color:#16a34a">Paiement réussi !</p>',
      '<p class="spw-sub">Votre paiement de ' + (t ? fmt(t.amount, t.currency) : '') + ' a été effectué.</p>',
      '</div>',
      '<div class="spw-ref-box">Référence : ' + escHtml(reference) + '</div>',
      '<div style="height:12px"></div>',
      '<button class="spw-btn secondary" onclick="SendavaPay.close()">Fermer</button>',
    ].join(''));
  }

  function renderFailed(msg) {
    setBody([
      '<div class="spw-center">',
      '<div class="spw-icon-circle error">❌</div>',
      '<p class="spw-title" style="color:#dc2626">Paiement échoué</p>',
      '<p class="spw-sub">' + escHtml(msg || 'Le paiement a échoué. Veuillez réessayer.') + '</p>',
      '</div>',
      '<button class="spw-btn" onclick="window.__spwRetry()">Réessayer</button>',
      '<div style="height:8px"></div>',
      '<button class="spw-btn secondary" onclick="SendavaPay.close()">Fermer</button>',
    ].join(''));
  }

  function updatePayBtn() {
    var btn = document.getElementById('spw-pay-btn');
    if (!btn) return;
    var ok = state.selectedService && state.phone && state.phone.length >= 6;
    btn.disabled = !ok;
  }

  function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  window.__spwChangeCountry = function (code) {
    state.selectedCountry = code;
    state.selectedService = null;
    loadServices(code);
  };

  window.__spwSelectOp = function (id) {
    state.selectedService = state.services.find(function (s) { return s.id === id; }) || null;
    renderPaymentStep();
  };

  window.__spwPhone = function (v) {
    state.phone = v.replace(/\D/g, '');
    updatePayBtn();
  };

  window.__spwRetry = function () {
    state.phone = '';
    state.payId = null;
    state.orderId = null;
    state.attempts = 0;
    renderPaymentStep();
  };

  window.__spwSubmit = function () {
    if (!state.selectedService || !state.phone) return;
    renderLoading('Initiation du paiement…');
    var t = state.transaction;
    apiFetch('POST', BASE_URL + '/api/pay-api/' + state.reference, {
      payerName: 'Client',
      payerPhone: state.phone,
      payerEmail: '',
      payerCountry: state.selectedService ? state.selectedService.countryCode : state.selectedCountry,
      serviceId: state.selectedService.id,
    }).then(function (data) {
      if (!data.success) {
        renderFailed(data.message || 'Erreur lors du paiement.');
        if (state.onFailed) state.onFailed({ error: data.message });
        return;
      }
      state.payId = data.payId;
      state.orderId = data.orderId;
      if (data.otpRequired) {
        renderOtp();
        return;
      }
      renderProcessing(data.message, data.waveUrl);
      startPolling();
    }).catch(function (err) {
      renderFailed('Erreur de connexion. Vérifiez votre réseau.');
    });
  };

  window.__spwOtp = function () {
    var inp = document.getElementById('spw-otp');
    var otp = inp ? inp.value.trim() : '';
    if (!otp) return;
    renderLoading('Vérification OTP…');
    apiFetch('POST', BASE_URL + '/api/sdk/v1/verify-otp', {
      reference: state.reference,
      otp: otp,
    }).then(function (data) {
      if (!data.success) {
        renderFailed(data.error || 'Code OTP invalide.');
        return;
      }
      renderProcessing('OTP confirmé. Traitement en cours…');
      startPolling();
    }).catch(function () {
      renderFailed('Erreur de connexion.');
    });
  };

  function startPolling() {
    state.attempts = 0;
    stopPolling();
    state.interval = setInterval(function () {
      state.attempts++;
      if (state.attempts >= state.maxAttempts) {
        stopPolling();
        renderFailed('Délai expiré. Le paiement n\'a pas été confirmé à temps.');
        if (state.onFailed) state.onFailed({ error: 'timeout' });
        return;
      }
      apiFetch('POST', BASE_URL + '/api/pay-api/' + state.reference + '/verify', {
        payId: state.payId,
        orderId: state.orderId,
        payerCountry: state.selectedService ? state.selectedService.countryCode : state.selectedCountry,
      }).then(function (data) {
        if (data.status === 'completed') {
          stopPolling();
          renderSuccess(state.reference);
          if (state.onSuccess) state.onSuccess({ reference: state.reference, amount: state.transaction ? state.transaction.amount : null });
        } else if (data.status === 'failed') {
          stopPolling();
          renderFailed(data.message || 'Paiement refusé.');
          if (state.onFailed) state.onFailed({ error: data.message, reference: state.reference });
        }
      }).catch(function () {});
    }, 3000);
  }

  function loadPaymentInfo() {
    apiFetch('GET', BASE_URL + '/api/sdk/widget/token/' + state.token).then(function (data) {
      if (!data.success) {
        setBody('<div class="spw-center"><div class="spw-icon-circle error">❌</div><p class="spw-title">Token invalide</p><p class="spw-sub">' + escHtml(data.error || 'Ce lien de paiement est invalide ou a expiré.') + '</p></div>');
        return;
      }
      state.reference = data.data.reference;
      state.transaction = data.data;
      if (data.data.status !== 'pending') {
        if (data.data.status === 'completed') {
          renderSuccess(state.reference);
          return;
        }
        setBody('<div class="spw-center"><div class="spw-icon-circle error">❌</div><p class="spw-title">Transaction expirée</p><p class="spw-sub">Cette transaction n\'est plus disponible.</p></div>');
        return;
      }
      loadCountries();
    }).catch(function () {
      setBody('<div class="spw-center"><div class="spw-icon-circle error">❌</div><p class="spw-title">Erreur de connexion</p><p class="spw-sub">Impossible de joindre SendavaPay.</p></div>');
    });
  }

  function loadCountries() {
    apiFetch('GET', BASE_URL + '/api/soleaspay/countries').then(function (data) {
      state.countries = Array.isArray(data) ? data : [];
      var preferred = state.transaction ? (state.transaction.payerCountry || null) : null;
      if (preferred && state.countries.find(function (c) { return c.code === preferred; })) {
        state.selectedCountry = preferred;
      } else if (state.countries.length > 0) {
        state.selectedCountry = state.countries[0].code;
      }
      if (state.selectedCountry) loadServices(state.selectedCountry);
      else renderPaymentStep();
    }).catch(function () {
      renderPaymentStep();
    });
  }

  function loadServices(country) {
    renderLoading('Chargement des opérateurs…');
    apiFetch('GET', BASE_URL + '/api/soleaspay/services/' + country).then(function (data) {
      state.services = Array.isArray(data) ? data : [];
      state.selectedService = state.services.length > 0 ? state.services[0] : null;
      renderPaymentStep();
    }).catch(function () {
      state.services = [];
      state.selectedService = null;
      renderPaymentStep();
    });
  }

  var SendavaPay = {
    init: function (opts) {
      if (!opts || !opts.token) { console.error('[SendavaPay] token requis'); return; }
      state.token = opts.token;
      state.onSuccess = opts.onSuccess || null;
      state.onFailed = opts.onFailed || null;
      state.theme = opts.theme || 'light';
      state.reference = null; state.transaction = null;
      state.countries = []; state.services = [];
      state.selectedCountry = null; state.selectedService = null;
      state.phone = ''; state.payId = null; state.orderId = null;
      state.attempts = 0;
      closeModal();
      showModal();
      loadPaymentInfo();
    },
    close: function () { closeModal(); },
  };

  window.SendavaPay = SendavaPay;
})(window, document);
