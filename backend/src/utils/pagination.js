const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

const parsePositiveInt = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n) || n < 1) return fallback;
  return n;
};

const parseLimit = (value) => {
  const n = parsePositiveInt(value, DEFAULT_LIMIT);
  return Math.min(n, MAX_LIMIT);
};

const parsePagination = (query) => {
  const page = parsePositiveInt(query.page, DEFAULT_PAGE);
  const limit = parseLimit(query.limit);
  return { page, limit, skip: (page - 1) * limit };
};

const buildResponse = (data, total, page, limit) => {
  const totalPages = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1;
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

const wantsPagination = (query) => query.page !== undefined || query.limit !== undefined;

module.exports = {
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  wantsPagination,
  parsePagination,
  buildResponse,
};
