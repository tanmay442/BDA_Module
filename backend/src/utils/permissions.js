const isElevated = (user) => user && (user.role === 'admin' || user.role === 'manager');

const ownsResource = (user, resource) => {
  if (!user || !resource) return false;
  const owner = resource.assignedTo || resource.createdBy;
  if (!owner) return false;
  const ownerId = owner._id ? owner._id.toString() : owner.toString();
  return ownerId === user._id.toString();
};

const ensureCanRead = (user, resource, resourceName = 'Resource') => {
  if (isElevated(user)) return;
  if (!resource) {
    const err = new Error(`${resourceName} not found`);
    err.status = 404;
    throw err;
  }
  if (!ownsResource(user, resource)) {
    const err = new Error(`Not authorized to access this ${resourceName.toLowerCase()}`);
    err.status = 404;
    throw err;
  }
};

const ensureCanModify = (user, resource, resourceName = 'Resource') => {
  if (isElevated(user)) return;
  if (!resource) {
    const err = new Error(`${resourceName} not found`);
    err.status = 404;
    throw err;
  }
  if (!ownsResource(user, resource)) {
    const err = new Error(`Not authorized to modify this ${resourceName.toLowerCase()}`);
    err.status = 403;
    throw err;
  }
};

const pick = (obj, fields) => {
  const out = {};
  for (const f of fields) {
    if (obj[f] !== undefined) out[f] = obj[f];
  }
  return out;
};

module.exports = { isElevated, ownsResource, ensureCanRead, ensureCanModify, pick };
