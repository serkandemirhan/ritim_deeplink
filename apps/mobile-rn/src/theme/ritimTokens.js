const tokens = require('../../ritim_codex_assets/ritim-design-tokens.json');

const colors = {
  background: tokens.brand.darkNavy,
  surface: tokens.brand.card,
  surfaceLight: tokens.brand.cardSoft,
  primaryStart: tokens.brand.turquoise,
  primaryMid: tokens.brand.violet,
  primaryEnd: tokens.brand.purple,
  textPrimary: tokens.brand.textPrimary,
  textSecondary: tokens.brand.textSecondary,
  border: tokens.brand.border,
  success: tokens.brand.success,
  danger: tokens.brand.danger,
};

const gradients = tokens.gradients;

export default { colors, gradients };
