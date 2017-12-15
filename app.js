      /*Name: Asset Bot*/
      /*version- v06:*/
      /*Last updated:28/11/2017: 10:00 PM*/
      /*Author: Suryadeep*/
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
var BaseQueryContents = jsonFile.readFileSync("smartAssetQuery.json");
var FilterQueryComponents = jsonFile.readFileSync("smartAssetFilterQuery.json");
var TopQueryContents= jsonFile.readFileSync("smartAssetTop.json");
var server = restify.createServer();

//fetch FilterQUeryComponents
var FilterPassQueryDepartment;
var FilterPassQueryFacility;
var FilterPassQueryYear;
var FilterPassQueryType;
var FilterPassQueryCategory;
var FilterPassQueryOrganization;
var FilterPassQueryCriticality;
var FilterPassQueryCraft;
var FilterPassQueryItem;
var FilterPassQuerySkill;
var FilterPassQuerySRCategory;
var FilterPassQuerySRType;
var FilterPassQueryInventory;
var FilterPassQuerySupplier; 


server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

//Configure and create 
var config = {
  userName: 'xxx', 
  password: 'xxx', 
  server: 'xxx', 
  options:{ 
    database: 'xxx', 
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
const LuisModelUrl = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/b9eaff0d-bef4-4af7-9aaa-edf3f5213ec6?subscription-key=10a124cbd7304280a37beef997cf34bf&verbose=true&timezoneOffset=0&q=';

var recognizer = new builder.LuisRecognizer(LuisModelUrl);
bot.recognizer(recognizer);  
var intents = new builder.IntentDialog({ recognizers: [recognizer] })

.matches('Greetings',(session,args)=>{
  session.send('Hello');
})


/*1st Update*/
/*Previous version: AssetBot.js*/
/*Working module of single intent handling both entity less and with entity utterances*/
/*New update of Asset Smart bot*/
/*Author: Suryadeep*/

/*****INTENT: ASSET****/
.matches('Asset',[
  function(session,args){

    //get all the required values
    var entityCount=builder.EntityRecognizer.findEntity(args.entities,'Asset Count');
    var entityValue=builder.EntityRecognizer.findEntity(args.entities,'Asset Value');
    var entityTop=builder.EntityRecognizer.findEntity(args.entities,'Top');
    var entityTopDept=builder.EntityRecognizer.findEntity(args.entities,'Top::Department_top');
    var entityTopFacility=builder.EntityRecognizer.findEntity(args.entities,'Top::Facility_top');
    var entityTopType=builder.EntityRecognizer.findEntity(args.entities,'Top::Type_top');
    var entityTopYear=builder.EntityRecognizer.findEntity(args.entities,'Top::Year_top');
    var entityNumber=builder.EntityRecognizer.findEntity(args.entities,'builtin.number');
    var entityFilterFacility=builder.EntityRecognizer.findEntity(args.entities,'With Filter::Facility');
    var entityFilterDept=builder.EntityRecognizer.findEntity(args.entities,'With Filter::Department');
    var entityFilterCritical=builder.EntityRecognizer.findEntity(args.entities,'With Filter::Critical');
    var entityFilterNonCritical=builder.EntityRecognizer.findEntity(args.entities,'With Filter::Non Critical');
    var entityFilterType=builder.EntityRecognizer.findEntity(args.entities,'With Filter::Type');
    var entityFilterYear=builder.EntityRecognizer.findEntity(args.entities,'With Filter::Year');

    //debugging purpose
    console.log('Asset count '+JSON.stringify(entityCount));
    console.log('Asset Value '+JSON.stringify(entityValue));
    console.log('Top '+JSON.stringify(entityTop));    
    console.log('Top Department '+JSON.stringify(entityTopDept));
    console.log('Top Facility '+JSON.stringify(entityTopFacility));
    console.log('Top Type '+JSON.stringify(entityTopType));
    console.log('Top Year '+JSON.stringify(entityTopYear));
    
    console.log('Number '+JSON.stringify(entityNumber));
    console.log('Facility Filter '+JSON.stringify(entityFilterFacility));
    console.log('Department Filter '+JSON.stringify(entityFilterDept));
    console.log('Year Filter '+JSON.stringify(entityFilterYear));
    console.log('Critical Filter '+JSON.stringify(entityFilterCritical));
    console.log('Non Critical Filter '+JSON.stringify(entityFilterNonCritical));
    console.log('Type Filter '+JSON.stringify(entityFilterType));

    //fetch BaseQueryContents
    var BasePassQueryAssetCount;
    var BasePassQueryAssetValue;
    var BasePassQueryTopAssetCount;
    var BasePassQueryTopAssetValue;
    var BasePassQueryTop;
    var BasePassQueryGroup;


    /******ASSET COUNT******/
    /***AUTHOR:Suryadeep***/
    //logic for handling LUIS and bot response
    //Base JSON: AssetCount
    if ((JSON.stringify(entityCount)!='null')&&(JSON.stringify(entityValue)=='null')) {           
      for(var i=0;i<BaseQueryContents.length;++i){
        if (BaseQueryContents[i].intent=="AssetCount") {
          BasePassQueryAssetCount=BaseQueryContents[i].query;
        }
      }
      for (var i=0;i<TopQueryContents.length;++i) {
       	if (TopQueryContents[i].intent=="TopAssetCount") {
       		BasePassQueryTop=TopQueryContents[i].query;
       		BasePassQueryGroup=TopQueryContents[i].group;
       	}
      }

/*TOP*/
/*1*/ if ((JSON.stringify(entityTop)!='null')&&(JSON.stringify(entityTopDept)=='null')&&(JSON.stringify(entityTopFacility)=='null')&&(JSON.stringify(entityTopType)=='null')&&(JSON.stringify(entityTopYear)=='null')) {       
        var PassQuery=BasePassQueryTop+BasePassQueryGroup;
        global.requestCountTop= new Request(
          PassQuery,//query for count and top by asset category
          function(err,rowCount,rows){
            if (err) {
              console.log(err);
            }
          }
        );
        requestCountTop.addParameter('paramDomain',TYPES.Int,entityNumber.entity);
        requestCountTop.addParameter('paramColumn',TYPES.NVarChar,'asset category');
        requestCountTop.on('row',function(columns){
          columns.forEach(function(column){
            session.send("%s\t%s", column.metadata.colName, column.value)
          });
        });
        connection.execSql(requestCountTop);
      }
/*2*/ else if ((JSON.stringify(entityTop)!='null')&&(JSON.stringify(entityTopDept)!='null')&&(JSON.stringify(entityTopFacility)=='null')&&(JSON.stringify(entityTopType)=='null')&&(JSON.stringify(entityTopYear)=='null')) {
        var PassQuery=BasePassQueryTop+BasePassQueryGroup;
        global.requestCountTop= new Request(
          PassQuery,//query for count and top by asset department
          function(err,rowCount,rows){
            if (err) {
              console.log(err);
            }
          }
        );
        requestCountTop.addParameter('paramDomain',TYPES.Int,entityNumber.entity); 
        requestCountTop.addParameter('paramColumn',TYPES.NVarChar,'department');
        requestCountTop.on('row',function(columns){
          columns.forEach(function(column){
            session.send("%s\t%s", column.metadata.colName, column.value)
          });
        });
        connection.execSql(requestCountTop);
      }
/*3*/ else if ((JSON.stringify(entityTop)!='null')&&(JSON.stringify(entityTopDept)=='null')&&(JSON.stringify(entityTopFacility)!='null')&&(JSON.stringify(entityTopType)=='null')&&(JSON.stringify(entityTopYear)=='null')) {
        var PassQuery=BasePassQueryTop+BasePassQueryGroup;
        global.requestCountTop= new Request(
          PassQuery,//query for count and top facility
          function(err,rowCount,rows){
            if (err) {
              console.log(err);
            }
          }
        );
        requestCountTop.addParameter('paramDomain',TYPES.Int,entityNumber.entity); 
        requestCountTop.addParameter('paramColumn',TYPES.NVarChar,'facility');
        requestCountTop.on('row',function(columns){
          columns.forEach(function(column){
            session.send("%s\t%s", column.metadata.colName, column.value)
          });
        });
        connection.execSql(requestCountTop);        
      }
/*4*/ else if ((JSON.stringify(entityTop)!='null')&&(JSON.stringify(entityTopDept)=='null')&&(JSON.stringify(entityTopFacility)=='null')&&(JSON.stringify(entityTopType)!='null')&&(JSON.stringify(entityTopYear)=='null')) {
        var PassQuery=BasePassQueryTop+BasePassQueryGroup;
        global.requestCountTop= new Request(
          PassQuery,//query for count and top by type
          function(err,rowCount,rows){
            if (err) {
              console.log(err);
            }
          }
        );
        requestCountTop.addParameter('paramDomain',TYPES.Int,entityNumber.entity); 
        requestCountTop.addParameter('paramColumn',TYPES.NVarChar,'type');
        requestCountTop.on('row',function(columns){
          columns.forEach(function(column){
            session.send("%s\t%s", column.metadata.colName, column.value)
          });
        });
        connection.execSql(requestCountTop);
      }
/*5*/ else if ((JSON.stringify(entityTop)!='null')&&(JSON.stringify(entityTopDept)=='null')&&(JSON.stringify(entityTopFacility)=='null')&&(JSON.stringify(entityTopType)=='null')&&(JSON.stringify(entityTopYear)!='null')) {
        global.requestCountTop= new Request(
          "",//query for top and count and year
          function(err,rowCount,rows){
            if (err) {
              console.log(err);
            }
          }
        );
        requestCountTop.on('row',function(columns){
          columns.forEach(function(column){
            session.send("%s\t%s", column.metadata.colName, column.value)
          });
        });
        connection.execSql(requestCountTop);
      }
/*FILTER*/      
/*1*/ else if ((JSON.stringify(entityTop)=='null') && (JSON.stringify(entityFilterFacility)!='null')) {               //FACILITY FILTER
        for(var i=0;i<FilterQueryComponents.length;++i){
          if (FilterQueryComponents[i].id=="Facility") {
            FilterPassQueryFacility=FilterQueryComponents[i].field;
          }
        }
        var PassQuery=BasePassQueryAssetCount+FilterPassQueryFacility;
        global.requestCountTop= new Request(
          PassQuery,//query for count and facility filter
          function(err,rowCount,rows){
            if (err) {
              console.log(err);
            }
          }
        );
        requestCountTop.addParameter('value',TYPES.NVarChar,entityFilterFacility.entity);
        requestCountTop.on('row',function(columns){
          columns.forEach(function(column){
            session.send("%s\t%s", column.metadata.colName, column.value)
          });
        });
        connection.execSql(requestCountTop);
      }
/*2*/ else if ((JSON.stringify(entityTop)=='null')&&(JSON.stringify(entityFilterDept)!='null')) {                     //DEPARTMENT FILTER
        for(var i=0;i<FilterQueryComponents.length;++i){
          if (FilterQueryComponents[i].id=="Department") {
            FilterPassQueryDepartment=FilterQueryComponents[i].field;
          }
        }
        var PassQuery=BasePassQueryAssetCount+FilterPassQueryDepartment;
        global.requestCountTop= new Request(
          PassQuery,//query for count and Department filter
          function(err,rowCount,rows){
            if (err) {
              console.log(err);
            }
          }
        );
        requestCountTop.addParameter('value',TYPES.NVarChar,entityFilterDept.entity);       
        requestCountTop.on('row',function(columns){
          columns.forEach(function(column){
            session.send("%s\t%s", column.metadata.colName, column.value)
          });
        });
        connection.execSql(requestCountTop);
      }
/*3*/ else if ((JSON.stringify(entityTop)=='null')&&(JSON.stringify(entityFilterCritical)!='null')) {                  //CRITICAL FILTER
        for(var i=0;i<FilterQueryComponents.length;++i){
          if (FilterQueryComponents[i].id=="Critical") {
            FilterPassQueryCriticality=FilterQueryComponents[i].field;
          }
        }
        var PassQuery=BasePassQueryAssetCount+FilterPassQueryCriticality;
        global.requestCountTop= new Request(
          PassQuery,//query for count and Critical filter
          function(err,rowCount,rows){
            if (err) {
              console.log(err);
            }
          }
        );
        requestCountTop.addParameter('value',TYPES.NVarChar,'Y'); 
        requestCountTop.on('row',function(columns){
          columns.forEach(function(column){
            session.send("%s\t%s", column.metadata.colName, column.value)
          });
        });
        connection.execSql(requestCountTop);
      }
/*4*/ else if ((JSON.stringify(entityTop)=='null')&&(JSON.stringify(entityFilterNonCritical)!='null')) {              //NON CRITICAL FILTER
        for(var i=0;i<FilterQueryComponents.length;++i){
          if (FilterQueryComponents[i].id=="Critical") {
            FilterPassQueryCriticality=FilterQueryComponents[i].field;
          }
        }
        var PassQuery=BasePassQueryAssetCount+FilterPassQueryCriticality;
        global.requestCountTop= new Request(
          PassQuery,//query for count and Critical filter
          function(err,rowCount,rows){
            if (err) {
              console.log(err);
            }
          }
        );
        requestCountTop.addParameter('value',TYPES.NVarChar,'N'); 
        requestCountTop.on('row',function(columns){
          columns.forEach(function(column){
            session.send("%s\t%s", column.metadata.colName, column.value)
          });
        });
        connection.execSql(requestCountTop);
      }
/*5*/ else if ((JSON.stringify(entityTop)=='null')&&(JSON.stringify(entityFilterType)!='null')) {                     //TYPE FILTER
        for(var i=0;i<FilterQueryComponents.length;++i){
          if (FilterQueryComponents[i].id=="Type") {
            FilterPassQueryType=FilterQueryComponents[i].field;
          }
        }
        var PassQuery=BasePassQueryAssetCount+FilterPassQueryType;
        global.requestCountTop= new Request(
          PassQuery,//query for count and Critical filter
          function(err,rowCount,rows){
            if (err) {
              console.log(err);
            }
          }
        );
        requestCountTop.addParameter('value',TYPES.NVarChar,entityFilterType.entity); 
        requestCountTop.on('row',function(columns){
          columns.forEach(function(column){
            session.send("%s\t%s", column.metadata.colName, column.value)
          });
        });
        connection.execSql(requestCountTop);
      }
/*6*/ else if ((JSON.stringify(entityTop)=='null')&&(JSON.stringify(entityFilterYear)!='null')) {                      //YEAR FILTER
        for(var i=0;i<FilterQueryComponents.length;++i){
          if (FilterQueryComponents[i].id=="Year") {
            FilterPassQueryYear=FilterQueryComponents[i].field;
          }
        }
        var PassQuery=BasePassQueryAssetCount+FilterPassQueryYear;
        global.requestCountTop= new Request(
          PassQuery,//query for count and Critical filter
          function(err,rowCount,rows){
            if (err) {
              console.log(err);
            }
          }
        );
        requestCountTop.addParameter('value',TYPES.NVarChar,entityFilterYear.entity);
        requestCountTop.on('row',function(columns){
          columns.forEach(function(column){
            session.send("%s\t%s", column.metadata.colName, column.value)
          });
        });
        connection.execSql(requestCountTop);
      }
/*7*/ else if ((JSON.stringify(entityTop)=='null')&&(JSON.stringify(entityFilterYear)=='null')&&(JSON.stringify(entityFilterType)=='null')&&(JSON.stringify(entityFilterDept)=='null')&&(JSON.stringify(entityFilterCritical)=='null')&&(JSON.stringify(entityFilterNonCritical)=='null')) {                      //NO FILTER        
        var PassQuery=BasePassQueryAssetCount;
        global.requestCountTop= new Request(
          PassQuery,//query for count and Critical filter
          function(err,rowCount,rows){
            if (err) {
              console.log(err);
            }
          }
        );
        requestCountTop.on('row',function(columns){
          columns.forEach(function(column){
            session.send("%s\t%s", column.metadata.colName, column.value)
          });
        });
        connection.execSql(requestCountTop);
      }
    }

    /******ASSET VALUE******/
    /***AUTHOR:Suryadeep***/
    //logic for handling LUIS and bot response
    //Base JSON: AssetValue
	else if((JSON.stringify(entityValue)!='null')&&(JSON.stringify(entityCount)=='null')) {
      for(var i=0;i<BaseQueryContents.length;++i){
        if (BaseQueryContents[i].intent=="AssetValue") {
          BasePassQueryAssetValue=BaseQueryContents[i].query;
        }
      }
      for (var i=0;i<TopQueryContents.length;++i) {
       	if (TopQueryContents[i].intent=="TopAssetValue") {
       		BasePassQueryTop=TopQueryContents[i].query;
       		BasePassQueryGroup=TopQueryContents[i].group;
       	}
      }
/*TOP*/
/*1*/ if ((JSON.stringify(entityTop)!='null')&&(JSON.stringify(entityTopDept)=='null')&&(JSON.stringify(entityTopFacility)=='null')&&(JSON.stringify(entityTopType)=='null')&&(JSON.stringify(entityTopYear)=='null')) {
        var PassQuery=BasePassQueryTop+BasePassQueryGroup;
        global.requestCountTop= new Request(
          PassQuery,//query for value and top by asset category
          function(err,rowCount,rows){
            if (err) {
              console.log(err);
            }
          }
        );
        requestCountTop.addParameter('paramDomain',TYPES.Int,entityNumber.entity);
        requestCountTop.addParameter('paramColumn',TYPES.NVarChar,'asset category');
        requestCountTop.on('row',function(columns){
          columns.forEach(function(column){
            session.send("%s\t%s", column.metadata.colName, column.value)
          });
        });
        connection.execSql(requestCountTop);
      }
/*2*/ else if ((JSON.stringify(entityTop)!='null')&&(JSON.stringify(entityTopDept)!='null')&&(JSON.stringify(entityTopFacility)=='null')&&(JSON.stringify(entityTopType)=='null')&&(JSON.stringify(entityTopYear)=='null')) {
        var PassQuery=BasePassQueryTop+BasePassQueryGroup;
        global.requestCountTop= new Request(
          PassQuery,//query for value and top by asset department
          function(err,rowCount,rows){
            if (err) {
              console.log(err);
            }
          }
        );
        requestCountTop.addParameter('paramDomain',TYPES.Int,entityNumber.entity);
        requestCountTop.addParameter('paramColumn',TYPES.NVarChar,'department');
        requestCountTop.on('row',function(columns){
          columns.forEach(function(column){
            session.send("%s\t%s", column.metadata.colName, column.value)
          });
        });
        connection.execSql(requestCountTop);
      }
/*3*/ else if ((JSON.stringify(entityTop)!='null')&&(JSON.stringify(entityTopDept)=='null')&&(JSON.stringify(entityTopFacility)!='null')&&(JSON.stringify(entityTopType)=='null')&&(JSON.stringify(entityTopYear)=='null')) {
        var PassQuery=BasePassQueryTop+BasePassQueryGroup;
        global.requestCountTop= new Request(
          PassQuery,//query for value and top by asset facility
          function(err,rowCount,rows){
            if (err) {
              console.log(err);
            }
          }
        );
        requestCountTop.addParameter('paramDomain',TYPES.Int,entityNumber.entity);
        requestCountTop.addParameter('paramColumn',TYPES.NVarChar,'facility');
        requestCountTop.on('row',function(columns){
          columns.forEach(function(column){
            session.send("%s\t%s", column.metadata.colName, column.value)
          });
        });
        connection.execSql(requestCountTop);        
      }
/*4*/ else if ((JSON.stringify(entityTop)!='null')&&(JSON.stringify(entityTopDept)=='null')&&(JSON.stringify(entityTopFacility)=='null')&&(JSON.stringify(entityTopType)!='null')&&(JSON.stringify(entityTopYear)=='null')) {
        var PassQuery=BasePassQueryTop+BasePassQueryGroup;
        global.requestCountTop= new Request(
          PassQuery,//query for value and top by asset type
          function(err,rowCount,rows){
            if (err) {
              console.log(err);
            }
          }
        );
        requestCountTop.addParameter('paramDomain',TYPES.Int,entityNumber.entity);
        requestCountTop.addParameter('paramColumn',TYPES.NVarChar,'type');
        requestCountTop.on('row',function(columns){
          columns.forEach(function(column){
            session.send("%s\t%s", column.metadata.colName, column.value)
          });
        });
        connection.execSql(requestCountTop);
      }
/*5*/ else if ((JSON.stringify(entityTop)!='null')&&(JSON.stringify(entityTopDept)=='null')&&(JSON.stringify(entityTopFacility)=='null')&&(JSON.stringify(entityTopType)=='null')&&(JSON.stringify(entityTopYear)!='null')) {
        global.requestCountTop= new Request(
          "",//query for top and count and year
          function(err,rowCount,rows){
            if (err) {
              console.log(err);
            }
          }
        );
        requestCountTop.on('row',function(columns){
          columns.forEach(function(column){
            session.send("%s\t%s", column.metadata.colName, column.value)
          });
        });
        connection.execSql(requestCountTop);
      }
/*FILTER*/
/*1*/ else if ((JSON.stringify(entityTop)=='null') && (JSON.stringify(entityFilterFacility)!='null')) {               //FACILITY FILTER
        for(var i=0;i<FilterQueryComponents.length;++i){
          if (FilterQueryComponents[i].id=="Facility") {
            FilterPassQueryFacility=FilterQueryComponents[i].field;
          }
        }
        var PassQuery=BasePassQueryAssetValue+FilterPassQueryFacility;
        global.requestCountTop= new Request(
          PassQuery,//query for value and facility filter
          function(err,rowCount,rows){
            if (err) {
              console.log(err);
            }
          }
        );
        requestCountTop.addParameter('value',TYPES.NVarChar,entityFilterFacility.entity);
        requestCountTop.on('row',function(columns){
          columns.forEach(function(column){
            session.send("%s\t%s", column.metadata.colName, column.value)
          });
        });
        connection.execSql(requestCountTop);
      }
/*2*/ else if ((JSON.stringify(entityTop)=='null')&&(JSON.stringify(entityFilterDept)!='null')) {                     //DEPARTMENT FILTER
        for(var i=0;i<FilterQueryComponents.length;++i){
          if (FilterQueryComponents[i].id=="Department") {
            FilterPassQueryDepartment=FilterQueryComponents[i].field;
          }
        }
        var PassQuery=BasePassQueryAssetValue+FilterPassQueryDepartment;
        global.requestCountTop= new Request(
          PassQuery,//query for value and Department filter
          function(err,rowCount,rows){
            if (err) {
              console.log(err);
            }
          }
        );
        requestCountTop.addParameter('value',TYPES.NVarChar,entityFilterDept.entity);       
        requestCountTop.on('row',function(columns){
          columns.forEach(function(column){
            session.send("%s\t%s", column.metadata.colName, column.value)
          });
        });
        connection.execSql(requestCountTop);
      }
/*3*/ else if ((JSON.stringify(entityTop)=='null')&&(JSON.stringify(entityFilterCritical)!='null')) {                  //CRITICAL FILTER
        for(var i=0;i<FilterQueryComponents.length;++i){
          if (FilterQueryComponents[i].id=="Critical") {
            FilterPassQueryCriticality=FilterQueryComponents[i].field;
          }
        }
        var PassQuery=BasePassQueryAssetValue+FilterPassQueryCriticality;
        global.requestCountTop= new Request(
          PassQuery,//query for value and Critical filter
          function(err,rowCount,rows){
            if (err) {
              console.log(err);
            }
          }
        );
        requestCountTop.addParameter('value',TYPES.NVarChar,'Y'); 
        requestCountTop.on('row',function(columns){
          columns.forEach(function(column){
            session.send("%s\t%s", column.metadata.colName, column.value)
          });
        });
        connection.execSql(requestCountTop);
      }
/*4*/ else if ((JSON.stringify(entityTop)=='null')&&(JSON.stringify(entityFilterNonCritical)!='null')) {              //NON CRITICAL FILTER
        for(var i=0;i<FilterQueryComponents.length;++i){
          if (FilterQueryComponents[i].id=="Critical") {
            FilterPassQueryCriticality=FilterQueryComponents[i].field;
          }
        }
        var PassQuery=BasePassQueryAssetValue+FilterPassQueryCriticality;
        global.requestCountTop= new Request(
          PassQuery,//query for value and Non Critical filter
          function(err,rowCount,rows){
            if (err) {
              console.log(err);
            }
          }
        );
        requestCountTop.addParameter('value',TYPES.NVarChar,'N'); 
        requestCountTop.on('row',function(columns){
          columns.forEach(function(column){
            session.send("%s\t%s", column.metadata.colName, column.value)
          });
        });
        connection.execSql(requestCountTop);
      }
/*5*/ else if ((JSON.stringify(entityTop)=='null')&&(JSON.stringify(entityFilterType)!='null')) {                     //TYPE FILTER
        for(var i=0;i<FilterQueryComponents.length;++i){
          if (FilterQueryComponents[i].id=="Type") {
            FilterPassQueryType=FilterQueryComponents[i].field;
          }
        }
        var PassQuery=BasePassQueryAssetValue+FilterPassQueryType;
        global.requestCountTop= new Request(
          PassQuery,//query for value and Type filter
          function(err,rowCount,rows){
            if (err) {
              console.log(err);
            }
          }
        );
        requestCountTop.addParameter('value',TYPES.NVarChar,entityFilterType.entity); 
        requestCountTop.on('row',function(columns){
          columns.forEach(function(column){
            session.send("%s\t%s", column.metadata.colName, column.value)
          });
        });
        connection.execSql(requestCountTop);
      }
/*6*/ else if ((JSON.stringify(entityTop)=='null')&&(JSON.stringify(entityFilterYear)!='null')) {                      //YEAR FILTER
        for(var i=0;i<FilterQueryComponents.length;++i){
          if (FilterQueryComponents[i].id=="Year") {
            FilterPassQueryYear=FilterQueryComponents[i].field;
          }
        }
        var PassQuery=BasePassQueryAssetValue+FilterPassQueryYear;
        global.requestCountTop= new Request(
          PassQuery,//query for value and Year filter
          function(err,rowCount,rows){
            if (err) {
              console.log(err);
            }
          }
        );
        requestCountTop.addParameter('value',TYPES.NVarChar,entityFilterYear.entity);
        requestCountTop.on('row',function(columns){
          columns.forEach(function(column){
            session.send("%s\t%s", column.metadata.colName, column.value)
          });
        });
        connection.execSql(requestCountTop);
      }
/*7*/ else if ((JSON.stringify(entityTop)=='null')&&(JSON.stringify(entityFilterYear)=='null')&&(JSON.stringify(entityFilterType)=='null')&&(JSON.stringify(entityFilterDept)=='null')&&(JSON.stringify(entityFilterCritical)=='null')&&(JSON.stringify(entityFilterNonCritical)=='null')) {                      //NO FILTER        
        var PassQuery=BasePassQueryAssetValue;
        global.requestCountTop= new Request(
          PassQuery,//query for count and No filter
          function(err,rowCount,rows){
            if (err) {
              console.log(err);
            }
          }
        );
        requestCountTop.on('row',function(columns){
          columns.forEach(function(column){
            session.send("%s\t%s", column.metadata.colName, column.value)
          });
        });
        connection.execSql(requestCountTop);
      }
    }     
    else{
    	console.log('ASSET COUNT: X');
    	console.log('ASSET VALUE: X');	
    }
  }
])
.onDefault((session) => {
    session.send('Sorry, I did not understand \'%s\'.', session.message.text);
       //session.send(LuisModelUrl);
     
});

bot.dialog('/',intents);
