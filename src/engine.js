// Core calculator engine: arithmetic, scientific, and memory operations.
// Pure functions throw `CalculatorError` for domain/argument problems so
// callers can surface meaningful messages instead of NaN / Infinity.

export const PI = Math.PI;
export const E = Math.E;

export const ERR = Object.freeze({
  INVALID_ARGUMENT: 'INVALID_ARGUMENT',
  DIVISION_BY_ZERO: 'DIVISION_BY_ZERO',
  DOMAIN_ERROR: 'DOMAIN_ERROR',
  OVERFLOW: 'OVERFLOW',
});

export class CalculatorError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'CalculatorError';
    this.code = code;
  }
}

function requireFiniteNumber(x, label = 'value') {
  if (typeof x !== 'number' || !Number.isFinite(x)) {
    throw new CalculatorError(
      ERR.INVALID_ARGUMENT,
      `${label} must be a finite number`,
    );
  }
}

function requireInteger(x, label = 'value') {
  requireFiniteNumber(x, label);
  if (!Number.isInteger(x)) {
    throw new CalculatorError(ERR.INVALID_ARGUMENT, `${label} must be an integer`);
  }
}

function guardOverflow(result) {
  if (!Number.isFinite(result)) {
    throw new CalculatorError(ERR.OVERFLOW, 'result is not a finite number');
  }
  return result;
}

// --- arithmetic --------------------------------------------------------------

export function add(a, b) {
  requireFiniteNumber(a, 'a');
  requireFiniteNumber(b, 'b');
  return guardOverflow(a + b);
}

export function subtract(a, b) {
  requireFiniteNumber(a, 'a');
  requireFiniteNumber(b, 'b');
  return guardOverflow(a - b);
}

export function multiply(a, b) {
  requireFiniteNumber(a, 'a');
  requireFiniteNumber(b, 'b');
  return guardOverflow(a * b);
}

export function divide(a, b) {
  requireFiniteNumber(a, 'a');
  requireFiniteNumber(b, 'b');
  if (b === 0) {
    throw new CalculatorError(ERR.DIVISION_BY_ZERO, 'cannot divide by zero');
  }
  return guardOverflow(a / b);
}

export function modulo(a, b) {
  requireFiniteNumber(a, 'a');
  requireFiniteNumber(b, 'b');
  if (b === 0) {
    throw new CalculatorError(ERR.DIVISION_BY_ZERO, 'cannot modulo by zero');
  }
  return a % b;
}

export function negate(x) {
  requireFiniteNumber(x, 'x');
  return -x;
}

export function abs(x) {
  requireFiniteNumber(x, 'x');
  return Math.abs(x);
}

export function reciprocal(x) {
  requireFiniteNumber(x, 'x');
  if (x === 0) {
    throw new CalculatorError(ERR.DIVISION_BY_ZERO, 'reciprocal of zero');
  }
  return 1 / x;
}

// percent(part, whole) -> part as a percentage of whole, i.e. part/whole*100.
export function percent(part, whole) {
  requireFiniteNumber(part, 'part');
  requireFiniteNumber(whole, 'whole');
  if (whole === 0) {
    throw new CalculatorError(ERR.DIVISION_BY_ZERO, 'whole must be non-zero');
  }
  return (part / whole) * 100;
}

// --- powers and roots --------------------------------------------------------

export function power(base, exponent) {
  requireFiniteNumber(base, 'base');
  requireFiniteNumber(exponent, 'exponent');
  if (base === 0 && exponent < 0) {
    throw new CalculatorError(ERR.DOMAIN_ERROR, '0 raised to a negative power');
  }
  if (base < 0 && !Number.isInteger(exponent)) {
    throw new CalculatorError(
      ERR.DOMAIN_ERROR,
      'negative base with non-integer exponent yields a complex result',
    );
  }
  return guardOverflow(base ** exponent);
}

export function sqrt(x) {
  requireFiniteNumber(x, 'x');
  if (x < 0) {
    throw new CalculatorError(ERR.DOMAIN_ERROR, 'sqrt of a negative number');
  }
  return Math.sqrt(x);
}

export function cbrt(x) {
  requireFiniteNumber(x, 'x');
  return Math.cbrt(x);
}

export function nthRoot(x, n) {
  requireFiniteNumber(x, 'x');
  requireInteger(n, 'n');
  if (n === 0) {
    throw new CalculatorError(ERR.INVALID_ARGUMENT, 'root index must be non-zero');
  }
  if (x < 0 && n % 2 === 0) {
    throw new CalculatorError(ERR.DOMAIN_ERROR, 'even root of a negative number');
  }
  // Preserve sign for odd roots of negative numbers.
  const sign = x < 0 ? -1 : 1;
  return sign * Math.abs(x) ** (1 / n);
}

// --- factorial ---------------------------------------------------------------

// 170! is the largest factorial representable as a finite double.
const MAX_FACTORIAL = 170;

export function factorial(n) {
  requireInteger(n, 'n');
  if (n < 0) {
    throw new CalculatorError(ERR.DOMAIN_ERROR, 'factorial of a negative integer');
  }
  if (n > MAX_FACTORIAL) {
    throw new CalculatorError(ERR.OVERFLOW, `factorial(${n}) overflows`);
  }
  let result = 1;
  for (let i = 2; i <= n; i += 1) {
    result *= i;
  }
  return result;
}

// --- combinatorics -----------------------------------------------------------

// nPr = n * (n-1) * … * (n-r+1). Computed iteratively so we don't hit the
// 170! ceiling for combinations of larger n with small r.
export function permutations(n, r) {
  requireInteger(n, 'n');
  requireInteger(r, 'r');
  if (n < 0 || r < 0) {
    throw new CalculatorError(ERR.DOMAIN_ERROR, 'n and r must be non-negative');
  }
  if (r > n) {
    throw new CalculatorError(ERR.DOMAIN_ERROR, 'r must not exceed n');
  }
  let result = 1;
  for (let i = 0; i < r; i += 1) {
    result *= n - i;
  }
  return guardOverflow(result);
}

// nCr = nPr / r!  computed iteratively to keep intermediate values smaller.
export function combinations(n, r) {
  requireInteger(n, 'n');
  requireInteger(r, 'r');
  if (n < 0 || r < 0) {
    throw new CalculatorError(ERR.DOMAIN_ERROR, 'n and r must be non-negative');
  }
  if (r > n) {
    throw new CalculatorError(ERR.DOMAIN_ERROR, 'r must not exceed n');
  }
  // Symmetry: C(n, r) = C(n, n-r).
  const k = Math.min(r, n - r);
  let result = 1;
  for (let i = 1; i <= k; i += 1) {
    result = (result * (n - k + i)) / i;
  }
  return guardOverflow(result);
}

// --- angle conversion --------------------------------------------------------

export function degToRad(deg) {
  requireFiniteNumber(deg, 'deg');
  return (deg * PI) / 180;
}

export function radToDeg(rad) {
  requireFiniteNumber(rad, 'rad');
  return (rad * 180) / PI;
}

// --- trigonometry (radians) --------------------------------------------------

export function sin(x) {
  requireFiniteNumber(x, 'x');
  return Math.sin(x);
}

export function cos(x) {
  requireFiniteNumber(x, 'x');
  return Math.cos(x);
}

export function tan(x) {
  requireFiniteNumber(x, 'x');
  return Math.tan(x);
}

export function asin(x) {
  requireFiniteNumber(x, 'x');
  if (x < -1 || x > 1) {
    throw new CalculatorError(ERR.DOMAIN_ERROR, 'asin argument outside [-1, 1]');
  }
  return Math.asin(x);
}

export function acos(x) {
  requireFiniteNumber(x, 'x');
  if (x < -1 || x > 1) {
    throw new CalculatorError(ERR.DOMAIN_ERROR, 'acos argument outside [-1, 1]');
  }
  return Math.acos(x);
}

export function atan(x) {
  requireFiniteNumber(x, 'x');
  return Math.atan(x);
}

// --- trigonometry (degrees) --------------------------------------------------

export function sinDeg(deg) {
  return sin(degToRad(deg));
}

export function cosDeg(deg) {
  return cos(degToRad(deg));
}

export function tanDeg(deg) {
  return tan(degToRad(deg));
}

export function asinDeg(x) {
  return radToDeg(asin(x));
}

export function acosDeg(x) {
  return radToDeg(acos(x));
}

export function atanDeg(x) {
  return radToDeg(atan(x));
}

// --- hyperbolic trigonometry -------------------------------------------------

export function sinh(x) {
  requireFiniteNumber(x, 'x');
  return guardOverflow(Math.sinh(x));
}

export function cosh(x) {
  requireFiniteNumber(x, 'x');
  return guardOverflow(Math.cosh(x));
}

export function tanh(x) {
  requireFiniteNumber(x, 'x');
  return Math.tanh(x);
}

export function asinh(x) {
  requireFiniteNumber(x, 'x');
  return Math.asinh(x);
}

export function acosh(x) {
  requireFiniteNumber(x, 'x');
  if (x < 1) {
    throw new CalculatorError(ERR.DOMAIN_ERROR, 'acosh argument must be >= 1');
  }
  return Math.acosh(x);
}

export function atanh(x) {
  requireFiniteNumber(x, 'x');
  if (x <= -1 || x >= 1) {
    throw new CalculatorError(ERR.DOMAIN_ERROR, 'atanh argument must be in (-1, 1)');
  }
  return Math.atanh(x);
}

// --- exponentials and logarithms --------------------------------------------

export function exp(x) {
  requireFiniteNumber(x, 'x');
  return guardOverflow(Math.exp(x));
}

export function ln(x) {
  requireFiniteNumber(x, 'x');
  if (x <= 0) {
    throw new CalculatorError(ERR.DOMAIN_ERROR, 'ln of non-positive number');
  }
  return Math.log(x);
}

export function log10(x) {
  requireFiniteNumber(x, 'x');
  if (x <= 0) {
    throw new CalculatorError(ERR.DOMAIN_ERROR, 'log10 of non-positive number');
  }
  return Math.log10(x);
}

export function logBase(base, x) {
  requireFiniteNumber(base, 'base');
  requireFiniteNumber(x, 'x');
  if (base <= 0 || base === 1) {
    throw new CalculatorError(ERR.DOMAIN_ERROR, 'log base must be positive and not equal to 1');
  }
  if (x <= 0) {
    throw new CalculatorError(ERR.DOMAIN_ERROR, 'log of non-positive number');
  }
  return Math.log(x) / Math.log(base);
}

// --- memory ------------------------------------------------------------------

// Models the M+/M-/MR/MC/MS keys on a typical scientific calculator.
export class Memory {
  #value = 0;

  recall() {
    return this.#value;
  }

  store(value) {
    requireFiniteNumber(value, 'value');
    this.#value = value;
    return this.#value;
  }

  clear() {
    this.#value = 0;
    return this.#value;
  }

  add(value) {
    requireFiniteNumber(value, 'value');
    this.#value = guardOverflow(this.#value + value);
    return this.#value;
  }

  subtract(value) {
    requireFiniteNumber(value, 'value');
    this.#value = guardOverflow(this.#value - value);
    return this.#value;
  }
}
