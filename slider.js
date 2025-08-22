let autoplayInterval = null;
let lastKeyPress = 0;
let autoplayBtn = null;
let $sliderLeft = null;
let wheelAccum = 0;
let wheelLocked = false;
let initialWidth = window.innerWidth;
let currentSlideIndex = 0;
const WHEEL_THRESHOLD = 80;
const WHEEL_LOCK_MS = 1100;
const STORAGE_KEY_SLIDE = 'splitSlideIndex';

window.addEventListener("resize", function () {
  if (window.innerWidth !== initialWidth) {
    sessionStorage.setItem(STORAGE_KEY_SLIDE, String(currentSlideIndex));
    location.reload();
  }
});

function normalizeDeltaY(e) {
  let dy = e.deltaY;
  if (e.deltaMode === 1) dy *= 16;
  else if (e.deltaMode === 2) dy *= window.innerHeight;
  return dy;
}

function pauseAutoplayIfRunning() {
  if (autoplayInterval) {
    clearInterval(autoplayInterval);
    autoplayInterval = null;
    if (autoplayBtn) autoplayBtn.classList.remove('toggled');
  }
}

function manualAdvance(direction) {
  pauseAutoplayIfRunning();
  if (direction === 'next') {
    $sliderLeft.slick('slickNext');
  } else {
    $sliderLeft.slick('slickPrev');
  }
}

document.addEventListener('DOMContentLoaded', function () {
  $sliderLeft = $('.slideshow .slider');
  const $splitSlideshow = $('.split-slideshow');
  const $textSlider = $('.slideshow-text');

  const maxItems = $('.item', $sliderLeft).length;

  const $sliderRightContainer = $('.slideshow')
    .clone()
    .addClass('slideshow-right')
    .appendTo($splitSlideshow);

  const reverseItems = $('.item', $sliderRightContainer).toArray().reverse();
  reverseItems.forEach(item => {
    const img = item.querySelector('img');
    if (img) img.loading = 'lazy';
  });

  const $sliderRight = $('.slider', $sliderRightContainer).empty().append(reverseItems);

  $sliderLeft.addClass('slideshow-left');
  $('.item img', $sliderLeft).attr('loading', 'lazy');

  $sliderRight.slick({
    swipe: false,
    vertical: true,
    arrows: false,
    infinite: true,
    speed: 950,
    cssEase: 'cubic-bezier(0.7, 0, 0.3, 1)',
    initialSlide: maxItems - 1
  });

  $textSlider.slick({
    swipe: false,
    vertical: true,
    arrows: false,
    infinite: true,
    speed: 900,
    cssEase: 'cubic-bezier(0.7, 0, 0.3, 1)'
  });

  $sliderLeft
    .slick({
      vertical: true,
      verticalSwiping: true,
      arrows: false,
      infinite: true,
      dots: true,
      speed: 1000,
      cssEase: 'cubic-bezier(0.7, 0, 0.3, 1)'
    })
    .on('beforeChange', function (event, slick, current, next) {
      const count = slick.slideCount;
      if (current === count - 1 && next === 0) {
        $sliderRight.slick('slickGoTo', count - 1);
        $textSlider.slick('slickGoTo', 0);
      } else if (current === 0 && next === count - 1) {
        $sliderRight.slick('slickGoTo', 0);
        $textSlider.slick('slickGoTo', count - 1);
      } else {
        $sliderRight.slick('slickGoTo', count - 1 - next);
        $textSlider.slick('slickGoTo', next);
      }
    })
    .on('afterChange', function (event, slick, current) {
      currentSlideIndex = current;
      sessionStorage.setItem(STORAGE_KEY_SLIDE, String(current));
    });

  $sliderLeft[0].addEventListener(
    'wheel',
    function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (wheelLocked) return;

      const dy = normalizeDeltaY(e);
      if (Math.abs(dy) < 1) return;

      wheelAccum += dy;

      if (Math.abs(wheelAccum) >= WHEEL_THRESHOLD) {
        const direction = wheelAccum > 0 ? 'next' : 'prev';
        manualAdvance(direction);
        wheelAccum = 0;
        wheelLocked = true;
        setTimeout(() => {
          wheelLocked = false;
        }, WHEEL_LOCK_MS);
      }
    },
    { passive: false }
  );

  autoplayBtn = document.getElementById('autoplay-toggle');
  if (autoplayBtn) {
    autoplayBtn.addEventListener('click', () => {
      const toggled = autoplayBtn.classList.toggle('toggled');
      if (toggled && !autoplayInterval) {
        autoplayInterval = setInterval(() => {
          $sliderLeft.slick('slickNext');
        }, 5000);
      } else if (!toggled && autoplayInterval) {
        clearInterval(autoplayInterval);
        autoplayInterval = null;
      }
    });
  }

  document.addEventListener('keydown', function (e) {
    const now = Date.now();
    if (now - lastKeyPress < 1100) return;

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      lastKeyPress = now;
      if (e.key === 'ArrowDown') {
        manualAdvance('next');
      } else {
        manualAdvance('prev');
      }
    }
  });

  document.addEventListener('visibilitychange', function () {
    const isHidden = document.hidden;
    const isToggled = autoplayBtn && autoplayBtn.classList.contains('toggled');
    if (isHidden && autoplayInterval) {
      clearInterval(autoplayInterval);
      autoplayInterval = null;
    } else if (!isHidden && isToggled && !autoplayInterval) {
      autoplayInterval = setInterval(() => {
        $sliderLeft.slick('slickNext');
      }, 5000);
    }
  });
});

window.addEventListener('load', function () {
  const loader = document.querySelector('.loader-overlay');
  const mainContent = document.getElementById('main-content');

  if (loader) {
    loader.style.opacity = '0';
    loader.style.visibility = 'hidden';
  }

  if (mainContent) {
    setTimeout(() => {
      mainContent.classList.add('visible');

      const waitForSlider = setInterval(() => {
        if ($sliderLeft && $sliderLeft.hasClass('slick-initialized')) {
          clearInterval(waitForSlider);

          const saved = sessionStorage.getItem(STORAGE_KEY_SLIDE);
          if (saved !== null) {
            const idx = parseInt(saved, 10);
            if (!Number.isNaN(idx)) {
              $sliderLeft.slick('slickGoTo', idx, true);
            }
            sessionStorage.removeItem(STORAGE_KEY_SLIDE);
          }

          if (autoplayBtn && !autoplayInterval) {
            autoplayBtn.classList.add('toggled');
            autoplayInterval = setInterval(() => {
              $sliderLeft.slick('slickNext');
            }, 5000);
          }
        }
      }, 100);
    }, 300);
  }
});
