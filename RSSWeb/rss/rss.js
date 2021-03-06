/**
 * 
 */

var request = require('request');

var parser = require('xml2js');

var config = require( './config');

function readRSS(sourceURL,callback){

	sourceURL = encodeURI(sourceURL);
	request({
		uri: sourceURL,
		method: 'GET',
		encoding:null,
	}, function (error, response, body) {
		parser.parseString(body, function (err, result) {
		    return callback(result);
		});
	});	
}

function formatNewsListSelected(result,limit,callback){
	var news = [];
	var newsItem = {};
	
	if (typeof (result.rss) !== 'undefined'){
		if (limit === -1 || limit > result.rss.channel[0].item.length){
			limit = result.rss.channel[0].item.length;
		}
		
		for (var i=0;i<limit;++i){			
			newsItem.title = result.rss.channel[0].item[i].title[0];
			newsItem.link = result.rss.channel[0].item[i].link[0];
			newsItem.description = result.rss.channel[0].item[i].description[0];
			news[i]= JSON.parse(JSON.stringify(newsItem));
		}
	}
	
	if (typeof (result.feed) !== 'undefined'){
		
		if (limit === -1 || limit > result.feed.entry.length){
			limit = result.feed.entry.length;
		}
		
		console.log('Number of entries: '+result.feed.entry.length);
		for (var j=0;j<limit;++j){
			newsItem.title = result.feed.entry[j].title[0]._;
			newsItem.link = result.feed.entry[j].link[0].$.href;
			newsItem.description = result.feed.entry[j].content[0]._;
			news[j]= JSON.parse(JSON.stringify(newsItem));
		}		
	}
	
	return callback(news);
}

function formatNewsList(result,callback){
	var news = [];
	var newsItem = {};
	
	if (typeof (result.rss) !== 'undefined'){
		
		for (var i=0;i<result.rss.channel[0].item.length;++i){
			
			newsItem.title = result.rss.channel[0].item[i].title[0];
			newsItem.link = result.rss.channel[0].item[i].link[0];
			newsItem.description = result.rss.channel[0].item[i].description[0];
			news[i]= JSON.parse(JSON.stringify(newsItem));
		}
	}
	
	if (typeof (result.feed) !== 'undefined'){
		console.log('Number of entries: '+result.feed.entry.length);
		for (var j=0;j<result.feed.entry.length;++j){
			newsItem.title = result.feed.entry[j].title[0]._;
			newsItem.link = result.feed.entry[j].link[0].$.href;
			newsItem.description = result.feed.entry[j].content[0]._;
			//console.log('Adding item: '+JSON.stringify(newsItem));
			news[j]= JSON.parse(JSON.stringify(newsItem));
		}		
	}
	
	return callback(news);
}

function readNews(newsList,position,callback){
	console.log('Reading news on position '+position);
	
	if (position >= newsList.length ){
		return callback(true,null);
	}
	
	var news = {};
	
	news.title = newsList[position].title;
	news.link = newsList[position].link;
	news.description = newsList[position].description;
	
	console.log('News selected: '+JSON.stringify(news));
	
	return callback(false,news);
}

function formatDetails(intent, content){
	
	if (typeof(config.rss.intents[intent].details) !== 'undefined'){
		var details = config.rss.intents[intent].details;
		var news = '';
		if (details.end !=='EOF'){
			news =  content.substring(content.indexOf(details.begin)+details.begin.length,content.indexOf(details.end));
		}
		else{
			if (content.indexOf("<img src=")!==-1){
				news =  content.substring(content.indexOf(details.begin)+details.begin.length);
			}
			
			else{
				news = content;
			}
		}
		news = news.replace('[&#8230;]','');
		return news;
	}else{
		return content;
	}	
}

function getURL(intent, callback){

	return new callback(config.rss.intents[intent].url);
}

function getIntentConfig(intent){
	return config.rss.intents[intent];
}


if (process.argv.length < 4){
	console.log("Usage node rss <list|show> url");
	console.log("Usage node rss listByIntent intent");
}	
else{
	var args = process.argv.slice(2);
	switch (args[0]){
		case "list":
			readRSS(args[1],function(response){
				console.log('Response from RSS: '+JSON.stringify(response));
				formatNewsList(response,function(result){
					console.log(JSON.stringify(result));
					for (var i=0;i<result.length;++i){
						console.log("Notícia "+i);
						console.log("Título : "+result[i].title);
						console.log("Link : "+result[i].link);
						//console.log("Description : "+result[i].description);
					}
				});		
			});
			break;
		case "show":
			var position = parseInt(args[2]);
			getURL(args[1],function(url){
				if (typeof (url) !=='undefined'){
					console.log('URL '+url+ ' found for intent '+args[1]);
					readRSS(url,function(response){
						formatNewsList(response,function(result){
							   console.log(JSON.stringify(result));
							readNews(result,position,function(error,news){
								if (error){
									console.log('Numero selecionado da mensagem está incorreto');
								}
								else{
									console.log("Notícia "+position);
									console.log("Título : "+news.title);
									console.log("Link : "+news.link);
									console.log("Description : "+formatDetails(args[1],news.description));
								}
							});
						});
					});	
				}else{
					console.log('URL news not found for intent '+args[1]);
				}
			});			
			break;
		case "listByIntent":
			getURL(args[1],function(url){
				if (typeof (url) !=='undefined'){
					console.log('URL '+url+ ' found for intent '+args[1]);
					readRSS(url,function(response){
						formatNewsList(response,function(result){
							console.log(JSON.stringify(result));
							for (var i=0;i<result.length;++i){
								console.log("Notícia "+i);
								console.log("Título : "+result[i].title);
								console.log("Link : "+result[i].link);
								//console.log("Description : "+formatDetails(args[1],result[i].description));
							}
						});		
					});
				}else{
					console.log('URL not found for intent '+args[1]);
				}				
			});
			break;
		default:
			console.log("Usage node rss <list|show> url");
	}
}

module.exports.readRSS=readRSS;
module.exports.getURL=getURL;
module.exports.formatNewsList = formatNewsList;
module.exports.formatNewsListSelected = formatNewsListSelected;
module.exports.readNews=readNews;
module.exports.formatDetails = formatDetails;
module.exports.getIntentConfig = getIntentConfig;


