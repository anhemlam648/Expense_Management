import React, { createContext, useContext, useEffect, useState } from 'react';

const CurrencyContext = createContext();

export const CURRENCIES = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
  VND: { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('USD');

  useEffect(() => {
    const saved = localStorage.getItem('currency') || 'USD';
    setCurrency(saved);
  }, []);

  const updateCurrency = (newCurrency) => {
    if (CURRENCIES[newCurrency]) {
      setCurrency(newCurrency);
      localStorage.setItem('currency', newCurrency);
    }
  };

  const formatMoney = (amount) => {
    const curr = CURRENCIES[currency];
    if (!amount) return `${curr.symbol}0`;
    const num = Number(amount);
    return `${curr.symbol}${num.toLocaleString()}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, updateCurrency, formatMoney, CURRENCIES }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
};
