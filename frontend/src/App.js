import React, { useState, useEffect, useMemo } from "react";

import "react-toastify/dist/ReactToastify.css";
import { QueryClient, QueryClientProvider } from "react-query";

import { ptBR } from "@material-ui/core/locale";
import { createTheme, ThemeProvider } from "@material-ui/core/styles";
import { useMediaQuery } from "@material-ui/core";
import ColorModeContext from "./layout/themeContext";
import { SocketContext, socketManager } from './context/Socket/SocketContext';
import useSettings from "./hooks/useSettings";
import Favicon from "react-favicon";
import { getBackendURL } from "./services/config";

import Routes from "./routes";

const queryClient = new QueryClient();
const defaultLogoLight = "/vector/logo.svg";
const defaultLogoDark = "/vector/logo-dark.svg";
const defaultLogoFavicon = "/vector/favicon.svg";

const App = () => {
  const [locale, setLocale] = useState();

  const prefersDarkMode = !!(window.matchMedia('(prefers-color-scheme: dark)').matches);
  const preferredTheme = window.localStorage.getItem("preferredTheme");
  const [mode, setMode] = useState(preferredTheme ? preferredTheme : prefersDarkMode ? "dark" : "light");
  const [primaryColorLight, setPrimaryColorLight] = useState("#888");
  const [primaryColorDark, setPrimaryColorDark] = useState("#888");
  const [appLogoLight, setAppLogoLight] = useState("");
  const [appLogoDark, setAppLogoDark] = useState("");
  const [appLogoFavicon, setAppLogoFavicon] = useState("");
  const [appName, setAppName] = useState("");
  const { getPublicSetting } = useSettings();

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
      },
      setPrimaryColorLight: (color) => {
        setPrimaryColorLight(color);
      },
      setPrimaryColorDark: (color) => {
        setPrimaryColorDark(color);
      },
      setAppLogoLight: (file) => {
        setAppLogoLight(file); 
      },
      setAppLogoDark: (file) => {
        setAppLogoDark(file); 
      },
      setAppLogoFavicon: (file) => {
        setAppLogoFavicon(file);
      },
      setAppName: (name) => {
        setAppName(name);
      }
    }),
    []
  );

  const calculatedLogoDark = () => {
    if (appLogoDark === defaultLogoDark && appLogoLight !== defaultLogoLight) {
      return appLogoLight;
    }
    return appLogoDark;
  };
  const calculatedLogoLight = () => {
    if (appLogoDark !== defaultLogoDark && appLogoLight === defaultLogoLight) {
      return appLogoDark;
    }
    return appLogoLight;
  };

  const theme = useMemo(() => createTheme(
    {
      scrollbarStyles: {
        "&::-webkit-scrollbar": {
          width: '8px',
          height: '8px',
        },
        "&::-webkit-scrollbar-thumb": {
          boxShadow: 'inset 0 0 6px rgba(0, 0, 0, 0.3)',
          backgroundColor: mode === "light" ? primaryColorLight : primaryColorDark,
        },
      },
      scrollbarStylesSoft: {
        "&::-webkit-scrollbar": {
          width: "8px",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: mode === "light" ? "#F3F3F3" : "#333333",
        },
      },
      palette: {
        primary: {
          main: primaryColorLight,
          contrastText: "#fff"
        },
        secondary: {
          main: primaryColorDark,
          contrastText: "#fff"
        },
        background: {
          default: mode === "light" ? "#f4f6f8" : "#303030",
          paper: mode === "light" ? "#FFFFFF" : "#424242"
        },
        inputBackground: mode === "light" ? "#FFFFFF" : "#333",
        barraSuperior: mode === "light" ? primaryColorLight : "#666",
        boxticket: mode === "light" ? "#EEE" : "#666"
      },
      mode,
      appLogoLight,
      appLogoDark,
      appLogoFavicon,
      appName,
      calculatedLogoLight,
      calculatedLogoDark,
      calculatedLogo: () => {
        if (mode === "light") {
          return calculatedLogoLight();
        }
        return calculatedLogoDark();
      }
    },
    locale
  ), [appLogoLight, appLogoDark, appLogoFavicon, appName, locale, mode, primaryColorDark, primaryColorLight]);

  useEffect(() => {
    const i18nlocale = localStorage.getItem("language");
    if (!i18nlocale) {
      return;
    }
    
    const browserLocale =
      i18nlocale.substring(0, 2) + i18nlocale.substring(3, 5);

    if (browserLocale === "ptBR") {
      setLocale(ptBR);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("preferredTheme", mode);
  }, [mode]);

  useEffect(() => {
    getPublicSetting("primaryColorLight")
      .then((color) => { setPrimaryColorLight(color || "#0000FF") })
      .catch((error) => { console.log("Error reading setting", error); });
    getPublicSetting("primaryColorDark")
      .then((color) => { setPrimaryColorDark(color || "#39ACE7") })
      .catch((error) => { console.log("Error reading setting", error); });
    getPublicSetting("appLogoLight")
      .then((file) => { setAppLogoLight(file ? (`${getBackendURL()}/public/${file}`) : defaultLogoLight) }, (_) => { })
      .catch((error) => { console.log("Error reading setting", error); });
    getPublicSetting("appLogoDark")
      .then((file) => { setAppLogoDark(file ? (`${getBackendURL()}/public/${file}`) : defaultLogoDark) })
      .catch((error) => { console.log("Error reading setting", error); });
    getPublicSetting("appLogoFavicon")
      .then((file) => { setAppLogoFavicon(file ? (`${getBackendURL()}/public/${file}`) : null) })
      .catch((error) => { console.log("Error reading setting", error); });
    getPublicSetting("appName").then((name) => { setAppName(name || "ticketz") })
      .catch((error) => { console.log("Error reading setting", error); setAppName("whitelabel chat") });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
    <Favicon url={ ((appLogoFavicon) ? theme.appLogoFavicon : defaultLogoFavicon ) } />
    <ColorModeContext.Provider value={{ colorMode }}>
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <SocketContext.Provider value={socketManager}>
            <Routes />
          </SocketContext.Provider>
        </QueryClientProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
    </>
  );
};

export default App;
