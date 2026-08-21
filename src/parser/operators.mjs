const LEVELS = { '??': 1, '||': 2, '&&': 3, '==': 4, '!=': 4, '>': 5, '<': 5, '>=': 5, '<=': 5, '+': 6, '-': 6, '*': 7, '/': 7, '%': 7, '**': 8 };

export function precedence(operator) {
  return LEVELS[operator] ?? -1;
}
