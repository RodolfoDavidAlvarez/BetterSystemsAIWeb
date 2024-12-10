export default {
  plugins: {
    'postcss-import': {},
    'tailwindcss/nesting': 'postcss-nesting',
    tailwindcss: {},
    autoprefixer: {
      flexbox: true,
      grid: 'autoplace',
      overrideBrowserslist: ['>0.2%', 'not dead', 'not op_mini all']
    },
    ...(process.env.NODE_ENV === 'production' ? {
      cssnano: {
        preset: ['default', {
          discardComments: { removeAll: true },
          normalizeWhitespace: false,
          colormin: true,
          mergeLonghand: true,
          cssDeclarationSorter: true,
          reduceIdents: false
        }]
      }
    } : {})
  },
}
