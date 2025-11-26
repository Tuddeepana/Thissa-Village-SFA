import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    const selectedModule = localStorage.getItem("selectedModule");
    
    if (!isAuthenticated) {
      navigate("/auth");
    } else if (!selectedModule) {
      navigate("/modules");
    } else {
      navigate(selectedModule === "pos" ? "/pos" : "/dashboard");
    }
  }, [navigate]);

  return null;
};

export default Index;
