var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var neo4j = require('neo4j-driver').v1;

var app = express();

//Visualizacao Motor
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extend: false}));
app.use(express.static(path.join(__dirname, 'public')));

var driver = neo4j.driver('bolt://192.168.59.103', neo4j.auth.basic('neo4j', '123456'));
var session = driver.session();


app.get('/', function(req, res) {
	session.run('MATCH(n:Movie) RETURN n')
		.then(function(result){
			var movieArr = [];
			result.records.forEach(function(record){
				movieArr.push({
					id: record._fields[0].identity.low,
					title: record._fields[0].properties.title,
					released: record._fields[0].properties.released,
					tagline: record._fields[0].properties.tagline
				});
			});

			session
				.run('MATCH(n:Person) RETURN n')
				.then(function(result2){
					var personArr = [];
					result2.records.forEach(function(record){
						personArr.push({
							id: record._fields[0].identity.low,
							name: record._fields[0].properties.name,
							born: record._fields[0].properties.born
							
						});
					});
					res.render('index', {
						movies: movieArr,
						persons: personArr
					});
				})
				.catch(function(err){
					console.log(err);
				});

			
		})
		.catch(function(err){
			console.log(err);
		})
	
})

app.post('/movie/add', function(req, res){
	var title = req.body.title;
	var released = req.body.released;
	var tagline = req.body.tagline;
	console.log('Inserindo Filme -> Titulo: '+title + ', Ano: '+ released + ', descricao: '+ tagline);

	session
		.run('CREATE (n:Movie {title:{titleParam},released:{releasedParam},tagline:{taglineParam}}) RETUN n.title',{titleParam:title, releasedParam:released, taglineParam:tagline})
		.then(function(result){
			res.redirect('/');
			session.close();
		})
		.catch(function(err){
					console.log(err);
		});

	console.log('Enviou Post '+title);
	res.redirect('/');

})

app.post('/person/add', function(req, res){
	var name = req.body.name;
	var born = req.body.born;

	console.log('Inserindo Ator -> Nome: '+name + ', Nascimento: '+ born);

	session
		.run('CREATE (n:Person {name:{nameParam},born:{bornParam}}) RETUN n.name',{nameParam:name, bornParam:born})
		.then(function(result){
			res.redirect('/');
			session.close();
		})
		.catch(function(err){
					console.log(err);
		});

	console.log('Enviou Post '+name);
	res.redirect('/');

})

app.post('/movie/person/add', function(req, res){
	var title = req.body.title;
	var name = req.body.name;

	console.log('ADD Ator -> Nome: '+name + ', AO FILME: '+ name);

	session
		.run('MATCH(p:Person {name:{nameParam}}), (b:Movie{title:{titleParam}}) MERGE(p)-[r:ACTED_IN]-(b)',{nameParam:name, titleParam:title})
		.then(function(result){
			res.redirect('/');
			session.close();
		})
		.catch(function(err){
					console.log(err);
		});

	console.log('Enviou Post '+name);
	res.redirect('/');

})

app.listen(3000);
console.log('Server iniciado na porta 3000');

module.exports = app;