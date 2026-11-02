// --- Constantes (substituem os "números mágicos" e strings soltas) ---
const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  USER: 'USER',
});

const USER_MAX_ITEM_VALUE = 500;
const PRIORITY_THRESHOLD = 1000;

// --- Formatadores (Replace Conditional with Polymorphism) ---
// Cada formato conhece apenas a sua própria forma de montar cabeçalho,
// linha e rodapé. Adicionar um novo formato não exige mexer no gerador.

class CsvFormatter {
  header() {
    return 'ID,NOME,VALOR,USUARIO\n';
  }

  row(item, user) {
    return `${item.id},${item.name},${item.value},${user.name}\n`;
  }

  footer(total) {
    return `\nTotal,,\n${total},,\n`;
  }
}

class HtmlFormatter {
  header(user) {
    return (
      '<html><body>\n' +
      '<h1>Relatório</h1>\n' +
      `<h2>Usuário: ${user.name}</h2>\n` +
      '<table>\n' +
      '<tr><th>ID</th><th>Nome</th><th>Valor</th></tr>\n'
    );
  }

  row(item, user) {
    const isHighlighted = user.role === ROLES.ADMIN && item.priority;
    const style = isHighlighted ? ' style="font-weight:bold;"' : '';
    return `<tr${style}><td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>\n`;
  }

  footer(total) {
    return '</table>\n' + `<h3>Total: ${total}</h3>\n` + '</body></html>\n';
  }
}

// Null Object: tipos desconhecidos geram relatório vazio (mesmo comportamento do original)
class EmptyFormatter {
  header() {
    return '';
  }

  row() {
    return '';
  }

  footer() {
    return '';
  }
}

const FORMATTERS = {
  CSV: new CsvFormatter(),
  HTML: new HtmlFormatter(),
};

const EMPTY_FORMATTER = new EmptyFormatter();

// --- Regras de visibilidade por perfil (Decompose Conditional) ---
const VISIBILITY_RULES = {
  [ROLES.ADMIN]: () => true,
  [ROLES.USER]: (item) => item.value <= USER_MAX_ITEM_VALUE,
};

export class ReportGenerator {
  constructor(database) {
    this.db = database;
  }

  /**
   * Gera um relatório de itens baseado no tipo e no usuário.
   * - Admins veem tudo.
   * - Users comuns só veem itens com valor <= 500.
   */
  generateReport(reportType, user, items) {
    const formatter = this.getFormatter(reportType);
    const visibleItems = this.filterVisibleItems(user, items);

    if (user.role === ROLES.ADMIN) {
      this.markPriorityItems(visibleItems);
    }

    const body = visibleItems.map((item) => formatter.row(item, user)).join('');
    const total = this.calculateTotal(visibleItems);

    const report = formatter.header(user) + body + formatter.footer(total);
    return report.trim();
  }

  getFormatter(reportType) {
    return FORMATTERS[reportType] ?? EMPTY_FORMATTER;
  }

  filterVisibleItems(user, items) {
    const canSee = VISIBILITY_RULES[user.role] ?? (() => false);
    return items.filter(canSee);
  }

  markPriorityItems(items) {
    for (const item of items) {
      if (item.value > PRIORITY_THRESHOLD) {
        item.priority = true;
      }
    }
  }

  calculateTotal(items) {
    return items.reduce((sum, item) => sum + item.value, 0);
  }
}
