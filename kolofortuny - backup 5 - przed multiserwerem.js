/* TODO
po zakończeniu gry jakaś wiadomość ogólna o co chodzi i co tam słychać
informacja że brak spółgłosek
ranking całkowity
*/

const Discord = require('discord.js');
const { prefix, token } = require('./config.json');
const GIFEncoder = require('gifencoder');
const client = new Discord.Client();
const { createCanvas, loadImage , registerFont } = require('canvas');
const fs = require('fs');

var kanal = '767826717971972157';
var rola = '771763289981845516'; // rola pozwalająca pisać na czacie;
var everyone = '394476100220223488';

var hasla = [ ['dwunastu gniewnych ludzi','film'], ['lot nad kukułczym gniazdem','film'], ['chłopiec w pasiastej piżamie','film'], ['stowarzyszenie umarłych poetów','film'], ['helikopter w ogniu','film'], ['mroczny rycerz powstaje','film'], ['cieśnina gibraltarska','geografia'], ['klonowanie organizmów','biotechnologia'], ['początek astronomicznej zimy','kalendarz'], ['francuscy impresjoniści','malarstwo'], ['genetyka molekularna','biologia'], ['gwiazdonos amerykański','zwierzęta'], ['powszechny spis ludności','prawo'], ['łyżwiarstwo figurowe','sport'], ['sztab generalny sił zbrojnych','wojsko'], ['poseł parlamentu europejskiego','stanowisko'], ['bieg sprinterski stylem klasycznym','narciarstwo'] ];
var naKole = ['550','350','400','1500','BANKRUT','300','500','300','400','250','1000','100','STOP','350','600','550','200','BANKRUT','2000','150','300','400','250','500'];
var kolory = ['blue','yellow','pink','darkblue','black','pink','yellow','darkgreen','red','yellow','blue','red','brown','blue','yellow','pink','darkblue','black','pink','yellow','darkgreen','red','pink','darkgrey'];
var samogloski = ['e','y','u','i','o','a','ó','ę','ą']

var rozgrywka = {
	gracze: [],
	stanKonta: [0, 0, 0],
	ogolnyStanKonta: [0,0,0],
	haslo: ['dwunastu gniewnych ludzi','film']
};
/*
rozgrywka.gracze = [{nick: 'Nicol.'},{nick: 'Lawrenc'},{nick: 'miszcz miejsc teraz raczej 3'}];
rozgrywka.stanKonta = [1200, 1500, 200];
*/
var odkryteLitery = [];
var wartoscNaKole = 0;

var stanGry = 0; // 0 - nierozpoczęta, 1 - można kręcić, 2 - oczekiwanie na spółgłoskę, 3 - można kręcić lub kupić samogłoskę lub zgadnąć
/////////////////// 4 - trzeba zgadywać hasło, 5 - podaj samogłoskę, 6 - wszystkie spółgłoski odsłonięte
/////////////////// 7 - samogłoska i hasło, 8 - hasło gdy musisz
var runda = 0;
var messPoTablicy = 'ee', timeout, iloscPol, dlugoscGifa, kanale, grajacy, uspokojSie = false, wyslijGifa = false, pula = 0;

client.on('ready', () => {
    console.log('Ready!');
	kanale = client.channels.get(kanal);
	client.user.setActivity('Koło fortuńskie', { type: 'PLAYING' })
	  .then(presence => console.log(`Activity set to ${presence.game ? presence.game.name : 'none'}`))
	  .catch(console.error);
	//tablica();
	//zakrecKolem();
	tablica(0);
});

client.on('error', (err) => {
   console.log(err.message)
});

client.login('NzY4NDcxMzQzMDM3MTUzMzAw.X5A8tQ.Jj2gfiQWR1ddW9iIwRtagcHi0Io');

/*
trzeba dać możliwość manualnego zakończenia gry z innego kanału
*/

fs.watch('imageskolo', function (event, filename) {
	//console.log(event, filename, fs.statSync('imageskolo/'+filename).size);
	
	if (filename=='myanimated.gif' && fs.statSync('imageskolo/'+filename).size!=0) {
		if (!wyslijGifa) return;
		wyslijGifa = false;
		//console.log('wyslijj gifa');
		setTimeout(function() {
			var channel = client.channels.get(kanal);
			channel.send({
			  files: [{
				attachment: 'imageskolo/myanimated.gif',
				name: 'kolo.gif'
			  }]
			})//.then(poZakreceniu());
		}, 100);
	} else if (filename=='kolofortunki2.png' && fs.statSync('imageskolo/'+filename).size!=0){	
		if (uspokojSie) return;
		uspokojSie = true;
		setTimeout(function() {
			uspokojSie = false;
		}, 1000);
		kanale.send({
		  files: [{
			attachment: 'imageskolo/kolofortunki2.png',
			name: 'kolo.png'
		  }]
		}).then(poTablicy(grajacy));
	}
	/*
	timer1[tap1.indexOf(filename)] = setTimeout(function() {
		channel.send({
		  files: [{
			attachment: 'gify/'+filename,
			name: filename
		  }]
		}).then(sentMessage => sendingGif(sentMessage,filename));
	}, (filename.endsWith('.gif') ? 2000 : 100));*/
});

client.on('message', message => {
	if (message.channel.id=='767826717971972157' && message.content=='f.stop') return stopGame();
    if (message.channel.id!=kanal) return;
	if (message.author.bot) {
		//console.log(message.attachments);
		if (message.attachments.array()[0] == undefined) return;
		if (message.attachments.array()[0].filename.endsWith('.gif')) {
			//console.log('jest gif');
			setTimeout(function(){
				poZakreceniu();
			}, Math.round(dlugoscGifa)+1500);
		}
		return;
	}
	var msg = message.content;
	if (msg=='f.join') {
		// jakaś grafika / richembed z tekstem kto gra 
		//console.log(rozgrywka.gracze[0]);
		//console.log(message, message.member);
		//console.log(message.guild.fetchMember(message.author));
		if (rozgrywka.gracze.length>0 && rozgrywka.gracze[0].id == message.author.id) return;
		if (rozgrywka.gracze.length>1 && rozgrywka.gracze[1].id == message.author.id) return;
		message.guild.fetchMember(message.author)
		  .then(fetchedMember => czyZaczynamy(fetchedMember))
		  .catch(console.error);
		return;
	} else if (msg == 'f.leave') {
		if (stanGry != 0) return kanale.send('Nie możesz opuścić gry w jej trakcie');
		for (let player of rozgrywka.gracze) {
			if (player.id == message.author.id) {
				rozgrywka.gracze.splice(rozgrywka.gracze.indexOf(player), 1);
				message.channel.send(message.author.username + ' opuścił grę');
				break;
			}
		}
		return;
	}
	if (stanGry == 0) return;
	//console.log('czy tu sie zatrzymuje',[rozgrywka.gracze[0].id,rozgrywka.gracze[1].id,rozgrywka.gracze[2].id].includes(message.author.id));
	if (![rozgrywka.gracze[0].id,rozgrywka.gracze[1].id,rozgrywka.gracze[2].id].includes(message.author.id)) return;
	if (!czyMozeGrac(message.author.id) || message.author.bot) return;
	if (stanGry == 6) {
		if (msg == '2') {
			stanGry = 7;
			kanale.send('Wpisz samogłoskę:');
			clearTimeout(timeout);
			timeout = setTimeout(function() {
				stanGry = 6;
				nextMove(grajacy);
				stanGry = 6;
			}, 20000);
		} else if (msg == '3') {
			stanGry = 8;
			kanale.send('Wpisz hasło (czas 30 sekund):');
			clearTimeout(timeout);
			timeout = setTimeout(function() {
				stanGry = 6;
				nextMove(grajacy);
				stanGry = 6;
			}, 30000);
		}
		return;
	}
	if (stanGry == 7) {
		rozgrywka.gracze[grajacy].stanKonta -= 200;
		if (!samogloski.includes(message.content)) {
			kanale.send('To nie jest samogłoska, przepadła kolejka');
			stanGry = 0;
			clearTimeout(timeout);
			setTimeout(function() {
				stanGry = 6
				nextMove(grajacy);
				stanGry = 6;
			}, 2000);
		} else {
			// co jeśli jest samogłoska
			if (odkryteLitery.includes(message.content.toUpperCase())) {
				kanale.send('Ta samogłoska została już podana.');
				stanGry = 0;
				clearTimeout(timeout);
				setTimeout(function() {
					stanGry = 6;
					nextMove(grajacy);
					stanGry = 6;
				}, 2000);
			} else {
				odkryteLitery.push(message.content.toUpperCase());
				stanGry = 0;
				clearTimeout(timeout);
				if (rozgrywka.haslo[0].toUpperCase().includes(message.content.toUpperCase())) {
					tablica(grajacy,message.content.toUpperCase());
					setTimeout(function() {
						stanGry = 6;
						kanale.send('Aby kupić samogłoskę, wpisz `2`. Aby spróbować zgadnąć hasło, wpisz `3`.');
					}, 2000);
				}
				else {
					kanale.send('Litera **'+message.content+'** nie znajduje się w haśle, tracisz kolejkę.');
					setTimeout(function() {
						stanGry = 6;
						nextMove(grajacy);
						stanGry = 6;
					}, 2000);
				}
			}
		}
		return;
	}
	if (stanGry == 8) {
		clearTimeout(timeout);
		if (rozgrywka.haslo[0].toUpperCase() == message.content.toUpperCase()) {
			kanale.send('<@'+message.author.id+'> ODGADŁ HASŁO!! W puli było **'+rozgrywka.stanKonta[grajacy]+' PLN**');
			stanGry = 0;
			rozgrywka.ogolnyStanKonta[grajacy] += rozgrywka.stanKonta[grajacy];
			setTimeout(function() {
				nextRound();
			}, 2000);
		} else {
			kanale.send('Niestety, podane hasło nie jest poprawne, tracisz kolejkę.');
			stanGry = 0;
			setTimeout(function() {
				stanGry = 6;
				nextMove(grajacy);
				stanGry = 6;
			}, 2000);
		}
		return;
	}
	if (msg == '1') {
		//console.log('kreci, stan gry',stanGry);
		if (stanGry == 1 || stanGry == 3) {
			message.channel.send(message.author.username + ' zakręcił kołem');
			stanGry = 0;
			//console.log('czykasuje',timeout);
			clearTimeout(timeout);
			//console.log('czykasuje',timeout);
			zakrecKolem();
		}
	} else if (msg == '2' && stanGry == 3) {
		stanGry = 5;
		kanale.send('Wpisz samogłoskę:');
		clearTimeout(timeout);
		timeout = setTimeout(function() {
			nextMove(grajacy);
			stanGry = 1;
		}, 20000);
	} else if (stanGry == 5) {
		rozgrywka.gracze[grajacy].stanKonta -= 200;
		if (!samogloski.includes(message.content)) {
			kanale.send('To nie jest samogłoska, przepadła kolejka');
			stanGry = 0;
			clearTimeout(timeout);
			setTimeout(function() {
				nextMove(grajacy);
				stanGry = 1;
			}, 2000);
		} else {
			// co jeśli jest samogłoska
			odkryteLitery.push(message.content.toUpperCase());
			stanGry = 3;
			clearTimeout(timeout);
			if (rozgrywka.haslo[0].toUpperCase().includes(message.content.toUpperCase())) {
				tablica(grajacy,message.content.toUpperCase());
				stanGry = 3
				setTimeout(function() {
					kanale.send('Aby ponownie zakręcić, wpisz `1`. Aby kupić samogłoskę, wpisz `2`. Aby spróbować zgadnąć hasło, wpisz `3`.');
				}, 2000);
			}
			else {
				kanale.send('Litera **'+message.content+'** nie znajduje się w haśle, tracisz kolejkę.');
				setTimeout(function() {
					nextMove(grajacy);
					stanGry = 1;
				}, 2000);
			}
		}
	} else if (msg == '3' && stanGry==3) {
		stanGry = 4;
		kanale.send('Wpisz hasło (czas 30 sekund):');
		clearTimeout(timeout);
		timeout = setTimeout(function() {
			nextMove(grajacy);
			stanGry = 1;
		}, 30000);
	} else if (stanGry==4) {
		clearTimeout(timeout);
		if (rozgrywka.haslo[0].toUpperCase() == message.content.toUpperCase()) {
			kanale.send('<@'+message.author.id+'> ODGADŁ HASŁO!! W puli było **'+rozgrywka.stanKonta[grajacy]+' PLN**');
			stanGry = 0;
			rozgrywka.ogolnyStanKonta[grajacy] += rozgrywka.stanKonta[grajacy];
			setTimeout(function() {
				nextRound();
			}, 2000);
		} else {
			kanale.send('Niestety, podane hasło nie jest poprawne, tracisz kolejkę.');
			stanGry = 0;
			setTimeout(function() {
				nextMove(grajacy);
				stanGry = 1;
			}, 2000);
		}
	} else if (stanGry == 2) {
		if (samogloski.includes(message.content.toLowerCase())) {
			kanale.send('To nie jest spółgłoska, tracisz kolejkę.');
			stanGry = 0;
			clearTimeout(timeout);
			setTimeout(function() {
				nextMove(grajacy);
				stanGry = 1;
			}, 2000);
		} else if (odkryteLitery.includes(message.content.toUpperCase())) {
			kanale.send('Ta spółgłoska została już podana.');
			stanGry = 0;
			clearTimeout(timeout);
			setTimeout(function() {
				nextMove(grajacy);
				stanGry = 1;
			}, 2000);
		} else if (rozgrywka.haslo[0].toUpperCase().includes(message.content.toUpperCase())) {
			odkryteLitery.push(message.content.toUpperCase());
			stanGry = 3;
			tablica(grajacy,message.content.toUpperCase());
			rozgrywka.stanKonta[grajacy] += pula;
			console.log(rozgrywka.stanKonta);
			clearTimeout(timeout);
			setTimeout(function() {
				if (stanGry != 6) kanale.send('Aby ponownie zakręcić, wpisz `1`. Aby kupić samogłoskę, wpisz `2`. Aby spróbować zgadnąć hasło, wpisz `3`.');
				else kanale.send('Aby kupić samogłoskę, wpisz `2`. Aby spróbować zgadnąć hasło, wpisz `3`.');
			}, 2000);
			timeout = setTimeout(function() {
				nextMove(grajacy);
				//console.log('koniec kolejki po ponownym zakręceniu');
			}, 22000);
		} else {
			kanale.send('Niestety, w haśle nie ma tej spółgłoski.');
			stanGry = 0;
			clearTimeout(timeout);
			setTimeout(function() {
				nextMove(grajacy);
				stanGry = 1;
			}, 2000);
		}
	}
});

function czyZaczynamy(fetchedMember) {
	rozgrywka.gracze.push({nick: fetchedMember.displayName, id: fetchedMember.user.id, member: fetchedMember});
	var mess = '';
	for (var i=1; i<rozgrywka.gracze.length; i++) mess += ', '+rozgrywka.gracze[i].nick; 
	kanale.send(fetchedMember.displayName + ' dołączył do gry!\nW grze: '+rozgrywka.gracze[0].nick+mess);
	//console.log(rozgrywka.gracze);
	if (rozgrywka.gracze.length==3) {
		startGame();
		kanale.overwritePermissions(kanale.guild.roles.get(everyone), {
		  SEND_MESSAGES: false
		})
		  .catch(console.error);
	}
}

function czyMozeGrac(id) {
	if (rozgrywka.gracze[grajacy].id == id) return true;
	else return false;
}

function poZakreceniu() {
	var a = wartoscNaKole;
	if (!['BANKRUT','STOP'].includes(wartoscNaKole)) {
		//wartoscNaKole = Number(wartoscNaKole);
		tablica(grajacy);
		kanale.send('Trafiono na pole: **'+wartoscNaKole+'**. Podaj spółgłoskę:');
		stanGry = 2;
		clearTimeout(timeout);
		timeout = setTimeout(function() {
			kanale.send('Minęło 10 sekund, kolejka przepadła');
			nextMove(grajacy);
			console.log('koniec kolejki po trafieniu na pole');
		}, 20000);
	} else if (wartoscNaKole=='BANKRUT') {
		kanale.send('Trafiono na pole: **BANKRUT**. Niestety tracisz wszystko, co miałeś na koncie.');
		rozgrywka.stanKonta[grajacy] = 0;
		stanGry = 0;
		setTimeout(function() {
			nextMove(grajacy);
			stanGry = 1;
		}, 1000);
	} else {
		kanale.send('Trafiono na pole: **STOP**. Tracisz kolejkę.');
		stanGry = 0;
		setTimeout(function() {
			nextMove(grajacy);
			stanGry = 1;
		}, 1000);
	}
	//console.log('po zakręceniu ',wartoscNaKole);
	
	//////// NO I TU CO SIĘ DZIEJE PO ZAKRĘCENIU, CZY NASTĘPNY, CZY OCZEKIWANIE NA SPÓŁGŁOSKĘ
	
}

function startGame() {
	// początek gry, pokazanie hasła itd
	//console.log('i czemu nie zaczynamy');
	if (hasla.length < 7) return kanale.send('HASŁA SIĘ SKOŃCZYŁY :(');
	wybierzHaslo();
	messPoTablicy = ':new: Zaczynamy pierwszą rundę koła fortuny! Kołem zakręci <@'+rozgrywka.gracze[0].id+'>. Aby zakręcić, wpisz `1`. Masz na to 10 sekund - po tym czasie kolejka przepada';
	kanale.send(messPoTablicy);
	tablica(0);
	stanGry = 1;
	runda = 1;
	grajacy = 0;
	rozgrywka.stanKonta = [0,0,0];
	rozgrywka.ogolnyStanKonta = [0,0,0];
	odkryteLitery=[];
	
	rozgrywka.gracze[0].member.addRole(rola)
	  .catch(console.error);
}

function stopGame() {
	clearTimeout(timeout);
	for (var i=0; i<rozgrywka.gracze.length; i++) {
		rozgrywka.gracze[0].member.removeRole(rola)
		.catch(console.error);
	}
	kanale.overwritePermissions(kanale.guild.roles.get(everyone), {
	  SEND_MESSAGES: true
	})
	.catch(console.error);
	var a = rozgrywka.gracze;
	var b = rozgrywka.ogolnyStanKonta;
	kanale.send('**KONIEC GRY! Stan kont:**\n'+a[0].nick+': '+b[0]+' PLN\n'+a[1].nick+': '+b[1]+' PLN\n'+a[2].nick+': '+b[2]+' PLN\n**Gratulacje dla zwycięzcy!**\n\nAby dołączyć do kolejnej gry, wpisz `f.join`');
	odkryteLitery = [];
	rozgrywka = {
		gracze: [],
		stanKonta: [0, 0, 0],
		ogolnyStanKonta: [0,0,0],
		haslo: ['dwunastu gniewnych ludzi','film']
	};
	wartoscNaKole = 0;
	stanGry = 0; // 0 - nierozpoczęta, 1 - można kręcić, 2 - oczekiwanie na spółgłoskę, 3 - można kręcić lub kupić samogłoskę lub zgadnąć
	/////////////////// 4 - trzeba zgadywać hasło, 5 - podaj samogłoskę, 6 - wszystkie spółgłoski odsłonięte
	/////////////////// 7 - samogłoska i hasło, 8 - hasło gdy musisz
	runda = 0;
	pula = 0;
}

function nextMove(gracz) {
	//console.log(gracz);
	//console.log(rozgrywka.gracze);
	rozgrywka.gracze[gracz].member.removeRole(rola)
	.catch(console.error);
	gracz++;
	if (gracz==3) gracz=0;
	rozgrywka.gracze[gracz].member.addRole(rola)
	.catch(console.error);
	if (stanGry != 6) stanGry = 1;
	
	grajacy++;
	if (grajacy==3) grajacy=0;
	if (stanGry != 6) kanale.send('Kolej na <@'+rozgrywka.gracze[grajacy].id+'>! Aby zakręcić, wpisz `1`.');
	else kanale.send('Kolej na <@'+rozgrywka.gracze[grajacy].id+'>! Aby kupić samogłoskę, wpisz `2`. Aby odgadnąć hasło, wpisz `3`');
	timeout = setTimeout(function() {
		nextMove(grajacy);
	}, 20000);
}

function nextRound() {
	for (var i=0; i<rozgrywka.gracze.length; i++) rozgrywka.gracze[0].member.removeRole(rola);
	wybierzHaslo();
	runda++;
	rozgrywka.stanKonta = [0,0,0];
	odkryteLitery=[];
	if (runda==7) return stopGame();
	if ([2,5].includes(runda)) {
		rozgrywka.gracze[1].member.removeRole(rola)
		.catch(console.error);
		grajacy = 1;
	} else if ([3,6].includes(runda)) {
		rozgrywka.gracze[2].member.removeRole(rola)
		.catch(console.error);
		grajacy = 2;
	} else {
		rozgrywka.gracze[0].member.removeRole(rola)
		.catch(console.error);
		grajacy = 0;
	}
	tablica(grajacy);
	stanGry = 1;
	messPoTablicy = ':new: Zaczynamy '+runda+'. rundę koła fortuny! Kołem zakręci <@'+rozgrywka.gracze[grajacy].id+'>. Aby zakręcić, wpisz `1`. Masz na to 10 sekund - po tym czasie kolejka przepada';
	kanale.send(messPoTablicy);
}

function wybierzHaslo() {
	var a = Math.floor(Math.random()*hasla.length);
	rozgrywka.haslo = hasla[a];
	hasla.splice(a,1);
}

function poTablicy(nrGracza) {
	var channel = client.channels.get(kanal);
	//console.log('czytoTędy');
	clearTimeout(timeout);
	timeout = setTimeout(function(){
		nextMove(grajacy);
	}, 20000);
}

function tablica(nrGracza, litera) {
	var canvas = createCanvas(1200, 600);
	ctx = canvas.getContext('2d');
	
	ctx.beginPath();
	ctx.moveTo(50,100);
	ctx.arc(100, 100, 50, Math.PI/180*180, Math.PI/180*270);
	ctx.lineTo(1100,50);
	ctx.arc(1100, 100, 50, Math.PI/180*270, 0);
	ctx.lineTo(1150,400);
	ctx.arc(1100, 400, 50, 0, Math.PI/180*90);
	ctx.lineTo(100,450);
	ctx.arc(100, 400, 50, Math.PI/180*90, Math.PI/180*180);
	ctx.lineTo(50,100);
	
	var gradient = ctx.createLinearGradient(600,50, 600,450);
	gradient.addColorStop(0, 'black');
	gradient.addColorStop(.3, '#eaf4f5');
	gradient.addColorStop(.7, '#eaf4f5');
	gradient.addColorStop(1, 'black');
	ctx.fillStyle = gradient;
	ctx.fill();
	
	ctx.lineWidth = 8;
	ctx.strokeStyle = '#03f8fc';
	ctx.stroke();
	ctx.strokeStyle = '#ffffff';
	ctx.lineWidth = 3;
	ctx.stroke();
	
	/*ctx.fillStyle = '#ffffff';
	ctx.fillRect(0,0,1200,500);*/
	ctx.fillStyle = '#4447f1';
	ctx.beginPath();
	for (var i=0; i<12; i++) {
		ctx.rect(277+i*57, 100, 50, 70);
		ctx.lineWidth = 4;
		ctx.strokeStyle = '#000000';
		ctx.strokeRect(277+i*57, 100, 50, 70);
		ctx.lineWidth = 2;
		ctx.strokeStyle = '#ffffff';
		ctx.strokeRect(277+i*57, 100, 50, 70);
		
		ctx.rect(277+i*57, 340, 50, 70);
		ctx.lineWidth = 4;
		ctx.strokeStyle = '#000000';
		ctx.strokeRect(277+i*57, 340, 50, 70);
		ctx.lineWidth = 2;
		ctx.strokeStyle = '#ffffff';
		ctx.strokeRect(277+i*57, 340, 50, 70);
	}
	for (var i=0; i<14; i++) {
		ctx.rect(220+i*57, 180, 50, 70);
		ctx.lineWidth = 4;
		ctx.strokeStyle = '#000000';
		ctx.strokeRect(220+i*57, 180, 50, 70);
		ctx.lineWidth = 2;
		ctx.strokeStyle = '#ffffff';
		ctx.strokeRect(220+i*57, 180, 50, 70);
		
		ctx.rect(220+i*57, 260, 50, 70);
		ctx.lineWidth = 4;
		ctx.strokeStyle = '#000000';
		ctx.strokeRect(220+i*57, 260, 50, 70);
		ctx.lineWidth = 2;
		ctx.strokeStyle = '#ffffff';
		ctx.strokeRect(220+i*57, 260, 50, 70);
	}
	ctx.fill();
	
	ctx.beginPath();
	ctx.moveTo(300,450);
	ctx.arc(320, 450, 20, Math.PI/180*180, Math.PI/180*270);
	ctx.lineTo(900,430);
	ctx.arc(900, 450, 20, Math.PI/180*270, 0);
	ctx.lineTo(920,480);
	ctx.arc(900, 480, 20, 0, Math.PI/180*90);
	ctx.lineTo(320,500);
	ctx.arc(320, 480, 20, Math.PI/180*90, Math.PI/180*180);
	ctx.lineTo(300,450);
	ctx.fillStyle = '#e6e4e9';
	ctx.fill();
	ctx.lineWidth = 4;
	ctx.strokeStyle = '#03f8fc';
	ctx.stroke();
	ctx.strokeStyle = '#ffffff';
	ctx.lineWidth = 2;
	ctx.stroke();
	
	// ODTĄD HASŁO
	
	var slowa = rozgrywka.haslo[0].split(' ');
	var a;
	if (slowa.length < 3) a=1;
	else a=0;
	var czyZgaduj = true;
	pula = 0;
	for (var i=0; i<slowa.length; i++) {
		var b;
		if (a==0 || a==3) b = 7 - Math.floor(slowa[i].length/2);
		else b = 7 - Math.floor(slowa[i].length/2);
		//console.log(slowa[i], slowa[i].length);
		for (var j=0; j<slowa[i].length; j++) {
			//console.log(slowa[i],j);
			var letter = slowa[i].charAt(j).toLowerCase();
			if (!samogloski.includes(letter) && !odkryteLitery.includes(letter.toUpperCase())) czyZgaduj = false;
			ctx.beginPath();
			ctx.fillStyle = '#ffffff';
			if (litera != undefined && litera.toUpperCase() == slowa[i].charAt(j).toUpperCase()) {
				ctx.fillStyle = '#03fc6b';
				pula += Number(wartoscNaKole);
			}
			ctx.fillRect(220+(b+j)*57, 100+a*80, 50, 70);
			ctx.lineWidth = 4;
			ctx.strokeStyle = '#000000';
			ctx.strokeRect(220+(b+j)*57, 100+a*80, 50, 70);
			ctx.lineWidth = 2;
			ctx.strokeStyle = '#ffffff';
			ctx.strokeRect(220+(b+j)*57, 100+a*80, 50, 70);
			
			if (odkryteLitery.includes(slowa[i].charAt(j).toUpperCase())) {
				ctx.font = 'bold 45px Arial';
				ctx.fillStyle = '#000000';
				ctx.textAlign = "center";
				ctx.fillText(slowa[i].charAt(j).toUpperCase(), 245+(b+j)*57, 152+a*80);
			}
		}
		a++;
	}
	if (czyZgaduj) stanGry = 6;
	ctx.font = 'bold 45px Arial';
	ctx.fillStyle = '#000000';
	ctx.textAlign = "center";
	ctx.fillText(rozgrywka.haslo[1].toUpperCase(), 600, 480);
	
	/////// STANY KONT
	
	for (var i=0; i<rozgrywka.gracze.length; i++) {
		var a = rozgrywka.gracze[i];
		var b = rozgrywka.stanKonta[i];
		ctx.beginPath();
		ctx.moveTo(20+400*i,530);
		ctx.arc(40+400*i, 530, 20, Math.PI/180*180, Math.PI/180*270);
		ctx.lineTo(350+400*i,510);
		ctx.arc(350+400*i, 530, 20, Math.PI/180*270, 0);
		ctx.lineTo(370+400*i,570);
		ctx.arc(350+400*i, 570, 20, 0, Math.PI/180*90);
		ctx.lineTo(40+400*i,590);
		ctx.arc(40+400*i, 570, 20, Math.PI/180*90, Math.PI/180*180);
		ctx.lineTo(20+400*i,530);
		ctx.fillStyle = '#e6e4e9';
		ctx.fill();
		ctx.lineWidth = 4;
		ctx.strokeStyle = '#03f8fc';
		ctx.stroke();
		ctx.strokeStyle = '#ffffff';
		ctx.lineWidth = 2;
		ctx.stroke();
		
		ctx.font = 'bold 30px Arial';
		if (a.nick.length>15) ctx.font = 'bold 25px Arial';
		if (a.nick.length>25) ctx.font = 'bold 20px Arial';
		ctx.fillStyle = '#000000';
		ctx.textAlign = "center";
		ctx.fillText(rozgrywka.gracze[i].nick, 200+400*i, 585);
		
		ctx.font = 'bold 40px Arial';
		ctx.fillStyle = '#ff0000';
		ctx.textAlign = "center";
		ctx.fillText(b, 200+400*i, 550);
	}
	
	
	
	var obraz = canvas.toDataURL("image/png");
	let base64Image = obraz.split(';base64,').pop();
	fs.writeFile('imageskolo/kolofortunki2.png', base64Image, {encoding: 'base64'}, function(err) {
		//console.log('File created');
	});
}

function zakrecKolem() {
	// gif, wyslanie gifa, odczekanie iluś sekund z pozwoleniem na pisanie
	//console.log('oj chyba coś');
	var canvas = createCanvas(300, 300);
	ctx = canvas.getContext('2d');
	ctx.scale(0.5,0.5);
	ctx.fillStyle = '#36393f';
	ctx.fillRect(0,0,2*canvas.width, 2*canvas.height);
	ctx.beginPath();
	ctx.moveTo(270,20);
	ctx.lineTo(330,20);
	ctx.lineTo(300,40);
	ctx.lineTo(270,20);
	ctx.fillStyle = 'lightgreen';
	ctx.fill();
	
	encoder = new GIFEncoder(canvas.width, canvas.height);
	// stream the results as they are available into myanimated.gif
	encoder.createReadStream().pipe(fs.createWriteStream('imageskolo/myanimated.gif'));
	 
	encoder.start();
	encoder.setRepeat(-1);   // 0 for repeat, -1 for no-repeat
	encoder.setDelay(30);  // frame delay in ms
	encoder.setQuality(10); // image quality. 10 is default.
	
	ctx.save();
	var aaa = Math.floor(Math.random()*24);
	iloscPol = aaa;
	var bbb = 30;
	//console.log(aaa);
	wartoscNaKole = aaa + 29;
	if (wartoscNaKole>23) wartoscNaKole = wartoscNaKole - 24;
	if (wartoscNaKole>23) wartoscNaKole = wartoscNaKole - 24;
	wartoscNaKole = naKole[wartoscNaKole];
	//console.log('Wartość na kole: ',wartoscNaKole);
	dlugoscGifa = 0;
	for (var k=0; k<(aaa+30); k++) {
		if (k>aaa) {
			bbb = bbb * 1.1;
			encoder.setDelay(bbb);
		}
		dlugoscGifa += bbb;
		
		//console.log('dupa',k,(aaa+30));
		
		for (var i=0; i<24; i++) {
			ctx.restore();
			ctx.translate(300,300);
			ctx.rotate(-Math.PI/180*7.5);
			ctx.translate(-300,-300);
			ctx.beginPath();
			ctx.moveTo(300,300);
			ctx.lineTo(300,50);
			ctx.arc(300,300, 250, Math.PI/180*270, Math.PI/180*285);
			ctx.lineTo(300,300);
			ctx.fillStyle = kolory[i];
			ctx.fill();
			ctx.lineWidth = 3;
			ctx.strokeStyle = 'white';
			ctx.stroke();
			
			ctx.translate(300,300);
			ctx.rotate(Math.PI/180*7.5);
			ctx.translate(-300,-300);
			
			ctx.textAlign = "center";
			ctx.fillStyle = 'white'
			ctx.font = 'bold 40px Arial';
			var a = naKole[i];
			for (var j=0; j<a.length; j++) {
				var b = 40-j*4;
				var c = 'bold '+b+'px Arial';
				ctx.font = c;
				ctx.fillText(a.charAt(j), 300,85+(35-j*2.1)*j);
				ctx.lineWidth = 1;
				ctx.strokeStyle = 'black';
				ctx.strokeText(a.charAt(j), 300,85+(35-j*2.1)*j);
			}

			ctx.translate(300,300);
			ctx.rotate(Math.PI/180*15);
			ctx.translate(-300,-300);
		}
		ctx.restore();

		ctx.beginPath();
		ctx.arc(300,300,80,0,2*Math.PI);
		ctx.fillStyle = 'blue';
		ctx.fill();
		ctx.lineWidth = 6;
		ctx.strokeStyle = 'white';
		ctx.stroke();
		ctx.lineWidth = 3;
		ctx.strokeStyle = 'black';
		ctx.stroke();
		
		ctx.translate(300,300);
		ctx.rotate(Math.PI/180*40);
		ctx.textAlign = "center";
		ctx.fillStyle = 'white'
		ctx.font = '35px Forte';
		ctx.fillText("KOLO", 0,-30);
		ctx.fillText("FORTUNY", 0,10);
		ctx.font = '15px Forte';
		ctx.fillText("by Falafel", 0,30);
		ctx.rotate(-Math.PI/180*40);
		ctx.translate(-300,-300);
		
		ctx.fillStyle = 'black';
		ctx.globalAlpha = 0.15;
		ctx.beginPath();
		ctx.arc(300,300, 250, Math.PI/180*270, Math.PI/180*285);
		ctx.fill();
		ctx.globalAlpha = 1;
			
		encoder.addFrame(ctx);
		ctx.restore();
		ctx.translate(300,300);
		ctx.rotate(-Math.PI/180*(15));
		ctx.translate(-300,-300);
	}
	wyslijGifa = true;
	encoder.finish();
	//console.log('dlugosc gifa',dlugoscGifa/1000);
	//ctx.setTransform(1, 0, 0, 1, 0, 0);
}
	