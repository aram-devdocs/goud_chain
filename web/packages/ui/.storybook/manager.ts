import { addons } from '@storybook/manager-api'
import { create } from '@storybook/theming/create'

const theme = create({
  base: 'dark',
  brandTitle: 'GoudChain UI',
  brandUrl: 'https://github.com/goudchain',
  brandTarget: '_self',

  // UI
  appBg: '#09090b',
  appContentBg: '#000000',
  appPreviewBg: '#000000',
  appBorderColor: '#27272a',
  appBorderRadius: 8,

  // Text colors
  textColor: '#f4f4f5',
  textInverseColor: '#09090b',

  // Toolbar default and active colors
  barTextColor: '#a1a1aa',
  barSelectedColor: '#ffffff',
  barHoverColor: '#ffffff',
  barBg: '#09090b',

  // Form colors
  inputBg: '#18181b',
  inputBorder: '#27272a',
  inputTextColor: '#f4f4f5',
  inputBorderRadius: 6,
})

addons.setConfig({
  theme,
})
