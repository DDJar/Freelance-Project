import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { appRoutes, publicPaths } from "./app-routes";
import { DefaultLayout } from "./layouts/default-layout/default-layout";
import { useAuth } from "./contexts/auth";

export const Home = () => {
  const { user } = useAuth();

  return (

    <Routes>
      {appRoutes.map(({ path, element }) =>
        path === "/home" ? (
          <Route key={path} path={path} element={element} />
        ) : publicPaths.includes(path) ? (
          <Route
            key={path}
            path={path}
            element={<DefaultLayout>{element}</DefaultLayout>}
          />
        ) : null
      )}
      <Route
        path="*"
        element={
          user ? <Navigate to="/home" /> : <Navigate to="/login" />
        }
      />
    </Routes>
  );
};
