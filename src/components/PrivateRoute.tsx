import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";

type PrivateRouteProps = {
  children: ReactNode;
};

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { session, isAuthLoading } = UserAuth();

  if (isAuthLoading && !session) {
    return <Navigate to="/signin" replace />;
  }

  return <>{session ? children : <Navigate to="/signin" replace />}</>;
};

export default PrivateRoute;
