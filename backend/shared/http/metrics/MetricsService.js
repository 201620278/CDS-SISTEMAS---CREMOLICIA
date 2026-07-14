/**
 * MetricsService — Serviço de métricas para observabilidade.
 *
 * Sprint 2.5.5: Hardening da API — infraestrutura de métricas.
 *
 * @module backend/shared/http/metrics/MetricsService
 */

class MetricsService {
  /**
   * Cria serviço de métricas.
   * @param {Object} [options]
   * @param {boolean} [options.enabled] - Habilita métricas (padrão: true)
   * @param {boolean} [options.includeMemory] - Inclui métricas de memória
   * @param {boolean} [options.includeCpu] - Inclui métricas de CPU
   * @returns {MetricsService}
   */
  static create(options = {}) {
    const enabled = options.enabled !== undefined ? options.enabled : true;
    const includeMemory = options.includeMemory !== undefined ? options.includeMemory : true;
    const includeCpu = options.includeCpu !== undefined ? options.includeCpu : false;

    return new MetricsService({
      enabled,
      includeMemory,
      includeCpu
    });
  }

  constructor(options) {
    this._enabled = options.enabled;
    this._includeMemory = options.includeMemory;
    this._includeCpu = options.includeCpu;
    this._counters = new Map();
    this._gauges = new Map();
    this._histograms = new Map();
    this._timers = new Map();
  }

  /**
   * Incrementa um contador.
   * @param {string} name - Nome do contador
   * @param {number} [value=1] - Valor a incrementar
   * @param {Object} [labels] - Labels adicionais
   * @returns {void}
   */
  increment(name, value = 1, labels = {}) {
    if (!this._enabled) return;

    const key = this._makeKey(name, labels);
    const current = this._counters.get(key) || 0;
    this._counters.set(key, current + value);
  }

  /**
   * Define um gauge.
   * @param {string} name - Nome do gauge
   * @param {number} value - Valor
   * @param {Object} [labels] - Labels adicionais
   * @returns {void}
   */
  gauge(name, value, labels = {}) {
    if (!this._enabled) return;

    const key = this._makeKey(name, labels);
    this._gauges.set(key, value);
  }

  /**
   * Registra uma duração (histograma).
   * @param {string} name - Nome do histograma
   * @param {number} duration - Duração em milissegundos
   * @param {Object} [labels] - Labels adicionais
   * @returns {void}
   */
  histogram(name, duration, labels = {}) {
    if (!this._enabled) return;

    const key = this._makeKey(name, labels);
    if (!this._histograms.has(key)) {
      this._histograms.set(key, []);
    }
    this._histograms.get(key).push(duration);
  }

  /**
   * Inicia um timer.
   * @param {string} name - Nome do timer
   * @param {Object} [labels] - Labels adicionais
   * @returns {Function} - Função para parar o timer
   */
  timer(name, labels = {}) {
    if (!this._enabled) {
      return () => {};
    }

    const start = Date.now();
    const key = this._makeKey(name, labels);

    return () => {
      const duration = Date.now() - start;
      this.histogram(name, duration, labels);
    };
  }

  /**
   * Obtém todas as métricas.
   * @returns {Object}
   */
  getMetrics() {
    if (!this._enabled) {
      return {};
    }

    const metrics = {
      counters: this._mapToObject(this._counters),
      gauges: this._mapToObject(this._gauges),
      histograms: {}
    };

    for (const [key, values] of this._histograms.entries()) {
      metrics.histograms[key] = {
        count: values.length,
        sum: values.reduce((a, b) => a + b, 0),
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        p50: this._percentile(values, 50),
        p90: this._percentile(values, 90),
        p95: this._percentile(values, 95),
        p99: this._percentile(values, 99)
      };
    }

    if (this._includeMemory) {
      metrics.memory = this._getMemoryMetrics();
    }

    if (this._includeCpu) {
      metrics.cpu = this._getCpuMetrics();
    }

    return metrics;
  }

  /**
   * Obtém métricas no formato Prometheus.
   * @returns {string}
   */
  getPrometheusMetrics() {
    if (!this._enabled) {
      return '';
    }

    let output = '';

    // Counters
    for (const [key, value] of this._counters.entries()) {
      const { name, labels } = this._parseKey(key);
      const labelStr = this._formatLabels(labels);
      output += `# TYPE ${name} counter\n`;
      output += `${name}${labelStr} ${value}\n`;
    }

    // Gauges
    for (const [key, value] of this._gauges.entries()) {
      const { name, labels } = this._parseKey(key);
      const labelStr = this._formatLabels(labels);
      output += `# TYPE ${name} gauge\n`;
      output += `${name}${labelStr} ${value}\n`;
    }

    // Histograms
    for (const [key, values] of this._histograms.entries()) {
      const { name, labels } = this._parseKey(key);
      const labelStr = this._formatLabels(labels);
      const sorted = [...values].sort((a, b) => a - b);

      output += `# TYPE ${name} histogram\n`;
      output += `${name}_count${labelStr} ${values.length}\n`;
      output += `${name}_sum${labelStr} ${sorted.reduce((a, b) => a + b, 0)}\n`;

      const buckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
      for (const bucket of buckets) {
        const count = sorted.filter(v => v <= bucket * 1000).length;
        output += `${name}_bucket${labelStr},le="${bucket}" ${count}\n`;
      }
      output += `${name}_bucket${labelStr},le="+Inf" ${values.length}\n`;
    }

    return output;
  }

  /**
   * Reseta todas as métricas.
   * @returns {void}
   */
  reset() {
    this._counters.clear();
    this._gauges.clear();
    this._histograms.clear();
    this._timers.clear();
  }

  /**
   * Obtém métricas de memória.
   * @private
   */
  _getMemoryMetrics() {
    const usage = process.memoryUsage();
    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      rss: usage.rss,
      external: usage.external,
      arrayBuffers: usage.arrayBuffers,
      heapUsedPercentage: (usage.heapUsed / usage.heapTotal) * 100
    };
  }

  /**
   * Obtém métricas de CPU.
   * @private
   */
  _getCpuMetrics() {
    const usage = process.cpuUsage();
    return {
      user: usage.user,
      system: usage.system
    };
  }

  /**
   * Calcula percentil.
   * @private
   */
  _percentile(values, p) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Cria chave única.
   * @private
   */
  _makeKey(name, labels) {
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return labelStr ? `${name}{${labelStr}}` : name;
  }

  /**
   * Parse chave.
   * @private
   */
  _parseKey(key) {
    const match = key.match(/^(.+?)\{(.*)\}$/);
    if (match) {
      const name = match[1];
      const labels = {};
      match[2].split(',').forEach(pair => {
        const [k, v] = pair.split('=');
        labels[k] = v.replace(/"/g, '');
      });
      return { name, labels };
    }
    return { name: key, labels: {} };
  }

  /**
   * Formata labels.
   * @private
   */
  _formatLabels(labels) {
    const entries = Object.entries(labels);
    if (entries.length === 0) return '';
    const labelStr = entries.map(([k, v]) => `${k}="${v}"`).join(',');
    return `{${labelStr}}`;
  }

  /**
   * Converte Map para Object.
   * @private
   */
  _mapToObject(map) {
    const obj = {};
    for (const [key, value] of map.entries()) {
      obj[key] = value;
    }
    return obj;
  }
}

module.exports = MetricsService;
