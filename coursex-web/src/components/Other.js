import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import feature_1 from "./path_to_image_1";
import feature_2 from "./path_to_image_2";
import feature_3 from "./path_to_image_3";
import "./Slider.css";

// get the dimensions of the viewport
const viewportWidth = window.innerWidth;
const viewportHeight = window.innerHeight;

// write a function so that when the device is a phone, the value of x_initial should be 100, x_animate shoudld be 0 and x_exit should be -100

const set_values = () => {
    if (viewportWidth < 768) {
        return [100, 0, -100];
    } else {
        return [300, 200, -100];
    }
    };

const images = [feature_1, feature_2, feature_3];

const ImageSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 2000); // 1 second stay + 1 second slide animation

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="sliderContainer">
      <AnimatePresence>
        <motion.img
          key={currentIndex}
          src={images[currentIndex]}
          className="sliderImage"
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 200, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          transition={{ duration: 1 }} // 1 second transition
          alt={`Feature ${currentIndex}`}
        />
      </AnimatePresence>
    </div>
  );
};

export default ImageSlider;