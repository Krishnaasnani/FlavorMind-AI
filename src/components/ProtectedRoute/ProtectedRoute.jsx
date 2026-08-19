import { Navigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { APP_ROUTES, UI_TEXT } from "../../constants";
import { useAuth } from "../../context/AuthContext";
import styles from "./ProtectedRoute.module.css";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <p className={styles.loading} role="status">{UI_TEXT.LOADING_PAGE}</p>;
  if (!user) return <Navigate to={APP_ROUTES.LOGIN} state={{ from: location }} replace />;
  return children;
}

export default ProtectedRoute;

ProtectedRoute.propTypes = { children: PropTypes.node.isRequired };
