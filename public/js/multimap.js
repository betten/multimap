$(document).ready(function() {
	var latlng = new google.maps.LatLng(-34.397, 150.644);
	var options = {
		zoom: 8,
		center: latlng,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	var map = new google.maps.Map($('#map').get(0), options);
	var remote = null;
	var mapClickEvent = function(event) {
		if(!remote) return false;
		remote.click(event.pixel.x, event.pixel.y);
	};
	var centerChangedEvent = function() {
		if(!remote) return false;
		var c = map.getCenter();
		remote.movemap(c.lat(), c.lng());
	};
	var center_changed_listener = null;
	var zoomChangedEvent = function() {
		if(!remote) return false;
		var z = map.getZoom();
		remote.zoom(z);
	};
	var zoom_changed_listener = null;
	var maptypeidChangedEvent = function() {
		if(!remote) return false;
		var i = map.getMapTypeId();
		remote.maptypeid(i);
	};
	var maptypeid_changed_listener = null;
	var mouseMoveEvent = function(event) {
		if(!remote) return false;
		remote.move(event.latLng.lat(), event.latLng.lng());
	};
	var addClientMouse = function(id, name) {
		$('#map').append('<div id="' + id + '" class="mouse">' + name + '</div>');
	};
	var addMessage = function(message) {
		$('#messages').append(message).scrollTop(99999999);
	};
	var addStatus = function(status) {
		$('#stati').prepend(status).scrollTop(0);
	};
	var mousemarkers = {};

	DNode(function() {
		this.name = null;
		this.id = null;
		this.init = function(id, name, clients, lat, lng, zoom, maptypeid) {
			this.id = id;
			this.name = name;
			$('#whoami').html('Your name is <strong>' + name + '</strong>');
			if(lat && lng) {
				var latlng = new google.maps.LatLng(lat, lng);
				map.setCenter(latlng);
			}
			if(zoom) map.setZoom(zoom);
			if(maptypeid) map.setMapTypeId(maptypeid);
		};
		this.joined = function(id, name) {
			if(this.id == id) return false;
			addMessage(
				$('<div class="message">').append(
					$('<strong>').text(name),
					$('<span>').text(' joined.')
				)
			);	
		};	
		this.said = function(name, message) {
			addMessage(
				$('<div class="message">').append(
					$('<strong>').text(this.name == name ? 'me' : name),
					$('<span>').text(': ' + message)
				)
			);
		};
		this.disconnected = function(id, name) {
			mousemarkers[id].setVisible(false);
			delete mousemarkers[id];
			addMessage(
				$('<div class="message">').append(
					$('<strong>').text(name),
					$('<span>').text(' left.')
				)
			);	
		};
		this.clicked = function(id, x, y) {
		};
		this.moved = function(id, lat, lng) {
			if(this.id == id) return false;
			if(!mousemarkers[id]) mousemarkers[id] = new google.maps.Marker({
				map: map,
				title: name
			});
			mousemarkers[id].setPosition(new google.maps.LatLng(lat, lng));
		};
		this.movedmap = function(id, name, lat, lng) {
			addStatus(
				$('<div class="status">').append(
					$('<strong>').text(name),
					$('<span>').text(' centered the map on lat long '),
					$('<strong>').text(Math.round(lat) + ', ' + Math.round(lng))
				)
			);
			if(this.id == id) return false;
			google.maps.event.removeListener(center_changed_listener);
			var c = new google.maps.LatLng(lat, lng);
			map.setCenter(c);
			center_changed_listener = google.maps.event.addListener(map, 'center_changed', centerChangedEvent);
		};
		this.zoomed = function(id, name, zoom) {
			addStatus(
				$('<div class="status">').append(
					$('<strong>').text(name),
					$('<span>').text(' zoomed to '),
					$('<strong>').text(zoom)
				)
			);
			if(this.id == id) return false;
			google.maps.event.removeListener(zoom_changed_listener);
			map.setZoom(zoom);
			zoom_changed_listener = google.maps.event.addListener(map, 'zoom_changed', zoomChangedEvent);
		};
		this.maptypeid = function(id, name, typeid) {
			addStatus(
				$('<div class="status">').append(
					$('<strong>').text(name),
					$('<span>').text(' changed the map type to '),
					$('<strong>').text(typeid)
				)
			);
			if(this.id == id) return false;
			google.maps.event.removeListener(maptypeid_changed_listener);
			map.setMapTypeId(typeid);
			maptypeid_changed_listener = google.maps.event.addListener(map, 'maptypeid_changed', maptypeidChangedEvent);
		};
	}).connect(3030, function(rmt) {
		remote = rmt;
		google.maps.event.addListener(map, 'click', mapClickEvent);
		center_changed_listener = google.maps.event.addListener(map, 'center_changed', centerChangedEvent);
		zoom_changed_listener = google.maps.event.addListener(map, 'zoom_changed', zoomChangedEvent);
		maptypeid_changed_listener = google.maps.event.addListener(map, 'maptypeid_changed', maptypeidChangedEvent);
		google.maps.event.addListener(map, 'mousemove', mouseMoveEvent);
		$('#say').keypress(function(e) {
			if(e.keyCode == 13) {
				remote.say($(this).val());
				$(this).val('');
			}
		});
	});
});
