/**
 * Tokens de layout y elevación para toda la app autenticada (dashboard, auth, compartidos).
 * No usar en la landing pública salvo que se importe explícitamente allí.
 */
export const SHELL = {
    contentMax: 1080,
    pagePadding: 40,
    sidebarWidth: 276,
    topBarHeight: 68,
    radius: {
        sm: 10,
        md: 14,
        lg: 18,
        xl: 22,
        pill: 999,
    },
    shadow: {
        sidebar: 'inset -1px 0 0 rgba(12,12,12,.07)',
        lift: '0 1px 2px rgba(12,12,12,.04), 0 14px 44px rgba(12,12,12,.08)',
        card: '0 1px 2px rgba(12,12,12,.04), 0 8px 28px rgba(12,12,12,.06)',
        cardHover: '0 4px 28px rgba(12,12,12,.1)',
        topBar: '0 1px 0 rgba(12,12,12,.06)',
        modal: '0 24px 64px rgba(0,0,0,.14)',
    },
    /** Fondo del área principal (sustituye plano #F5F4F1) */
    mainGradient: 'linear-gradient(168deg, #FCFBF8 0%, #F6F4EF 38%, #EDEAE2 100%)',
    sidebarBg: '#FAFAF8',
    topBarBg: 'rgba(255,255,255,.92)',
} as const;
