export default function loadDefaultTypes(parser) {
  // Integer
  parser.add('integer', data => {
    const value = parseInt(data.word, 10);
    if (Number.isNaN(value)) {
      return [true, '⛔ Вы указали не число'];
    }

    if (data.argument.min && value < data.argument.min) {
      return [true, `⛔ Ваше число не должно быть меньше ${data.argument.min}`];
    }

    if (data.argument.max && value > data.argument.max) {
      return [true, `⛔ Ваше число не должно быть больше ${data.argument.max}`];
    }

    return [false, value];
  });

  // String
  parser.add('string', data => {
    const words = data.commandLine.split(' ');
    words.splice(0, data.index + data.offset + 1);
    const str = words.join(' ');

    if (data.argument.max && str.length > data.argument.max) {
      return [true, `⛔ Превышение максимальной длины строки (${str.length}/${data.argument.max})`];
    }

    if (data.argument.min && str.length < data.argument.min) {
      return [true, `⛔ Превышение минимальной длины строки (${str.length}/${data.argument.min})`];
    }

    if (data.argument.match && !data.argument.match.test(str)) {
      return [true, data.argument.matchError || '⛔ Введённый аргумент не соответствует шаблону.'];
    }

    return [false, str];
  });

  parser.add('word', data => {
    const str = data.word;

    if (data.argument.max && str.length > data.argument.max) {
      return [true, `⛔ Превышение максимальной длины строки (${str.length}/${data.argument.max})`];
    }

    if (data.argument.min && str.length < data.argument.min) {
      return [true, `⛔ Превышение минимальной длины строки (${str.length}/${data.argument.min})`];
    }

    if (data.argument.match && !data.argument.match.test(str)) {
      return [true, data.argument.matchError || '⛔ Введённый аргумент не соответствует шаблону.'];
    }

    return [false, data.argument.case ? str[{lower: 'toLowerCase', upper: 'toUpperCase'}[data.argument.case]]() : str];
  });
}