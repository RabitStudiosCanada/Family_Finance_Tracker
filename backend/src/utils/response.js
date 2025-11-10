const send = (res, statusCode, payload = {}) => {
  const { data, meta, message } = payload;

  return res.status(statusCode).json(
    Object.fromEntries(
      Object.entries({ status: 'success', message, data, meta }).filter(([, value]) => value !== undefined)
    )
  );
};

const ok = (res, payload) => send(res, 200, payload);

const created = (res, payload) => send(res, 201, payload);

const noContent = (res) => res.status(204).send();

module.exports = {
  ok,
  created,
  noContent,
};
