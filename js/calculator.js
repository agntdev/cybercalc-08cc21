/**
 * CyberCalc — Calculator Engine
 * Core math + UI wiring with sound integration
 */

class Calculator {
  constructor() {
    this.display = document.getElementById('display');
    this.expressionEl = document.getElementById('expression');
    this.reset();
    this._bindKeys();
  }

  reset() {
    this.current = '0';
    this.previous = null;
    this.operation = null;
    this.shouldReset = false;
    this.updateDisplay();
  }

  /* ── Display ──────────────────────────────────────── */
  updateDisplay() {
    this.display.textContent = formatNumber(this.current);
    if (this.expressionEl) {
      this.expressionEl.textContent = this.previous != null
        ? `${formatNumber(this.previous)} ${this.operation || ''}`
        : '';
    }
  }

  /* ── Input handling ───────────────────────────────── */
  inputDigit(d) {
    if (this.shouldReset) {
      this.current = '0';
      this.shouldReset = false;
    }
    if (this.current === '0' && d !== '.') {
      this.current = d;
    } else {
      this.current += d;
    }
    sound.playKeyClick();
    this.updateDisplay();
  }

  inputDecimal() {
    if (this.shouldReset) {
      this.current = '0';
      this.shouldReset = false;
    }
    if (!this.current.includes('.')) {
      this.current += '.';
    }
    sound.playKeyClick();
    this.updateDisplay();
  }

  inputOperator(op) {
    const val = parseFloat(this.current);
    if (this.operation && !this.shouldReset) {
      this._compute();
    } else {
      this.previous = val;
    }
    this.operation = op;
    this.shouldReset = true;
    sound.playKeyClick();
    this.updateDisplay();
  }

  inputEquals() {
    if (!this.operation) return;
    if (this.shouldReset) return; // prevent double-eval
    this._compute();
    this.operation = null;
    this.previous = null;
    this.shouldReset = true;
    sound.playKeyClick();
    this.updateDisplay();
  }

  inputPercent() {
    const val = parseFloat(this.current);
    this.current = String(val / 100);
    sound.playKeyClick();
    this.updateDisplay();
  }

  inputNegate() {
    if (this.current !== '0') {
      this.current = this.current.startsWith('-')
        ? this.current.slice(1)
        : '-' + this.current;
    }
    sound.playKeyClick();
    this.updateDisplay();
  }

  inputBackspace() {
    if (this.current.length > 1) {
      this.current = this.current.slice(0, -1);
    } else {
      this.current = '0';
    }
    sound.playKeyClick();
    this.updateDisplay();
  }

  inputClear() {
    this.reset();
    sound.playKeyClick();
  }

  /* ── Computation ──────────────────────────────────── */
  _compute() {
    const a = this.previous;
    const b = parseFloat(this.current);

    let result;
    switch (this.operation) {
      case '+': result = a + b; break;
      case '−': result = a - b; break;
      case '×': result = a * b; break;
      case '÷':
        if (b === 0) {
          this.current = 'Error';
          this.previous = null;
          this.operation = null;
          sound.playError();
          this.updateDisplay();
          return;
        }
        result = a / b;
        break;
      default: return;
    }

    // Prevent floating-point display madness
    this.current = String(parseFloat(result.toPrecision(12)));
  }

  /* ── Keyboard binding ─────────────────────────────── */
  _bindKeys() {
    const keyMap = {
      '/': '÷', '*': '×', '-': '−', '+': '+',
      Enter: '=', '=': '=',
      Escape: 'C', Backspace: '⌫', '%': '%',
      '.': '.',
    };

    document.addEventListener('keydown', (e) => {
      if (e.key >= '0' && e.key <= '9') {
        this.inputDigit(e.key);
        this._animateKey(e.key);
        return;
      }
      const op = keyMap[e.key];
      if (!op) return;
      e.preventDefault();

      if ('+-×÷'.includes(op)) this.inputOperator(op);
      else if (op === '=') this.inputEquals();
      else if (op === 'C') this.inputClear();
      else if (op === '⌫') this.inputBackspace();
      else if (op === '%') this.inputPercent();
      else if (op === '.') this.inputDecimal();

      this._animateKey(op);
    });
  }

  _animateKey(label) {
    const btn = document.querySelector(`[data-key="${CSS.escape(label)}"]`);
    if (btn) {
      btn.classList.add('active');
      setTimeout(() => btn.classList.remove('active'), 100);
    }
  }
}

/* ── Formatting ─────────────────────────────────────── */
function formatNumber(n) {
  if (n === 'Error') return 'Error';
  const num = parseFloat(n);
  if (isNaN(num)) return '0';
  // Avoid scientific notation for reasonable ranges
  if (Math.abs(num) >= 1e15 || (Math.abs(num) < 1e-10 && num !== 0)) {
    return num.toExponential(4);
  }
  const s = num.toPrecision(12);
  // Remove trailing zeros
  return String(parseFloat(s));
}

// Boot
document.addEventListener('DOMContentLoaded', () => {
  window.calc = new Calculator();
});
