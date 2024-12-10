export default {
  plugins: {
    'postcss-import': {
      path: ["client/src"]
    },
    'tailwindcss/nesting': 'postcss-nesting',
    tailwindcss: {},
    autoprefixer: {
      flexbox: true,
      grid: true,
      overrideBrowserslist: ['last 2 versions', '> 1%']
    },
    'cssnano': process.env.NODE_ENV === 'production' ? {
      preset: ['default', {
        discardComments: {
          removeAll: true,
        },
        normalizeWhitespace: false,
        colormin: false
      }],
    } : false
  },
}
