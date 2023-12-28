import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  daisyui: {
    themes: [
      {
        light: {
          ...require('daisyui/src/theming/themes')['light'],
          'base-content': '#000000'
        },
      },
      {
        dark: {
          ...require('daisyui/src/theming/themes')['dark'],
          'base-content': '#ffffff'
        },
      }
    ],
  },

  plugins: [
    require('@tailwindcss/typography'),
    require('daisyui')
  ],
}
export default config
