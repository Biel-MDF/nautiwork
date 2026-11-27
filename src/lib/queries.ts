// Pedaços de consulta reaproveitados.

/** O que o cartão de vaga precisa da empresa: nome e logotipo. */
export const jobCardCompany = {
  select: { id: true, name: true, userId: true, cnpjVerifiedAt: true, user: { select: { image: { select: { updatedAt: true } } } } },
} as const;
