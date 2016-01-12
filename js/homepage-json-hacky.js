var DEMO = (function( $ ) {
  'use strict';

  var $grid = $('#grid'),
      $filterOptions = $('.filter-options'),
      $sizer = $grid.find('.shuffle__sizer'),

  init = function() {

    // Synchronously retrieve and display initial items
    var items = retrieveItems();
    // console.log("json_items: "+json_items);
    // var items = $.parseJSON(json_items).items;
    console.log("items: "+items);
    displayItems(items);

    // None of these need to be executed synchronously
    setTimeout(function() {
      listen();
      setupFilters();
      setupSorting();
      setupSearching();
    }, 100);

    // You can subscribe to custom events.
    // shrink, shrunk, filter, filtered, sorted, load, done
    $grid.on('loading.shuffle done.shuffle layout.shuffle', function(evt, shuffle) {
      // Make sure the browser has a console
      if ( window.console && window.console.log && typeof window.console.log === 'function' ) {
        console.log( 'Shuffle:', evt.type );
      }
    });

    // instantiate the plugin
    $grid.shuffle({
      itemSelector: '.picture-item',
      sizer: $sizer
    });

    // Destroy it! o_O
    // $grid.shuffle('destroy');
  },

  retrieveItems = function() {
    var path = "projects/";
    
    var projects_count = 0;
    // var projects_content = new Array();
    var projects_content = new Object();
    var project_source_categories = new Array();

    var base64decoded, json_content, projects_content;

    // FIND ALL THE FILES INSIDE THE FOLDER
    return $.ajax({
      url: "https://api.github.com/repos/openinnovationnetwork/2016-MIT-IAP-PrototypeJam/contents/"+path,
      method: "get",
      async: false
    })
    .success(function(allFiles){
      $.each(allFiles, function (index, value) {
        // GET CONTENT OF EACH JSON FILE
        if ((value.type == "file") && (value.name.split('.').pop() == "json")) {

          projects_count++;
          
          $.ajax({
            url: "https://api.github.com/repos/openinnovationnetwork/2016-MIT-IAP-PrototypeJam/contents/"+value.path,
            method: "get",
            async: false
          })
          .success(function( fileResponse ) {
            // PARSE CONTENT
            base64decoded = atob(fileResponse.content);
            
            try {
              json_content = jQuery.parseJSON(base64decoded);

              // Add to list of contents
              if (json_content.project_name && json_content.project_blurb) {
                projects_content.push(json_content);
              }

              // console.log('Retrieved file content');
            } catch (e) {
              // invalid json
            }
          });
        }
      });
    }).responseText;

    // THE CONTENT OF ALL FILES WAS RETRIEVED
    // $(document).ajaxStop(function() {
    //   console.log('All '+ projects_count +' projects retrieved');
    //   return responseText;
      
    // });
  },

  displayItems = function(items) {
    // Creating elements based on parsed JSON entry
    var itemsToCreate = items.length,
        frag = document.createDocumentFragment(),
        $htmlItems,
        htmlItems = [],
        classes = ['w2', 'h2', 'w3'],
        item,
        extras = "", cols = 3,
        shuffleSizer, figure, item_inner, picture, item_details, picture_blur, picture_description, figcaption, captionLink, tags,
        i, j;

    for (i = 0; i < itemsToCreate; i++) {
      item = items[i];

      // Figure
      figure = document.createElement('figure');
      figure.setAttribute('data-groups', '["'+item.groups.join('","')+'"]');
      figure.setAttribute('data-created', item.date);
      figure.setAttribute('data-title', item.title);

      // Figure classes
      figure.classList.add('m-span3', 'picture-item', 'shuffle-item', 'filtered');

      if ((item.extras) && (item.extras.length > 0)) {
        for (j = 0; j < item.extras.length; j++) {
          figure.classList.add("picture-item--"+item.extras[j]);
        }
      }

      if (item.cols) {
        cols = item.cols;
      }
      figure.classList.add('span'+cols);

      // Inner div
      item_inner = document.createElement('div');
      item_inner.className = 'picture-item__inner';
      figure.appendChild(item_inner);
      
      // Picture
      picture = document.createElement('img');
      picture.setAttribute('src','../img/'+item.img);
      picture.setAttribute('alt','');
      picture.setAttribute('height','145');
      picture.setAttribute('width','230');

      // Details
      item_details = document.createElement('div');
      item_details.className = 'picture-item__details clearfix';

        picture_blur = picture.cloneNode();
        picture_blur.className = 'picture-item__blur';

        // Caption
        figcaption = document.createElement('figcaption');
        figcaption.classList.add('picture-item__title', 'pull-left');

          captionLink = document.createElement('a');
          captionLink.setAttribute('target','_blank');
          captionLink.setAttribute('href', '../img/originals/'+item.original);
          captionLink.innerHTML = item.title;

          figcaption.appendChild(captionLink);

        tags = document.createElement('p');
        tags.className = 'picture-item__tags pull-right';
        if (item.groups.length > 0) {
          tags.innerHTML = item.groups.join(", ");
        }
        
        item_details.appendChild(picture_blur);
        item_details.appendChild(figcaption);
        item_details.appendChild(tags);

      // Appending children
      item_inner.appendChild(picture);
      item_inner.appendChild(item_details);
      
      if (item.description) {
        picture_description = document.createElement('p');
        picture_description.className = 'picture-item__description';
        picture_description.innerHTML = item.description;
        item_inner.appendChild(picture_description);
      }
      
      htmlItems.push( figure );
      frag.appendChild( figure );
    }

    $htmlItems = $(htmlItems);

    // Shuffle sizer after all the elements
    shuffleSizer = document.createElement('div');
    shuffleSizer.className = 'span3 m-span3 shuffle__sizer';
    frag.appendChild(shuffleSizer)

    // Insert items in the grid
    $grid.append(frag);

    // Tell shuffle items have been appended.
    // It expects a jQuery object as the parameter.
    $grid.shuffle('appended', $htmlItems );
  },

  // Set up button clicks
  setupFilters = function() {
    var $btns = $filterOptions.children();
    $btns.on('click', function() {
      var $this = $(this),
          isActive = $this.hasClass( 'active' ),
          group = isActive ? 'all' : $this.data('group');

      // Hide current label, show current label in title
      if ( !isActive ) {
        $('.filter-options .active').removeClass('active');
      }

      $this.toggleClass('active');

      // Filter elements
      $grid.shuffle( 'shuffle', group );
    });

    $btns = null;
  },

  setupSorting = function() {
    // Sorting options
    $('.sort-options').on('change', function() {
      var sort = this.value,
          opts = {};

      // We're given the element wrapped in jQuery
      if ( sort === 'date-created' ) {
        opts = {
          reverse: true,
          by: function($el) {
            return $el.data('date-created');
          }
        };
      } else if ( sort === 'title' ) {
        opts = {
          by: function($el) {
            return $el.data('title').toLowerCase();
          }
        };
      }

      // Filter elements
      $grid.shuffle('sort', opts);
    });
  },

  setupSearching = function() {
    // Advanced filtering
    $('.js-shuffle-search').on('keyup change', function() {
      var val = this.value.toLowerCase();
      $grid.shuffle('shuffle', function($el, shuffle) {

        // Only search elements in the current group
        if (shuffle.group !== 'all' && $.inArray(shuffle.group, $el.data('groups')) === -1) {
          return false;
        }

        var text = $.trim( $el.find('.picture-item__title').text() ).toLowerCase();
        return text.indexOf(val) !== -1;
      });
    });
  },

  // Re layout shuffle when images load. This is only needed
  // below 768 pixels because the .picture-item height is auto and therefore
  // the height of the picture-item is dependent on the image
  // I recommend using imagesloaded to determine when an image is loaded
  // but that doesn't support IE7
  listen = function() {
    var debouncedLayout = $.throttle( 300, function() {
      $grid.shuffle('update');
    });

    // Get all images inside shuffle
    $grid.find('img').each(function() {
      var proxyImage;

      // Image already loaded
      if ( this.complete && this.naturalWidth !== undefined ) {
        return;
      }

      // If none of the checks above matched, simulate loading on detached element.
      proxyImage = new Image();
      $( proxyImage ).on('load', function() {
        $(this).off('load');
        debouncedLayout();
      });

      proxyImage.src = this.src;
    });

    // Because this method doesn't seem to be perfect.
    setTimeout(function() {
      debouncedLayout();
    }, 500);
  };

  return {
    init: init
  };
}( jQuery ));



$(document).ready(function() {
  DEMO.init();
});
