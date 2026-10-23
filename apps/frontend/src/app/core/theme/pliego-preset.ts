import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

import { BRANDS, DEFAULT_BRAND } from './brand';
import type { BrandDefinition } from './types/brand';

const ld = (light: string, dark: string): string => `light-dark(${light}, ${dark})`;

const shadow = {
  control: `0 1px 2px ${ld('rgba(15, 23, 42, 0.05)', 'rgba(0, 0, 0, 0.5)')}`,
  overlay: `0 10px 24px -6px ${ld('rgba(15, 23, 42, 0.14)', 'rgba(0, 0, 0, 0.7)')}, 0 2px 6px ${ld('rgba(15, 23, 42, 0.06)', 'rgba(0, 0, 0, 0.3)')}`,
  modal: `0 24px 48px -12px ${ld('rgba(15, 23, 42, 0.28)', 'rgba(0, 0, 0, 0.8)')}`,
};

const neutral = {
  bg: ld('#F8FAFC', '#141414'),
  surface: ld('#FFFFFF', '#1B1B1B'),
  surface2: ld('#F8FAFC', '#202020'),
  raised: ld('#FFFFFF', '#262626'),
  sunken: ld('#F1F5F9', '#111111'),
  hover: ld('#F1F5F9', '#2A2A2A'),
  pressed: ld('#E2E8F0', '#111111'),
  border: ld('#E2E8F0', '#2E2E2E'),
  borderStrong: ld('#CBD5E1', '#404040'),
  borderHover: ld('#94A3B8', '#5C5C5C'),
  text: ld('#17212B', '#EDEDED'),
  text2: ld('#475569', '#B5B5B5'),
  text3: ld('#64748B', '#8F8F8F'),
  placeholder: ld('#94A3B8', '#6E6E6E'),
  track: ld('#EEF0F5', '#2A2A2A'),
};

const status = {
  success: {
    bg: ld('#F0FDF4', '#11241A'),
    border: ld('#BBF7D0', '#1F4A33'),
    text: ld('#15803D', '#6EE7A0'),
  },
  info: {
    bg: ld('#F0F9FF', '#10222E'),
    border: ld('#BAE6FD', '#1E4A63'),
    text: ld('#0369A1', '#7DD3FC'),
  },
  warn: {
    bg: ld('#FFFBEB', '#2A2112'),
    border: ld('#FDE68A', '#5A4318'),
    text: ld('#B45309', '#FBC069'),
  },
  danger: {
    bg: ld('#FEF2F2', '#2D1616'),
    border: ld('#FCA5A5', '#6B2A2A'),
    text: ld('#DC2626', '#FF8A80'),
    solid: ld('#DC2626', '#E5483C'),
    hover: ld('#B91C1C', '#C93A2F'),
    active: ld('#991B1B', '#B0332A'),
  },
};

const focusRingShadow = `0 0 0 3px ${ld(
  'color-mix(in srgb, {primary.color} 25%, transparent)',
  'color-mix(in srgb, {highlight.color} 35%, transparent)',
)}`;
const dangerFocusRingShadow = '0 0 0 3px color-mix(in srgb, #DC2626 25%, transparent)';

const ring = { color: 'transparent', shadow: focusRingShadow };

export function buildPreset(brand: BrandDefinition) {
  const { light: l, dark: d } = brand;
  const brandText = ld(l.text, d.text);
  const brandSoft = ld(l.soft, d.soft);
  const brandSoft2 = ld(l.soft2, d.soft2);
  const brandBorder = ld(l.border, d.border);

  return definePreset(Aura, {
    extend: {
      brand: {
        border: brandBorder,
        disabled: ld(l.disabled, d.disabled),
      },
    },
    semantic: {
      transitionDuration: '0.15s',
      disabledOpacity: '0.5',
      iconSize: '1rem',
      focusRing: {
        width: '0',
        style: 'none',
        color: 'transparent',
        offset: '0',
        shadow: focusRingShadow,
      },
      primary: {
        ...brand.palette,
        color: ld(l.color, d.color),
        contrastColor: '#ffffff',
        hoverColor: ld(l.hover, d.hover),
        activeColor: ld(l.active, d.active),
      },
      surface: {
        0: '#ffffff',
        50: ld('#F8FAFC', '#F5F5F5'),
        100: ld('#F1F5F9', '#EDEDED'),
        200: ld('#E2E8F0', '#D4D4D4'),
        300: ld('#CBD5E1', '#B5B5B5'),
        400: ld('#94A3B8', '#8F8F8F'),
        500: ld('#64748B', '#6E6E6E'),
        600: ld('#475569', '#404040'),
        700: ld('#334155', '#2E2E2E'),
        800: ld('#1E293B', '#262626'),
        900: ld('#0F172A', '#1B1B1B'),
        950: ld('#020617', '#111111'),
      },
      formField: {
        paddingX: '0.75rem',
        paddingY: '0.5625rem',
        sm: { fontSize: '0.875rem', paddingX: '0.625rem', paddingY: '0.4375rem' },
        lg: { fontSize: '1.125rem', paddingX: '0.875rem', paddingY: '0.75rem' },
        borderRadius: '{border.radius.md}',
        focusRing: {
          width: '0',
          style: 'none',
          color: 'transparent',
          offset: '0',
          shadow: focusRingShadow,
        },
        background: ld('#FFFFFF', '#111111'),
        disabledBackground: neutral.sunken,
        filledBackground: neutral.surface2,
        filledHoverBackground: neutral.surface2,
        filledFocusBackground: neutral.surface2,
        borderColor: neutral.borderStrong,
        hoverBorderColor: neutral.borderHover,
        focusBorderColor: '{primary.color}',
        invalidBorderColor: status.danger.solid,
        color: neutral.text,
        disabledColor: neutral.text3,
        placeholderColor: neutral.placeholder,
        invalidPlaceholderColor: status.danger.text,
        floatLabelColor: neutral.text3,
        floatLabelFocusColor: brandText,
        floatLabelActiveColor: neutral.text3,
        iconColor: neutral.text3,
        shadow: 'none',
      },
      list: {
        padding: '0.375rem',
        gap: '2px',
        option: {
          padding: '0.5rem 0.625rem',
          borderRadius: '{border.radius.md}',
          focusBackground: neutral.hover,
          focusColor: neutral.text,
          selectedFontWeight: '500',
          icon: { color: neutral.text3, focusColor: neutral.text2 },
        },
        optionGroup: { padding: '0.5rem 0.625rem 0.25rem', color: neutral.text3 },
      },
      content: {
        borderRadius: '{border.radius.lg}',
        background: neutral.surface,
        hoverBackground: neutral.hover,
        borderColor: neutral.border,
        color: neutral.text,
        hoverColor: neutral.text,
      },
      mask: {
        background: ld('rgba(15, 23, 42, 0.45)', 'rgba(0, 0, 0, 0.65)'),
      },
      navigation: {
        list: { padding: '0.375rem' },
        item: {
          padding: '0.5rem 0.625rem',
          borderRadius: '{border.radius.md}',
          focusBackground: neutral.hover,
          activeBackground: brandSoft,
          color: neutral.text,
          focusColor: neutral.text,
          activeColor: brandText,
          icon: { color: neutral.text3, focusColor: neutral.text2, activeColor: brandText },
        },
        submenuLabel: { color: neutral.text3 },
      },
      overlay: {
        select: {
          borderRadius: '10px',
          shadow: shadow.overlay,
          background: neutral.raised,
          borderColor: neutral.border,
        },
        popover: {
          borderRadius: '10px',
          padding: '0.75rem',
          shadow: shadow.overlay,
          background: neutral.raised,
          borderColor: neutral.border,
        },
        modal: {
          borderRadius: '{border.radius.xl}',
          padding: '1.5rem',
          shadow: shadow.modal,
          background: neutral.raised,
          borderColor: neutral.border,
        },
        navigation: { shadow: shadow.overlay },
      },
      highlight: {
        background: brandSoft,
        focusBackground: brandSoft2,
        color: brandText,
        focusColor: brandText,
      },
      text: {
        color: neutral.text,
        hoverColor: ld('#0F172A', '#FFFFFF'),
        mutedColor: neutral.text3,
        hoverMutedColor: neutral.text2,
      },
    },
    components: {
      button: {
        root: {
          borderRadius: '{border.radius.md}',
          gap: '0.5rem',
          paddingX: '0.875rem',
          paddingY: '0.5rem',
          iconOnlyWidth: '2.25rem',
          sm: {
            fontSize: '0.875rem',
            paddingX: '0.625rem',
            paddingY: '0.375rem',
            iconOnlyWidth: '2rem',
          },
          lg: {
            fontSize: '1.125rem',
            paddingX: '1.125rem',
            paddingY: '0.75rem',
            iconOnlyWidth: '3rem',
          },
          label: { fontWeight: '600' },
          primary: { focusRing: ring },
          secondary: {
            background: neutral.surface,
            hoverBackground: neutral.hover,
            activeBackground: neutral.pressed,
            borderColor: neutral.borderStrong,
            hoverBorderColor: neutral.borderHover,
            activeBorderColor: neutral.borderHover,
            color: neutral.text,
            hoverColor: neutral.text,
            activeColor: neutral.text,
            focusRing: ring,
          },
          success: { focusRing: ring },
          info: { focusRing: ring },
          warn: { focusRing: ring },
          help: { focusRing: ring },
          contrast: { focusRing: ring },
          danger: {
            background: status.danger.solid,
            hoverBackground: status.danger.hover,
            activeBackground: status.danger.active,
            borderColor: status.danger.solid,
            hoverBorderColor: status.danger.hover,
            activeBorderColor: status.danger.active,
            color: '#ffffff',
            hoverColor: '#ffffff',
            activeColor: '#ffffff',
            focusRing: { color: 'transparent', shadow: dangerFocusRingShadow },
          },
        },
        outlined: {
          primary: {
            hoverBackground: brandSoft,
            activeBackground: brandSoft2,
            borderColor: brandBorder,
            color: brandText,
          },
          secondary: {
            hoverBackground: neutral.hover,
            activeBackground: neutral.pressed,
            borderColor: neutral.borderStrong,
            color: neutral.text,
          },
          danger: {
            hoverBackground: status.danger.bg,
            activeBackground: status.danger.bg,
            borderColor: status.danger.border,
            color: status.danger.text,
          },
        },
        text: {
          primary: { hoverBackground: brandSoft, activeBackground: brandSoft2, color: brandText },
          secondary: {
            hoverBackground: neutral.hover,
            activeBackground: neutral.pressed,
            color: neutral.text2,
          },
          danger: {
            hoverBackground: status.danger.bg,
            activeBackground: status.danger.bg,
            color: status.danger.text,
          },
        },
        link: { color: brandText, hoverColor: brandText, activeColor: ld(l.active, d.text) },
      },
      checkbox: {
        root: {
          borderRadius: '5px',
          hoverBorderColor: '{primary.color}',
          shadow: 'none',
        },
      },
      radiobutton: {
        root: {
          hoverBorderColor: '{primary.color}',
          shadow: 'none',
        },
      },
      toggleswitch: {
        root: {
          width: '2.25rem',
          height: '1.25rem',
          background: neutral.borderStrong,
          hoverBackground: neutral.borderHover,
          disabledBackground: neutral.pressed,
          shadow: 'none',
        },
        handle: {
          size: '1rem',
          background: '#ffffff',
          hoverBackground: '#ffffff',
          checkedBackground: '#ffffff',
          checkedHoverBackground: '#ffffff',
          disabledBackground: neutral.surface,
        },
      },
      tabs: {
        tab: {
          color: neutral.text2,
          hoverColor: neutral.text,
          activeColor: brandText,
          padding: '0.625rem 0.75rem',
          fontWeight: '500',
          gap: '0.5rem',
        },
        activeBar: { height: '2px', background: '{primary.color}' },
      },
      tag: {
        root: {
          fontSize: '0.75rem',
          fontWeight: '500',
          padding: '0.125rem 0.5rem',
          gap: '0.375rem',
          borderRadius: '999px',
        },
        primary: { background: brandSoft, color: brandText },
        secondary: { background: ld('#F1F5F9', '#262626'), color: ld('#334155', '#D4D4D4') },
        success: { background: status.success.bg, color: status.success.text },
        info: { background: status.info.bg, color: status.info.text },
        warn: { background: status.warn.bg, color: status.warn.text },
        danger: { background: status.danger.bg, color: status.danger.text },
      },
      toast: {
        root: { width: '20rem', borderRadius: '{border.radius.lg}' },
        summary: { fontWeight: '600' },
        detail: { fontWeight: '400' },
        success: {
          background: status.success.bg,
          borderColor: status.success.border,
          color: status.success.text,
          detailColor: neutral.text,
          shadow: shadow.overlay,
        },
        info: {
          background: status.info.bg,
          borderColor: status.info.border,
          color: status.info.text,
          detailColor: neutral.text,
          shadow: shadow.overlay,
        },
        warn: {
          background: status.warn.bg,
          borderColor: status.warn.border,
          color: status.warn.text,
          detailColor: neutral.text,
          shadow: shadow.overlay,
        },
        error: {
          background: status.danger.bg,
          borderColor: status.danger.border,
          color: status.danger.text,
          detailColor: neutral.text,
          shadow: shadow.overlay,
        },
      },
      message: {
        success: {
          background: status.success.bg,
          borderColor: status.success.border,
          color: status.success.text,
          shadow: 'none',
        },
        info: {
          background: status.info.bg,
          borderColor: status.info.border,
          color: status.info.text,
          shadow: 'none',
        },
        warn: {
          background: status.warn.bg,
          borderColor: status.warn.border,
          color: status.warn.text,
          shadow: 'none',
        },
        error: {
          background: status.danger.bg,
          borderColor: status.danger.border,
          color: status.danger.text,
          shadow: 'none',
        },
      },
      dialog: {
        header: { padding: '1.25rem 1.5rem', gap: '0.5rem' },
        title: { fontSize: '1.125rem', fontWeight: '600' },
        content: { padding: '0 1.5rem 1.25rem 1.5rem' },
        footer: { padding: '1rem 1.5rem', gap: '0.5rem' },
      },
      datatable: {
        headerCell: {
          background: neutral.surface2,
          color: neutral.text3,
          padding: '0.625rem 1rem',
        },
        columnTitle: { fontWeight: '600' },
        row: { hoverBackground: neutral.hover },
        bodyCell: { padding: '1rem 1rem' },
      },
      tooltip: {
        root: {
          background: ld('#1F2937', '#EDEDED'),
          color: ld('#F3F4F6', '#141414'),
          borderRadius: '{border.radius.md}',
          padding: '0.375rem 0.5rem',
        },
      },
      card: {
        root: { borderRadius: '{border.radius.xl}', shadow: 'none' },
        body: { padding: '1.25rem', gap: '0.75rem' },
        title: { fontSize: '1.125rem', fontWeight: '600' },
      },
      menu: {
        root: { background: neutral.raised, borderRadius: '10px' },
      },
      slider: {
        track: { background: neutral.track, borderRadius: '3px', size: '6px' },
        handle: {
          width: '20px',
          height: '20px',
          background: '{primary.color}',
          hoverBackground: '{primary.hover.color}',
          content: {
            background: neutral.raised,
            hoverBackground: neutral.raised,
            width: '14px',
            height: '14px',
            shadow: 'none',
          },
        },
      },
      skeleton: {
        root: { background: ld('#E9EDF2', '#111111') },
      },
      togglebutton: {
        root: {
          padding: '0.1875rem',
          borderRadius: '{border.radius.lg}',
          fontWeight: '500',
          background: neutral.sunken,
          checkedBackground: neutral.sunken,
          hoverBackground: neutral.sunken,
          borderColor: neutral.border,
          checkedBorderColor: neutral.border,
          color: neutral.text2,
          hoverColor: neutral.text,
          checkedColor: neutral.text,
        },
        content: {
          padding: '0.3125rem 0.75rem',
          borderRadius: '{border.radius.md}',
          checkedBackground: neutral.raised,
          checkedShadow: shadow.control,
        },
      },
      sidebar: {
        layout: { background: neutral.bg },
        panel: { background: neutral.surface, color: neutral.text },
        header: { padding: '0.5rem', gap: '0.5rem' },
        footer: { padding: '0.5rem', gap: '0.25rem' },
        group: { padding: '0.25rem 0.5rem' },
        groupLabel: { color: neutral.text3, fontWeight: '600' },
        menuButton: {
          height: '2.25rem',
          padding: '0.375rem 0.5625rem',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: neutral.text2,
          focusColor: neutral.text,
          activeColor: brandText,
          iconOnlyWidth: '2.25rem',
          icon: { color: neutral.text3, focusColor: neutral.text2 },
        },
        menuBadge: {
          top: '0.5rem',
          background: neutral.sunken,
          borderColor: neutral.border,
          color: neutral.text3,
        },
        main: { background: neutral.bg },
      },
    },
  });
}

export const PliegoPreset = buildPreset(BRANDS[DEFAULT_BRAND]);

export const PLIEGO_THEME_OPTIONS = {
  darkModeSelector: '.app-dark',
  cssLayer: {
    name: 'primeng',
    order: 'theme, base, primeng',
  },
};
