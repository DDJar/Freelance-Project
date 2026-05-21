import React, { useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";

import LoadPanel from "devextreme-react/load-panel";

import { NavigationProvider } from "./contexts/navigation";
import { AuthProvider } from "./contexts/auth";
import { useScreenSizeClass } from "./utils/media-query";
import { useThemeContext, ThemeContext } from "./theme/theme";

import { RootApp } from "./RootApp"; // <-- tách riêng logic điều hướng ở đây

import "./styles.scss";
import "./theme/theme";

// App.tsx hoặc index.tsx

export const App = () => {
  const screenSizeClass = useScreenSizeClass();
  const themeContext = useThemeContext();

  useEffect(() => {
    const tryCloseLicense = () => {
      const btn = document.querySelector(
        'dx-license div[style*="cursor: pointer"]'
      ) as HTMLElement | null;

      if (btn) {
        btn.click();
        console.log("✅ dx-license closed automatically");
      }
    };

    tryCloseLicense();

    const observer = new MutationObserver(() => {
      tryCloseLicense();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return (
    <Router>
      <ThemeContext.Provider value={themeContext}>
        <AuthProvider>
          <NavigationProvider>
            <div className={`app ${screenSizeClass}`}>
              {themeContext.isLoaded ? <RootApp /> : <LoadPanel visible />}
            </div>
          </NavigationProvider>
        </AuthProvider>
      </ThemeContext.Provider>
    </Router>
  );
};
