export const buttonLayout = [
  ['C', '⌫', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['±', '0', '.', '='],
];

export function initialMobileState() {
  return {
    value: '0',
    expression: '',
    pendingValue: null,
    operation: null,
    shouldReset: false,
    pushToken: null,
  };
}

function calculate(a, op, b) {
  if (op === '+') return a + b;
  if (op === '−') return a - b;
  if (op === '×') return a * b;
  if (op === '÷') return b === 0 ? 'Error' : a / b;
  return b;
}

export function evaluateKeyPress(state, key) {
  if (/^\d$/.test(key)) {
    const value = state.shouldReset || state.value === '0' ? key : `${state.value}${key}`;
    return { ...state, value, shouldReset: false };
  }

  if (key === '.') {
    return state.value.includes('.') ? state : { ...state, value: `${state.value}.`, shouldReset: false };
  }

  if (key === 'C') return initialMobileState();
  if (key === '⌫') return { ...state, value: state.value.length > 1 ? state.value.slice(0, -1) : '0' };
  if (key === '%') return { ...state, value: String(parseFloat(state.value) / 100) };
  if (key === '±') return { ...state, value: state.value.startsWith('-') ? state.value.slice(1) : `-${state.value}` };

  if ('+-×÷'.includes(key)) {
    return {
      ...state,
      pendingValue: parseFloat(state.value),
      operation: key,
      expression: `${state.value} ${key}`,
      shouldReset: true,
    };
  }

  if (key === '=' && state.operation) {
    const result = calculate(state.pendingValue, state.operation, parseFloat(state.value));
    return {
      ...state,
      value: String(result),
      expression: '',
      operation: null,
      pendingValue: null,
      shouldReset: true,
    };
  }

  return state;
}
