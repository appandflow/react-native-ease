import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'React Native Ease',
  tagline: 'Lightweight declarative animations powered by platform APIs',
  favicon: 'img/app-icon.png',
  url: 'https://appandflow.github.io',
  baseUrl: '/react-native-ease/',
  organizationName: 'AppAndFlow',
  projectName: 'react-native-ease',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'throw',
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/docs',
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/AppAndFlow/react-native-ease/tree/main/docs/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    image: 'img/github-banner.png',
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'React Native Ease',
      hideOnScroll: true,
      logo: {
        alt: 'Ease App Icon',
        src: 'img/app-icon.png',
        srcDark: 'img/app-icon.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          'href': 'https://github.com/AppAndFlow/react-native-ease',
          'className': 'header-github',
          'aria-label': 'GitHub repository',
          'position': 'right',
        },
      ],
    },
    footer: {
      logo: {
        alt: 'App & Flow Logo',
        src: 'img/appandflow-logo.svg',
        srcDark: 'img/appandflow-logo-dark.svg',
      },
      style: 'light',
      links: [],
      copyright: `Copyright © ${new Date().getFullYear()} App & Flow. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
