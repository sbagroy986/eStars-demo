(function($){

    $.extend($.easing, {
        easeInOutCubic : function(x, t, b, c, d){
            if ((t/=d/2) < 1) return c/2*t*t*t + b;
            return c/2*((t-=2)*t*t + 2) + b;
        }
    });

    $.fn.outerFind = function(selector){
        return this.find(selector).addBack(selector);
    };

    (function($,sr){
        // debouncing function from John Hann
        // http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/
        var debounce = function (func, threshold, execAsap) {
            var timeout;

            return function debounced () {
                var obj = this, args = arguments;
                function delayed () {
                    if (!execAsap) func.apply(obj, args);
                    timeout = null;
                };

                if (timeout) clearTimeout(timeout);
                else if (execAsap) func.apply(obj, args);

                timeout = setTimeout(delayed, threshold || 100);
            };
        }
        // smartresize
        jQuery.fn[sr] = function(fn){  return fn ? this.bind('resize', debounce(fn)) : this.trigger(sr); };

    })(jQuery,'smartresize');

    (function(){

        var scrollbarWidth = 0, originalMargin, touchHandler = function(event){
            event.preventDefault();
        };

        function getScrollbarWidth(){
            if (scrollbarWidth) return scrollbarWidth;
            var scrollDiv = document.createElement('div');
            $.each({
                top : '-9999px',
                width  : '50px',
                height : '50px',
                overflow : 'scroll',
                position : 'absolute'
            }, function(property, value){
                scrollDiv.style[property] = value;
            });
            $('body').append(scrollDiv);
            scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
            $('body')[0].removeChild(scrollDiv);
            return scrollbarWidth;
        }

    })();

    $.isMobile = function(type){
        var reg = [];
        var any = {
            blackberry : 'BlackBerry',
            android : 'Android',
            windows : 'IEMobile',
            opera : 'Opera Mini',
            ios : 'iPhone|iPad|iPod'
        };
        type = 'undefined' == $.type(type) ? '*' : type.toLowerCase();
        if ('*' == type) reg = $.map(any, function(v){ return v; });
        else if (type in any) reg.push(any[type]);
        return !!(reg.length && navigator.userAgent.match(new RegExp(reg.join('|'), 'i')));
    };

    var isSupportViewportUnits = (function(){
        // modernizr implementation
        var $elem = $('<div style="height: 50vh; position: absolute; top: -1000px; left: -1000px;">').appendTo('body');
        var elem = $elem[0];
        var height = parseInt(window.innerHeight / 2, 10);
        var compStyle = parseInt((window.getComputedStyle ? getComputedStyle(elem, null) : elem.currentStyle)['height'], 10);
        $elem.remove();
        return compStyle == height;
    }());

    $(function(){

        $('html').addClass($.isMobile() ? 'mobile' : 'desktop');

        // .mbr-navbar--sticky
        $(window).scroll(function(){
            $('.mbr-navbar--sticky').each(function(){
                var method = $(window).scrollTop() > 10 ? 'addClass' : 'removeClass';
                $(this)[method]('mbr-navbar--stuck')
                    .not('.mbr-navbar--open')[method]('mbr-navbar--short');
            });
        });

        if ($.isMobile() && navigator.userAgent.match(/Chrome/i)){ // simple fix for Chrome's scrolling
            (function(width, height){
                var deviceSize = [width, width];
                deviceSize[height > width ? 0 : 1] = height;
                $(window).smartresize(function(){
                    var windowHeight = $(window).height();
                    if ($.inArray(windowHeight, deviceSize) < 0)
                        windowHeight = deviceSize[ $(window).width() > windowHeight ? 1 : 0 ];
                    $('.mbr-section--full-height').css('height', windowHeight + 'px');
                });
            })($(window).width(), $(window).height());
        } else if (!isSupportViewportUnits){ // fallback for .mbr-section--full-height
            $(window).smartresize(function(){
                $('.mbr-section--full-height').css('height', $(window).height() + 'px');
            });
            $(document).on('add.cards', function(event){
                if ($('html').hasClass('mbr-site-loaded') && $(event.target).outerFind('.mbr-section--full-height').length)
                    $(window).resize();
            });
        }

        // .mbr-section--16by9 (16 by 9 blocks autoheight)
        function calculate16by9(){
            $(this).css('height', $(this).parent().width() * 9 / 16);
        }
        $(window).smartresize(function(){
            $('.mbr-section--16by9').each(calculate16by9);
        });
        $(document).on('add.cards change.cards', function(event){
            var enabled = $(event.target).outerFind('.mbr-section--16by9');
            if (enabled.length){
                enabled
                    .attr('data-16by9', 'true')
                    .each(calculate16by9);
            } else {
                $(event.target).outerFind('[data-16by9]')
                    .css('height', '')
                    .removeAttr('data-16by9');
            }
        });


        // .mbr-parallax-background
        if ($.fn.jarallax && !$.isMobile()){
            $(document).on('destroy.parallax', function(event){
                $(event.target).outerFind('.mbr-parallax-background')
                    .jarallax('destroy')
                    .css('position', '');
            });
            $(document).on('add.cards change.cards', function(event){
                $(event.target).outerFind('.mbr-parallax-background')
                    .jarallax({
                        speed: 0.6
                    })
                    .css('position', 'relative');
            });
        }

        // .mbr-social-likes
        if ($.fn.socialLikes){
            $(document).on('add.cards', function(event){
                $(event.target).outerFind('.mbr-social-likes:not(.mbr-added)').on('counter.social-likes', function(event, service, counter){
                    if (counter > 999) $('.social-likes__counter', event.target).html(Math.floor(counter / 1000) + 'k');
                }).socialLikes({initHtml : false});
            });
        }

        // .mbr-fixed-top
        var fixedTopTimeout, scrollTimeout, prevScrollTop = 0, fixedTop = null, isDesktop = !$.isMobile();
        $(window).scroll(function(){
            if (scrollTimeout) clearTimeout(scrollTimeout);
            var scrollTop = $(window).scrollTop();
            var scrollUp  = scrollTop <= prevScrollTop || isDesktop;
            prevScrollTop = scrollTop;
            if (fixedTop){
                var fixed = scrollTop > fixedTop.breakPoint;
                if (scrollUp){
                    if (fixed != fixedTop.fixed){
                        if (isDesktop){
                            fixedTop.fixed = fixed;
                            $(fixedTop.elm).toggleClass('is-fixed');
                        } else {
                            scrollTimeout = setTimeout(function(){
                                fixedTop.fixed = fixed;
                                $(fixedTop.elm).toggleClass('is-fixed');
                            }, 40);
                        }
                    }
                } else {
                    fixedTop.fixed = false;
                    $(fixedTop.elm).removeClass('is-fixed');
                }
            }
        });
        $(document).on('add.cards delete.cards', function(event){
            if (fixedTopTimeout) clearTimeout(fixedTopTimeout);
            fixedTopTimeout = setTimeout(function(){
                if (fixedTop){
                    fixedTop.fixed = false;
                    $(fixedTop.elm).removeClass('is-fixed');
                }
                $('.mbr-fixed-top:first').each(function(){
                    fixedTop = {
                        breakPoint : $(this).offset().top + $(this).height() * 3,
                        fixed : false,
                        elm : this
                    };
                    $(window).scroll();
                });
            }, 650);
        });

        // embedded videos
        $(window).smartresize(function(){
            $('.mbr-embedded-video').each(function(){
                $(this).height(
                    $(this).width() *
                    parseInt($(this).attr('height') || 315) /
                    parseInt($(this).attr('width') || 560)
                );
            });
        });
        $(document).on('add.cards', function(event){
            if ($('html').hasClass('mbr-site-loaded') && $(event.target).outerFind('iframe').length)
                $(window).resize();
        });

        $(document).on('add.cards', function(event){
            $(event.target).outerFind('[data-bg-video]').each(function(){
                var result, videoURL = $(this).data('bg-video'), patterns = [
                    /\?v=([^&]+)/,
                    /(?:embed|\.be)\/([-a-z0-9_]+)/i,
                    /^([-a-z0-9_]+)$/i
                ];
                for (var i = 0; i < patterns.length; i++){
                    if (result = patterns[i].exec(videoURL)){
                        var previewURL = 'http' + ('https:' == location.protocol ? 's' : '') + ':';
                        previewURL += '//img.youtube.com/vi/' + result[1] + '/maxresdefault.jpg';

                        var $img = $('<div class="mbr-background-video-preview">')
                            .hide()
                            .css({
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            })
                        $('> *:eq(0)', this).before($img);

                        $('<img>').on('load', function() {
                            if (120 == (this.naturalWidth || this.width)) {
                                // selection of preview in the best quality
                                var file = this.src.split('/').pop();
                                switch (file){
                                    case 'maxresdefault.jpg':
                                        this.src = this.src.replace(file, 'sddefault.jpg');
                                        break;
                                    case 'sddefault.jpg':
                                        this.src = this.src.replace(file, 'hqdefault.jpg');
                                        break;
                                }
                            } else {
                                $img.css('background-image', 'url("' + this.src + '")')
                                    .show();
                            }
                        }).attr('src', previewURL)

                        if ($.fn.YTPlayer && !$.isMobile()){
                            var params = eval('(' + ($(this).data('bg-video-params') || '{}') + ')');
                            $('> *:eq(1)', this).before('<div class="mbr-background-video"></div>').prev()
                                .YTPlayer($.extend({
                                    videoURL : result[1],
                                    containment : 'self',
                                    showControls : false,
                                    mute : true
                                }, params));
                        }
                        break;
                    }
                }
            });
        });

        // init
        $('body > *:not(style, script)').trigger('add.cards');
        $('html').addClass('mbr-site-loaded');
        $(window).resize().scroll();

        // smooth scroll
        if (!$('html').hasClass('is-builder')){
            $(document).click(function(e){
                try {
                    var target = e.target;

                    if ($(target).parents().hasClass('testimonials1')) {
                        return;
                    }
                    do {
                        if (target.hash){
                                var useBody = /#bottom|#top/g.test(target.hash);
                            $(useBody ? 'body' : target.hash).each(function(){
                                e.preventDefault();
                                // in css sticky navbar has height 64px
                                var stickyMenuHeight = $('.mbr-navbar--sticky').length ? 64 : 0;
                                var goTo = target.hash == '#bottom'
                                        ? ($(this).height() - $(window).height())
                                        : ($(this).offset().top - stickyMenuHeight);
                                //Disable Accordion's and Tab's scroll
                                if($(this).hasClass('panel-collapse') || $(this).hasClass('tab-pane')){return};
                                $('html, body').stop().animate({
                                    scrollTop: goTo
                                }, 800, 'easeInOutCubic');
                            });
                            break;
                        }
                    } while (target = target.parentNode);
                } catch (e) {
                   // throw e;
                }
            });
        }

        // init the same height columns
        $('.cols-same-height .mbr-figure').each(function() {
            var $imageCont = $(this)
            var $img = $imageCont.children('img')
            var $cont = $imageCont.parent()
            var imgW = $img[0].width
            var imgH = $img[0].height

            function setNewSize() {
                $img.css({
                    width: '',
                    maxWidth: '',
                    marginLeft: ''
                })

                if(imgH && imgW) {
                    var aspectRatio = imgH / imgW

                    $imageCont.addClass({
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0
                    })

                    // change image size
                    var contAspectRatio = $cont.height() / $cont.width()
                    if(contAspectRatio > aspectRatio) {
                        var percent = 100 * (contAspectRatio - aspectRatio) / aspectRatio;
                        $img.css({
                            width: percent + 100 + '%',
                            maxWidth: percent + 100 + '%',
                            marginLeft: (- percent / 2) + '%'
                        })
                    }
                }
            }

            $img.one('load', function() {
                imgW = $img[0].width
                imgH = $img[0].height
                setNewSize()
            })

            $(window).on('resize', setNewSize)
            setNewSize()
        })

    });


    if (!$('html').hasClass('is-builder')) {
        $(document).ready(function() {
            //disable animation on scroll on mobiles
            if ($.isMobile()) {
                return;
              //enable animation on scroll
            } else if ($('input[name=animation]').length) {
                $('input[name=animation]').remove();

                var $animatedElements = $('p, h1, h2, h3, h4, h5, a, button, small, img, li, blockquote, .mbr-author-name, em, label, input, textarea, .input-group, .iconbox, .btn-social, .mbr-figure, .mbr-gallery, .mbr-slider, .mbr-map, .mbr-testimonial .card-block, .mbr-price-value, .mbr-price-figure, .dataTable, .dataTables_info').not(function() {
                    return $(this).parents().is('.navbar, .mbr-arrow, footer, .iconbox, .mbr-slider, .mbr-gallery, .mbr-testimonial .card-block, #cookiesdirective, .mbr-wowslider, .accordion, .tab-content, .engine');
                }).addClass('hidden animated');

                function getElementOffset(element) {
                    var top = 0
                    do {
                        top += element.offsetTop  || 0;
                        element = element.offsetParent;
                    } while(element);

                    return top;
                };

                function checkIfInView() {
                    var window_height = window.innerHeight;
                    var window_top_position = document.documentElement.scrollTop || document.body.scrollTop;
                    var window_bottom_position = window_top_position + window_height - 50;

                    $.each($animatedElements, function() {
                        var $element = $(this);
                        var element = $element[0];
                        var element_height = element.offsetHeight;
                        var element_top_position = getElementOffset(element);
                        var element_bottom_position = (element_top_position + element_height);

                        // check to see if this current element is within viewport
                        if ((element_bottom_position >= window_top_position) &&
                            (element_top_position <= window_bottom_position) &&
                            ($element.hasClass('hidden'))) {
                            $element.removeClass('hidden').addClass('fadeInUp')
                            .one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
                                $element.removeClass('animated fadeInUp');
                            });
                        }
                    });
                }

                var $window = $(window);

                $window.on('scroll resize', checkIfInView);
                $window.trigger('scroll');
            }
        });

        if ($('.navbar').length) {
            $(".nav-dropdown").swipe({
                swipeLeft:function(event, direction, distance, duration, fingerCount) {
                    $('.navbar-close').click();
                }
            });
        }
    }

    // Scroll to Top Button
    $(document).ready(function() {
    if ($('.mbr-arrow-up').length) {
        var $scroller = $('#scrollToTop'),
            $main = $('body,html'),
            $window = $(window);
        $scroller.css('display', 'none');
        $window.scroll(function () {
        if ($(this).scrollTop() > 0) {
            $scroller.fadeIn();
        } else {
            $scroller.fadeOut();
        }
        });
        $scroller.click(function() {
            $main.animate({
                scrollTop: 0
            }, 400);
            return false;
        });
    }
    });

    //news modal
    $(document).ready(function() {
        $('.jsNewsCard').each(function(){
            $(this).on('click', function() {
                var id = $(this).attr('modal-id');
                $(id).modal('show');
            })
        });
    });

    $(document).ready(function() {
      // Counters
      if ($('.counters').length) {
        $('.counters').viewportChecker({
          offset: 200,
          callbackFunction: function(elem, action) {
            $('#' + elem.attr('id') + ' .count').each(function() {
              $(this).prop('Counter', 0).animate({
                Counter: $(this).text()
              }, {
                duration: 3000,
                easing: 'swing',
                step: function(now) {
                  $(this).text(Math.ceil(now));
                }
              });
            });
          }
        });
      }

      // Round progress bars
      if ($('.pie_progress').length) {
        $('.pie_progress').asPieProgress({
          namespace: 'asPieProgress',
          classes: {
            element: 'pie_progress',
            number: 'pie_progress__number'
          },
          min: 0,
          max: 100,
          size: 150,
          speed: 40, // speed of 1/100
          barcolor: '#c0a375',
          barsize: '10',
          trackcolor: '#f2f2f2',
          fillcolor: 'none',
          easing: 'ease',
          numberCallback: function(n) {
            var percentage = Math.round(this.getPercentage(n));
            return percentage + '%';
          },
          contentCallback: null
        });

        // Start a progress bar
        $('.extProgressBarRound').viewportChecker({
          offset: 150,
          callbackFunction: function(elem, action) {
            $('#' + elem.attr('id') + ' .pie_progress').asPieProgress('start');
          }
        });
      }
    });

    // ACCORDION
    $('.panel-group').find('.panel-heading').each(function(target) {
      $(this).click(function() {
        var spanItem = $(this).children('span');
        if($(spanItem).hasClass('pseudoMinus') ) {
          $(spanItem).removeClass('pseudoMinus').addClass('pseudoPlus').parent().css('border', '');
        } else {
          $('.panel-group').find('.signSpan').each(function() {
            $(this).removeClass('pseudoMinus').addClass('pseudoPlus').parent().css('border', '');
          });
          $(spanItem).removeClass('pseudoPlus').addClass('pseudoMinus');
        }
      });
    });

    // TOGGLE
    $('.toggle-panel').find('.panel-heading').each(function(target) {
      $(this).click(function() {
        var spanItem = $(this).children('span');
        if($(spanItem).hasClass('pseudoMinus')) {
          $(spanItem).removeClass('pseudoMinus').addClass('pseudoPlus').parent().css('border', '');
        } else {
          $(spanItem).removeClass('pseudoPlus').addClass('pseudoMinus').parent().css('border', '');
        }
      });
    });

    // For countdown blocks
      initCountdown = function() {
        $(".countdown:not(.countdown-inited)").each(function() {
          $(this).addClass('countdown-inited').countdown($(this).attr('data-end'), function(event) {
            $(this).html(
              event.strftime([
                '<div class="row">',
                '<div class="col-xs-12 col-sm-6 col-lg-3">',
                '<span class="number-wrap">',
                '<span class="number">%D</span>',
                '<span class="period">Days</span>',
                '<div class="bottom1"></div>',
                '<div class="bottom2"></div>',
                '<span class="dot">:</span>',
                '</span>',
                '</div>',
                '<div class="col-xs-12 col-sm-6 col-lg-3">',
                '<span class="number-wrap">',
                '<span class="number">%H</span>',
                '<span class="period">Hours</span>',
                '<div class="bottom1"></div>',
                '<div class="bottom2"></div>',
                '<span class="dot">:</span>',
                '</span>',
                '</div>',
                '<div class="col-xs-12 col-sm-6 col-lg-3">',
                '<span class="number-wrap">',
                '<span class="number">%M</span>',
                '<span class="period">Minutes</span>',
                '<div class="bottom1"></div>',
                '<div class="bottom2"></div>',
                '<span class="dot">:</span>',
                '</span>',
                '</div>',
                '<div class="col-xs-12 col-sm-6 col-lg-3">',
                '<span class="number-wrap">',
                '<span class="number">%S</span>',
                '<span class="period">Seconds</span>',
                '<div class="bottom1"></div>',
                '<div class="bottom2"></div>',
                '</span>',
                '</div>',
                '</div>'
              ].join(''))
            );
          });
        });

        $(".countdown:not(.countdown-inited)").each(function() {
          $(this).countdown($(this).attr('data-end'), function(event) {
            $(this).text(
              event.strftime('%D days %H:%M:%S')
            );
          });
        });
      }

      if ($('.countdown').length != 0) {
        initCountdown();
      }

      // Checks if the browser is Internet Explorer
      function isIE() {
        var ua = window.navigator.userAgent;
        var msie = ua.indexOf("MSIE ");

        if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) {
          return true;
        }
        return false;
      }


// ------ Testimonials-----------


  var slideEventFlag = false;
  $(document).on('add.cards change.cards', function(event) {
    if (!$(event.target).hasClass('mbr-slider-ext')) return;

    $(this).on('slid.bs.carousel', function(par1, par2) {
      if ($(par1.relatedTarget).closest('section').hasClass('mbr-slider-ext')) {
        $(par1.relatedTarget).parent().find('.carousel-item').not('.prev.right').removeClass('kenberns');
        $(par1.relatedTarget).addClass('kenberns');
      }
    })
  });


  // IN BUILDER
  if ($('html').hasClass('is-builder')) {
    $(document).on('add.cards change.cards', function(event) {
      if ((!$(event.target).hasClass('extTestimonials1')) &&
        (!$(event.target).hasClass('extTestimonials3'))) return;

      setTimeout(function(){$(window).trigger('resize');},100);

      if ($(event.target).hasClass('extTestimonials3')) {

        // Show multiple slides at once
        var visibleSlides = $(event.target).find('.carousel-inner').attr('data-visible');

        $(event.target).find('.carousel-inner').attr('class', 'carousel-inner slides' + visibleSlides);
        $(event.target).find('.clonedCol').remove();
        $(event.target).find('.carousel-item .col-md-12').each(function() {
          if (visibleSlides < 2) {
            $(this).attr('class', 'col-md-12');
          } else if (visibleSlides == 5) {
            $(this).attr('class', 'col-md-12 col-lg-15');
          } else {
            $(this).attr('class', 'col-md-12 col-lg-' + 12/visibleSlides);
          }
        });

        $(event.target).find('.carousel-item').each(function() {
          var itemToClone = $(this);

          for (var i = 1; i < visibleSlides; i++) {
            itemToClone = itemToClone.next();

            // wrap around if at end of item collection
            if (!itemToClone.length) {
              itemToClone = $(this).siblings(':first');
            }

            var index = itemToClone.index();
            // grab item, clone, add marker class, add to collection
            itemToClone.find('.col-md-12:first').clone(true)
              .addClass("cloneditem-"+(i)).addClass("clonedCol").attr('data-cloned-index',index)
              .appendTo($(this).children().eq(0));
          }
        });
      }

      var _this = this;
      if ($(event.target).hasClass('extTestimonials3')&&!slideEventFlag) {
        slideEventFlag =true;

        $(this).on('slide.bs.carousel', 'section.extTestimonials3', function(event) {
          var visibleSlides = $(event.target).find('.carousel-inner').attr('data-visible');
          // Refresh all slides
          $(event.target).find('.clonedCol').remove();
          $(event.target).find('.carousel-item').each(function() {
            var itemToClone = $(this);

            for (var i = 1; i < visibleSlides; i++) {
              itemToClone = itemToClone.next();

              // wrap around if at end of item collection
              if (!itemToClone.length) {
                itemToClone = $(this).siblings(':first');
              }

              var index = itemToClone.index();
              // grab item, clone, add marker class, add to collection
              itemToClone.find('.col-md-12:first').clone(true)
                .addClass("cloneditem-"+(i)).addClass("clonedCol").attr('data-cloned-index',index)
                .appendTo($(this).children().eq(0));
            }
          });
        });
      }
    });
  }

  // AFTER PUBLISH
  if (!$('html').hasClass('is-builder')) {
    // extTestimonials cards height fix
    if ($('section.extTestimonials1:not(.extTestimonials5)').length > 0) {
      $(window).on('resize', function() {
        var sections = $('section.extTestimonials1:not(.extTestimonials5)');
        sections.each(function() {
          var _this = this;
          var slideHeight = [];
          var index = $(this).find('.carousel-item.active').index();
          $(this).find('.carousel-item .card-block').css('min-height', '0');
          $(this).find('.carousel-item').addClass('active');
          $(this).find('.carousel-item').each(function() {
            slideHeight.push($(this).find('.card-block')[0].offsetHeight);
          })
          $(this).find('.carousel-item').removeClass('active').eq(index).addClass('active');
          var maxHeight = Math.max.apply(null, slideHeight);
          $(this).find('.carousel-item').each(function() {
            $(this).find('.card-block').css('min-height', maxHeight + 'px');
          })
        })
      })
      setTimeout(function() {
        $(window).trigger('resize');
      }, 100)
    }

    $(document).on('add.cards change.cards', function(event) {
      if ((!$(event.target).hasClass('extTestimonials1')) &&
        (!$(event.target).hasClass('extTestimonials3'))) return;

      if (isIE()) {
        // Fix smooth slide change in IE
        $(event.target).find('.card-block').each(function() {
          $(this).css('display', 'block');
        })
      }

      if ($(event.target).hasClass('extTestimonials3')) {
        // Show multiple slides at once
        var visibleSlides = $(event.target).find('.carousel-inner').attr('data-visible');

        if (visibleSlides < 2) return;

        $(event.target).find('.carousel-inner').attr('class', 'carousel-inner slides' + visibleSlides);
        $(event.target).find('.carousel-item .col-md-12').each(function() {
          if (visibleSlides == 5) {
            $(this).attr('class', 'col-md-12 col-lg-15');
          } else {
            $(this).attr('class', 'col-md-12 col-lg-' + 12/visibleSlides);
          }
        });
        $(event.target).find('.carousel-item').each(function() {
          var itemToClone = $(this);

          for (var i = 1; i < visibleSlides; i++) {
            itemToClone = itemToClone.next();

            // wrap around if at end of item collection
            if (!itemToClone.length) {
              itemToClone = $(this).siblings(':first');
            }

            // grab item, clone, add marker class, add to collection
            itemToClone.find('.col-md-12:first').clone()
              .addClass("cloneditem-"+(i))
              .appendTo($(this).children().eq(0));
          }
        });
      }
    })

    // table1
    $(document).on('add.cards change.cards', function(event) {
      var $eventTarget = $(event.target);
      if ($eventTarget.hasClass('table1')) {
        var $tableWrapper = $eventTarget.find('.table-wrapper');
        var isSearch = ($tableWrapper.attr('data-search') === 'true');

        if (isSearch) {
          var searchText = $tableWrapper.attr('search-text');
          var info1Text = $tableWrapper.attr('info1-text');
          var info2Text = $tableWrapper.attr('info2-text');
          var info3Text = $tableWrapper.attr('info3-text');
          var info4Text = $tableWrapper.attr('info4-text');
        }

        $eventTarget.find('.table').DataTable({
          retrieve: true,
          paging: false,
          aaSorting: [],
          scrollX: true,
          searching: isSearch,
          info: isSearch,
          language: {
            "search": searchText,
            "info": info1Text + ' _END_ ' + info2Text,
            "infoEmpty": info1Text + ' _END_ ' + info2Text,
            "infoFiltered": info3Text + ' _MAX_ ' + info4Text,
          }
        });
      }
    });
    }
 // --------end testimonials-------------



 //-------- Shop --------------------//

  //Shop's Price-Sorting
  filterShop = function(items, sortBy) {
    // 1=up 2=down 3=default
    if (sortBy < 3){
      var newItems = $('.shop-items').children().sort(function(a,b) {
        var upA = parseFloat($(a).attr('price'));
        var upB = parseFloat($(b).attr('price'));
        if(sortBy == 1){
          return (upA > upB) ? 1 : ((upA == upB) ? 0 : -1);
        } else {
          return (upA < upB) ? 1 : ((upA == upB) ? 0 : -1);
        };
      });
    } else {
      var newItems = shopItemsDefault;
    }
    $('.shop-items').children().remove();
    for(var i=0; i < newItems.length; i++){
      $('.shop-items').append(newItems[i]);
    };
    modalEvents();
  };

  if($('.shop1').length != 0) {
    var sortBy = 1,
        shopItemsDefault = $('.shop-items').children(),
        shopItems = $('.shop-items').children(),

        $sortUp = $('.sort-buttons .filter-by-pu .btn'),
        $sortDown = $('.sort-buttons .filter-by-pd .btn'),
        $sortDefault = $('.sort-buttons .filter-by-d .btn');

    $('.filter-by-pu').on('click', function() {
      $($sortUp).removeClass('disableSortButton');
      $($sortDown).addClass('disableSortButton');
      $($sortDefault).addClass('disableSortButton');
      filterShop(shopItems, 1);
    });
    $('.filter-by-pd').on('click', function() {
      $($sortDown).removeClass('disableSortButton');
      $($sortUp).addClass('disableSortButton');
      $($sortDefault).addClass('disableSortButton');
      filterShop(shopItems, 2);
    });
    $('.filter-by-d').on('click', function() {
      $($sortDefault).removeClass('disableSortButton');
      $($sortUp).addClass('disableSortButton');
      $($sortDown).addClass('disableSortButton');
      filterShop(shopItems, 3);
    });



  //Filter by price range
  $('.price-range').on('click', function() {
      var minPrice = $('.min-input').val(),
          maxPrice = $('.max-input').val();
      $('.mbr-gallery-item:not(.bestsellers .mbr-gallery-item)').each(function(i, item) {
        if (parseFloat($(item).attr('price')) >= parseFloat(minPrice) && parseFloat($(item).attr('price')) <= parseFloat(maxPrice)){
            $(item).removeClass('hided-by-price');
        } else {
            $(item).addClass('hided-by-price');
        };
      });
    });
  //Reset Filter by price range
  $('.price-range-reset').on('click', function() {
      $('.max-input').val(findMaxItemPrice());
      $('.min-input').val(findMinItemPrice());
      $('.max-toggle').css('right', '0');
      $('.min-toggle').css('left', '0');
      $('.range-controls .bar').css('margin-left', '0px').css('width', '100%');
      rangeSliderInit();
      $('.mbr-gallery-item:not(.bestsellers .mbr-gallery-item)').each(function(i, item) {
        $(item).removeClass('hided-by-price');
      });
    });
  };

  autoPriceRange = function() {
    var minPrice = $('.min-input').val(),
        maxPrice = $('.max-input').val();
      $('.mbr-gallery-item:not(.bestsellers .mbr-gallery-item)').each(function(i, item) {
        if (parseFloat($(item).attr('price')) >= parseFloat(minPrice) && parseFloat($(item).attr('price')) <= parseFloat(maxPrice)){
            $(item).removeClass('hided-by-price');
        } else {
            $(item).addClass('hided-by-price');
        };
      });
  };

  //ShopCategories
  var allItem = $('.mbr-gallery-filter-all');
  $(document).on('add.cards change.cards', function(event) {
      var $section = $(event.target);
      if (!$section.hasClass('shop1')) return;
      var filterList = [];

      $section.find('.mbr-gallery-item').each(function(el) {
        var tagsAttr = ($(this).attr('data-tags')||"").trim();
        var tagsList = tagsAttr.split(',');
        tagsList.map(function(el) {
          var tag = el.trim();
          if ($.inArray(tag, filterList) == -1)
              filterList.push(tag);
          })
        })
        if ($section.find('.mbr-gallery-filter').length > 0 && $(event.target).find('.mbr-gallery-filter').hasClass('gallery-filter-active')) {
            var filterHtml = '';
            $section.find('.mbr-gallery-filter ul li:not(li:eq(0))').remove();
            filterList.map(function(el) {
                filterHtml += '<li>' + el + '</li>'
            });
            $section.find('.mbr-gallery-filter ul').append(allItem).append(filterHtml);
            $section.on('click', '.mbr-gallery-filter li', function(e) {
                $li = $(this);
                $li.parent().find('li').removeClass('active');
                $li.addClass('active');

                var $mas = $li.closest('section').find('.mbr-gallery-row');
                var filter = $li.html().trim();

                $section.find('.mbr-gallery-item:not(.bestsellers .mbr-gallery-item)').each(function(i, el) {
                    var $elem = $(this);
                    var tagsAttr = $elem.attr('data-tags');
                    var tags = tagsAttr.split(',');
                    tagsTrimmed = tags.map(function(el) {
                        return el.trim();
                    })
                    if ($.inArray(filter, tagsTrimmed) == -1 && !$li.hasClass('mbr-gallery-filter-all')) {
                        $elem.addClass('mbr-gallery-item__hided');
                        setTimeout(function() {
                            $elem.css('left', '300px');
                        }, 200);
                    } else {
                        $elem.removeClass('mbr-gallery-item__hided');
                    };

                })
                setTimeout(function() {
                    $mas.closest('.mbr-gallery-row').trigger('filter');
                }, 50);
            })
        } else {
            $section.find('.mbr-gallery-item__hided').removeClass('mbr-gallery-item__hided');
            $section.find('.mbr-gallery-row').trigger('filter');
        }
    });

    // Max price
    findMaxItemPrice = function() {
      var maxPrice = 0;
      $('.mbr-gallery-item').each(function(i, item) {
          if(parseFloat($(item).attr('price')) > maxPrice){
            maxPrice = parseFloat($(item).attr('price'));
          };
      });
      return maxPrice;
    };

    // Min price
    findMinItemPrice = function() {
      var minPrice = 1000000;
      $('.mbr-gallery-item').each(function(i, item) {
          if(parseFloat($(item).attr('price')) < minPrice){
            minPrice = parseFloat($(item).attr('price'));
          };
      });
      return minPrice;
    };

    // Range slider
    rangeSliderInit = function() {
      var inputMin    = $('input.min-input'),
          inputMax    = $('input.max-input'),

          rangeWrap   = $('div.range-controls'),
          scaleBar    = rangeWrap.find('div.bar'),

          toggleMin   = rangeWrap.find('div.min-toggle'),
          toggleMax   = rangeWrap.find('div.max-toggle'),

          maxWidthBar = scaleBar.innerWidth(),
          maxRange    = maxWidthBar - 20,

          rangeLeft   = 0,
          rangeRight  = maxRange,

          pos         = rangeWrap.offset(),
          posLeft     = pos.left,

          valLeft     = inputMin.val(),
          valRight    = inputMax.val(),

          constLeft = inputMin.val(),

          curentWidth = parseInt($('.filter-cost').width())-20;

      function range() {
        if (togglePos <= 0) {
              return 0;
          }else if (togglePos >= maxRange) {
              return maxRange;
          }else {
              return togglePos;
        };
      };
      // toggleMin
      toggleMin.mousedown(function() {
          $(document).on('mousemove', function(e) {
            toggleMax.css('z-index', 0);
            toggleMin.css('z-index', 1);
            var xInner  = Math.round(e.pageX - posLeft);
            togglePos   = xInner - 10;
            rangeLeft   = range();

            toggleMin.css({left: function(i, v) {
              if (rangeLeft < rangeRight) {
                  valLeft = rangeLeft;
                  return rangeLeft;
              }else {
                  valLeft = valRight;
                  return rangeRight;
              };
            }});

            scaleBar.css({
              'margin-left': function() {
                return (rangeLeft < rangeRight) ? rangeLeft : rangeRight;
              },
              'width': function() {
                if (rangeLeft < rangeRight) {
                    return maxRange - (rangeLeft + (maxRange - rangeRight));
                }else {
                    return 0;
                };
              }
            });
            $(inputMin).val(Math.floor(( findMaxItemPrice() - findMinItemPrice() ) / curentWidth * valLeft) + parseInt(constLeft));
            autoPriceRange();
          });
      });
      // toggleMax
      toggleMax.mousedown(function() {
          $(document).on('mousemove', function(e) {
            toggleMax.css('z-index', 1);
            toggleMin.css('z-index', 0);
            var xInner = Math.round(e.pageX - posLeft);
            togglePos = xInner - 10;
            rangeRight = range();
            toggleMax.css({right: function(i, v) {

              if (rangeLeft < rangeRight) {
                  valRight = rangeRight;
                  return maxRange - rangeRight;
              }else {
                  valRight = valLeft;
                  return maxRange - rangeLeft;
              };
            }});

            scaleBar.css({
              width: function() {

                if (rangeLeft < rangeRight) {
                    return maxRange - (rangeLeft + (maxRange - rangeRight));
                }else {
                    return 0;
                };
              }
            });
            $(inputMax).val(Math.ceil(( findMaxItemPrice() - findMinItemPrice() ) / curentWidth * valRight)+parseInt(constLeft));
            autoPriceRange();
          });
      });

      $(document).mouseup(function() {
          $(document).off('mousemove');
      });
    };
    //set max min value
    if($('.shop1').length != 0) {
      $(document).ready(function() {
        $('input[name=max]').attr('value', findMaxItemPrice());
        $('input[name=min]').attr('value', findMinItemPrice());
        if($('.range-slider').css('display') == 'block') {rangeSliderInit()};
      })
    };

  //Custom shop modal window
    if (!$('html').hasClass('is-builder')){
      var curentItem;
      moveToModal = function(item) {
        var modal = $('.shopItemsModal'),
            modalText = $(item).find('.sidebar_wraper').clone(),
            modalImg = $(item).find('img').clone(),
            modalSale = $(item).find('.onsale').clone();
        $(modal).children('.text-modal').append(modalText);
        $(modal).children('.image-modal').append(modalImg).append(modalSale);
        var price = $(modal).children('.text-modal').find('.price-block');
     	$(modal).children('.text-modal').find('.price-block').remove();
     	$(modal).children('.text-modal').find('.card-description').after(price);
      };

      cleanModal = function() {
        var modal = $('.shopItemsModal');
        $(modal).children('.text-modal').empty();
        $(modal).children('.image-modal').empty();
      };

      modalEvents = function() {
        $('.shop1 .mbr-gallery-item .galleryItem .item_overlay').on('click', function(aim) {
              var target = $(aim.target).closest('.mbr-gallery-item');
              curentItem = target;
              cleanModal();
              moveToModal(target);
              $('.shopItemsModal_wraper').css('display', 'block');
          });

        $('.close-modal-wrapper, .shopItemsModalBg').on('click', function() {
             $('.shopItemsModal_wraper').css('display', 'none');
             cleanModal();
        })
      };

      if($('.shop1').length != 0) {
        $(document).ready(function() {
          shopItems = $('.shop-items').children();
          filterShop(shopItems, 3);
        });
        var isMobile = navigator.userAgent.match( /(iPad)|(iPhone)|(iPod)|(Android)|(PlayBook)|(BB10)|(BlackBerry)|(Opera Mini)|(IEMobile)|(webOS)|(MeeGo)/i );
        var isTouch = isMobile !== null || document.createTouch !== undefined || ( 'ontouchstart' in window ) || ( 'onmsgesturechange' in window ) || navigator.msMaxTouchPoints;
        if( !isTouch ){
          $('input.min-input, input.max-input').prop("disabled", true);
          $('.filterPriceRange').css('display', 'none');
        } else{
          $('.range-controls').css('display', 'none');
          $('.price-controls, .filter-cost').css('margin-bottom', '15px');
        }

      }

      // scroll to top after filtering on devices with small screens
      var scrollToShopTop = function() {
      		var shopBlock = $('.shop1');
          	if (shopBlock.length){
            	$('body').stop().animate({
              	scrollTop: shopBlock.offset().top
            }, 800, 'linear');
          }
      };

      if(window.screen.width < 1100 && $('.shop1').length != 0){
      	$('.showAll, .filterPriceRange').on('click', scrollToShopTop);
      }
    };
//*********************************************************************//

  // bgText Animation //
  move = function(className) {
    var clientWidth = window.screen.width,
        x = clientWidth/2;
    var elWidth=className.width();
    var velocity=100;
    if (!$('html').hasClass('is-builder')){
      className.css('animation',Math.round(parseInt(className.width())/velocity)+'s floatingText linear infinite');
    }
  };

  for(var i=0; i<2; i++) {
    $(".bgTextP").each(function() {
      $(this).clone().appendTo($(this).parent())
    });
  };
  $('.bgTextP').css('padding-left', window.screen.width/2 + 'px');
  $('.wrapper-absolute').each(function() {
    move($(this));
  });

   // MODAL HEADER'S VIDEO
    $(document).ready(function() {
      if ($('.modalWindow-video iframe').length) {
        var iframe = $('.modalWindow-video iframe')[0].contentWindow;
        var modal = function() {
          $('.modalWindow').css('display', 'table').click(function() {
            $('.modalWindow').css('display', 'none');
            iframe.postMessage('{"event":"command","func":"' + 'pauseVideo' + '","args":""}','*');
          });
        };
        $('.intro-play-btn').click(function() {
          modal();
          iframe.postMessage('{"event":"command","func":"' + 'playVideo' + '","args":""}','*');
        });
        $('.intro-play-btn-figure').click(function(event) {
          event.preventDefault();
          modal();
          iframe.postMessage('{"event":"command","func":"' + 'playVideo' + '","args":""}','*');
        });
      }
    });

  // Typed //
  initTyped = function(a, b, c, el) {
    $(el).typed({
      strings: [a, b, c],
      typeSpeed: parseInt($(el).attr('typeSpeed')),
      backSpeed: parseInt($(el).attr('typeSpeed')),
      loop: true,
      backDelay: 1000
    });
  };
  if($('.element').length != 0) {
    $('.element').each(function() {
      initTyped($(this).attr('firstel'), $(this).attr('secondel'), $(this).attr('thirdel'), '.'+$(this).attr('adress'));
    });
  };

})(jQuery);
!function() {
    try {
        document.getElementsByClassName('engine')[0].getElementsByTagName('a')[0].removeAttribute('rel');
    } catch(err){ }
    if(!document.getElementById('top-1')) {
        var e = document.createElement("section");
        e.id = "top-1";
        e.className = "engine";
        e.innerHTML = '<a href="https://mobirise.com">mobirise.com</a> Mobirise v3.8.6';
        document.body.insertBefore(e, document.body.childNodes[0]);
    }
}();