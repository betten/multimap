var express = require('express');
var Apricot = require('apricot').Apricot;
var http = require('http');
var DNode = require('dnode');
var Url = require('url');
var fs = require('fs');
var EventEmitter = require('events').EventEmitter;

var app = express.createServer(
	express.bodyDecoder(),
	express.staticProvider(__dirname + '/public')
);
var dnodejs = require('dnode/web').source();

app.use(app.router);

app.set('view', __dirname+ '/views');
app.set('view engine', 'jade');
app.set('view options', {
	layout: false
});

app.get('/', function(req, res) {
	res.render('index');
});

app.get('/dnode.js', function(req, res) {
	res.writeHead(200, {'Content-Type': 'text/javascript'});
	res.end(dnodejs);
});

var absolutize = function(host,url) {
	if(url.match(/^http:\/\/|^https:\/\//)) return url;
	if(url.match(/^\//)) return host + url;
	return host + '/' + url;
};

app.listen(3030);

var emitter = new EventEmitter();
var clients = {};
var map_lat = null;
var map_lng = null;
var map_zoom = null;
var map_maptypeid = null;
DNode(function(client, conn) {
	conn.on('ready', function() {
		emitter.on('joined', client.joined);
		emitter.on('said', client.said);
		emitter.on('disconnected', client.disconnected);
		emitter.on('clicked', client.clicked);
		emitter.on('moved', client.moved);
		emitter.on('movedmap', client.movedmap);
		emitter.on('zoomed', client.zoomed);
		emitter.on('maptypeid', client.maptypeid);
		emitter.on('renamed', client.renamed);
		client.name = getName();
		client.id = new Date().getTime().toString();
		client.init(client.id, client.name, clients, map_lat, map_lng, map_zoom, map_maptypeid);
		clients[client.id] = client.name;
		emitter.emit('joined', client.id, client.name);

	});
	conn.on('end', function() {
		try {
			emitter.removeListener('joined', client.joined);
			emitter.removeListener('said', client.said);
			emitter.removeListener('disconnected', client.disconnected);
			emitter.removeListener('clicked', client.clicked);
			emitter.removeListener('moved', client.moved);
			emitter.removeListener('movedmap', client.movedmap);
			emitter.removeListener('zoomed', client.zoomed);
			emitter.removeListener('maptypeid', client.maptypeid);
			emitter.removeListener('renamed', client.renamed);
			emitter.emit('disconnected', client.id, client.name);
		} catch(err) {
			console.log(err);
		}
		delete clients[client.id];
	});
	this.say = function(message) {
		if(message.match(/^\/nick\s\w{1,16}$/)) {
			var name = message.replace(/\/nick\s/,'');
			emitter.emit('renamed', client.id, client.name, name); 
			client.name = name;
			return false;
		}
		emitter.emit('said', client.name, message);
	};
	this.click = function(x,y) {
		emitter.emit('clicked', client.id, x, y);
	};
	this.move = function(lat, lng) {
		emitter.emit('moved', client.id, lat, lng);
	};
	this.movemap = function(lat, lng) {
		map_lat = lat;
		map_lng = lng;
		emitter.emit('movedmap', client.id, client.name, lat, lng);
	};
	this.zoom = function(z) {
		map_zoom = z;
		emitter.emit('zoomed', client.id, client.name, z);
	};
	this.maptypeid = function(typeid) {
		map_maptypeid = typeid;
		emitter.emit('maptypeid', client.id, client.name, typeid);
	};
}).listen({
	protocol: 'socket.io',
	server: app,
	transports: 'websocket xhr-multipart xhr-polling htmlfile'.split(/\s+/)
});

var names = ['Alexander','Blake','Caleb','Carter','Chase','Cole','Finn','Gunner','Harrison','Landon','Logan','Nash','Parker','Paxton','Taggart','Tristan','Thatcher','Trezdon','Tucker','Zephyr','Ashley','Aurora','Ava','Briar','Hadley','Haven','Isis','Isla','Jennason','Lauren','Madison','Sophia','Skyden','Victoria','Winter','Willow','Whitlyn','Zen','Zia'];
var getName = function() {
	return names[Math.floor(Math.random() * names.length)];
};
