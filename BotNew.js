      /*Name: Asset Bot*/
      /*version- v06:*/
      /*Last updated:15/12/2017: 10:00 PM*/
      /*Author:Suryadeep & Gurava Raj*/
      /*LUIS :demoasset*/

      var restify = require('restify');
      var builder = require('botbuilder');
      var sql = require('mssql');
      require('json-response');
      var Connection = require('tedious').Connection;
      var Request = require('tedious').Request;
      var app = require('express');
      var TYPES = require('tedious').TYPES;
      var jsonFile = require('jsonfile')
      var basequery=jsonFile.readFileSync("SmartAssetBaseQuery.json")
      var filterquery=jsonFile.readFileSync("SmartAssetFilterQuery.json")
      var topquery=jsonFile.readFileSync("SmartAssetTopQuery.json")
      var SmartAssetAllEntities=jsonFile.readFileSync("SmartAssetAllEntities.json")
      var server = restify.createServer();

      server.listen(process.env.port || process.env.PORT || 3977, function () {
      	console.log('%s listening to %s', server.name, server.url); 
      });

//Configure and create 
var config = {
	userName: 'dilabadmin', 
	password: 'Capgemini@123', 
	server: 'dilabsql-02', 
	options:{ 
		database: 'EDW_PS_ASSET_AGG', 
		encrypt: true
	}
}

//Configure Connection
var connection = new Connection(config);

//set up the database connection
connection.on('connect', function(err){
	if (err){
		console.log(err)
	}
	else{
		console.log('Connected to database!')
	}
});

//connect the bot to my node js server  
var connector = new builder.ChatConnector({
	appId: process.env.MICROSOFT_APP_ID,
	appPassword: process.env.MICROSOFT_APP_PASSWORD
});

server.post('/api/messages', connector.listen());

var bot = new builder.UniversalBot(connector);

//Integrate LUIS framework with bode js server
const LuisModelUrl = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/10ffa32e-a5ce-4f72-af0c-d20fde3d569e?subscription-key=bbb1a28a035f476c86b0205ce03d7f25&verbose=true&timezoneOffset=0&q= ';

var recognizer = new builder.LuisRecognizer(LuisModelUrl);
bot.recognizer(recognizer);  
var intents = new builder.IntentDialog({ recognizers: [recognizer] })
//function code to handles entities for intents
function getentities(session,entity){
	//Read the all entities from josn file store them in respective variables
	const alltypes=SmartAssetAllEntities[0].alltypes // Main entities like Asset Count, Asset Value
	const filtertypes=SmartAssetAllEntities[1].filtertypes //Filter entites like With Filter::Department
	const toptypes=SmartAssetAllEntities[2].toptypes	 //Top entities like Top::Top_Department
    var isTop='N'//Top
    var topNumber=1//builtin.number
    var filtertypesmatches=[] //creates an array to store mulitple filter types like department, country
    var filterentity=[] //creates an array to store mulitple values of filter like ehs, india
    for(i=0;i<entity.entities.length;i++){ //using for loop, we loop each entity type and try to match with entities we have and store them respective variable 
    	if (alltypes.indexOf(entity.entities[i].type)>-1) { //alltypes.indexOf(entity.entities[i].type tries to get index of entity type stored in alltypes
    		var alltypesmatches=alltypes[alltypes.indexOf(entity.entities[i].type)]   //if matches, store value in alltypesmatches variable
    	}
    	if (filtertypes.indexOf(entity.entities[i].type)>-1) { //tries to match with filter entities 
    		filtertypesmatches[i]=filtertypes[filtertypes.indexOf(entity.entities[i].type)] //if matches, store filter type and entity in respective values in variables
    		filterentity[i]=entity.entities[i].entity
    	}
    	if (toptypes.indexOf(entity.entities[i].type)>-1) { //tries to match with top entities
    		var toptypesmatches=toptypes[toptypes.indexOf(entity.entities[i].type)] //if mathces, stores top type in respective toptypesmatches variable
    	}
    	if(entity.entities[i].type=='Top'){ //checks whether any entity is Top
    		var isTop='Y'                
    	}
    	if (entity.entities[i].type=='builtin.number') { //checks for top number
    		var topNumber=entity.entities[i].entity
    	}
    }
   // console.log('##############')
   filtertypesmatches=filtertypesmatches.filter(function(x){return x!=undefined}) //Removes if any undefined values in filtertypesmatches array  
   for(var i=0;i<filtertypesmatches.length;i++){
   	filtertypesmatches[i]=filtertypesmatches[i].replace(/\s/g,"") //for each element removes the white spaces
   	filtertypesmatches[i]=filtertypesmatches[i].replace(/:/g,"")//for each element removes :
   }
   filterentity=filterentity.filter(function(x){return x!=undefined})  //Removes if any undefined values in filterentity array 
   // for(var i=0;i<filterentity.length;i++){
   // 	filterentity[i]=filterentity[i].replace(/\s/g,"")//for each element removes the white spaces
   // 	filterentity[i]=filterentity[i].replace(/:/g,"")//for each element removes :
   // }
   //print all values to console
   console.log(alltypesmatches)
   console.log(filtertypesmatches)
   console.log(filterentity)
   console.log(toptypesmatches)
   console.log(isTop)
   console.log(topNumber)
   if (isTop=='Y') { //if its top utterance
   	for (var i=0;i<topquery.length;++i) { //search through all queries in json file then return query , group for selected and store them in respective variables
   		if (topquery[i].intent==alltypesmatches){
   			var BasePassQueryTop=topquery[i].query;
   			var BasePassQueryGroup=topquery[i].group;
   			break
   		}
   	}
   	if (filtertypesmatches.length>0) { //if any filter is present with top like 'top 5 departments by asset count in india' where'india' is filter
   		for(var j=0;j<filtertypesmatches.length;j++){  //this particular code block search for filter field in json file as per values in filtertypesmatches array
   			for(var i=0;i<filterquery.length;++i){      // and append them to base base query
   				if (filterquery[i].id==filtertypesmatches[j]) {
   					var FilterPassQuery=filterquery[i].field;
   					var BasePassQueryTop=BasePassQueryTop+' '+FilterPassQuery
   					break
   				}
   			}
   		}
   	}
   	var PassQuery=BasePassQueryTop+' '+BasePassQueryGroup; //final query that to be sent to database
    	//console.log(PassQuery)
    	global.requestCountTop= new Request(
    		PassQuery,
    		function(err,rowCount,rows){
    			if (err) {
    				console.log(err);
    			}
    		}
    		);
    	requestCountTop.addParameter('paramDomain',TYPES.Int,topNumber); //adds top number to query
    	requestCountTop.addParameter('paramColumn',TYPES.NVarChar,toptypesmatches); //adds top column to be returned as parameter
    	if(filterentity.length>0){
    		for(var i=0;i<filterentity.length;i++){
    			requestCountTop.addParameter(filtertypesmatches[i],TYPES.NVarChar,filterentity[i]) //adds all filter conditions as parameters to query
    		}
    	}    	
    	requestCountTop.on('row',function(columns){
    		columns.forEach(function(column){
    			session.send("%s\t%s", column.metadata.colName, column.value)    //will send output to bot window			
    		});
    		
    	});
    	connection.execSql(requestCountTop);
    	//console.log(PassQuery)
    }
    else if(isTop=='N'){//if not top query 
    	for(var i=0;i<basequery.length;++i){ //will search for particular query from entity store in alltypesmatches
    		if (basequery[i].intent==alltypesmatches) {
    			var BasePassQueryAssetValue=basequery[i].query; //returns the base query and stores in it
    			var PassQuery= BasePassQueryAssetValue 
    			break
    		}
    	}
    	if (filtertypesmatches.length>0) { //this particular code block adds filters if any exists to base query
    		for(var j=0;j<filtertypesmatches.length;j++){
    			for(var i=0;i<filterquery.length;++i){
    				if (filterquery[i].id==filtertypesmatches[j]) {
    					var FilterPassQuery=filterquery[i].field;
    					var PassQuery=PassQuery+' '+FilterPassQuery
    					break
    				}
    			}
    		}
    	}
    	global.requestCountTop= new Request(
    		PassQuery,
    		function(err,rowCount,rows){
    			if (err) {
    				console.log(err);
    			}
    		});

    	for(var i=0;i<filterentity.length;i++){ //adds all filters exists in array as parameters to query
    		requestCountTop.addParameter(filtertypesmatches[i],TYPES.NVarChar,filterentity[i])
    	}
    	requestCountTop.on('row',function(columns){
    		columns.forEach(function(column){
    			session.send("%s\t%s", column.metadata.colName, column.value)
    		});
    	});
    	connection.execSql(requestCountTop);
    	console.log(PassQuery)
    }
}
intents.matches('Greetings',[function(session,args){
	session.send('Hi')
}])
intents.matches('Asset',function(session,args){	
	getentities(session,args)
})
intents.matches('Labour',function(session,args){
	getentities(session,args)
})
intents.matches('Supplier',function(session,args){
	getentities(session,args)
})
intents.matches('ServiceRequest',function(session,args){
	getentities(session,args)
})
intents.matches('Inventory',function(session,args){
	getentities(session,args)
})
intents.matches('Work Order',function(session,args){
	getentities(session,args)
})
intents.matches('OVertime',function(session,args){
  getentities(session,args)
})
intents.matches('MTBF',function(session,args){
  getentities(session,args)
})
intents.matches('Maintenance',function(session,args){
  getentities(session,args)
})
intents.matches('Prediction',function(session,args){
  getentities(session,args)
})
intents.matches('Failure',function(session,args){
  getentities(session,args)
})
intents.matches('DownTimeProductivityLoss',function(session,args){
  getentities(session,args)
})
intents.matches('Retirement',function(session,args){
  getentities(session,args)
})
intents.matches('DowntimeHours',function(session,args){
  getentities(session,args)
})
intents.matches('Safety Stock',function(session,args){
  getentities(session,args)
})
intents.matches('Decommission',function(session,args){
  getentities(session,args)
})
intents.matches('SensorDetails',function(session,args){
  getentities(session,args)
})
intents.matches('CurrentStockStatus',function(session,args){
  getentities(session,args)
})
intents.matches('AVGOnTimeDelivery Value',function(session,args){
  getentities(session,args)
})
intents.matches('Warranty',function(session,args){
  getentities(session,args)
})
intents.matches('Affected',function(session,args){
  getentities(session,args)
})
intents.matches('LTI',function(session,args){
  getentities(session,args)
})
.onDefault((session) => {
	session.send('Sorry, I did not understand \'%s\'.', session.message.text);
});

bot.dialog('/', intents);
