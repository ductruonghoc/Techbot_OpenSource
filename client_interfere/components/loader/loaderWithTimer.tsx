import React, { useState, useEffect } from "react";
import "./css/loader.css"; // Ensure this file contains the provided CSS for the loader

const LoaderWithTimer = () => {
  const [timeElapsed, setTimeElapsed] = useState(0); // Time elapsed in seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer); // Cleanup the interval on unmount
  }, []);

  // Format time in hh:mm:ss
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600).toString().padStart(2, "0");
    const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${hours}:${minutes}:${secs}`;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="loader"></div> {/* Loader animation */}
      <p className="mt-2 text-sm text-gray-600">Time Elapsed: {formatTime(timeElapsed)}</p>
    </div>
  );
};

export default LoaderWithTimer;