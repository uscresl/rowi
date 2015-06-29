/*
**
* multiaccordion.jquery.js - v1.3.1 (https://github.com/TouPye/multiaccordion.jquery)
* Pierre Skowron 2014 - www.pskowron.info
*
**
* Dependencies
* - jQuery
* - jQuery UI
**
* HowTo
* $(selector).multiaccordion(method, options);
**
* Method (String) - facultative
* - "init" : initialize multiaccordion - default if no method defined
* - "open" : open selected accordion(s)
* - "close" : close selected accordion(s)
**
* Options (Object) - facultative
* - header (String) : selector for the header
* - container (String) : selector for the container
* - closeIcon (String) : jQuery UI icon when accordion is closed
* - openIcon (String) : jQuery UI icon when accordion is open
* - initialState (String) : initial state of accordions ("open" or "close")
* - animation (Boolean) : whether the content display is animated or not
*/

(function($) {
    // default options of multiaccordion
    var defaults = {
        header: "h3",
        container: ".content",
        closeIcon: "ui-icon-circle-arrow-e",
        openIcon: "ui-icon-circle-arrow-s",
        initialState: "open",
        animation: false
    }

    var methods = {
        init: function(options) {
            var opts = $.extend(defaults, options),
            $this = (this);

            // if state is not forced by user, we affect the default state
            if ($this.data("state") == undefined) {
                setState($this, opts.initialState);
            }

            $this.addClass("ui-accordion ui-widget")
            .children(opts.header + ":first-child")
            .off()
            .addClass("ui-accordion-header")
            .prepend('<span class="ui-icon ui-accordion-header-icon"></span>')
            .hover(function() {
                $(this).toggleClass("ui-state-hover");
            })
            .click(function() {
                if (isOpen($this)) {
                    $this.multiaccordion("close");
                } else {
                    $this.multiaccordion("open");
                }
            })
            .next(opts.container)
            .addClass("ui-accordion-content", function() {
                if (isOpen($this)) {
                    $this.children(opts.header + ":first-child")
                    .addClass("ui-state-active ui-accordion-header-active")
                    .find("> .ui-icon").addClass(opts.openIcon)
                    .end()
                    .next(".ui-accordion-content")
                    .addClass("ui-accordion-content-active");
                } else {
                    $this.children(opts.header + ":first-child")
                    .addClass("ui-state-state-default")
                    .find("> .ui-icon").addClass(opts.closeIcon)
                    .end()
                    .next(".ui-accordion-content")
                    .addClass("ui-accordion-content-default")
                    .hide();
                }
            });
        },
        open: function(options) {
            var opts = $.extend(defaults, options),
            $this = (this);

            if (!isOpen($this)) {
                setState($this, "open");

                $this.children(".ui-accordion-header:first-child")
                .removeClass("ui-state-default").addClass("ui-accordion-header-active ui-state-active")
                .find("> .ui-icon")
                .removeClass(opts.closeIcon).addClass(opts.openIcon)
                .end()
                .next(".ui-accordion-content")
                .removeClass("ui-accordion-content-default").addClass("ui-accordion-content-active")
                .off();


                if (opts.animation) {
                    $(this).children(".ui-accordion-content").slideToggle();
                } else {
                    $(this).children(".ui-accordion-content").show();
                }
            }
        },
        close: function(options) {
            var opts = $.extend(defaults, options),
            $this = (this);

            if (isOpen($this)) {
                setState($this, "close");

                $this.children(".ui-accordion-header:first-child")
                .removeClass("ui-accordion-header-active ui-state-active").addClass("ui-state-default")
                .find("> .ui-icon")
                .removeClass(opts.openIcon).addClass(opts.closeIcon)
                .end()
                .next(".ui-accordion-content")
                .removeClass("ui-accordion-content-active").addClass("ui-accordion-content-default")
                .off();

                if (opts.animation) {
                    $(this).children(".ui-accordion-content").slideToggle();
                } else {
                    $(this).children(".ui-accordion-content").hide();
                }
            }
        }
    };

    function isOpen(elt) {
        return elt.data("state") == "open";
    }
    function setState(elt, state) {
        elt.attr("data-state", state).data("state", state);
    }

    $.fn.multiaccordion = function(params) {
        if (methods[params] != undefined) {
            if (this.length > 0) {
                return $(this).each(function(i) {
                    return methods[params].apply($(this), Array.prototype.slice.call(arguments, 1));
                });
            }
        } else if (typeof params === "object" || !params) {
            if (this.length > 0) {
                return $(this).each(function(i) {
                    return methods.init.apply($(this), arguments);
                });
            }
        } else {
            $.error("Method " + params + " doesn't exist on jQuery.multiaccordion");
        }
    }
})(jQuery);
