import { describe, expect, it } from 'vitest';

import {
  abs,
  acos,
  add,
  asin,
  atan,
  CalculatorError,
  cbrt,
  cos,
  divide,
  ERR,
  exp,
  factorial,
  ln,
  log10,
  logBase,
  Memory,
  modulo,
  multiply,
  negate,
  nthRoot,
  percent,
  power,
  sin,
  sqrt,
  subtract,
  tan,
} from '../src/engine.js';

const PI = Math.PI;

function expectCode(fn, code) {
  try {
    fn();
  } catch (err) {
    expect(err).toBeInstanceOf(CalculatorError);
    expect(err.code).toBe(code);
    return;
  }
  throw new Error(`expected ${code} but no error was thrown`);
}

describe('CalculatorError', () => {
  it('exposes the code field', () => {
    const err = new CalculatorError(ERR.OVERFLOW, 'too big');
    expect(err.code).toBe('OVERFLOW');
    expect(err.name).toBe('CalculatorError');
    expect(err).toBeInstanceOf(Error);
  });
});

describe('add', () => {
  it('adds two positive numbers', () => expect(add(2, 3)).toBe(5));
  it('adds with a negative', () => expect(add(5, -3)).toBe(2));
  it('adds two negatives', () => expect(add(-2, -3)).toBe(-5));
  it('adds zero on the right', () => expect(add(7, 0)).toBe(7));
  it('adds zero on the left', () => expect(add(0, 7)).toBe(7));
  it('adds decimals', () => expect(add(0.1, 0.2)).toBeCloseTo(0.3));
  it('throws on NaN', () => expectCode(() => add(NaN, 1), ERR.INVALID_ARGUMENT));
  it('throws on Infinity', () => expectCode(() => add(Infinity, 1), ERR.INVALID_ARGUMENT));
  it('throws on a non-number', () => expectCode(() => add('1', 1), ERR.INVALID_ARGUMENT));
  it('detects overflow', () => expectCode(() => add(Number.MAX_VALUE, Number.MAX_VALUE), ERR.OVERFLOW));
});

describe('subtract', () => {
  it('subtracts positives', () => expect(subtract(5, 3)).toBe(2));
  it('subtracts to a negative', () => expect(subtract(3, 5)).toBe(-2));
  it('subtracts a negative (double negative)', () => expect(subtract(5, -3)).toBe(8));
  it('subtracts zero', () => expect(subtract(5, 0)).toBe(5));
  it('subtracts from zero', () => expect(subtract(0, 5)).toBe(-5));
  it('subtracts decimals', () => expect(subtract(1.5, 0.5)).toBe(1));
  it('throws on NaN', () => expectCode(() => subtract(1, NaN), ERR.INVALID_ARGUMENT));
});

describe('multiply', () => {
  it('multiplies positives', () => expect(multiply(3, 4)).toBe(12));
  it('multiplies by zero', () => expect(multiply(123, 0)).toBe(0));
  it('handles a negative factor', () => expect(multiply(-2, 5)).toBe(-10));
  it('multiplies two negatives', () => expect(multiply(-2, -5)).toBe(10));
  it('multiplies decimals', () => expect(multiply(0.5, 4)).toBe(2));
  it('throws on NaN', () => expectCode(() => multiply(NaN, 1), ERR.INVALID_ARGUMENT));
  it('detects overflow', () => expectCode(() => multiply(Number.MAX_VALUE, 2), ERR.OVERFLOW));
});

describe('divide', () => {
  it('divides positives', () => expect(divide(12, 4)).toBe(3));
  it('divides with non-integer result', () => expect(divide(7, 2)).toBe(3.5));
  it('divides a negative', () => expect(divide(-12, 4)).toBe(-3));
  it('divides two negatives', () => expect(divide(-12, -4)).toBe(3));
  it('divides zero by a number', () => expect(divide(0, 5)).toBe(0));
  it('throws on division by zero', () => expectCode(() => divide(5, 0), ERR.DIVISION_BY_ZERO));
  it('throws on division of zero by zero', () => expectCode(() => divide(0, 0), ERR.DIVISION_BY_ZERO));
  it('throws on NaN', () => expectCode(() => divide(NaN, 1), ERR.INVALID_ARGUMENT));
  it('throws on Infinity divisor', () => expectCode(() => divide(1, Infinity), ERR.INVALID_ARGUMENT));
});

describe('modulo', () => {
  it('computes basic modulo', () => expect(modulo(10, 3)).toBe(1));
  it('handles exact division', () => expect(modulo(9, 3)).toBe(0));
  it('keeps the sign of the dividend', () => expect(modulo(-10, 3)).toBe(-1));
  it('works with decimals', () => expect(modulo(5.5, 2)).toBeCloseTo(1.5));
  it('throws on modulo by zero', () => expectCode(() => modulo(5, 0), ERR.DIVISION_BY_ZERO));
});

describe('negate', () => {
  it('negates a positive', () => expect(negate(5)).toBe(-5));
  it('negates a negative', () => expect(negate(-5)).toBe(5));
  it('negates zero', () => expect(Object.is(negate(0), -0)).toBe(true));
  it('throws on NaN', () => expectCode(() => negate(NaN), ERR.INVALID_ARGUMENT));
});

describe('abs', () => {
  it('returns positive unchanged', () => expect(abs(5)).toBe(5));
  it('flips a negative', () => expect(abs(-5)).toBe(5));
  it('zero stays zero', () => expect(abs(0)).toBe(0));
  it('throws on NaN', () => expectCode(() => abs(NaN), ERR.INVALID_ARGUMENT));
});

describe('percent', () => {
  it('computes part / whole as a percentage', () => expect(percent(50, 200)).toBe(25));
  it('handles 100%', () => expect(percent(7, 7)).toBe(100));
  it('handles 0%', () => expect(percent(0, 5)).toBe(0));
  it('throws when whole is zero', () => expectCode(() => percent(5, 0), ERR.DIVISION_BY_ZERO));
});

describe('power', () => {
  it('raises to a positive integer', () => expect(power(2, 10)).toBe(1024));
  it('raises to zero', () => expect(power(123, 0)).toBe(1));
  it('raises to one', () => expect(power(7, 1)).toBe(7));
  it('raises to a negative exponent', () => expect(power(2, -2)).toBe(0.25));
  it('handles fractional exponent on positive base', () => expect(power(9, 0.5)).toBe(3));
  it('handles a negative integer exponent on negative base', () => expect(power(-2, 3)).toBe(-8));
  it('throws for 0 ** negative', () => expectCode(() => power(0, -1), ERR.DOMAIN_ERROR));
  it('throws for negative base with non-integer exponent', () =>
    expectCode(() => power(-2, 0.5), ERR.DOMAIN_ERROR));
  it('detects overflow', () => expectCode(() => power(10, 1000), ERR.OVERFLOW));
});

describe('sqrt', () => {
  it('square roots a perfect square', () => expect(sqrt(9)).toBe(3));
  it('roots zero', () => expect(sqrt(0)).toBe(0));
  it('roots a non-perfect square', () => expect(sqrt(2)).toBeCloseTo(Math.SQRT2));
  it('throws on negative input', () => expectCode(() => sqrt(-1), ERR.DOMAIN_ERROR));
  it('throws on NaN', () => expectCode(() => sqrt(NaN), ERR.INVALID_ARGUMENT));
});

describe('cbrt', () => {
  it('cube roots a perfect cube', () => expect(cbrt(27)).toBe(3));
  it('cube roots a negative cube', () => expect(cbrt(-27)).toBe(-3));
  it('cube roots zero', () => expect(cbrt(0)).toBe(0));
  it('throws on NaN', () => expectCode(() => cbrt(NaN), ERR.INVALID_ARGUMENT));
});

describe('nthRoot', () => {
  it('takes the 4th root of 16', () => expect(nthRoot(16, 4)).toBeCloseTo(2));
  it('takes an odd root of a negative number', () => expect(nthRoot(-8, 3)).toBeCloseTo(-2));
  it('takes the 1st root', () => expect(nthRoot(5, 1)).toBe(5));
  it('throws on even root of negative', () => expectCode(() => nthRoot(-16, 4), ERR.DOMAIN_ERROR));
  it('throws on n=0', () => expectCode(() => nthRoot(16, 0), ERR.INVALID_ARGUMENT));
  it('throws on non-integer n', () => expectCode(() => nthRoot(16, 1.5), ERR.INVALID_ARGUMENT));
});

describe('factorial', () => {
  it('factorial of 0 is 1', () => expect(factorial(0)).toBe(1));
  it('factorial of 1 is 1', () => expect(factorial(1)).toBe(1));
  it('factorial of 5', () => expect(factorial(5)).toBe(120));
  it('factorial of 10', () => expect(factorial(10)).toBe(3628800));
  it('factorial of 20', () => expect(factorial(20)).toBe(2432902008176640000));
  it('throws on negative', () => expectCode(() => factorial(-1), ERR.DOMAIN_ERROR));
  it('throws on non-integer', () => expectCode(() => factorial(1.5), ERR.INVALID_ARGUMENT));
  it('throws on NaN', () => expectCode(() => factorial(NaN), ERR.INVALID_ARGUMENT));
  it('throws on overflow at 171', () => expectCode(() => factorial(171), ERR.OVERFLOW));
  it('factorial of 170 stays finite', () => expect(Number.isFinite(factorial(170))).toBe(true));
});

describe('sin / cos / tan', () => {
  it('sin(0) is 0', () => expect(sin(0)).toBe(0));
  it('sin(π/2) is 1', () => expect(sin(PI / 2)).toBeCloseTo(1));
  it('sin(π) is ~0', () => expect(sin(PI)).toBeCloseTo(0));
  it('sin(-π/2) is -1', () => expect(sin(-PI / 2)).toBeCloseTo(-1));
  it('sin throws on NaN', () => expectCode(() => sin(NaN), ERR.INVALID_ARGUMENT));

  it('cos(0) is 1', () => expect(cos(0)).toBe(1));
  it('cos(π/2) is ~0', () => expect(cos(PI / 2)).toBeCloseTo(0));
  it('cos(π) is -1', () => expect(cos(PI)).toBeCloseTo(-1));
  it('cos throws on NaN', () => expectCode(() => cos(NaN), ERR.INVALID_ARGUMENT));

  it('tan(0) is 0', () => expect(tan(0)).toBe(0));
  it('tan(π/4) is ~1', () => expect(tan(PI / 4)).toBeCloseTo(1));
  it('tan(π) is ~0', () => expect(tan(PI)).toBeCloseTo(0));
  it('tan throws on NaN', () => expectCode(() => tan(NaN), ERR.INVALID_ARGUMENT));
});

describe('asin / acos / atan', () => {
  it('asin(0) is 0', () => expect(asin(0)).toBe(0));
  it('asin(1) is π/2', () => expect(asin(1)).toBeCloseTo(PI / 2));
  it('asin(-1) is -π/2', () => expect(asin(-1)).toBeCloseTo(-PI / 2));
  it('asin throws above 1', () => expectCode(() => asin(1.0001), ERR.DOMAIN_ERROR));
  it('asin throws below -1', () => expectCode(() => asin(-1.0001), ERR.DOMAIN_ERROR));

  it('acos(1) is 0', () => expect(acos(1)).toBeCloseTo(0));
  it('acos(0) is π/2', () => expect(acos(0)).toBeCloseTo(PI / 2));
  it('acos(-1) is π', () => expect(acos(-1)).toBeCloseTo(PI));
  it('acos throws out of range', () => expectCode(() => acos(2), ERR.DOMAIN_ERROR));

  it('atan(0) is 0', () => expect(atan(0)).toBe(0));
  it('atan(1) is π/4', () => expect(atan(1)).toBeCloseTo(PI / 4));
  it('atan(-1) is -π/4', () => expect(atan(-1)).toBeCloseTo(-PI / 4));
  it('atan throws on NaN', () => expectCode(() => atan(NaN), ERR.INVALID_ARGUMENT));
});

describe('exp / ln / log10 / logBase', () => {
  it('exp(0) is 1', () => expect(exp(0)).toBe(1));
  it('exp(1) is e', () => expect(exp(1)).toBeCloseTo(Math.E));
  it('exp throws on overflow', () => expectCode(() => exp(1e6), ERR.OVERFLOW));

  it('ln(1) is 0', () => expect(ln(1)).toBe(0));
  it('ln(e) is 1', () => expect(ln(Math.E)).toBeCloseTo(1));
  it('ln throws on zero', () => expectCode(() => ln(0), ERR.DOMAIN_ERROR));
  it('ln throws on negative', () => expectCode(() => ln(-1), ERR.DOMAIN_ERROR));

  it('log10(1) is 0', () => expect(log10(1)).toBe(0));
  it('log10(10) is 1', () => expect(log10(10)).toBe(1));
  it('log10(100) is 2', () => expect(log10(100)).toBe(2));
  it('log10(1000) is 3', () => expect(log10(1000)).toBeCloseTo(3));
  it('log10 throws on zero', () => expectCode(() => log10(0), ERR.DOMAIN_ERROR));
  it('log10 throws on negative', () => expectCode(() => log10(-5), ERR.DOMAIN_ERROR));

  it('logBase(2, 8) is 3', () => expect(logBase(2, 8)).toBeCloseTo(3));
  it('logBase(3, 27) is 3', () => expect(logBase(3, 27)).toBeCloseTo(3));
  it('logBase(10, 1000) is 3', () => expect(logBase(10, 1000)).toBeCloseTo(3));
  it('logBase throws on base 1', () => expectCode(() => logBase(1, 5), ERR.DOMAIN_ERROR));
  it('logBase throws on negative base', () => expectCode(() => logBase(-2, 5), ERR.DOMAIN_ERROR));
  it('logBase throws on non-positive value', () => expectCode(() => logBase(2, 0), ERR.DOMAIN_ERROR));
});

describe('Memory', () => {
  it('starts at 0', () => {
    const m = new Memory();
    expect(m.recall()).toBe(0);
  });

  it('store sets the value', () => {
    const m = new Memory();
    expect(m.store(42)).toBe(42);
    expect(m.recall()).toBe(42);
  });

  it('clear resets to 0', () => {
    const m = new Memory();
    m.store(99);
    expect(m.clear()).toBe(0);
    expect(m.recall()).toBe(0);
  });

  it('add accumulates from zero', () => {
    const m = new Memory();
    expect(m.add(7)).toBe(7);
    expect(m.recall()).toBe(7);
  });

  it('add accumulates onto an existing value', () => {
    const m = new Memory();
    m.store(10);
    expect(m.add(5)).toBe(15);
  });

  it('subtract works against zero', () => {
    const m = new Memory();
    expect(m.subtract(3)).toBe(-3);
  });

  it('subtract works against a stored value', () => {
    const m = new Memory();
    m.store(20);
    expect(m.subtract(8)).toBe(12);
  });

  it('handles a sequence of operations', () => {
    const m = new Memory();
    m.store(0);
    m.add(10);
    m.add(5);
    m.subtract(3);
    expect(m.recall()).toBe(12);
  });

  it('store throws on NaN', () => {
    const m = new Memory();
    expectCode(() => m.store(NaN), ERR.INVALID_ARGUMENT);
  });

  it('add throws on Infinity', () => {
    const m = new Memory();
    expectCode(() => m.add(Infinity), ERR.INVALID_ARGUMENT);
  });

  it('subtract throws on a non-number', () => {
    const m = new Memory();
    expectCode(() => m.subtract('5'), ERR.INVALID_ARGUMENT);
  });

  it('add detects overflow', () => {
    const m = new Memory();
    m.store(Number.MAX_VALUE);
    expectCode(() => m.add(Number.MAX_VALUE), ERR.OVERFLOW);
  });

  it('store leaves prior value untouched on a bad call', () => {
    const m = new Memory();
    m.store(7);
    try {
      m.store(NaN);
    } catch {
      // expected
    }
    expect(m.recall()).toBe(7);
  });

  it('two memories are independent', () => {
    const a = new Memory();
    const b = new Memory();
    a.store(1);
    b.store(2);
    expect(a.recall()).toBe(1);
    expect(b.recall()).toBe(2);
  });
});

describe('integration scenarios', () => {
  it('quadratic discriminant: b^2 - 4ac', () => {
    const a = 1;
    const b = -3;
    const c = 2;
    const disc = subtract(power(b, 2), multiply(4, multiply(a, c)));
    expect(disc).toBe(1);
    expect(sqrt(disc)).toBe(1);
  });

  it('compound interest: P(1 + r)^n', () => {
    const principal = 1000;
    const rate = 0.05;
    const years = 10;
    const total = multiply(principal, power(add(1, rate), years));
    expect(total).toBeCloseTo(1628.894626, 5);
  });

  it('Pythagorean theorem', () => {
    expect(sqrt(add(power(3, 2), power(4, 2)))).toBe(5);
  });

  it('combinations C(5,2) = 5! / (2! * 3!)', () => {
    const result = divide(factorial(5), multiply(factorial(2), factorial(3)));
    expect(result).toBe(10);
  });

  it('memory accumulation across operations', () => {
    const m = new Memory();
    m.add(multiply(2, 3));
    m.add(multiply(4, 5));
    m.subtract(divide(20, 4));
    expect(m.recall()).toBe(21);
  });
});
