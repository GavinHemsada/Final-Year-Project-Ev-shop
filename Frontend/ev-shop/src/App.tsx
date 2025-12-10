import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRouter";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { Provider } from "react-redux";
import { store } from "./store/store";

const App = () => {
  return (
    <Provider store={store}>
    <BrowserRouter>
      <ThemeProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
    </Provider>
  );
};

export default App;
