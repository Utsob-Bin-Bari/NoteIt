import React, { createContext, useState, ReactNode } from "react";

export const AppContext = createContext({
    theme: 'light',
    toggleTheme: () => {},
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };
    return (
        <AppContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </AppContext.Provider>
    );
}
