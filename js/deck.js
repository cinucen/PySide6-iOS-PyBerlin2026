/**
 * Deck behaviour for index.html.
 *
 * Loaded after reveal.js and its plugins, at the end of <body>, so the DOM and
 * the Reveal global are both available by the time this runs.
 *
 *   1. Reveal initialization
 *   2. Corner header/footer chrome  (opt out per slide with `data-no-header`)
 *   3. Click-to-play YouTube posters
 */

/*********************************************
 * 1. INITIALIZATION
 * https://revealjs.com/config/
 *********************************************/
Reveal.initialize({
  hash: true,

  // Reveal lays every slide out in this fixed logical box, then scales the
  // whole thing to fit the window. The default 960x700 is ~4:3, so on a 16:9
  // screen the fit is height-limited and ~25% of the width goes unused —
  // matching the box to the screen is what lets columns span the display.
  // Text keeps its on-screen size (the scale factor barely moves); what
  // changes is that there are now 1280 logical px of width to lay out in.
  width: 1280,
  height: 720,

  // Fraction of the viewport kept empty around the slide. This is the
  // breathing room the corner chrome and reveal's progress bar live in;
  // lower it for a tighter fit, but the chrome will start to overlap.
  margin: 0.04,

  // Ceiling on the scale factor. The default 2 stops the slide growing on
  // displays past ~1500px of usable height, stranding it in the middle of a
  // 4K screen.
  maxScale: 4,

  highlight: {
    // The `data-noescape` blocks contain intentional markup (<mark>, fragments),
    // so silence highlight.js' unescaped-HTML warning.
    beforeHighlight: function( hljs ) {
      hljs.configure({ ignoreUnescapedHTML: true });
    }
  },

  // https://revealjs.com/plugins/
  plugins: [ RevealMarkdown, RevealHighlight, RevealNotes ]
});

/*********************************************
 * 2. HEADER / FOOTER CHROME
 * Reveal has no footer concept, so copy the hidden #header markup from
 * index.html into the deck: once into .reveal on screen, or into every slide
 * background when exporting to PDF. Positioned by css/slides.css.
 *
 * Add `data-no-header` to a <section> to keep its chrome hidden; marking a
 * vertical stack hides it for every slide inside it.
 *********************************************/
( function() {
  var header = document.getElementById( 'header' ).innerHTML;
  var revealEl = document.querySelector( 'div.reveal' );

  function hasNoHeader( slide ) {
    if ( !slide ) return false;
    if ( slide.hasAttribute( 'data-no-header' ) ) return true;
    var parent = slide.parentNode;
    return !!parent && parent.nodeName === 'SECTION' && parent.hasAttribute( 'data-no-header' );
  }

  if ( window.location.search.match( /print-pdf/gi ) ) {
    Reveal.addEventListener( 'ready', function() {
      Reveal.getSlides().forEach( function( slide ) {
        if ( hasNoHeader( slide ) ) return;
        if ( slide.slideBackgroundElement ) {
          slide.slideBackgroundElement.insertAdjacentHTML( 'beforeend', header );
        }
      });
    });
  }
  else {
    function updateHeader( event ) {
      var slide = ( event && event.currentSlide ) || Reveal.getCurrentSlide();
      revealEl.classList.toggle( 'hide-header', hasNoHeader( slide ) );
    }

    // Insert on `ready`, not immediately: reveal.js builds `.backgrounds` during
    // initialization, and that layer has no z-index of its own, so it is painted
    // purely by DOM order. Inserting the chrome before it exists puts the chrome
    // behind the slide background, where it flashes on load and then vanishes.
    Reveal.addEventListener( 'ready', function( event ) {
      revealEl.insertAdjacentHTML( 'beforeend', header );
      updateHeader( event );
    });
    Reveal.addEventListener( 'slidechanged', updateHeader );
  }
})();

/*********************************************
 * 3. CLICK-TO-PLAY YOUTUBE
 * Swap the poster for a real player only on click, so no third-party player
 * code (and none of its console noise) loads up front.
 *********************************************/
( function() {
  document.querySelectorAll( '.yt-facade' ).forEach( function( facade ) {
    facade.addEventListener( 'click', function() {
      if ( facade.classList.contains( 'playing' ) ) return;

      var iframe = document.createElement( 'iframe' );
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + facade.dataset.videoId +
                   '?autoplay=1&rel=0';
      iframe.title = 'YouTube video player';
      // `autoplay` is needed here so the click carries through to the player;
      // Firefox logs one "unsupported feature name" line for it, only on play.
      iframe.allow = 'autoplay; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      facade.appendChild( iframe );
      facade.classList.add( 'playing' );
    });
  });

  // Reveal's auto-pause only matches `iframe[src*="youtube.com/embed/"]`, which the
  // -nocookie domain doesn't, so tear the player down ourselves when leaving a slide.
  Reveal.addEventListener( 'slidechanged', function( event ) {
    document.querySelectorAll( '.yt-facade.playing' ).forEach( function( facade ) {
      if ( event.currentSlide && event.currentSlide.contains( facade ) ) return;
      var iframe = facade.querySelector( 'iframe' );
      if ( iframe ) iframe.remove();
      facade.classList.remove( 'playing' );
    });
  });
})();
