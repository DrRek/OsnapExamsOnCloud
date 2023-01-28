import React from "react";
import { BrowserRouter } from "react-router-dom";
import App from "./components/App";
import { createRoot } from 'react-dom/client';
import { BASE_PATH } from './utils/constants'

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <BrowserRouter basename={BASE_PATH}>
    <App />
  </BrowserRouter>
);