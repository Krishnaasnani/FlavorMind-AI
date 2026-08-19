import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AIChat from "./components/AIChat/AIChat";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import Navbar from "./components/Navbar/Navbar";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import Toast from "./components/Toast/Toast";
import { AuthProvider } from "./context/AuthContext";
import { APP_ROUTES, UI_TEXT } from "./constants";
import styles from "./App.module.css";

const Home = lazy(() => import("./pages/Home"));
const RecipeDetail = lazy(() => import("./pages/RecipeDetail"));
const Favorites = lazy(() => import("./pages/Favorites"));
const MealPlanner = lazy(() => import("./pages/MealPlanner"));
const ShoppingList = lazy(() => import("./pages/ShoppingList"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(() => import("./pages/Login"));
const SignUp = lazy(() => import("./pages/SignUp"));
const Account = lazy(() => import("./pages/Account"));

function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Navbar />
        <ErrorBoundary>
          <main className={styles.main}>
            <Suspense fallback={<p className={styles.pageLoading} role="status">{UI_TEXT.LOADING_PAGE}</p>}>
              <Routes>
                <Route path={APP_ROUTES.HOME} element={<Home />} />
                <Route path={APP_ROUTES.RECIPE_DETAIL} element={<RecipeDetail />} />
                <Route path={APP_ROUTES.LOGIN} element={<Login />} />
                <Route path={APP_ROUTES.SIGNUP} element={<SignUp />} />
                <Route path={APP_ROUTES.ACCOUNT} element={<ProtectedRoute><Account /></ProtectedRoute>} />
                <Route path={APP_ROUTES.FAVORITES} element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
                <Route path={APP_ROUTES.MEAL_PLANNER} element={<ProtectedRoute><MealPlanner /></ProtectedRoute>} />
                <Route path={APP_ROUTES.SHOPPING_LIST} element={<ProtectedRoute><ShoppingList /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
        </ErrorBoundary>
        <AIChat />
        <Toast />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
