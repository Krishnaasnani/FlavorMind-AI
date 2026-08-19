import { Toaster } from "react-hot-toast";
import styles from "./Toast.module.css";

function Toast() {
  return <Toaster position="bottom-right" containerClassName={styles.container} toastOptions={{ duration: 3500, className: styles.toast }} />;
}

export default Toast;
