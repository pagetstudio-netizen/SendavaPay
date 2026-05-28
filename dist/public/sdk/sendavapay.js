/* SendavaPay SDK v2.0 — Client API navigateur (sans interface) */
(function (root, factory) {
  'use strict';
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.SendavaPay = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var DEFAULT_BASE_URL = (function () {
    if (typeof document !== 'undefined') {
      var scripts = document.getElementsByTagName('script');
      for (var i = 0; i < scripts.length; i++) {
        var src = scripts[i].src;
        if (src && src.indexOf('/sdk/sendavapay.js') !== -1) {
          try { var u = new URL(src); return u.protocol + '//' + u.host; } catch (e) {}
        }
      }
    }
    return 'https://sendavapay.com';
  })();

  function SendavaPay(options) {
    if (!(this instanceof SendavaPay)) return new SendavaPay(options);
    if (!options || !options.token) throw new Error('SendavaPay: options.token est requis');
    this._token = options.token;
    this._baseUrl = (options.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '');
    this._reference = null;
    this._transaction = null;
  }

  SendavaPay.prototype._fetch = function (method, path, body) {
    var url = this._baseUrl + path;
    var opts = {
      method: method,
      mode: 'cors',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) opts.body = JSON.stringify(body);
    return fetch(url, opts).then(function (r) { return r.json(); });
  };

  /**
   * Valide le token et récupère les détails de la transaction.
   * À appeler en premier sur votre page de paiement.
   * @returns {Promise<{reference, amount, currency, description, customerName, customerEmail}>}
   */
  SendavaPay.prototype.getDetails = function () {
    var self = this;
    return this._fetch('GET', '/api/sdk/widget/token/' + this._token)
      .then(function (res) {
        if (!res.success) throw new Error(res.message || 'Token invalide ou expiré');
        self._reference = res.data.reference;
        self._transaction = res.data;
        return res.data;
      });
  };

  /**
   * Récupère la liste des pays et opérateurs disponibles.
   * @returns {Promise<Array<{code, name, currency, operators}>>}
   */
  SendavaPay.prototype.getCountries = function () {
    return this._fetch('GET', '/api/soleaspay/countries')
      .then(function (res) { return Array.isArray(res) ? res : (res.countries || []); });
  };

  /**
   * Récupère les opérateurs pour un pays donné.
   * @param {string} countryCode  Ex: "SN", "CI", "TG"
   * @returns {Promise<Array<{id, name, code}>>}
   */
  SendavaPay.prototype.getServices = function (countryCode) {
    return this._fetch('GET', '/api/soleaspay/services/' + countryCode)
      .then(function (res) { return Array.isArray(res) ? res : []; });
  };

  /**
   * Lance le paiement avec les informations du payeur.
   * @param {{payerName, payerPhone, payerEmail, payerCountry, serviceId}} params
   * @returns {Promise<{success, requiresOtp, payId, orderId, message}>}
   */
  SendavaPay.prototype.initiatePayment = function (params) {
    if (!this._reference) throw new Error('Appelez getDetails() d\'abord');
    return this._fetch('POST', '/api/pay-api/' + this._reference, params);
  };

  /**
   * Soumet le code OTP reçu par SMS pour confirmer le paiement.
   * @param {{payId, orderId, otp}} params
   * @returns {Promise<{success, message}>}
   */
  SendavaPay.prototype.verifyOtp = function (params) {
    return this._fetch('POST', '/api/pay-api/' + this._reference + '/verify', params);
  };

  /**
   * Vérifie le statut actuel du paiement.
   * @returns {Promise<{status: 'pending'|'completed'|'failed', reference, amount, currency}>}
   */
  SendavaPay.prototype.getStatus = function () {
    if (!this._reference) throw new Error('Appelez getDetails() d\'abord');
    return this._fetch('GET', '/api/sdk/v1/payment-status/' + this._reference)
      .then(function (res) { return res.data || res; });
  };

  /**
   * Lance un polling automatique jusqu'à ce que le paiement soit terminé.
   * @param {{onSuccess, onFailed, interval, maxAttempts}} opts
   * @returns {{ stop: Function }} — appeler stop() pour annuler le polling
   */
  SendavaPay.prototype.pollStatus = function (opts) {
    var self = this;
    var interval = (opts.interval || 3) * 1000;
    var max = opts.maxAttempts || 40;
    var attempts = 0;
    var stopped = false;

    function check() {
      if (stopped) return;
      self.getStatus().then(function (data) {
        attempts++;
        if (data.status === 'completed') {
          stopped = true;
          if (opts.onSuccess) opts.onSuccess(data);
        } else if (data.status === 'failed' || data.status === 'cancelled') {
          stopped = true;
          if (opts.onFailed) opts.onFailed(data);
        } else if (attempts >= max) {
          stopped = true;
          if (opts.onFailed) opts.onFailed({ status: 'timeout', message: 'Délai dépassé' });
        } else {
          setTimeout(check, interval);
        }
      }).catch(function () {
        if (attempts < max && !stopped) setTimeout(check, interval);
      });
    }

    setTimeout(check, interval);
    return { stop: function () { stopped = true; } };
  };

  return SendavaPay;
}));
