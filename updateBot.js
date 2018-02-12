      /*Name: Asset Bot*/
      /*version- v06:*/
      /*Last updated:15/12/2017: 10:00 PM*/
      /*Author:Suryadeep & Gurava Raj*/
      /*LUIS :demoasset*/

      var restify = require('restify');
      var builder = require('botbuilder');
      var sql = require('mssql');
      require('json-response');
      var stringify = require('json-stringify');
      var Connection = require('tedious').Connection;
      var Request = require('tedious').Request;
      var app = require('express');
      var TYPES = require('tedious').TYPES;
      var jsonFile = require('jsonfile')
      var basequery=jsonFile.readFileSync("smartAssetQueryVer0.5.json")
      var filterquery=jsonFile.readFileSync("smartAssetFilterQueryVer0.5.json")
      var topquery=jsonFile.readFileSync("smartAssetTopVer0.5.json")
      var SmartAssetAllEntities=jsonFile.readFileSync("SmartAssetAllEntities.json")
      var links=jsonFile.readFileSync("SmartAssetWebLinks.json")
      var server = restify.createServer();
      var fs = require('fs');
      var path = require('path');
      var userName = process.env['USERPROFILE'].split(path.sep)[2];
//      var loginId = path.join("domainName",userName);

      let valPlaceholder="";
      let PrimaryEntity="";
      var SecondaryEntity="";
      let TernaryEntity="";
      let SqlQuery="";
      let IntentName="";
      let UtterFetchValue1="";
      let UtterFetchValue2="";
      var StoreForFAQ= [];
      var StoreReturnForFAQ=[];
      var SlNo = 0;

      server.listen(process.env.port || process.env.PORT || 3978, function () {
      	console.log('%s listening to %s', server.name, server.url); 
      });

//Configure and create 
var config = {
	userName: '****', 
	password: '*****', 
	server: '******', 
	options:{ 
		database: '******', 
		encrypt: true
	}
}



//Configure Connection
var connection = new Connection(config);

var connectionInsert = new Connection(config);

var connectionUtter= new Connection(config);

//set up the database connection
connection.on('connect', function(err){
	if (err){
		console.log(err)
	}
	else{
		console.log('Connected to database fetch database!')
	}
});

connectionInsert.on('connect',function(err){
  if (err) {
    console.log('error while connecting the log table'+err);
  }
  else{
    console.log('Connected to insert database');
  }
});

connectionUtter.on('connect',function(err){
  if (err) {
    console.log('error while connecting for utterance fetch');
  }
  else{
    console.log('Connected For utterance fetch');
  }
});


//connect the bot to my node js server  
var connector = new builder.ChatConnector({
	appId: process.env.MICROSOFT_APP_ID,
	appPassword: process.env.MICROSOFT_APP_PASSWORD
});

server.post('/api/messages', connector.listen());

var bot = new builder.UniversalBot(connector);

//Integrate LUIS framework with node js server
const LuisModelUrl = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/6232d6e1-4dbc-476a-a2ca-ba80047b1a23?subscription-key=b32c3c902efa422e8ba42e9164de50a5&verbose=true&timezoneOffset=0&q=';

var recognizer = new builder.LuisRecognizer(LuisModelUrl);
bot.recognizer(recognizer);  
var intents = new builder.IntentDialog({ recognizers: [recognizer] })
console.log("INTENTS " + JSON.stringify(recognizer))


//function code to handles entities for intents
function getentities(session,entity,column){
  SecondaryEntity="";
	//Read the all entities from josn file store them in respective variables
	const alltypes=SmartAssetAllEntities[0].alltypes // Main entities like Asset Count, Asset Value
	const filtertypes=SmartAssetAllEntities[1].filtertypes //Filter entites like With Filter::Department
	const toptypes=SmartAssetAllEntities[2].toptypes	 //Top entities like Top::Top_Department
    var isTop='N'//Top
    var topNumber=1//builtin.number
    var filtertypesmatches=[] //creates an array to store mulitple filter types like department, country
    var filterentity=[] //creates an array to store mulitple values of filter like ehs, india
    for(i=0;i<entity.entities.length;i++){ //using for loop, we loop each entity type and try to match with entities we have and store them respective variable 
      //SecondaryEntity="";
    	if (alltypes.indexOf(entity.entities[i].type)>-1) { //alltypes.indexOf(entity.entities[i].type tries to get index of entity type stored in alltypes
    		var alltypesmatches=alltypes[alltypes.indexOf(entity.entities[i].type)]   //if matches, store value in alltypesmatches variable
        PrimaryEntity=alltypesmatches;
        
        console.log('primary entity: '+PrimaryEntity);
        console.log('secondary entity: '+SecondaryEntity);       
    	}
    	if (filtertypes.indexOf(entity.entities[i].type)>-1) { //tries to match with filter entities 

    		filtertypesmatches[i]=filtertypes[filtertypes.indexOf(entity.entities[i].type)] //if matches, store filter type and entity in respective values in variables
    		filterentity[i]=entity.entities[i].entity
        SecondaryEntity=filterentity[i];
        console.log('secondary entity inside filters: '+SecondaryEntity);
        console.log('primary entity inside filters: '+PrimaryEntity);
    	}
    	if (toptypes.indexOf(entity.entities[i].type)>-1) { //tries to match with top entities
    		var toptypesmatches=toptypes[toptypes.indexOf(entity.entities[i].type)] //if mathces, stores top type in respective toptypesmatches variable
        TernaryEntity=toptypesmatches;
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
   IntentName= stringify(entity.intent);
   //print all values to console
   console.log(alltypesmatches)
   console.log(filtertypesmatches)
   console.log(filterentity)
   console.log(toptypesmatches)
   console.log(isTop)
   console.log(topNumber)
   console.log("intents " + intents)
   console.log("Intent name "+IntentName);
      
   if (isTop=='Y') { //if its top utterance
   	for (var i=0;i<topquery.length;++i) { //search through all queries in json file then return query , group for selected and store them in respective variables
   		if (topquery[i].intent==alltypesmatches){
   			var BasePassQueryTop=topquery[i].query;
   			var BasePassQueryGroup=topquery[i].group;
   			break
   		}
   	}

    /*for (var i=0;i<links.length;++i) { //search for HYPERLINKS
      if (links[i].intent==alltypesmatches){
        var Hyperlink=links[i].link;
        console.log(Hyperlink);

      }
    }*/



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
          console.log(PassQuery);
    			session.send("%s\t%s", column.metadata.colName, column.value) ;   //will send output to bot window	
          /*builder.Prompts.number(session,"Would you like to see a graphical report " + "1. YES  2. NO",function(session){
          if (session.message.number==1) {
          session.send(Hyperlink);}})*/
          session.send("For more information Click On the link" + Hyperlink);
          //session.send(Hyperlink);		
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
          SqlQuery=PassQuery;
    			break
    		}
    	}

      for (var i=0;i<links.length;++i) { //search for HYPERLINKS
      if (links[i].intent==alltypesmatches){
        var Hyperlink=links[i].link;
        console.log(Hyperlink);
      }
    }
    	if (filtertypesmatches.length>0) { //this particular code block adds filters if any exists to base query
    		for(var j=0;j<filtertypesmatches.length;j++){
    			for(var i=0;i<filterquery.length;++i){
    				if (filterquery[i].id==filtertypesmatches[j]) {
    					var FilterPassQuery=filterquery[i].field;
    					var PassQuery=PassQuery+' '+FilterPassQuery
              SqlQuery=PassQuery;
    					break
    				}
    			}
    		}
    	}
    	var requestCountTop= new Request(
    		PassQuery,
        function(err,rowCount,rows){
    			if (err) {
    				console.log(err);
    			}
    		}
        );

    	for(var i=0;i<filterentity.length;i++){ //adds all filters exists in array as parameters to query
    		requestCountTop.addParameter(filtertypesmatches[i],TYPES.NVarChar,filterentity[i])
    	}

    	requestCountTop.on('row',function(columns){
    		columns.forEach(function(column){
    			session.send("%s\t%s", column.metadata.colName, column.value);
        /* builder.Prompts.number(session,"Would you like to see a graphical report " + '1. YES  2.NO',function(session){
          if (session.message.text=='1') {
          session.send(Hyperlink);}}) */ 
          valPlaceholder= stringify(column.value);
          console.log('Value inside ON: '+valPlaceholder);
          forInsertion(session);
          session.send("For more information Click On the link " + Hyperlink);
          //session.send(Hyperlink);


    		});
        
    	});

      connection.execSql(requestCountTop);
    	//console.log(PassQuery)

    }
}


function forInsertion(session,entity){

      /*State data store(1.5.1)*/
      /*Author: Suryadeep*/
      /*29th Jan*/
      var d = new Date();
      var ConcatString= "";
      global.requesToInsert= new Request(
        "insert into UserLogs  values (@u_name,@utterance,@primary_entity,@secondary_entity,@ternary_entity,@sql_query,@value,@intentname,@masterstring,'Y',@datestamp)",
        function(err){
          if (err) {
            console.log('Error while inserting into log table'+err);
          }
          else{
            console.log('Successfully inserted into Log Table');
            toUpdate();
          }
        }
      );
      
      /*
      global.toUpdate= new Request(
            "UPDATE [UserLogs] SET [Flag]='N' WHERE [timemap]!= (SELECT CONVERT(VARCHAR(10), GETDATE(),120))",
            function(err){
              if(err){
                console.log('Error in update bro'+err);
              }
              else{
                console.log('Update performed Successfully');
              }
            }
        );*/
      console.log("Intent name inside insertion "+IntentName);
      ConcatString= '0'+PrimaryEntity+'1'+SecondaryEntity+'2'+TernaryEntity+'3'+IntentName;
      console.log("forInsertion function "+valPlaceholder);
      console.log(ConcatString);
      requesToInsert.addParameter('u_name',TYPES.NVarChar,userName);
      requesToInsert.addParameter('utterance',TYPES.NVarChar,session.message.text);
      requesToInsert.addParameter('primary_entity',TYPES.NVarChar,PrimaryEntity);
      requesToInsert.addParameter('secondary_entity',TYPES.NVarChar,SecondaryEntity);
      requesToInsert.addParameter('ternary_entity',TYPES.NVarChar,TernaryEntity);
      requesToInsert.addParameter('sql_query',TYPES.NVarChar,SqlQuery);
      requesToInsert.addParameter('value',TYPES.NVarChar,valPlaceholder);
      requesToInsert.addParameter('intentname',TYPES.NVarChar,IntentName);
      requesToInsert.addParameter('masterstring',TYPES.NVarChar,ConcatString);
      requesToInsert.addParameter('datestamp',TYPES.Date,d);

      connectionInsert.execSql(requesToInsert);
      
}

function toUpdate(){
  /*Historical data(1.5.2)*/
  /*Author: Suryadeep*/
  /*6th Feb*/
  global.queryUpdate= new Request(
    "UPDATE [UserLogs] SET [Flag]='N' WHERE [timemap]!= (SELECT CONVERT(VARCHAR(10), GETDATE(),120))",
    function(err){
      if(err){
        console.log('Error in update bro'+err);
      }
      else{
        console.log('Update performed Successfully');
      }
    }
  );
  connectionInsert.execSql(queryUpdate);
}

function fetchTop(session){
  /*Frequently asking questions(1.5.3)*/
  /*Author: Suryadeep*/
  /*7th Feb*/
  var i=1;
  global.fetchTopAskedQuestions= new Request(
    "SELECT TOP 2 masterstring,SUM(executed_value) FROM [UserLogs] GROUP BY [masterstring] ORDER BY COUNT([masterstring]) DESC",
    function(err){
      if (err) {
        console.log('Error while fetching top queries'+err);
      }
      else{
        console.log('FAQ has been fetched');  
        getDisplayValues(session);
      }
    }
  );
  connectionInsert.execSql(fetchTopAskedQuestions);

  fetchTopAskedQuestions.on('row', function(columns){
    columns.forEach(function(column){
      console.log('Before Push '+i)
      StoreForFAQ[i]=column.value;
      console.log('After push '+i)
      console.log('%s   %s',i,StoreForFAQ[i]);
      //session.send('%d) %s',i,column.value);
      //sendValues(session);
      i=i+1;
    });
    UtterFetchValue1= StoreForFAQ[1];
    UtterFetchValue2= StoreForFAQ[3];    
    console.log('while calling function '+i)
    console.log('size of array: '+StoreForFAQ.length)

    //sendValues(session,i);
    
 } );

}

function sendValues(session,args){
  console.log(args);
  SlNo=SlNo+1;
  session.send('%d) %s--> %s',SlNo,StoreReturnForFAQ[args-2],StoreReturnForFAQ[args-1])
}

function getDisplayValues(session){
  /*Utterance and value from FAQ(1.5.4)*/
  /*Author: Suryadeep*/
  /*Last Updated: 9th Feb*/
  var i=1;
  console.log('UtterFetchValue1: '+UtterFetchValue1);
  global.GetDisplay= new Request(
    "SELECT [utterance],[executed_value] FROM [UserLogs] WHERE [id]=(SELECT MAX([id]) FROM [UserLogs] WHERE [masterstring]=@val1);SELECT [utterance],[executed_value] FROM [UserLogs] WHERE [id]=(SELECT MAX([id]) FROM [UserLogs] WHERE [masterstring]=@val2)",
    function(err){
      if (err) {
        console.log('Error while getting display values'+err)
      }
      else{
        console.log('Utterance and executed values fetched')
      }
    }
  );
  console.log('About to add parameter: '+UtterFetchValue1);
  var LocalScopeForDisplay1= UtterFetchValue1;
  var LocalScopeForDisplay2= UtterFetchValue2;
  console.log('LocalScopeForDisplay1: ',LocalScopeForDisplay1);
  GetDisplay.addParameter('val1', TYPES.NVarChar, LocalScopeForDisplay1);
  GetDisplay.addParameter('val2', TYPES.NVarChar, LocalScopeForDisplay2);
  //GetDisplay.addParameter('val2', TYPES.NVarChar, UtterFetchValue2);
  console.log('parameters added: '+UtterFetchValue1);

  connectionInsert.execSql(GetDisplay);
  console.log('Sql executed');
    GetDisplay.on('row',function(columns){
      console.log('before for each')
    columns.forEach(function(column){
      console.log('About to send value to bot')
      //session.send('%s', column.value);
      StoreReturnForFAQ[i]=column.value;
      i=i+1;
    });
    sendValues(session,i);
  });
    console.log('column execution done');
}

function getHistory(){
  /*Session History(1.5.5)*/
  /*Author: Suryadeep*/
  /*Last Updated: 12th Feb*/
  global.GetHistory= new Request(
    "SELECT [utterance],[executed_value] FROM [UserLogs] WHERE [Flag]='Y'",
    function(err){
      if (err) {
        console.log('Error while fetching history')
      }
      else{
        console.log('Fetched history');
      }
    }
  );
  connectionInsert.execSql(GetHistory);
}

intents.matches('Greetings',[function(session,args){
	session.send('Hi %s',userName)
  session.send('You look interested in the following topics: ')
  fetchTop(session);
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
intents.matches('Workorder',function(session,args){
	getentities(session,args)
})
intents.matches('Top',function(session,args){
  getentities(session,args)
})
.onDefault((session) => {
	session.send('Sorry, I did not understand \'%s\'.', session.message.text);
});

bot.dialog('/', intents);
