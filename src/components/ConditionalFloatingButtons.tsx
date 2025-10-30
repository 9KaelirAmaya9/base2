import { useLocation } from "react-router-dom";
import { FloatingContactButton } from "./FloatingContactButton";
import { FloatingCartButton } from "./FloatingCartButton";

export const ConditionalFloatingButtons = () => {
  const location = useLocation();
  
  // Show cart button on order page, contact button on all other pages
  if (location.pathname === "/order") {
    return <FloatingCartButton />;
  }
  
  return <FloatingContactButton />;
};
