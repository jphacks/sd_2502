import { ref, onMounted, watchEffect } from "vue";

// テーマの種別
type Theme = "light" | "dark";

// localStorage に保存するキー
const STORAGE_KEY = "color-scheme";

// ダーク/ライトテーマの切替と永続化を行う composable
export const useTheme = () => {
  // デフォルトはライトモード
  const theme = ref<Theme>("light");

  // <html> に "dark" クラスを付与/削除して Tailwind のダークモードを反映
  const applyThemeClass = (t: Theme) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (t === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  };

  onMounted(() => {
    // 初期化: 1) localStorage > 2) システム設定 > fallback 'light'
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === "light" || stored === "dark") {
      theme.value = stored;
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      theme.value = "dark";
    } else {
      theme.value = "light";
    }
    applyThemeClass(theme.value);
  });

  // 変更のたびにローカルへ保存し、DOM クラスを反映
  watchEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, theme.value);
    applyThemeClass(theme.value);
  });

  // テーマのトグル操作
  const toggleTheme = () => {
    theme.value = theme.value === "dark" ? "light" : "dark";
  };

  return { theme, toggleTheme };
};
