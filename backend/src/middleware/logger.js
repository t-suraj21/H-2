import morgan from 'morgan';

export const requestLogger = morgan((tokens, req, res) => {
  return [
    `[${tokens.date(req, res, 'iso')}]`,
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    '-',
    tokens['response-time'](req, res),
    'ms',
  ].join(' ');
});
