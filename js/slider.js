window.initHomeSlider = function () {
  if (window.homeSplide) {
    window.homeSplide.destroy(true);
    window.homeSplide = null;
  }

  if (typeof Splide === 'undefined') return;

  window.homeSplide = new Splide('.splide', {
    type: 'fade',
    rewind: true,
    speed: 500,
    autoplay: true,
    interval: 5000,
  });

  window.homeSplide.mount();
};
