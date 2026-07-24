import React, { useRef } from "react";
import PropTypes from "prop-types";
import { Swiper, SwiperSlide } from "swiper/react";

import { EffectCoverflow, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";

const FALLBACK_IMAGE = "/assets/images/placeholder.png";

const ImageCarousel = ({ images, slidesPerView }) => {
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  return (
    <div className="slider-container">
      <div className="slider-btns">
        <button ref={nextRef} className="custom-next-btn">
          &#10094;
        </button>
        <button ref={prevRef} className="custom-prev-btn">
          &#10095;
        </button>
      </div>

      <Swiper
        centeredSlides={true}
        slidesPerView={3}
        spaceBetween={30}
        navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
        pagination={{ clickable: true }}
        modules={[EffectCoverflow, Navigation, Pagination]}
        className="custom-swiper"
        onInit={(swiper) => {
          setTimeout(() => {
            if (swiper.params?.navigation) {
              swiper.params.navigation.prevEl = prevRef.current;
              swiper.params.navigation.nextEl = nextRef.current;
              swiper.navigation.init();
              swiper.navigation.update();
            }
          });
        }}
      >
        {(images.length > 0 ? images : [FALLBACK_IMAGE]).map((image, index) => (
          <SwiperSlide
            key={index}
            className={`custom-slide ${index === 0 ? "large" : ""}`}
          >
            <img
              src={image}
              alt={`Slide ${index + 1}`}
              className="slide-image"
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

ImageCarousel.propTypes = {
  images: PropTypes.arrayOf(PropTypes.string).isRequired,
  slidesPerView: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

ImageCarousel.defaultProps = {
  images: [],
  slidesPerView: "auto",
};

export default ImageCarousel;
