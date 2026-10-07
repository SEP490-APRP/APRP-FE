module.exports = {
  "presets": [require("./tailwind.capnong-preset.js").default],
  "darkMode": "class",
  "theme": {
    "extend": {
      "colors": {
        "surface-bright": "#fcf9f1",
        "on-surface": "#1c1c17",
        "background": "#fcf9f1",
        "on-tertiary-container": "#fff2e4",
        "inverse-surface": "#31312b",
        "tertiary-container": "#966600",
        "secondary-container": "#fdceaa",
        "inverse-primary": "#9ed67d",
        "outline-variant": "#c2c9b8",
        "tertiary": "#765000",
        "secondary": "#7a573a",
        "surface-container-highest": "#e5e2da",
        "primary-container": "#4a7c2f",
        "primary-fixed-dim": "#9ed67d",
        "on-primary-fixed-variant": "#215106",
        "surface-container": "#f1eee6",
        "on-secondary-fixed": "#2d1601",
        "tertiary-fixed": "#ffddae",
        "surface-tint": "#396a1f",
        "tertiary-fixed-dim": "#ffba41",
        "inverse-on-surface": "#f3f1e9",
        "on-surface-variant": "#42493c",
        "surface-dim": "#dcdad2",
        "primary-fixed": "#b9f296",
        "on-error-container": "#93000a",
        "on-primary": "#ffffff",
        "secondary-fixed": "#ffdcc2",
        "on-secondary-fixed-variant": "#5f4025",
        "on-secondary-container": "#795639",
        "on-tertiary-fixed": "#281800",
        "outline": "#72796b",
        "surface": "#fcf9f1",
        "on-error": "#ffffff",
        "secondary-fixed-dim": "#ebbe9a",
        "on-secondary": "#ffffff",
        "surface-container-high": "#ebe8e0",
        "surface-container-low": "#f6f3eb",
        "on-primary-container": "#ddffc4",
        "on-tertiary-fixed-variant": "#604000",
        "on-tertiary": "#ffffff",
        "on-background": "#1c1c17",
        "error": "#ba1a1a",
        "error-container": "#ffdad6",
        "surface-variant": "#e5e2da",
        "primary": "#326318",
        "surface-container-lowest": "#ffffff",
        "on-primary-fixed": "#082100"
      },
      "borderRadius": {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      "spacing": {
        "space-lg": "1.5rem",
        "space-sm": "0.5rem",
        "gutter-mobile": "0.75rem",
        "space-xs": "0.25rem",
        "margin-mobile": "1rem",
        "margin": "2rem",
        "gutter": "1.25rem",
        "space-md": "1rem",
        "space-xl": "2.5rem"
      },
      "fontFamily": {
        "headline-lg": [
          "Be Vietnam Pro"
        ],
        "headline-md": [
          "Be Vietnam Pro"
        ],
        "label-sm": [
          "Be Vietnam Pro"
        ],
        "headline-lg-mobile": [
          "Be Vietnam Pro"
        ],
        "label-lg": [
          "Be Vietnam Pro"
        ],
        "display-hero-mobile": [
          "Be Vietnam Pro"
        ],
        "title-md": [
          "Be Vietnam Pro"
        ],
        "body-lg": [
          "Be Vietnam Pro"
        ],
        "body-md": [
          "Be Vietnam Pro"
        ],
        "display-hero": [
          "Be Vietnam Pro"
        ],
        "headline-sm": [
          "Be Vietnam Pro"
        ],
        "label-md": [
          "Be Vietnam Pro"
        ],
        "body-sm": [
          "Be Vietnam Pro"
        ],
        "sans": [
          "Be Vietnam Pro",
          "sans-serif"
        ]
      },
      "fontSize": {
        "headline-lg": [
          "36px",
          {
            "lineHeight": "44px",
            "letterSpacing": "-0.02em",
            "fontWeight": "700"
          }
        ],
        "headline-md": [
          "24px",
          {
            "lineHeight": "32px",
            "fontWeight": "700"
          }
        ],
        "label-sm": [
          "11px",
          {
            "lineHeight": "14px",
            "letterSpacing": "0.03em",
            "fontWeight": "700"
          }
        ],
        "headline-lg-mobile": [
          "26px",
          {
            "lineHeight": "34px",
            "letterSpacing": "-0.01em",
            "fontWeight": "700"
          }
        ],
        "label-lg": [
          "14px",
          {
            "lineHeight": "20px",
            "letterSpacing": "0.01em",
            "fontWeight": "600"
          }
        ],
        "display-hero-mobile": [
          "32px",
          {
            "lineHeight": "40px",
            "letterSpacing": "-0.02em",
            "fontWeight": "800"
          }
        ],
        "title-md": [
          "18px",
          {
            "lineHeight": "26px",
            "fontWeight": "600"
          }
        ],
        "body-lg": [
          "16px",
          {
            "lineHeight": "24px",
            "fontWeight": "400"
          }
        ],
        "body-md": [
          "14px",
          {
            "lineHeight": "22px",
            "fontWeight": "400"
          }
        ],
        "display-hero": [
          "48px",
          {
            "lineHeight": "58px",
            "letterSpacing": "-0.03em",
            "fontWeight": "800"
          }
        ],
        "headline-sm": [
          "20px",
          {
            "lineHeight": "28px",
            "fontWeight": "600"
          }
        ],
        "label-md": [
          "12px",
          {
            "lineHeight": "16px",
            "letterSpacing": "0.02em",
            "fontWeight": "700"
          }
        ],
        "body-sm": [
          "12px",
          {
            "lineHeight": "18px",
            "fontWeight": "400"
          }
        ]
      }
    }
  },
  "content": [
    "./index.html",
    "./src/**/*.{ts,tsx}"
  ]
}