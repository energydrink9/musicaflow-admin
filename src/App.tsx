import { AuthBindings, Refine } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import { useNotificationProvider } from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";

import routerBindings, {
  DocumentTitleHandler,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";
import { App as AntdApp } from "antd";
import { BrowserRouter, Route, Routes, Outlet, Navigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

import { ColorModeContextProvider } from "./contexts/color-mode";
import { Header } from "./components/header";
import { Layout } from "./components/layout";
import { Breadcrumbs } from "./components/breadcrumbs";
import { Login } from "./pages/login";
import { LevelsList } from "./pages/levels/list";
import { LevelShow } from "./pages/levels/show";
import { generateDataProvider } from "./providers/data-provider";
import { generateAuthProvider } from "./providers/auth-provider";
import { createAxiosInstance } from "./providers/axios-instance";

function App() {
  const { isLoading, user, getAccessTokenSilently, logout } = useAuth0();

  if (isLoading) {
    return <span>loading...</span>;
  }

  const axiosInstance = createAxiosInstance(getAccessTokenSilently);
  
  const dataProvider = generateDataProvider(
    import.meta.env.VITE_API_URL || 'http://localhost:8888',
    axiosInstance
  );

  const authProvider = generateAuthProvider(user, logout);

  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <ColorModeContextProvider>
          <AntdApp>
            <Refine
              dataProvider={dataProvider}
              notificationProvider={useNotificationProvider}
              routerProvider={routerBindings}
              authProvider={authProvider}
              resources={[
                {
                  name: "levels",
                  list: "/levels",
                  show: "/levels/show/:id",
                },
              ]}
              options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
              }}
            >
              <Routes>
                <Route
                  path="/"
                  element={
                    user ? (
                      <>
                        <Header />
                        {/* Breadcrumbs outside the main content container */}
                        <Breadcrumbs />
                        <Layout>
                          <Outlet />
                        </Layout>
                      </>
                    ) : (
                      <Login />
                    )
                  }
                >
                  <Route index element={<Navigate to="/levels" />} />
                  <Route path="/levels">
                    <Route index element={<LevelsList />} />
                    <Route path="show/:id" element={<LevelShow />} />
                  </Route>
                </Route>
              </Routes>
              <RefineKbar />
              <UnsavedChangesNotifier />
              <DocumentTitleHandler />
            </Refine>
          </AntdApp>
        </ColorModeContextProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;
