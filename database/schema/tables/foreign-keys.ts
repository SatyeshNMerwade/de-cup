export const FK_CASCADE = {
  onDelete: 'cascade' as const,
  onUpdate: 'cascade' as const,
};

export const FK_RESTRICT = {
  onDelete: 'restrict' as const,
  onUpdate: 'cascade' as const,
};

export const FK_SET_NULL = {
  onDelete: 'set null' as const,
  onUpdate: 'cascade' as const,
};
