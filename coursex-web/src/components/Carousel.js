import { useState, useEffect } from "react";
import "../App.css";

// get dimensions of the viewport
// just a comment.

const viewportWidth = window.innerWidth;

export default function Carousel({
  autoSlide = false,
  autoSlideInterval = 3000,
  slides,
}) {
  const [curr, setCurr] = useState(0);

  const prev = () =>
    setCurr((curr) => (curr === 0 ? slides.length - 1 : curr - 1));
  const next = () =>
    setCurr((curr) => (curr === slides.length - 1 ? 0 : curr + 1));

  useEffect(() => {
    if (!autoSlide) return;
    const slideInterval = setInterval(next, autoSlideInterval);
    return () => clearInterval(slideInterval);
  }, [autoSlide, autoSlideInterval]);

  let translate_value = 110;

  if (viewportWidth < 768) {
    translate_value = 125;
  } else {
    translate_value = 110;
  }

  return (
    <div className="carousel-container">
      <div
        className="carousel-slide"
        style={{ transform: `translateX(-${curr * translate_value}%)` }}
      >
        {slides.map((img, index) => (
          <img
            key={index}
            src={img}
            alt={`Slide ${index}`}
            className="featureImage"
          />
        ))}
      </div>
    </div>
  );
}
