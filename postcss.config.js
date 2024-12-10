export default {
  plugins: {
    'postcss-import': {
      path: ["client/src"]
    },
    'tailwindcss/nesting': {},
    tailwindcss: {},
    autoprefixer: {
      flexbox: true,
      grid: true,
      overrideBrowserslist: ['>0.2%', 'not dead', 'not op_mini all']
    },
    'cssnano': process.env.NODE_ENV === 'production' ? {
      preset: ['default', {
        discardComments: {
          removeAll: true,
        },
        normalizeWhitespace: false,
        colormin: true,
        mergeLonghand: true,
        cssDeclarationSorter: true,
        reduceIdents: false
      }],
    } : false
  },
}
