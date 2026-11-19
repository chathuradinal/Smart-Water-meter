import { theme } from 'antd';

export const aquaticTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#00B4D8', // Electric Cyan
    colorPrimaryHover: '#48CAE4',
    colorPrimaryActive: '#0096C7',
    colorInfo: '#0077B6',
    colorSuccess: '#10B981',
    colorWarning: '#F59E0B',
    colorError: '#EF4444',
    
    // Backgrounds
    colorBgBase: '#040a17', // Abyssal deep navy
    colorBgContainer: '#0a192f', // Glass container
    colorBgElevated: '#0f2444', // Modal / Popover / Dropdown
    colorBgLayout: '#040a17',
    
    // Borders
    colorBorder: 'rgba(0, 180, 216, 0.22)',
    colorBorderSecondary: 'rgba(255, 255, 255, 0.08)',
    
    // Typography
    colorText: '#F1F5F9',
    colorTextSecondary: '#94A3B8',
    colorTextTertiary: '#64748B',
    colorTextQuaternary: '#475569',
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,
    
    // Radii & Motion
    borderRadius: 12,
    borderRadiusLG: 16,
    borderRadiusSM: 8,
    wireframe: false
  },
  components: {
    Layout: {
      bodyBg: '#040a17',
      headerBg: 'rgba(10, 25, 47, 0.85)',
      siderBg: '#050f21',
      triggerBg: '#00B4D8'
    },
    Menu: {
      darkItemBg: 'transparent',
      darkItemSelectedBg: 'rgba(0, 180, 216, 0.16)',
      darkItemSelectedColor: '#38BDF8',
      itemHoverBg: 'rgba(0, 180, 216, 0.08)',
      itemBorderRadius: 10,
      itemMarginInline: 10
    },
    Card: {
      colorBgContainer: '#0a192f',
      colorBorderSecondary: 'rgba(0, 180, 216, 0.18)',
      paddingLG: 24,
      borderRadiusLG: 16
    },
    Table: {
      colorBgContainer: '#0a192f',
      headerBg: '#081426',
      rowHoverBg: 'rgba(0, 180, 216, 0.08)',
      borderColor: 'rgba(0, 180, 216, 0.15)'
    },
    Button: {
      borderRadius: 10,
      fontWeight: 600,
      primaryShadow: '0 4px 18px rgba(0, 180, 216, 0.35)'
    },
    Statistic: {
      titleFontSize: 13,
      contentFontSize: 24
    },
    Drawer: {
      colorBgElevated: '#081426'
    },
    Modal: {
      contentBg: '#081426',
      headerBg: '#081426'
    },
    Tabs: {
      itemSelectedColor: '#00B4D8',
      inkBarColor: '#00B4D8'
    }
  }
};

