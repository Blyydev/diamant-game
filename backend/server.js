/*
	- DIAMANT Game -
	> Blyy_ (c) 2022
*/

// INIT LIBS

	const bodyParser = require("body-parser")
	const express = require('express')
	const app = express()
	const server = require('http').createServer(app)
	const io = require('socket.io')(server)

	app.use(function(req, res, next) {
		res.header('Access-Control-Allow-Credentials', 'true')
		res.header('Access-Control-Allow-Origin', req.get('origin'))
		next()
	});

	app.use(express.static('dist'))
	app.use(bodyParser.urlencoded({extended: true}))
	app.use(bodyParser.json())

	app.get('/', function(req, res){
		res.sendFile(__dirname + '/dist/index.html');
	})

// IMPORT

	// GAME
	const GameInstance = require('./game.js')

// SOCKET *******************************

let games = {};
let playersOnline = {};

const createRoom = () => {
	let test = false
	let tmp = null
	while(!test){
		tmp = Math.floor(1000 + Math.random() * 9000);
		if(!(tmp in games)) test = true
	}
	return tmp
}


io.on("connection", (socket) => {

	// Create new game
	socket.on("CREATE_NEW_GAME", (pseudo) => {
		if(pseudo.length < 2 || pseudo.length > 12) return false

		let gameId = createRoom()

		socket.join(gameId);
		games[gameId] = new GameInstance(gameId, socket.id, io)

		games[gameId].connection(pseudo, socket.id)

		if(!playersOnline.hasOwnProperty(socket.id)){
			playersOnline[socket.id] = gameId
		}else{
			console.log('error player already in "playersOnline"')
		}
	});

	// Client trying to join a game
	socket.on("JOIN_GAME", (gameId, pseudo) => {
		if(pseudo.length < 2 || pseudo.length > 12) return false

		if(gameId in games){
			if(games[gameId].gameState === 0){

				socket.join(gameId);
				games[gameId].connection(pseudo, socket.id)

				if(!playersOnline.hasOwnProperty(socket.id))
					playersOnline[socket.id] = gameId

			}else{
				io.to(socket.id).emit("GAME_IS_RUNNING");
			}
		}else{
			io.to(socket.id).emit("GAME_NOT_FOUND");
		}
	});

	// Client trying to join a game as Game Screen (for local games)
	socket.on("JOIN_GAME_SPECTATOR", (gameId) => {
		if(gameId in games){

			socket.join(gameId);			
			games[gameId].screenGame(socket.id);

		}else{
			io.to(socket.id).emit("GAME_NOT_FOUND");
		}
	});

	// Player is Ready
	socket.on("SET_READY", (gameId) => {
		if(!(gameId in games)) return false;
		games[gameId].setReady(socket.id)
	});

	// Receive Choice fropm player
	socket.on("SUBMIT_CHOICE", (gameId, choice) => {
		if(!(gameId in games)) return false;

		games[gameId].setChoicePlayer(socket.id, choice)
		// 0 = stay in cave -- 1 = back to camp
	});

	// Reconnection
	socket.on('PLAYER_RECONNECTION', function(cookie){
		let tmpCookie = cookie.split('___')
		let oldSocket = tmpCookie[0]
		let gameId = tmpCookie[1]

		if(gameId in games
		   && games[gameId].gameState === 1
		   && oldSocket in games[gameId].discoPlayers){

			socket.emit('RECONNECT_PLAYER', true, gameId)

			socket.join(gameId);
			games[gameId].reconnection(socket.id, oldSocket)

			if(!playersOnline.hasOwnProperty(socket.id)) playersOnline[socket.id] = gameId
		}else{
			socket.emit('RECONNECT_PLAYER', false)
		}
	})

	// Disconnect
	socket.on("disconnect", () => {
		let gameId = playersOnline[socket.id]

		if(gameId in games){
			// Remove player
			games[gameId].disconnect(socket.id)
			
			// if no more player : delete this room
			if(games[gameId].testDestroy()) delete games[gameId]
		}

		delete playersOnline[socket.id]
	});

});


// Listen the Server
	server.listen(8084)