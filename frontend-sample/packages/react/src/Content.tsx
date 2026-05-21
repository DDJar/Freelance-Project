import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { appRoutes, publicPaths } from "./app-routes";
import { SideNavOuterToolbar as SideNavBarLayout } from "./layouts";
import { useAuth } from "./contexts/auth";

const appInfo = {
  title: "Trương Gia Thịnh",
};

export const Content = () => {
  const { user } = useAuth();

  return (
    <SideNavBarLayout title={appInfo.title}>
      <Routes>
        {appRoutes.map(({ path, element }) => (
          !publicPaths.includes(path) && (
            <Route key={path} path={path} element={element} />
          )
        ))}
        <Route
          path="*"
          element={
            user ? (
              <Navigate to={`/user-profile/${user.username}`} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </SideNavBarLayout>
  );
};
