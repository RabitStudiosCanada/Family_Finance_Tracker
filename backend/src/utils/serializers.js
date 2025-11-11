const pickDefined = (value) => {
  if (Array.isArray(value)) {
    return value.filter((entry) => entry !== undefined && entry !== null);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null)
    );
  }

  return value;
};

const serializeUser = (user) =>
  pickDefined({
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    isActive: user.is_active,
    archivedAt: user.archived_at,
    role: pickDefined({
      id: user.role_id,
      code: user.role_code,
      name: user.role_name,
    }),
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  });

module.exports = {
  serializeUser,
};
