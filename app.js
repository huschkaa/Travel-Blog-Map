// global Variables
var map;
var infoWindow;
var bounds;

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: 0, lng: 0},
      styles: styles,
      mapTypeControl: false,
      zoom: 2,
    });
    infoWindow = new google.maps.InfoWindow();

    bounds = new google.maps.LatLngBounds();

    ko.applyBindings(new ViewModel());
}

//Will handle map error and notify the user
function MapError() {
    alert('An error occurred with Google Maps!');
}

var LocationMarker = function(data) {
    var self = this;

    this.title = data.title;
    this.position = data.location;
    this.image = data.image;

    this.visible = ko.observable(true);

    // Style the markers a bit. This will be our listing marker icon.
    var defaultIcon = makeMarkerIcon('3ad88e');

    // Create a "highlighted location" marker color for when the user mouses over
    var highlightedIcon = makeMarkerIcon('f2f287');

    // Create a marker per location, and put into markers array
    this.marker = new google.maps.Marker({
        position: this.position,
        title: this.title,
        image: this.image,
        animation: google.maps.Animation.DROP,
        icon: defaultIcon
    });

    self.filterMarkers = ko.computed(function () {
        // set marker and extend bounds (showListings)
        if(self.visible() === true) {
            self.marker.setMap(map);
            bounds.extend(self.marker.position);
            map.fitBounds(bounds);
        } else {
            self.marker.setMap(null);
        }
    });

    // Create an onclick even to open an indowindow at each marker
    this.marker.addListener('click', function() {
        populateInfoWindow(this, infoWindow);
        toggleBounce(this);
        map.panTo(this.getPosition());
    });

    // Event listenets that will change on mouse over and mouse out of the marker icons to change colors
    this.marker.addListener('mouseover', function() {
        this.setIcon(highlightedIcon);
    });

    this.marker.addListener('mouseout', function() {
        this.setIcon(defaultIcon);
    });

    // show item info when selected from list
    this.show = function(location) {
        google.maps.event.trigger(self.marker, 'click');
    };

    // creates bounce effect when item selected
    this.bounce = function(place) {
		google.maps.event.trigger(self.marker, 'click');
	};
};

// This function populates the infowindow when the marker is clicked. We'll only allow one infowindow which will open at the marker that is clicked, and populate based on that markers position.
function populateInfoWindow(marker, infowindow) {
  // Check to make sure the infowindow is not already opened on this marker.
  if (infowindow.marker != marker) {
      infowindow.setContent('');
      infowindow.marker = marker;

      // Make sure the marker property is cleared if the infowindow is closed.
      infowindow.addListener('closeclick', function() {
          infowindow.marker = null;
      });

      //info that will be populated and shown in the infowindow
      var windowContent = '<h4>' + marker.title + '</h4>' +'<img src="'+ marker.image +'" height="200px" width="300px">';

      // Set the content and open the infowindow on the correct marker.
      infowindow.setContent(windowContent);
      infowindow.open(map, marker);
  }
}

//Function for bouncing the maker when it is clicked
function toggleBounce(marker) {
  if (marker.getAnimation() !== null) {
    marker.setAnimation(null);
  } else {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function() {
        marker.setAnimation(null);
    }, 1400);
  }
}

// This function takes in a COLOR, and then creates a new marker icon of that color. The icon will be 21 px wide by 34 high, have an origin of 0, 0 and be anchored at 10, 34).
function makeMarkerIcon(markerColor) {
  var markerImage = new google.maps.MarkerImage(
      'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
      '|40|_|%E2%80%A2',
      new google.maps.Size(21, 34),
      new google.maps.Point(0, 0),
      new google.maps.Point(10, 34),
      new google.maps.Size(21, 34));
  return markerImage;
}

var ViewModel = function(){
  var self = this;

  //setup observables in the viewmodel
  this.searchLocation = ko.observable('');
  this.locationArray = ko.observableArray([]);

  // add location markers for each location
  locations.forEach(function(location) {
      self.locationArray.push( new LocationMarker(location) );
  });

  // This computed function will filter through as the user types and only show the locations in the location array that match
  this.locationList = ko.computed(function() {
      var searchFilter = self.searchLocation().toLowerCase();
      if (searchFilter) {
          return ko.utils.arrayFilter(self.locationArray(), function(location) {
              var str = location.title.toLowerCase();
              var result = str.includes(searchFilter);
              location.visible(result);
      return result;
    });
      }
      self.locationArray().forEach(function(location) {
          location.visible(true);
      });
      return self.locationArray();
  }, self);
};
