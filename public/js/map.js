whereispat.map = function() {
	
	var LAST_ROUTE_UPDATE = "2012-07-27 15:09:58 +0600"

    var BICYCLE_IMAGE = new google.maps.MarkerImage('/images/bicycle_50.png', null, null, null, null);
    var TWITTER_IMAGE = new google.maps.MarkerImage('/images/twitter_newbird_blue.png', null, null, null, new google.maps.Size(35, 35));

    var instance = {};	
    var map = createMap();
    var infoWindow = new google.maps.InfoWindow();

    instance.render = function(route, tweetedRoute) {
        showCurrentLocation();
        showTweets(tweetedRoute);
        showRoute();
        showHowFarCircle();
        showProbableRoute(tweetedRoute);
        fitBounds(tweetedRoute);
    };

    function createMap() {
        return new google.maps.Map($('#map_canvas')[0], { center: currentLocation(), zoom: 7, mapTypeId: google.maps.MapTypeId.TERRAIN });
    };

    function currentLocation() {
        return new google.maps.LatLng($('.latitude').text(), $('.longitude').text());
    };

    function showCurrentLocation() {
        new google.maps.Marker({
            position: currentLocation(),
            map: map,
            animation: google.maps.Animation.BOUNCE,
            icon: BICYCLE_IMAGE
        });
    };

    function showHowFarCircle() {
        new google.maps.Circle({
            center: currentLocation(),
            map: map,
            radius: $('.how-far').text() * 1609,
            fillColor: "#c30083",
            fillOpacity: 0.1,
            strokeWeight: 2,
            strokeColor: "#c30083",
            strokeOpacity: 0.3
        });
    };

    function showTweets(tweetedRoute) {
        $.each(tweetedRoute.places, function() {
            var marker = new google.maps.Marker({
                position: new google.maps.LatLng(this.latitude, this.longitude),
                map: map,
                icon: TWITTER_IMAGE
            });

            var tweet = this.tweet;
			
            google.maps.event.addListener(marker, 'click', function() {
	            infoWindow.setContent(tweet);
			    infoWindow.open(map, marker);
			});			
        });
    };

    function showRoute() {
	
	    $.ajax({
			url: 'route/chiasso-osh-1000.json',
			dataType: 'json',
			success: function(points) {
				latLongs = $.map(points, function(point, i) {
					latLng = point.split(',');
					return new google.maps.LatLng(latLng[0], latLng[1]);
				});
		
				 new google.maps.Polyline({
				     map: map,
				     path: latLongs,
				     strokeColor: "#257890",
				     strokeOpacity: 1,
				     strokeWeight: 5,
				     geodesic: true,
				     zIndex: 0,
				 });
			},
			error: function(qXHR, textStatus, errorThrown) {
				console.log('Something went wrong trying to fetch route info: ' + textStatus + " " + errorThrown)
			}
		});
			
        showNotCycledLeg(new google.maps.LatLng('41.133581','16.866534'), new google.maps.LatLng('41.316929','19.45464')); // bari -> durres
        showNotCycledLeg(new google.maps.LatLng('41.016612','28.977127'), new google.maps.LatLng('41.009973','29.017231')); // bosphorus
        showNotCycledLeg(new google.maps.LatLng('37.591419','61.809983'), new google.maps.LatLng('39.100759','63.57032')); // mary->turkmenabat		
    };

    instance.computeDirections = function(route) {
        var directionsService = new google.maps.DirectionsService();
        $.each(route, function(i, leg) {
            directionsService.route(directionsRequestFor(leg),
            function(response, status) {
                if (status == google.maps.DirectionsStatus.OK) {
		            var directionsRenderer = new google.maps.DirectionsRenderer({ map: map, preserveViewport: false, suppressMarkers: true });                	
                    directionsRenderer.setDirections(response);
                    geoCode(response);
                } else {
                    console.log("Request to direction service failed. Status: " + status);
                }
            });
        });        
    };

    function geoCode(response) {
	    var route = response.routes[0];
		var geo_data = [];
		console.log('legs: ' + route.legs.length)
		$.each(route.legs, function(i, leg) {
		console.log('steps: ' + leg.steps.length)						
		  $.each(leg.steps, function(j, step) {
			
		    $.each(step.path, function(k, point) {
			    geo_data.push(point.toString());
			});						
		  });
		});
		
		console.log('geo_data: ' + geo_data.length)												
		console.log(geo_data)													
    };

    function showNotCycledLeg(from, to) {
	    new google.maps.Polyline({
            map: map,
            path: [from, to],
            strokeColor: "#FF4000",
            strokeOpacity: 0.5,
            strokeWeight: 4,
            geodesic: true,
            zIndex: 1
        });
    };

    function showProbableRoute(tweetedRoute) {
        var probableRoute = [];
        $.each(tweetedRoute.places, function() {
            if (Date.parse(this.visited_at) >= Date.parse(LAST_ROUTE_UPDATE)) {
                console.log("This tweet happened after the manual route mapping: " + this.visited_at + ". Tweeted from: " + this.latitude + "," + this.longitude);
                probableRoute.push(new google.maps.LatLng(this.latitude, this.longitude));
            }
        });

        new google.maps.Polyline({
            map: map,
            path: probableRoute,
            strokeColor: "#257890",
            strokeOpacity: 0.5,
            strokeWeight: 4,
            geodesic: true
        });
    };

    function directionsRequestFor(data) {
        return {
            origin: data.origin,
            destination: data.destination,
            waypoints: waypointsFor(data),
            avoidHighways: (typeof data.avoidHighways === 'undefined') ? true: data.avoidHighways,
            provideRouteAlternatives: false,
            travelMode: google.maps.DirectionsTravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC
        };
    };

    function waypointsFor(data) {
      if (data.waypoints) 
        return $.map(data.waypoints, function(w, i) { return { location: w, stopover: false } })
      else
        return []
    };

    function fitBounds(tweetedRoute) {
        var bounds = new google.maps.LatLngBounds();
        $.each(tweetedRoute.places, function() { bounds.extend(new google.maps.LatLng(this.latitude, this.longitude)); });
        map.fitBounds(bounds);
    };

    return instance;
};