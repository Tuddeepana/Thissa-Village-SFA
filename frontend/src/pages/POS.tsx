import { useState } from "react";
import { POSClassic } from "@/pages/POSClassic";
import { POSBeta } from "@/components/pos/beta/POSBeta";

const POS = () => {
  const [isBeta, setIsBeta] = useState(() => {
    return localStorage.getItem("pos_useBetaUI") === "true";
  });

  const handleToggleBeta = (checked: boolean) => {
    setIsBeta(checked);
    localStorage.setItem("pos_useBetaUI", String(checked));
  };

  if (isBeta) {
    return <POSBeta onToggleBeta={handleToggleBeta} />;
  }

  return <POSClassic onToggleBeta={handleToggleBeta} isBeta={isBeta} />;
};

export default POS;
