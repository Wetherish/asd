import ReactDOM from "react-dom/client";
import App from "./App";
import SharePage from "./views/SharePage";
import { ApiProvider } from "./store";
import "./theme.css";

const share = window.location.pathname.match(/^\/share\/([^/]+)/);

ReactDOM.createRoot(document.getElementById("root")!).render(
  share ? (
    <SharePage token={decodeURIComponent(share[1])} />
  ) : (
    <ApiProvider>
      <App />
    </ApiProvider>
  ),
);
